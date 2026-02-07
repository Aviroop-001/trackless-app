const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are an AI project management assistant generating a weekly retrospective / project health report.
Given a board summary with task data, velocity info, and team workload, produce a structured health report.

Output this exact JSON shape (no markdown, no backticks, just raw JSON):
{
  "healthScore": 75,
  "healthLabel": "Good | Fair | At Risk | Critical",
  "summary": "2-3 sentence overall assessment",
  "velocity": {
    "completedThisWeek": 4,
    "trend": "up | down | stable",
    "note": "1 sentence about velocity trend"
  },
  "risks": [
    { "title": "short risk title", "detail": "1 sentence explanation", "severity": "high | medium | low" }
  ],
  "wins": ["1 sentence each, things going well"],
  "recommendations": ["1 sentence each, actionable next steps"],
  "workloadSummary": "1-2 sentences about team workload distribution"
}

Rules:
- healthScore: 0-100 integer. 80+ = Good, 60-79 = Fair, 40-59 = At Risk, below 40 = Critical
- healthLabel: must match the score range
- risks: 1-4 items, sorted by severity. Be specific — reference task names and people
- wins: 1-3 items. Highlight completed work, good patterns
- recommendations: 2-4 items. Actionable, specific
- velocity.completedThisWeek: count from the data provided
- Be specific and reference real task names, people, and numbers from the data
- Output ONLY valid JSON, no extra text`

/**
 * POST /api/ai/retro
 * Body: { summary: object }
 *
 * Generates a weekly retrospective / health report via Groq LLM.
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
      return res.status(400).json({ error: 'Project summary is required.' })
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
      console.error('[ai/retro] Groq API error:', response.status, body)
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
      console.error('[ai/retro] Failed to parse AI response:', content)
      return res.status(502).json({ error: 'AI returned invalid JSON.' })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('[ai/retro] Error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
