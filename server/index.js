import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import healthHandler from './api/health.js'
import waitlistHandler from './api/waitlist.js'
import { migrate } from './lib/db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

const app = express()

app.use(express.json())

/* ── API routes ── */
app.get('/api/health', healthHandler)
app.post('/api/waitlist', waitlistHandler)

/* ── Serve built client in production ── */
if (isProd) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist')
  app.use(express.static(clientDist))

  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

/* ── Start ── */
async function start() {
  // Run DB migration if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      await migrate()
      console.log('[db] Migration complete')
    } catch (err) {
      console.error('[db] Migration failed:', err.message)
    }
  } else {
    console.log('[db] No DATABASE_URL — running without database')
  }

  app.listen(PORT, () => {
    console.log(`[server] Listening on http://localhost:${PORT}`)
    if (!isProd) {
      console.log('[server] Dev mode — run "npm run dev:client" for the frontend')
    }
  })
}

start()
