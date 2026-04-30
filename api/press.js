export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

  try {
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: `You are a lead analyst for Sonic Design Studios (SDS), a London luxury architectural audio consultancy. Draw on your knowledge of London's hospitality and residential design scene to list real, known projects from 2023-2026.

Return ONLY a raw JSON array. No markdown fences, no preamble, no text after the array.

Each item must be a real project you have knowledge of:
[
  {
    "project": "venue or development name",
    "type": "e.g. New Restaurant, Hotel Refurbishment, Members Club, Luxury Residential",
    "location": "area or address in London",
    "architect": "architecture firm name or empty string",
    "interiorDesigner": "interior design firm name or empty string",
    "developer": "developer or operator name or empty string",
    "description": "1-2 sentence description of the project",
    "sourceUrl": "URL of a Dezeen/Caterer/Sleeper article about this project if known, else empty string",
    "sourceDate": "approximate date if known, else empty string",
    "relevance": "high or medium"
  }
]

Mark "high" for: large multi-zone venues, luxury hotels, members clubs, significant residential.
Only include London projects. Only include projects where at least one of architect, interiorDesigner, or developer is known.`,
        messages: [{
          role: 'user',
          content: 'List 8 real London hospitality and premium residential projects from 2023-2026 with named architects or interior designers. Prioritise: restaurants, bars, hotels, members clubs, nightclubs, rooftop venues, luxury apartments. Return the JSON array only — no other text.'
        }]
      })
    });

    const data = await claudeRes.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
