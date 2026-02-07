import dotenv from 'dotenv'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

import healthHandler from './api/health.js'
import waitlistHandler from './api/waitlist.js'
import aiGenerateHandler from './api/ai/generate.js'
import aiNudgesHandler from './api/ai/nudges.js'
import aiQuicktaskHandler from './api/ai/quicktask.js'
import aiStandupHandler from './api/ai/standup.js'
import aiRetroHandler from './api/ai/retro.js'
import { migrate } from './lib/db.js'
const PORT = process.env.PORT || 3001
const isProd = process.env.NODE_ENV === 'production'

const app = express()

app.use(express.json())

/* ── API routes ── */
app.get('/api/health', healthHandler)
app.post('/api/waitlist', waitlistHandler)
app.post('/api/ai/generate', aiGenerateHandler)
app.post('/api/ai/nudges', aiNudgesHandler)
app.post('/api/ai/quicktask', aiQuicktaskHandler)
app.post('/api/ai/standup', aiStandupHandler)
app.post('/api/ai/retro', aiRetroHandler)

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
