import { getDb } from '../lib/db.js'

/**
 * POST /api/waitlist
 * Body: { email: string }
 *
 * Saves the email to the waitlist table in Neon Postgres.
 * Returns 201 on success, 409 if already on the list, 400/500 for errors.
 */
export default async function handler(req, res) {
  // Only accept POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email } = req.body ?? {}

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' })
    }

    const trimmed = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return res.status(400).json({ error: 'Enter a valid email address.' })
    }

    if (trimmed.length > 254) {
      return res.status(400).json({ error: 'Email is too long.' })
    }

    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      // Dev fallback — log to console so you can see signups locally
      console.log(`[waitlist] ${trimmed} (no DATABASE_URL — not persisted)`)
      return res.status(201).json({ ok: true, email: trimmed })
    }

    const sql = getDb()

    await sql`
      INSERT INTO waitlist (email)
      VALUES (${trimmed})
      ON CONFLICT (email) DO NOTHING
    `

    return res.status(201).json({ ok: true, email: trimmed })
  } catch (err) {
    console.error('[waitlist] Error:', err)
    return res.status(500).json({ error: 'Something went wrong. Try again.' })
  }
}
