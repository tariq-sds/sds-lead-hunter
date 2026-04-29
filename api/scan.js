export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

  try {
    const today = new Date();
    const ninetyDaysAgo = new Date(today - 90 * 24 * 60 * 60 * 1000);
    const dateFrom = `${String(ninetyDaysAgo.getDate()).padStart(2,'0')}/${String(ninetyDaysAgo.getMonth()+1).padStart(2,'0')}/${ninetyDaysAgo.getFullYear()}`;

    // Direct application search URLs by borough
    const buildApplicationUrl = (borough, ref) => {
      const encodedRef = encodeURIComponent(ref);
      const portals = {
        'Westminster': `https://publicaccess.westminster.gov.uk/online-applications/search.do?action=simple&searchType=Application&searchText=${encodedRef}`,
        'City of London': `https://www.planning2.cityoflondon.gov.uk/online-applications/search.do?action=simple&searchType=Application&searchText=${encodedRef}`,
        'Hackney': `https://planningapps.hackney.gov.uk/online-applications/search.do?action=simple&searchType=Application&searchText=${encodedRef}`,
        'Tower Hamlets': `https://development.towerhamlets.gov.uk/online-applications/search.do?action=simple&searchType=Application&searchText=${encodedRef}`,
        'Kensington and Chelsea': `https://www.rbkc.gov.uk/planning-and-building-control/planning/search-planning-applications?query=${encodedRef}`,
        'Camden': `https://planningonline.camden.gov.uk/online-applications/search.do?action=simple&searchType=Application&searchText=${encodedRef}`,
        'Islington': `https://www.islington.gov.uk/planning/planning-applications/planning-application-search?reference=${encodedRef}`,
        'Lambeth': `https://planning.lambeth.gov.uk/online-applications/search.do?action=simple&searchType=Application&searchText=${encodedRef}`,
        'Southwark': `https://planning.southwark.gov.uk/online-applications/search.do?action=simple&searchType=Application&searchText=${encodedRef}`,
        'Wandsworth': `https://planning2.wandsworth.gov.uk/planningcase/search?caseNo=${encodedRef}`,
      };
      return portals[borough] || `https://planningdata.london.gov.uk`;
    };

    const pldQuery = {
      query: {
        bool: {
          must: [
            {
              query_string: {
                query: "restaurant OR bar OR hotel OR \"members club\" OR nightclub OR rooftop OR \"food and beverage\" OR \"F&B\" OR \"drinking establishment\" OR \"leisure\" OR \"live music\" OR \"event space\" OR \"private dining\" OR cocktail OR café OR brasserie OR \"public house\" OR \"wine bar\" OR \"spa\" OR \"gym\"",
                fields: ["development_description", "site_name"]
              }
            },
            {
              // Only recently decided applications
              range: { decision_date: { gte: dateFrom } }
            },
            {
              // Only approved/granted decisions
              query_string: {
                query: "Approved OR Granted OR \"Grant Permission\" OR \"Prior Approval Required and Approved\" OR \"Prior Approval Not Required\" OR \"No Objection\"",
                fields: ["decision"]
              }
            }
          ],
          filter: [{
            terms: {
              "lpa_name.raw": [
                "Westminster", "Hackney", "Tower Hamlets",
                "Kensington and Chelsea", "Camden", "Islington",
                "Lambeth", "Southwark", "Wandsworth", "City of London"
              ]
            }
          }]
        }
      },
      _source: [
        "lpa_name", "lpa_app_no", "valid_date", "decision_date",
        "development_description", "site_address", "application_type",
        "development_type", "site_name", "status", "decision",
        "agent_name", "agent_address", "applicant_name", "applicant_address",
        "agent_company", "applicant_company"
      ],
      size: 50,
      sort: [{ decision_date: { order: "desc" } }]  // Most recently approved first
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

    // Exclude pure signage/advertisement applications
    const excludeSuffixes = ['ADVT', 'ADFULL', 'ADV', 'TCA', 'HAPP', 'PNO'];
    const filtered = hits.filter(h => {
      const ref = (h._source.lpa_app_no || '').toUpperCase();
      return !excludeSuffixes.some(t => ref.endsWith('/' + t) || ref.includes('/' + t + '/'));
    });

    const rawLeads = (filtered.length > 0 ? filtered : hits).slice(0, 35).map(h => {
      const s = h._source;
      // Build professional team from available PLD fields
      const team = [];
      if (s.agent_company) team.push({ role: 'Agent/Planning', name: s.agent_company, address: s.agent_address || '' });
      else if (s.agent_name) team.push({ role: 'Agent/Planning', name: s.agent_name, address: s.agent_address || '' });
      if (s.applicant_company) team.push({ role: 'Applicant', name: s.applicant_company, address: s.applicant_address || '' });
      else if (s.applicant_name) team.push({ role: 'Applicant', name: s.applicant_name, address: s.applicant_address || '' });

      return {
        ref: s.lpa_app_no || '',
        borough: s.lpa_name || '',
        address: s.site_address || s.site_name || '',
        siteName: s.site_name || '',
        actualDescription: s.development_description || '',
        applicationType: s.application_type || s.development_type || '',
        validDate: s.valid_date || '',
        status: s.status || '',
        decision: s.decision || '',
        team,
        applicationUrl: buildApplicationUrl(s.lpa_name, s.lpa_app_no || '')
      };
    });

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: `You are a lead analyst for Sonic Design Studios (SDS), a London luxury architectural audio consultancy. Select and format the 8-12 most relevant RECENTLY APPROVED planning applications for SDS from the list provided. These are greenlit projects — ideal for immediate outreach to the design team.

Prioritise: full planning applications for new/refurbished restaurants, bars, hotels, members clubs, nightclubs, event spaces, rooftop venues, large residential developments.
Deprioritise: minor works, pure signage, small single-room extensions, office/retail change of use.

Return ONLY a valid JSON array. No markdown, no preamble. Use ONLY data from the source — do not fabricate anything.

Each item:
{
  "name": string (site name or first meaningful part of address),
  "location": string (full address),
  "borough": string,
  "type": string (concise venue type),
  "description": string (VERBATIM actualDescription from source — do not paraphrase),
  "ref": string (exact ref),
  "relevance": "high"|"medium",
  "date": string (decision_date — the approval date),
  "status": string,
  "applicationUrl": string (exact applicationUrl from source),
  "team": array (exact team array from source — include all entries, empty array if none)
}`,
        messages: [{
          role: 'user',
          content: `Select the best SDS leads from these real London planning applications:\n\n${JSON.stringify(rawLeads, null, 2)}`
        }]
      })
    });

    const claudeData = await claudeRes.json();
    return res.status(200).json(claudeData);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
