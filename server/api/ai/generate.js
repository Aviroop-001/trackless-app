const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are a senior engineering manager breaking down a software project into actionable tasks.
Given a project description, output a structured JSON plan.

Output this exact JSON shape (no markdown, no backticks, just raw JSON):
{
  "projectName": "short descriptive name (2-4 words)",
  "tasks": [
    {
      "title": "actionable task title",
      "description": "1-2 sentence explanation of what this task involves",
      "status": "inbox",
      "priority": "p0 | p1 | p2 | p3",
      "tags": ["relevant", "tags"],
      "subtasks": [
        { "text": "specific subtask", "done": false }
      ]
    }
  ]
}

Rules:
- Generate 5-12 tasks depending on complexity
- Each task title should be specific and actionable (e.g. "Set up Postgres schema for users table", NOT "Backend stuff")
- description should be 1-2 sentences explaining context or approach
- Use meaningful tags that group related work (e.g. "auth", "api", "ui", "infra", "testing")
- All tasks must have status "inbox"
- priority must be one of: "p0" (urgent), "p1" (high), "p2" (medium), "p3" (low)
- Most tasks should be "p2", 1-3 can be "p1", at most 1 "p0", and a couple "p3" for nice-to-haves
- Add 2-4 subtasks for complex tasks; skip subtasks for simple ones (empty array)
- Think in terms of a small team (2-5 people) building an MVP
- tags should be lowercase, max 3 per task
- Output ONLY valid JSON, no extra text`

/**
 * POST /api/ai/generate
 * Body: { prompt: string }
 *
 * Calls Groq LLM to generate a project plan from a natural-language description.
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
    const { prompt } = req.body ?? {}

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A project description is required.' })
    }

    const trimmed = prompt.trim()
    if (trimmed.length < 5) {
      return res.status(400).json({ error: 'Please provide a more detailed description (at least 5 characters).' })
    }
    if (trimmed.length > 1000) {
      return res.status(400).json({ error: 'Description is too long (max 1000 characters).' })
    }

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
          { role: 'user', content: trimmed },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[ai/generate] Groq API error:', response.status, body)
      return res.status(502).json({ error: 'AI service returned an error. Please try again.' })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({ error: 'AI returned an empty response. Please try again.' })
    }

    // Parse and validate the JSON
    let plan
    try {
      plan = JSON.parse(content)
    } catch {
      console.error('[ai/generate] Failed to parse AI response:', content)
      return res.status(502).json({ error: 'AI returned invalid JSON. Please try again.' })
    }

    // Basic shape validation
    if (!plan.projectName || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
      return res.status(502).json({ error: 'AI returned an incomplete plan. Please try again.' })
    }

    // Sanitize tasks
    const validPriorities = new Set(['p0', 'p1', 'p2', 'p3'])
    plan.tasks = plan.tasks.slice(0, 15).map((t) => ({
      title: String(t.title || 'Untitled task').slice(0, 200),
      description: String(t.description || '').slice(0, 500),
      status: 'inbox',
      priority: validPriorities.has(t.priority) ? t.priority : 'p2',
      tags: Array.isArray(t.tags) ? t.tags.slice(0, 4).map((x) => String(x).toLowerCase().slice(0, 20)) : [],
      subtasks: Array.isArray(t.subtasks) ? t.subtasks.slice(0, 6).map((s) => ({
        text: String(s.text || s.title || '').slice(0, 200),
        done: false,
      })).filter((s) => s.text) : [],
    }))

    plan.projectName = String(plan.projectName).slice(0, 60)

    return res.status(200).json(plan)
  } catch (err) {
    console.error('[ai/generate] Error:', err)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}
