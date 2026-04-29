export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY not set' } });

  const SYSTEM = `You are a lead researcher for Sonic Design Studios, a London luxury audio consultancy. Search for recent London hospitality and residential project announcements from trade press (Dezeen, The Caterer, Big Hospitality, Sleeper, Architizer). Find projects with named architects or interior designers. After searching, return ONLY a JSON array — no markdown, no preamble. Each item: {"project":string,"type":string,"location":string,"architect":string,"interiorDesigner":string,"developer":string,"description":string,"sourceUrl":string,"sourceDate":string,"relevance":"high"|"medium"}. Use empty string if unknown.`;

  const MESSAGES = [{
    role: 'user',
    content: 'Search for London new restaurant bar hotel members club nightclub opening 2025 2026 with named architect or interior designer. Return 8-10 results as a JSON array only.'
  }];

  try {
    let messages = [...MESSAGES];

    // Agentic loop — handle web search tool_use/tool_result cycles
    for (let i = 0; i < 5; i++) {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
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
          system: SYSTEM,
          messages
        })
      });

      const data = await apiRes.json();
      if (data.error) return res.status(200).json({ content: [{ type: 'text', text: '[]' }], _apiError: data.error.message });

      const content = data.content || [];
      const toolUses = content.filter(b => b.type === 'tool_use');
      const textBlocks = content.filter(b => b.type === 'text');

      // No more tool calls — return final text as-is to frontend
      if (toolUses.length === 0 || data.stop_reason === 'end_turn') {
        return res.status(200).json({ content: textBlocks });
      }

      // Continue loop: append assistant message and tool results
      messages = [
        ...messages,
        { role: 'assistant', content },
        {
          role: 'user',
          content: toolUses.map(tu => ({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: tu.input?.query
              ? `Search completed for "${tu.input.query}". Please use the results to find London hospitality projects with named design teams.`
              : 'Search completed.'
          }))
        }
      ];
    }

    // Fallback if loop exhausted
    return res.status(200).json({ content: [{ type: 'text', text: '[]' }] });

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
