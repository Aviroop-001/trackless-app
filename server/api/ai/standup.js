const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are an AI assistant generating a daily standup summary for a software team.
Given a board summary with tasks grouped by user, generate a clean standup report.

Output this exact JSON shape (no markdown, no backticks, just raw JSON):
{
  "summary": "1-2 sentence overall team status",
  "members": [
    {
      "name": "person name",
      "done": ["task titles completed recently"],
      "inProgress": ["task titles currently in progress"],
      "blocked": ["overdue or stale task titles"],
      "highlights": "optional 1-sentence note about this person's workload or blockers"
    }
  ],
  "teamHighlights": ["1-3 overall observations about the team"]
}

Rules:
- Keep each section concise — task titles only, no descriptions
- "done" = tasks with status "done"
- "inProgress" = tasks with status "doing" or "in progress"
- "blocked" = overdue tasks or tasks stuck for 3+ days
- highlights per member: only if something notable (overloaded, idle, blocked)
- teamHighlights: big-picture observations (velocity, blockers, balance)
- If a person has no tasks, still include them with empty arrays and a note like "No assigned tasks"
- Output ONLY valid JSON, no extra text`

/**
 * POST /api/ai/standup
 * Body: { summary: object }
 *
 * Generates a daily standup summary via Groq LLM.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' })
  }

  try {
    const { summary } = req.body ?? {}

    if (!summary || typeof summary !== 'object') {
      return res.status(400).json({ error: 'Board summary is required.' })
    }

    const userPrompt = JSON.stringify(summary, null, 2)

    const response = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.5,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[ai/standup] Groq API error:', response.status, body)
      return res.status(502).json({ error: 'AI service returned an error. Please try again.' })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({ error: 'AI returned an empty response.' })
    }

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      console.error('[ai/standup] Failed to parse AI response:', content)
      return res.status(502).json({ error: 'AI returned invalid JSON.' })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[ai/standup] Error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
