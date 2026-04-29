export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

  try {
    // Step 1: Run web searches across target press sources
    const searches = [
      'site:dezeen.com London restaurant bar hotel interior design 2025 2026',
      'site:thecaterer.com new restaurant hotel opening London design architect 2025 2026',
      'site:bighospitality.co.uk new opening London interior design 2025 2026',
      'site:sleeper.media London hotel restaurant design architect 2025 2026',
      'site:architizer.com London hospitality residential interior 2025 2026',
      'London restaurant bar hotel "interior designer" OR "architect" "new opening" OR "refit" OR "refurbishment" 2025 2026',
    ];

    // Run searches via Anthropic API with web search tool
    const searchPromises = searches.map(query =>
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          system: `You are a research assistant finding London hospitality and residential projects for Sonic Design Studios, a luxury audio consultancy. Search for recent project announcements and extract: project name, venue/client name, architect firm, interior designer firm, project type, location, and source URL. Return ONLY a JSON array of found projects. No markdown, no preamble. Each item: {"project":string,"venue":string,"type":string,"location":string,"architect":string,"interiorDesigner":string,"projectManager":string,"description":string,"sourceUrl":string,"sourceDate":string}. Use empty string if a field is not mentioned. Only include London projects relevant to hospitality or premium residential.`,
          messages: [{ role: 'user', content: `Search: ${query}` }]
        })
      }).then(r => r.json()).catch(() => null)
    );

    const searchResults = await Promise.all(searchPromises);

    // Extract all text responses
    const allText = searchResults
      .filter(Boolean)
      .flatMap(data => (data.content || []).filter(b => b.type === 'text').map(b => b.text))
      .join('\n');

    // Step 2: Pass all results to Claude for deduplication and final formatting
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
