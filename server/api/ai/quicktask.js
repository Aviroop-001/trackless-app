const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are an AI assistant that converts natural language into a structured task for a project management tool.
Given a sentence describing something to do, plus context about existing users, teams, and projects, output a structured JSON task.

Output this exact JSON shape (no markdown, no backticks, just raw JSON):
{
  "title": "concise actionable task title",
  "description": "1 sentence description or empty string",
  "priority": "p0 | p1 | p2 | p3",
  "tags": ["relevant", "tags"],
  "assigneeName": "exact full name from context or null",
  "projectName": "exact project name from context or null",
  "status": "inbox"
}

Rules:
- title: Clean, actionable. Remove filler words. Max 80 chars.
- priority: Infer from urgency words. "urgent"/"critical"/"ASAP" -> p0, "important"/"high" -> p1, default p2, "low"/"nice to have" -> p3.
- tags: Infer 1-3 relevant tags from the description. Lowercase. e.g. "fix login bug" -> ["auth", "bug"].
- assigneeName: If the sentence mentions a person by name AND that name appears in the context users/teams list, return their EXACT full name. Otherwise null.
- projectName: If the sentence mentions a project or the task clearly belongs to one from context, return its EXACT name. Otherwise null.
- status: Always "inbox" unless the user says "start" or "in progress" -> "doing", or "plan" -> "planned".
- description: Only if useful context beyond the title. Often empty string is fine.
- Output ONLY valid JSON, no extra text.`

/**
 * POST /api/ai/quicktask
 * Body: { text: string, context: { users: string[], teams: string[], projects: string[], tags: string[] } }
 *
 * Converts natural language into a structured task via Groq LLM.
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
    const { text, context } = req.body ?? {}

    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a task description (at least 3 characters).' })
    }

    const trimmed = text.trim().slice(0, 500)
    const ctx = context ?? {}

    const userPrompt = `Task description: "${trimmed}"

Context:
- Users: ${(ctx.users || []).join(', ') || 'none'}
- Teams: ${(ctx.teams || []).join(', ') || 'none'}
- Projects: ${(ctx.projects || []).join(', ') || 'none'}
- Existing tags: ${(ctx.tags || []).join(', ') || 'none'}`

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
        temperature: 0.3,
        max_tokens: 512,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[ai/quicktask] Groq API error:', response.status, body)
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
      console.error('[ai/quicktask] Failed to parse AI response:', content)
      return res.status(502).json({ error: 'AI returned invalid JSON.' })
    }

    const validPriorities = new Set(['p0', 'p1', 'p2', 'p3'])
    const validStatuses = new Set(['inbox', 'planned', 'doing'])

    const task = {
      title: String(parsed.title || trimmed).slice(0, 200),
      description: String(parsed.description || '').slice(0, 500),
      priority: validPriorities.has(parsed.priority) ? parsed.priority : 'p2',
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4).map((x) => String(x).toLowerCase().slice(0, 20)) : [],
      assigneeName: parsed.assigneeName ? String(parsed.assigneeName).slice(0, 100) : null,
      projectName: parsed.projectName ? String(parsed.projectName).slice(0, 100) : null,
      status: validStatuses.has(parsed.status) ? parsed.status : 'inbox',
    }

    return res.status(200).json(task)
  } catch (err) {
    console.error('[ai/quicktask] Error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
