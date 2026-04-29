export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ref, borough } = req.body || {};
  if (!ref) return res.status(400).json({ error: { message: 'ref required' } });

  try {
    // Fetch full application record from PLD using flexible search
    const query = {
      query: {
        bool: {
          must: [
            {
              query_string: {
                query: `"${ref}"`,
                fields: ["lpa_app_no", "lpa_app_no.raw"]
              }
            }
          ]
        }
      },
      _source: true,
      size: 3
    };

    // If borough provided, add filter
    if (borough) {
      query.query.bool.filter = [{ term: { "lpa_name.raw": borough } }];
    }

    const pldRes = await fetch('https://planningdata.london.gov.uk/api-guest/applications/_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-AllowRequest': 'be2rmRnt&'
      },
      body: JSON.stringify(query)
    });

    if (!pldRes.ok) {
      return res.status(502).json({ error: { message: `PLD error: ${pldRes.status}` } });
    }

    const pldData = await pldRes.json();
    const hit = pldData?.hits?.hits?.[0];

    if (!hit) {
      // Try again without borough filter in case of mismatch
      if (borough) {
        const retryQuery = {
          query: { query_string: { query: `"${ref}"`, fields: ["lpa_app_no", "lpa_app_no.raw"] } },
          _source: true,
          size: 1
        };
        const retryRes = await fetch('https://planningdata.london.gov.uk/api-guest/applications/_search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-AllowRequest': 'be2rmRnt&' },
          body: JSON.stringify(retryQuery)
        });
        const retryData = await retryRes.json();
        const retryHit = retryData?.hits?.hits?.[0];
        if (!retryHit) {
          return res.status(404).json({ error: { message: `Application ${ref} not found. The PLD may not yet have full data for this borough. Try searching the reference directly on the borough planning portal.` } });
        }
        const s2 = retryHit._source;
        return res.status(200).json({ doc: buildDoc(s2, ref, borough) });
      }
      return res.status(404).json({ error: { message: `Application ${ref} not found in Planning London Datahub.` } });
    }

    const s = hit._source;
    return res.status(200).json({ doc: buildDoc(s, ref, borough) });

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}

function buildDoc(s, ref, borough) {
  return {
      // Identity
      ref: s.lpa_app_no || ref,
      borough: s.lpa_name || borough || '',
      // Site
      siteName: s.site_name || '',
      siteAddress: s.site_address || '',
      postcode: s.postcode || '',
      ward: s.ward_name || s.ward || '',
      // Application
      applicationType: s.application_type || s.development_type || '',
      applicationCategory: s.application_category || '',
      description: s.development_description || '',
      // Dates
      receivedDate: s.received_date || '',
      validDate: s.valid_date || '',
      committeeDate: s.committee_date || '',
      decisionDate: s.decision_date || '',
      // Decision
      decision: s.decision || '',
      status: s.status || s.application_status || '',
      decisionLevel: s.decision_level || '',
      // Applicant
      applicantName: s.applicant_name || s.applicant_company || '',
      applicantAddress: s.applicant_address || '',
      applicantCompany: s.applicant_company || '',
      // Agent
      agentName: s.agent_name || s.agent_company || '',
      agentAddress: s.agent_address || '',
      agentCompany: s.agent_company || '',
      // Development details
      existingUse: s.existing_land_use || s.existing_use || '',
      proposedUse: s.proposed_land_use || s.proposed_use || '',
      floorspaceExisting: s.existing_floorspace || s.total_existing_floorspace || '',
      floorspaceProposed: s.proposed_floorspace || s.total_proposed_floorspace || '',
      storeys: s.no_storeys || s.storeys || '',
      siteArea: s.site_area || '',
      // Residential
      residentialUnitsProposed: s.total_proposed_residential_units || s.residential_units_proposed || '',
      residentialUnitsExisting: s.total_existing_residential_units || s.residential_units_existing || '',
      // Other
      listedBuilding: s.listed_building_grade || '',
      conservationArea: s.conservation_area || '',
      appealStatus: s.appeal_status || '',
      appealDecision: s.appeal_decision || '',
      // Raw source for any missed fields
      _raw: s
    };
}
