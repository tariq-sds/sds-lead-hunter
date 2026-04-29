export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

  try {
    // Step 1: Query the Planning London Datahub for recent hospitality applications
    const today = new Date();
    const ninetyDaysAgo = new Date(today - 90 * 24 * 60 * 60 * 1000);
    const dateFrom = `${String(ninetyDaysAgo.getDate()).padStart(2,'0')}/${String(ninetyDaysAgo.getMonth()+1).padStart(2,'0')}/${ninetyDaysAgo.getFullYear()}`;

    const pldQuery = {
      query: {
        bool: {
          must: [
            {
              query_string: {
                query: "restaurant OR bar OR hotel OR \"members club\" OR nightclub OR \"rooftop\" OR \"food and beverage\" OR \"F&B\" OR \"drinking establishment\" OR \"sui generis\" OR \"leisure\" OR \"live music\" OR \"event space\" OR \"private dining\"",
                fields: ["development_description", "site_name", "lpa_app_no"]
              }
            },
            {
              range: {
                valid_date: { gte: dateFrom }
              }
            }
          ],
          filter: [
            {
              terms: {
                "lpa_name.raw": [
                  "Westminster", "Hackney", "Tower Hamlets",
                  "Kensington and Chelsea", "Camden", "Islington",
                  "Lambeth", "Southwark", "Wandsworth", "City of London"
                ]
              }
            }
          ]
        }
      },
      _source: [
        "lpa_name", "lpa_app_no", "valid_date", "decision_date",
        "development_description", "site_address", "application_type",
        "development_type", "site_name", "status"
      ],
      size: 30,
      sort: [{ valid_date: { order: "desc" } }]
    };

    const pldRes = await fetch('https://planningdata.london.gov.uk/api-guest/applications/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-AllowRequest': 'be2rmRnt&'
      },
      body: JSON.stringify(pldQuery)
    });

    if (!pldRes.ok) {
      const errText = await pldRes.text();
      return res.status(502).json({ error: { message: `PLD API error ${pldRes.status}: ${errText.slice(0,200)}` } });
    }

    const pldData = await pldRes.json();
    const hits = pldData?.hits?.hits || [];

    if (hits.length === 0) {
      return res.status(200).json({ content: [{ type: 'text', text: '[]' }] });
    }

    // Step 2: Pass raw PLD results to Claude to filter and format for SDS
    const rawLeads = hits.map(h => ({
      ref: h._source.lpa_app_no || '',
      borough: h._source.lpa_name || '',
      address: h._source.site_address || h._source.site_name || '',
      description: h._source.development_description || '',
      type: h._source.application_type || h._source.development_type || '',
      date: h._source.valid_date || '',
      status: h._source.status || ''
    }));

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: `You are a lead intelligence analyst for Sonic Design Studios (SDS), a London luxury architectural audio consultancy specialising in high-end hospitality venues and premium residential.

You will receive raw planning application data from the London Planning Portal. Your job is to:
1. Filter for applications relevant to SDS — hospitality venues (restaurants, bars, hotels, nightclubs, members clubs, rooftop venues, event spaces, private dining) and premium residential
2. Exclude minor works, small extensions, signage, residential conversions, offices, retail
3. Format the best 6-10 results as a JSON array

Return ONLY a valid JSON array. No markdown, no preamble.
Each item: {"name":string,"location":string,"borough":string,"type":string,"description":string,"ref":string,"relevance":"high"|"medium","source":"London Planning Portal"}
"name" = venue/site name or short description. "location" = street address. "relevance":"high" for large/luxury multi-zone venues, hotels, members clubs. "medium" for standard restaurants/bars.`,
        messages: [{
          role: 'user',
          content: `Filter these real London planning applications for SDS relevance and return as JSON:\n\n${JSON.stringify(rawLeads, null, 2)}`
        }]
      })
    });

    const claudeData = await claudeRes.json();
    return res.status(200).json(claudeData);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
