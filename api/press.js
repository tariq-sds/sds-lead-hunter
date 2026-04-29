export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

  try {
    // Run searches sequentially to avoid rate limits
    const searches = [
      'London new restaurant bar hotel opening "interior designer" OR "architect" 2025 2026',
      'site:dezeen.com London hospitality residential interior design 2025 2026',
      'site:thecaterer.com OR site:bighospitality.co.uk new London venue opening design 2025 2026',
    ];

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const searchTexts = [];

    for (let i = 0; i < searches.length; i++) {
      if (i > 0) await delay(2000); // 2 second gap between searches
      try {
        const result = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'web-search-2025-03-05'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 600,
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            system: `Find recent London hospitality and residential project announcements. Extract: project name, architect firm, interior designer firm, location, type, source URL. Return a brief JSON array only. Each item: {"project":string,"type":string,"location":string,"architect":string,"interiorDesigner":string,"developer":string,"description":string,"sourceUrl":string,"sourceDate":string}`,
            messages: [{ role: 'user', content: `Search: ${searches[i]}` }]
          })
        });
        const data = await result.json();
        const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
        if (text) searchTexts.push(text);
      } catch { /* continue */ }
    }

    const allText = searchTexts.join('\n');
    const finalRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: `You are a lead analyst for Sonic Design Studios (SDS), a London luxury architectural audio consultancy. You will receive raw search results about London hospitality and residential projects.

Extract and deduplicate all distinct projects. Only keep projects that are:
- In London
- Hospitality (restaurant, bar, hotel, members club, nightclub, rooftop venue, event space) or premium residential
- Recently announced, opened, or under development (2025-2026)
- Have at least one named professional (architect, interior designer, or developer)

Return ONLY a clean JSON array. No markdown, no preamble.
Each item:
{
  "project": string (project/venue name),
  "venue": string (operator/client name if different),
  "type": string (e.g. "New Restaurant", "Hotel Refurbishment", "Members Club", "Luxury Residential"),
  "location": string (area/address in London),
  "architect": string (firm name or empty string),
  "interiorDesigner": string (firm name or empty string),
  "developer": string (developer/operator name or empty string),
  "description": string (1-2 sentence summary of the project),
  "sourceUrl": string (URL of the article),
  "sourceDate": string (publication date if known),
  "relevance": "high"|"medium"
}
"high" = large venue, luxury positioning, multi-zone, named design team. "medium" = smaller project or limited team info.`,
        messages: [{
          role: 'user',
          content: `Extract and format all London hospitality/residential projects from these search results:\n\n${allText}`
        }]
      })
    });

    const finalData = await finalRes.json();
    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
