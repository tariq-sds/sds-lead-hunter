export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

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
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `Find recent London hospitality and residential projects (2025-2026) from trade press (Dezeen, The Caterer, Big Hospitality, Sleeper). Return ONLY a JSON array. Each item: {"project":string,"type":string,"location":string,"architect":string,"interiorDesigner":string,"developer":string,"description":string,"sourceUrl":string,"sourceDate":string,"relevance":"high"|"medium"}. Empty string if unknown. Only London projects.`,
        messages: [{
          role: 'user',
          content: 'Search for: London new restaurant bar hotel members club opening 2025 2026 architect interior designer. Find 8-10 projects with named design teams. Return as JSON array only.'
        }]
      })
    });

    const data = await result.json();
    if (data.error) return res.status(200).json({ error: { message: data.error.message || JSON.stringify(data.error) } });

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
