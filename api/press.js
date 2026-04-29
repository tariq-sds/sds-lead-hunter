export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

  try {
    // Fetch content from known press sources directly
    const sources = [
      { url: 'https://www.dezeen.com/tag/restaurants/', name: 'Dezeen' },
      { url: 'https://www.dezeen.com/tag/hotels/', name: 'Dezeen Hotels' },
      { url: 'https://www.thecaterer.com/news/openings', name: 'The Caterer' },
      { url: 'https://www.bighospitality.co.uk/tag/new-openings', name: 'Big Hospitality' },
    ];

    const delay = ms => new Promise(r => setTimeout(r, ms));
    const pageContents = [];

    for (let i = 0; i < sources.length; i++) {
      if (i > 0) await delay(500);
      try {
        const r = await fetch(sources[i].url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SDS-LeadHunter/1.0)' },
          signal: AbortSignal.timeout(8000)
        });
        if (r.ok) {
          const html = await r.text();
          // Strip HTML tags and extract readable text, limit size
          const text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 3000);
          pageContents.push(`=== ${sources[i].name} ===\n${text}`);
        }
      } catch { /* skip failed fetches */ }
    }

    if (pageContents.length === 0) {
      // Fallback: ask Claude to use its knowledge of recent London hospitality projects
      const fallbackRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: `You are a lead analyst for Sonic Design Studios, a London luxury audio consultancy. Return a JSON array of 8-10 real London hospitality and residential projects from 2024-2026 that you know about, where an architect or interior designer is named. No markdown, no preamble. Each item: {"project":string,"type":string,"location":string,"architect":string,"interiorDesigner":string,"developer":string,"description":string,"sourceUrl":string,"sourceDate":string,"relevance":"high"|"medium"}`,
          messages: [{ role: 'user', content: 'List recent London restaurant, bar, hotel, members club and luxury residential projects with named design teams. JSON array only.' }]
        })
      });
      const fallbackData = await fallbackRes.json();
      return res.status(200).json(fallbackData);
    }

    // Pass fetched content to Claude for extraction
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are a lead analyst for Sonic Design Studios, a London luxury audio consultancy. Extract London hospitality and residential projects from the press content provided. Focus on projects with named architects or interior designers. Return ONLY a JSON array — no markdown, no preamble. Each item: {"project":string,"type":string,"location":string,"architect":string,"interiorDesigner":string,"developer":string,"description":string,"sourceUrl":string,"sourceDate":string,"relevance":"high"|"medium"}. Use empty string if unknown. Only include London projects.`,
        messages: [{
          role: 'user',
          content: `Extract all London hospitality/residential projects with design team details from this press content:\n\n${pageContents.join('\n\n')}`
        }]
      })
    });

    const claudeData = await claudeRes.json();
    return res.status(200).json(claudeData);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
