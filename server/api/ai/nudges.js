const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are an AI project management assistant analyzing a team's task board.
Given a summary of the board state, provide 3-5 concise, actionable suggestions to help the team work more effectively.

Output ONLY a JSON array (no markdown, no backticks, just raw JSON):
[
  {
    "message": "one clear, actionable sentence",
    "type": "insight | warning | tip"
  }
]

Types:
- "warning": urgent issues that need immediate attention (blockers, critical overdue items)
- "insight": strategic observations about patterns, workload, or priorities
- "tip": helpful suggestions to improve workflow or productivity

Rules:
- Each message should be 1 sentence, max 120 characters
- Be specific -- reference task names, people, or numbers from the data
- Focus on actionable advice, not generic platitudes
- Don't repeat what's obvious from the raw numbers (e.g. don't just say "you have 3 overdue tasks")
- Think like a seasoned engineering manager giving quick advice in a standup
- Output 3-5 suggestions, sorted by urgency (warnings first, then insights, then tips)`

/**
 * POST /api/ai/nudges
 * Body: { summary: { projectName, totalTasks, byStatus, overdue, stale, unassigned, noDescription, workload, highPriorityCount, completionRate } }
 *
 * Calls Groq LLM to generate smart nudges from a board summary.
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
        temperature: 0.7,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[ai/nudges] Groq API error:', response.status, body)
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
      console.error('[ai/nudges] Failed to parse AI response:', content)
      return res.status(502).json({ error: 'AI returned invalid JSON.' })
    }

    // Handle both { nudges: [...] } and [...] formats
    const nudges = Array.isArray(parsed) ? parsed : Array.isArray(parsed.nudges) ? parsed.nudges : Array.isArray(parsed.suggestions) ? parsed.suggestions : []

    const validTypes = new Set(['insight', 'warning', 'tip'])
    const sanitized = nudges.slice(0, 6).map((n) => ({
      message: String(n.message || '').slice(0, 200),
      type: validTypes.has(n.type) ? n.type : 'insight',
    })).filter((n) => n.message)

    return res.status(200).json({ nudges: sanitized })
  } catch (err) {
    console.error('[ai/nudges] Error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
