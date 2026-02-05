import { neon } from '@neondatabase/serverless'

let _sql = null

/**
 * Returns a Neon SQL tagged-template function.
 * Lazily initialised so the module can be imported even if DATABASE_URL
 * is not set (e.g. during the Vite client build).
 */
export function getDb() {
  if (_sql) return _sql

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Create a free Neon database at https://neon.tech and add the connection string to .env',
    )
  }

  _sql = neon(url)
  return _sql
}

/**
 * Run once on first deploy (or locally) to create the waitlist table.
 */
export async function migrate() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
}
