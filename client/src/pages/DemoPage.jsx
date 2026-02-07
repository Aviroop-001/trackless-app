import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

/* ───────────────────────── constants ───────────────────────── */

const STORAGE_KEY = 'nudgeai_demo_v7'

const DEFAULT_COLUMNS = [
  { id: 'inbox', label: 'Inbox', dot: 'bg-slate-400' },
  { id: 'planned', label: 'Planned', dot: 'bg-amber-400' },
  { id: 'doing', label: 'In Progress', dot: 'bg-blue-500' },
  { id: 'done', label: 'Done', dot: 'bg-emerald-500' },
]

// Keep STATUSES as alias for backward compat in places that don't need per-project
const STATUSES = DEFAULT_COLUMNS

const CUSTOM_COL_COLORS = ['bg-purple-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-lime-500', 'bg-sky-500', 'bg-fuchsia-500', 'bg-yellow-500']

const PRIORITIES = [
  { id: 'p0', label: 'Urgent', short: 'P0', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  { id: 'p1', label: 'High', short: 'P1', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  { id: 'p2', label: 'Medium', short: 'P2', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  { id: 'p3', label: 'Low', short: 'P3', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
]

const NAV = { projects: 'projects', users: 'users', teams: 'teams', board: 'board', settings: 'settings' }

const DEFAULT_SETTINGS = { theme: 'light', defaultView: 'kanban', sidebarCollapsed: false, density: 'comfortable' }
const BOARD_VIEWS = { kanban: 'kanban', list: 'list', timeline: 'timeline', heatmap: 'heatmap' }

const TAG_PALETTE = [
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-amber-100', text: 'text-amber-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
]

const TEAM_COLORS = [
  { id: 'blue', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', pill: 'bg-blue-100 text-blue-700' },
  { id: 'rose', dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', pill: 'bg-rose-100 text-rose-700' },
  { id: 'amber', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', pill: 'bg-amber-100 text-amber-700' },
  { id: 'emerald', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', pill: 'bg-emerald-100 text-emerald-700' },
  { id: 'violet', dot: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200', pill: 'bg-violet-100 text-violet-700' },
  { id: 'cyan', dot: 'bg-cyan-500', bg: 'bg-cyan-50', text: 'text-cyan-700', ring: 'ring-cyan-200', pill: 'bg-cyan-100 text-cyan-700' },
]

/* ───────────────────────── helpers ──────────────────────────── */

function uid() { try { return crypto.randomUUID() } catch { return `${Date.now()}_${Math.random().toString(16).slice(2)}` } }
function initials(name) { const p = String(name || '').trim().split(/\s+/).filter(Boolean); return `${p[0]?.[0] ?? '?'}${p.length > 1 ? p.at(-1)?.[0] : ''}`.toUpperCase() }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)) }

function timeAgo(ts) {
  const d = Date.now() - ts, m = Math.floor(d / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function tagColorIdx(tag) { let h = 0; for (const c of tag) h = ((h << 5) - h + c.charCodeAt(0)) | 0; return Math.abs(h) % TAG_PALETTE.length }
function isOverdue(dueDate) { if (!dueDate) return false; const d = new Date(dueDate); d.setHours(23, 59, 59, 999); return d < new Date() }
function formatDate(iso) { if (!iso) return ''; return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }

function derivePrefix(name) {
  const first = String(name || '').trim().split(/\s+/)[0] || 'PRJ'
  return first.toUpperCase().slice(0, 6)
}

function getProjectColumns(project) {
  return project?.columns ?? DEFAULT_COLUMNS
}

function taskKey(prefix, number) { return `${prefix}-${number}` }

/** Resolve assigneeId to { type: 'user'|'team', entity } or null */
function resolveAssignee(assigneeId, users, teams) {
  if (!assigneeId) return null
  const user = users.find((u) => u.id === assigneeId)
  if (user) return { type: 'user', entity: user }
  const team = (teams ?? []).find((t) => t.id === assigneeId)
  if (team) return { type: 'team', entity: team }
    return null
}

/** Render comment text with highlighted @mentions (users + teams) */
function renderMentionText(text, userNames, teams = []) {
  const parts = []
  let remaining = text
  let key = 0
  while (remaining) {
    const atIdx = remaining.indexOf('@')
    if (atIdx === -1) { parts.push(remaining); break }
    if (atIdx > 0) parts.push(remaining.slice(0, atIdx))
    remaining = remaining.slice(atIdx)
    let matched = false
    // try user names first
    for (const name of userNames) {
      if (remaining.slice(1).startsWith(name)) {
        parts.push(<span key={key++} className="inline-block bg-cyan-100 text-cyan-700 rounded px-1 font-medium text-[12px]">@{name}</span>)
        remaining = remaining.slice(1 + name.length)
        matched = true
        break
      }
    }
    // try team names
    if (!matched) {
      for (const team of teams) {
        if (remaining.slice(1).startsWith(team.name)) {
          const tc = TEAM_COLORS.find((c) => c.id === team.color) ?? TEAM_COLORS[0]
          parts.push(<span key={key++} className={['inline-block rounded px-1 font-medium text-[12px]', tc.pill].join(' ')}>@{team.name}</span>)
          remaining = remaining.slice(1 + team.name.length)
          matched = true
          break
        }
      }
    }
    if (!matched) { parts.push('@'); remaining = remaining.slice(1) }
  }
  return parts
}

/* ───────────────────────── persistence ──────────────────────── */

function loadState() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null } catch { return null } }
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* */ } }

/* ───────────────────────── seed data ───────────────────────── */

function seedProjects(users) {
  const now = Date.now()
  return [
    { id: uid(), name: 'MVP Launch', prefix: 'MVP', taskCounter: 6, columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), comments: [
      { id: uid(), authorId: users[0]?.id, text: 'Kicked off the MVP sprint. Let\'s aim for launch by end of month. @Sam Chen can you own the infra tickets?', createdAt: now - 1000 * 60 * 60 * 24 },
    ], createdAt: now - 1000 * 60 * 60 * 48 },
    { id: uid(), name: 'Growth Experiments', prefix: 'GROWTH', taskCounter: 3, columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), comments: [], createdAt: now - 1000 * 60 * 60 * 24 },
  ]
}

function seedUsers() {
  const now = Date.now()
  return ['Avi Banerjee', 'Sam Chen', 'Riya Patel'].map((n, i) => ({
    id: uid(), name: n, initials: initials(n), createdAt: now - i * 1000,
  }))
}

function seedTeams(users) {
  const now = Date.now()
  return [
    { id: uid(), name: 'Engineering', color: 'blue', memberIds: [users[0]?.id, users[1]?.id].filter(Boolean), createdAt: now - 1000 * 60 * 60 * 48 },
    { id: uid(), name: 'Design', color: 'rose', memberIds: [users[2]?.id].filter(Boolean), createdAt: now - 1000 * 60 * 60 * 24 },
  ]
}

function seedTasks(p1, p2, users, teams) {
  const now = Date.now()
  const yesterday = new Date(now - 86400000).toISOString().slice(0, 10)
  const in3days = new Date(now + 86400000 * 3).toISOString().slice(0, 10)
  const in7days = new Date(now + 86400000 * 7).toISOString().slice(0, 10)
  return [
    { id: uid(), projectId: p1, number: 1, title: 'Fix auth redirect loop on refresh', description: 'Users get stuck in an infinite redirect when their session token expires mid-navigation. Need to catch the 401 and redirect to login gracefully.', tags: ['auth', 'bug'], status: 'doing', priority: 'p0', dueDate: yesterday, subtasks: [{ id: uid(), title: 'Reproduce in staging', done: true }, { id: uid(), title: 'Add token refresh interceptor', done: false }, { id: uid(), title: 'Write regression test', done: false }], comments: [
      { id: uid(), authorId: users[1]?.id, text: 'Reproduced this in staging. It happens when the token expires mid-navigation. @Avi Banerjee I pushed a fix to the interceptor branch.', createdAt: now - 1000 * 60 * 60 * 2 },
      { id: uid(), authorId: users[0]?.id, text: 'Nice catch. Let me review the PR. @Riya Patel can you write the regression test once it\'s merged?', createdAt: now - 1000 * 60 * 45 },
    ], assigneeId: users[0]?.id ?? null, order: 0, createdAt: now - 1000 * 60 * 60 * 3 },
    { id: uid(), projectId: p1, number: 2, title: 'Ship onboarding flow to prod', description: 'The 3-step onboarding is tested and approved. Deploy behind a feature flag first, then roll out 100%.', tags: ['launch'], status: 'done', priority: 'p1', dueDate: null, subtasks: [], comments: [], assigneeId: users[1]?.id ?? null, order: 0, createdAt: now - 1000 * 60 * 60 * 10 },
    { id: uid(), projectId: p1, number: 3, title: 'Write API docs for public endpoints', description: '', tags: ['docs'], status: 'planned', priority: 'p2', dueDate: in7days, subtasks: [{ id: uid(), title: 'Document /auth endpoints', done: false }, { id: uid(), title: 'Document /tasks CRUD', done: false }], comments: [], assigneeId: teams?.[1]?.id ?? null, order: 0, createdAt: now - 1000 * 60 * 60 * 2 },
    { id: uid(), projectId: p1, number: 4, title: 'Set up error monitoring (Sentry)', description: '', tags: ['infra'], status: 'inbox', priority: 'p1', dueDate: in3days, subtasks: [], comments: [], assigneeId: teams?.[0]?.id ?? null, order: 0, createdAt: now - 1000 * 60 * 25 },
    { id: uid(), projectId: p1, number: 5, title: 'Nudge AI: auto-tag + detect duplicates', description: 'Research feasibility of using embeddings to detect duplicate tasks and suggest tags based on title + description content.', tags: ['ai', 'v2'], status: 'inbox', priority: 'p3', dueDate: null, subtasks: [], comments: [], assigneeId: null, order: 1, createdAt: now - 1000 * 60 * 8 },
    { id: uid(), projectId: p2, number: 1, title: 'A/B test pricing page copy', description: '', tags: ['experiment'], status: 'doing', priority: 'p2', dueDate: in3days, subtasks: [{ id: uid(), title: 'Set up Vercel split test', done: true }, { id: uid(), title: 'Monitor for 7 days', done: false }], comments: [], assigneeId: users[2]?.id ?? null, order: 0, createdAt: now - 1000 * 60 * 60 },
    { id: uid(), projectId: p2, number: 2, title: 'Set up referral program', description: '', tags: ['growth'], status: 'planned', priority: 'p2', dueDate: null, subtasks: [], comments: [], assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 30 },
  ]
}

function normalizeOrders(tasks, pid, columns = DEFAULT_COLUMNS) {
  const out = tasks.map((t) => ({ ...t }))
  for (const s of columns) {
    const g = out.filter((t) => t.projectId === pid && t.status === s.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    g.forEach((t, i) => { t.order = i })
  }
  return out
}

function getInitialState() {
  const s = typeof window !== 'undefined' ? loadState() : null
  if (s?.projects && s?.users && s?.tasks) return { projects: s.projects, users: s.users, teams: s.teams ?? [], tasks: s.tasks, activeProjectId: s.activeProjectId ?? null, view: s.view ?? NAV.projects, settings: { ...DEFAULT_SETTINGS, ...(s.settings ?? {}) } }
  const users = seedUsers()
  const teams = seedTeams(users)
  const projects = seedProjects(users)
  return { projects, users, teams, tasks: seedTasks(projects[0].id, projects[1].id, users, teams), activeProjectId: null, view: NAV.projects, settings: { ...DEFAULT_SETTINGS } }
}

/* ───────────────────────── SVG icons ───────────────────────── */

function IconFolder({ className = 'w-5 h-5' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.06-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg> }
function IconUsers({ className = 'w-5 h-5' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> }
function IconPlus({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function IconArrowLeft({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg> }
function IconArrowRight({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg> }
function IconSearch({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg> }
function IconKanban({ className = 'w-5 h-5' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" /></svg> }
function IconX({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg> }
function IconTrash({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg> }
function IconClock({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> }
function IconList({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></svg> }
function IconCalendar({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg> }
function IconCheck({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg> }
function IconCommand({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></svg> }
function IconCopy({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg> }
function IconChat({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg> }
function IconSparkle({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg> }
function IconTeam({ className = 'w-5 h-5' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg> }
function IconPencil({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg> }
function IconSliders({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg> }
function IconGear({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> }
function IconChevronLeft({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg> }
function IconChevronRight({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg> }
function IconGripVertical({ className = 'w-4 h-4', ...props }) { return <svg className={className} fill="currentColor" viewBox="0 0 20 20" {...props}><circle cx="7" cy="4" r="1.5" /><circle cx="13" cy="4" r="1.5" /><circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" /><circle cx="7" cy="16" r="1.5" /><circle cx="13" cy="16" r="1.5" /></svg> }
function IconSun({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg> }
function IconMoon({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg> }
function IconEye({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> }
function IconEyeOff({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg> }

function IconBolt({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg> }
function IconLink({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg> }
function IconClipboard({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" /></svg> }
function IconTarget({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0-3-3m3 3 3-3m-8.25 6a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg> }
function IconDocument({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg> }
function IconTimeline({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg> }
function IconHeatmap({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg> }
function IconChart({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> }
function IconBookmark({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg> }
function IconFilter({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg> }
function IconEllipsis({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg> }
function IconChevronDown({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg> }

/** Simple fuzzy string similarity (0-1). Normalized Levenshtein-like bigram overlap. */
function stringSimilarity(a, b) {
  if (!a || !b) return 0
  const sa = a.toLowerCase().trim(), sb = b.toLowerCase().trim()
  if (sa === sb) return 1
  if (sa.length < 2 || sb.length < 2) return 0
  const bigramsA = new Set(); for (let i = 0; i < sa.length - 1; i++) bigramsA.add(sa.slice(i, i + 2))
  const bigramsB = new Set(); for (let i = 0; i < sb.length - 1; i++) bigramsB.add(sb.slice(i, i + 2))
  let overlap = 0; for (const b2 of bigramsB) if (bigramsA.has(b2)) overlap++
  return (2 * overlap) / (bigramsA.size + bigramsB.size)
}

/** Default task templates */
const TASK_TEMPLATES = [
  { name: 'Bug Report', icon: '🐛', fields: { tags: ['bug'], priority: 'p1', subtasks: ['Reproduce the issue', 'Identify root cause', 'Implement fix', 'Write regression test'] } },
  { name: 'Feature Request', icon: '✨', fields: { tags: ['feature'], priority: 'p2', subtasks: ['Define requirements', 'Design solution', 'Implement', 'Write tests', 'Update docs'] } },
  { name: 'Spike / Research', icon: '🔬', fields: { tags: ['research'], priority: 'p3', subtasks: ['Research options', 'Document findings', 'Present recommendation'] } },
  { name: 'Chore / Maintenance', icon: '🔧', fields: { tags: ['chore'], priority: 'p3', subtasks: [] } },
  { name: 'Design Task', icon: '🎨', fields: { tags: ['design'], priority: 'p2', subtasks: ['Create mockups', 'Get feedback', 'Finalize designs'] } },
]

/* ───────────────────────── shared components ───────────────── */

function Avatar({ name, size = 'sm' }) {
  const init = initials(name)
  const s = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }
  return <span className={['inline-flex items-center justify-center rounded-full font-semibold bg-linear-to-br from-cyan-50 to-slate-100 text-slate-600 ring-1 ring-slate-200/80', s[size] ?? s.sm].join(' ')}>{init}</span>
}

function TagPill({ tag, onRemove }) {
  const c = TAG_PALETTE[tagColorIdx(tag)]
  return (
    <span className={['inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium', c.bg, c.text].join(' ')}>
      {tag}
      {onRemove && <button type="button" onClick={onRemove} className="ml-0.5 rounded-sm p-0.5 hover:bg-black/5 transition-colors" aria-label={`Remove ${tag}`}><IconX className="w-2.5 h-2.5" /></button>}
    </span>
  )
}

function PriorityBadge({ priority, size = 'sm' }) {
  const p = PRIORITIES.find((x) => x.id === priority)
  if (!p) return null
  const s = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
  return <span className={['inline-flex items-center gap-1 rounded font-bold', s, p.bg, p.text].join(' ')}>{p.short}</span>
}

function SubtaskProgress({ subtasks }) {
  if (!subtasks?.length) return null
  const done = subtasks.filter((s) => s.done).length
  return <span className="inline-flex items-center gap-1 text-[11px] text-slate-500"><IconCheck className="w-3 h-3" />{done}/{subtasks.length}</span>
}

function TaskId({ prefix, number }) {
  if (!prefix || !number) return null
  return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-600">{prefix}-{number}</span>
}

function CopyButton({ text, label = 'Copy link' }) {
  const [copied, setCopied] = useState(false)
  const copy = async (e) => {
    e.stopPropagation()
    try { await navigator.clipboard.writeText(text) } catch { /* fallback */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button type="button" onClick={copy} className="relative rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label={label}>
      <IconCopy className="w-3.5 h-3.5" />
      {copied && <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white whitespace-nowrap animate-[fadeIn_100ms_ease-out]">Copied!</span>}
    </button>
  )
}

/* ───────────────────────── comment input with @mention ──────── */

function CommentInput({ users, teams, onSubmit }) {
  const [text, setText] = useState('')
  const [mentionQ, setMentionQ] = useState(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const ref = useRef(null)

  // combine users and teams into a single mention list
  const mentionItems = useMemo(() => {
    if (mentionQ === null) return []
    const q = mentionQ.toLowerCase()
    const userMatches = users.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 4).map((u) => ({ type: 'user', id: u.id, name: u.name, user: u }))
    const teamMatches = (teams ?? []).filter((t) => t.name.toLowerCase().includes(q)).slice(0, 3).map((t) => ({ type: 'team', id: t.id, name: t.name, team: t }))
    return [...userMatches, ...teamMatches].slice(0, 6)
  }, [mentionQ, users, teams])

  const handleChange = (e) => {
    const val = e.target.value
    setText(val)
    const cur = e.target.selectionStart
    const before = val.slice(0, cur)
    const atIdx = before.lastIndexOf('@')
    if (atIdx >= 0 && (atIdx === 0 || /\s/.test(before[atIdx - 1]))) {
      const q = before.slice(atIdx + 1)
      if (!/\s/.test(q)) { setMentionQ(q); setMentionIdx(0); return }
    }
    setMentionQ(null)
  }

  const insertMention = (item) => {
    const cur = ref.current?.selectionStart ?? text.length
    const before = text.slice(0, cur)
    const atIdx = before.lastIndexOf('@')
    const after = text.slice(cur)
    const next = text.slice(0, atIdx) + `@${item.name} ` + after
    setText(next)
    setMentionQ(null)
    setTimeout(() => {
      const pos = atIdx + item.name.length + 2
      ref.current?.setSelectionRange(pos, pos)
      ref.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (mentionQ !== null && mentionItems.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => Math.min(i + 1, mentionItems.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionItems[mentionIdx]) }
      else if (e.key === 'Escape') { setMentionQ(null) }
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (text.trim()) { onSubmit(text.trim()); setText('') }
    }
  }

  return (
    <div className="relative">
      {mentionQ !== null && mentionItems.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-10">
          {mentionItems.map((item, i) => {
            if (item.type === 'team') {
              const tc = TEAM_COLORS.find((c) => c.id === item.team.color) ?? TEAM_COLORS[0]
              return (
                <button key={`t-${item.id}`} type="button" onClick={() => insertMention(item)} className={['flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors', i === mentionIdx ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>
                  <span className={['inline-flex h-7 w-7 items-center justify-center rounded-full', tc.bg].join(' ')}><span className={['h-2 w-2 rounded-full', tc.dot].join(' ')} /></span>
                  <span>{item.name}</span>
                  <span className="ml-auto text-[10px] text-slate-400">Team</span>
                </button>
              )
            }
  return (
              <button key={`u-${item.id}`} type="button" onClick={() => insertMention(item)} className={['flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors', i === mentionIdx ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>
                <Avatar name={item.name} size="sm" /><span>{item.name}</span>
              </button>
            )
          })}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea ref={ref} value={text} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Write a comment… (use @ to mention)" rows={1} className="flex-1 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors resize-none" style={{ minHeight: 36 }} />
        <button type="button" onClick={() => { if (text.trim()) { onSubmit(text.trim()); setText('') } }} disabled={!text.trim()} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Send</button>
      </div>
    </div>
  )
}

/* ───────────────────────── comment list ─────────────────────── */

function CommentList({ comments, users, teams, onDelete }) {
  const userNames = useMemo(() => users.map((u) => u.name), [users])
  if (!comments?.length) return <div className="py-3 text-center text-xs text-slate-400">No comments yet</div>
  return (
    <div className="space-y-3">
      {comments.map((c) => {
        const author = users.find((u) => u.id === c.authorId)
        return (
          <div key={c.id} className="group flex gap-2.5">
            <Avatar name={author?.name ?? 'Unknown'} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-slate-900">{author?.name ?? 'Unknown'}</span>
                <span className="text-[11px] text-slate-400">{timeAgo(c.createdAt)}</span>
                {onDelete && <button type="button" onClick={() => onDelete(c.id)} className="ml-auto rounded p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><IconX className="w-3 h-3" /></button>}
              </div>
              <p className="mt-0.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{renderMentionText(c.text, userNames, teams)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────────────────── command palette ─────────────────── */

function CommandPalette({ tasks, projects, users, teams, onClose, onSelectTask, onNavigate }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { const fn = (e) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn) }, [onClose])

  const results = useMemo(() => {
    const lower = q.trim().toLowerCase()
    if (!lower) return { tasks: [], projects: [], users: [], teams: [] }
    return {
      tasks: tasks.filter((t) => {
        const proj = projects.find((p) => p.id === t.projectId)
        const key = proj ? taskKey(proj.prefix, t.number).toLowerCase() : ''
        return t.title.toLowerCase().includes(lower) || key.includes(lower)
      }).slice(0, 6),
      projects: projects.filter((p) => p.name.toLowerCase().includes(lower) || p.prefix.toLowerCase().includes(lower)).slice(0, 3),
      users: users.filter((u) => u.name.toLowerCase().includes(lower)).slice(0, 3),
      teams: (teams ?? []).filter((t) => t.name.toLowerCase().includes(lower)).slice(0, 3),
    }
  }, [q, tasks, projects, users, teams])

  const hasResults = results.tasks.length + results.projects.length + results.users.length + results.teams.length > 0

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] animate-[fadeIn_100ms_ease-out]" onClick={onClose} />
      <div className="fixed left-1/2 top-[20%] z-[61] w-full max-w-lg -translate-x-1/2 animate-[slideUp_150ms_ease-out]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <IconSearch className="w-5 h-5 text-slate-400 shrink-0" />
            <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks, projects, people… (try MVP-1)" className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none" />
            <kbd className="hidden sm:inline rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">ESC</kbd>
          </div>
          {q.trim() ? (
            <div className="max-h-72 overflow-y-auto p-2">
              {!hasResults && <div className="px-3 py-6 text-center text-sm text-slate-400">No results for &ldquo;{q.trim()}&rdquo;</div>}
              {results.projects.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Projects</div>
                  {results.projects.map((p) => (
                    <button key={p.id} type="button" onClick={() => { onNavigate(NAV.board, p.id); onClose() }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <IconKanban className="w-4 h-4 text-slate-400" />{p.name}<span className="ml-auto text-[10px] font-mono text-slate-400">{p.prefix}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.tasks.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tasks</div>
                  {results.tasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId)
                    return (
                      <button key={t.id} type="button" onClick={() => { onSelectTask(t.id, t.projectId); onClose() }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <span className={['h-2 w-2 rounded-full shrink-0', getProjectColumns(proj).find((s) => s.id === t.status)?.dot ?? 'bg-slate-400'].join(' ')} />
                        {proj && <TaskId prefix={proj.prefix} number={t.number} />}
                        <span className="truncate flex-1">{t.title}</span>
                        {t.priority && <PriorityBadge priority={t.priority} />}
                      </button>
                    )
                  })}
                </div>
              )}
              {results.users.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">People</div>
                  {results.users.map((u) => (
                    <button key={u.id} type="button" onClick={onClose} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <Avatar name={u.name} size="sm" />{u.name}
                    </button>
                  ))}
                </div>
              )}
              {results.teams.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Teams</div>
                  {results.teams.map((t) => {
                    const tc = TEAM_COLORS.find((c) => c.id === t.color) ?? TEAM_COLORS[0]
  return (
                      <button key={t.id} type="button" onClick={() => { onNavigate(NAV.teams); onClose() }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <span className={['h-2.5 w-2.5 rounded-full shrink-0', tc.dot].join(' ')} />{t.name}<span className="ml-auto text-[10px] text-slate-400">{t.memberIds.length} members</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-400">Start typing to search across everything…</div>
          )}
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── keyboard shortcuts help ──────────── */

function ShortcutHelp({ onClose }) {
  useEffect(() => { const fn = (e) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn) }, [onClose])
  const shortcuts = [['N', 'New task (when on board)'], ['⌘ K', 'Open command palette'], ['?', 'Toggle this help'], ['Esc', 'Close panel / dialog']]
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed left-1/2 top-[25%] z-[61] w-full max-w-sm -translate-x-1/2 animate-[slideUp_150ms_ease-out]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Keyboard shortcuts</h3>
            <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100"><IconX className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2">
            {shortcuts.map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-600">{desc}</span>
                <kbd className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 min-w-[2rem] text-center">{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── task detail panel ─────────────────── */

function DepPicker({ allTasks, project, columns, onAdd }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const filtered = allTasks.filter((t) => !q || t.title.toLowerCase().includes(q.toLowerCase()))
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 hover:border-slate-300 hover:text-slate-600 transition-colors"><IconLink className="w-3 h-3" />Add blocker</button>
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden" style={{ animation: 'fadeIn 0.1s ease-out' }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tasks…" autoFocus className="w-full border-b border-slate-100 px-3 py-2 text-xs placeholder:text-slate-400 focus:outline-none" onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); setQ('') } }} />
      <div className="max-h-32 overflow-y-auto">
        {filtered.length === 0 && <div className="px-3 py-2 text-[11px] text-slate-400">No tasks found</div>}
        {filtered.slice(0, 8).map((t) => {
          const st = (columns ?? DEFAULT_COLUMNS).find((c) => c.id === t.status)
          return (
            <button key={t.id} type="button" onClick={() => { onAdd(t.id); setOpen(false); setQ('') }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors">
              <span className={['h-2 w-2 rounded-full shrink-0', st?.dot ?? 'bg-slate-400'].join(' ')} />
              {project && <span className="font-mono text-[10px] text-slate-400">{taskKey(project.prefix, t.number)}</span>}
              <span className="flex-1 truncate">{t.title}</span>
        </button>
          )
        })}
      </div>
    </div>
  )
}

function TaskDetailPanel({ task, project, users, teams, columns, allTasks, onClose, onUpdate, onDelete, onAddComment, onDeleteComment, onAddBlocker, onRemoveBlocker, buildTaskUrl }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [descDraft, setDescDraft] = useState(task.description ?? '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const titleRef = useRef(null)
  const descRef = useRef(null)

  const statusInfo = (columns ?? DEFAULT_COLUMNS).find((s) => s.id === task.status)
  const stDone = (task.subtasks ?? []).filter((s) => s.done).length
  const stTotal = (task.subtasks ?? []).length
  const tk = project ? taskKey(project.prefix, task.number) : null

  useEffect(() => { if (editingTitle && titleRef.current) titleRef.current.focus() }, [editingTitle])
  useEffect(() => { if (editingDesc && descRef.current) { descRef.current.focus(); descRef.current.setSelectionRange(descRef.current.value.length, descRef.current.value.length) } }, [editingDesc])
  useEffect(() => { const fn = (e) => { if (e.key === 'Escape' && !editingTitle && !editingDesc) onClose() }; window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn) }, [onClose, editingTitle, editingDesc])

  const commitTitle = () => { const t = titleDraft.trim(); if (t && t !== task.title) onUpdate(task.id, { title: t }); setEditingTitle(false) }
  const commitDesc = () => { if (descDraft !== (task.description ?? '')) onUpdate(task.id, { description: descDraft }); setEditingDesc(false) }
  const addTag = () => { const t = newTag.trim().toLowerCase(); if (!t) return; if (!(task.tags ?? []).includes(t)) onUpdate(task.id, { tags: [...(task.tags ?? []), t].slice(0, 8) }); setNewTag('') }
  const removeTag = (t) => onUpdate(task.id, { tags: (task.tags ?? []).filter((x) => x !== t) })
  const addSubtask = () => { const t = newSubtask.trim(); if (!t) return; onUpdate(task.id, { subtasks: [...(task.subtasks ?? []), { id: uid(), title: t, done: false }] }); setNewSubtask('') }
  const toggleSubtask = (sid) => onUpdate(task.id, { subtasks: (task.subtasks ?? []).map((s) => s.id === sid ? { ...s, done: !s.done } : s) })
  const removeSubtask = (sid) => onUpdate(task.id, { subtasks: (task.subtasks ?? []).filter((s) => s.id !== sid) })

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideInRight_200ms_ease-out]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {tk && <TaskId prefix={project.prefix} number={task.number} />}
            {tk && <CopyButton text={buildTaskUrl(project.prefix, task.number)} label="Copy task link" />}
            <span className="h-4 w-px bg-slate-200" />
            {statusInfo && <span className={['h-2.5 w-2.5 rounded-full', statusInfo.dot].join(' ')} />}
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{statusInfo?.label}</span>
            {task.priority && <PriorityBadge priority={task.priority} size="md" />}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" aria-label="Close"><IconX className="w-5 h-5" /></button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</label>
            {editingTitle ? (
              <input ref={titleRef} value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} onBlur={commitTitle} onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleDraft(task.title); setEditingTitle(false) } }} className="mt-1 w-full rounded-lg border border-cyan-300 bg-cyan-50/30 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30" />
            ) : (
              <button type="button" onClick={() => { setTitleDraft(task.title); setEditingTitle(true) }} className="mt-1 w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50 hover:border-slate-200 transition-colors cursor-text">{task.title}</button>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</label>
            {editingDesc ? (
              <textarea ref={descRef} value={descDraft} onChange={(e) => setDescDraft(e.target.value)} onBlur={commitDesc} rows={4} placeholder="Add a description…" className="mt-1 w-full rounded-lg border border-cyan-300 bg-cyan-50/30 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 resize-none" />
            ) : (
              <button type="button" onClick={() => { setDescDraft(task.description ?? ''); setEditingDesc(true) }} className="mt-1 w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-colors cursor-text min-h-[60px]">
                {task.description || <span className="text-slate-400">Add a description…</span>}
              </button>
            )}
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</label>
              <select value={task.status} onChange={(e) => onUpdate(task.id, { status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30">
                {(columns ?? DEFAULT_COLUMNS).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</label>
              <select value={task.priority ?? ''} onChange={(e) => onUpdate(task.id, { priority: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30">
                <option value="">None</option>
                {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.short} — {p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Due date + Assignee */}
          <div className="grid grid-cols-2 gap-4">
          <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Due date</label>
              <input type="date" value={task.dueDate ?? ''} onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })} className={['mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30', task.dueDate && isOverdue(task.dueDate) && task.status !== 'done' ? 'border-red-300 text-red-700 bg-red-50/50' : 'border-slate-200 text-slate-700 bg-white'].join(' ')} />
                </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assignee</label>
              <select value={task.assigneeId ?? ''} onChange={(e) => onUpdate(task.id, { assigneeId: e.target.value || null })} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30">
                <option value="">Unassigned</option>
                {users.length > 0 && <optgroup label="Users">{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</optgroup>}
                {(teams ?? []).length > 0 && <optgroup label="Teams">{(teams ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tags</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(task.tags ?? []).map((t) => <TagPill key={t} tag={t} onRemove={() => removeTag(t)} />)}
              {!(task.tags ?? []).length && !newTag && <span className="text-xs text-slate-400 py-1">No tags</span>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addTag() }} className="mt-2 flex items-center gap-2">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add a tag…" className="flex-1 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
              <button type="submit" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Add</button>
            </form>
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subtasks {stTotal > 0 && <span className="text-slate-500 normal-case">({stDone}/{stTotal})</span>}</label>
            {stTotal > 0 && <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${(stDone / stTotal) * 100}%` }} /></div>}
            <div className="mt-2 space-y-1">
              {(task.subtasks ?? []).map((st) => (
                <div key={st.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors">
                  <button type="button" onClick={() => toggleSubtask(st.id)} className={['h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors', st.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'].join(' ')}>{st.done && <IconCheck className="w-3 h-3 text-white" />}</button>
                  <span className={['flex-1 text-sm', st.done ? 'text-slate-400 line-through' : 'text-slate-700'].join(' ')}>{st.title}</span>
                  <button type="button" onClick={() => removeSubtask(st.id)} className="rounded p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><IconX className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addSubtask() }} className="mt-2 flex items-center gap-2">
              <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Add a subtask…" className="flex-1 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
              <button type="submit" className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">Add</button>
            </form>
          </div>

          {/* Dependencies */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Blocked by {(task.blockedBy ?? []).length > 0 && <span className="text-slate-500 normal-case">({(task.blockedBy ?? []).length})</span>}</label>
            <div className="mt-2 space-y-1">
              {(task.blockedBy ?? []).map((bid) => {
                const blocker = (allTasks ?? []).find((t) => t.id === bid)
                if (!blocker) return null
                const bp = project // same project for now
                return (
                  <div key={bid} className="group flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50/50 px-3 py-2 text-sm">
                    <IconLink className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    {bp && <span className="text-[10px] font-mono text-orange-500">{taskKey(bp.prefix, blocker.number)}</span>}
                    <span className="flex-1 text-[13px] text-slate-700 truncate">{blocker.title}</span>
                    <span className={['h-2 w-2 rounded-full shrink-0', (columns ?? DEFAULT_COLUMNS).find((c) => c.id === blocker.status)?.dot ?? 'bg-slate-400'].join(' ')} />
                    <button type="button" onClick={() => onRemoveBlocker?.(task.id, bid)} className="rounded p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><IconX className="w-3 h-3" /></button>
            </div>
                )
              })}
            </div>
            <div className="mt-2">
              <DepPicker task={task} allTasks={(allTasks ?? []).filter((t) => t.projectId === task.projectId && t.id !== task.id && !(task.blockedBy ?? []).includes(t.id))} project={project} columns={columns} onAdd={(bid) => onAddBlocker?.(task.id, bid)} />
          </div>
        </div>

          {/* Comments */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Comments {(task.comments ?? []).length > 0 && <span className="text-slate-500 normal-case">({(task.comments ?? []).length})</span>}
            </label>
            <div className="mt-3">
              <CommentList comments={task.comments ?? []} users={users} teams={teams} onDelete={(cid) => onDeleteComment(task.id, cid)} />
            </div>
            <div className="mt-3">
              <CommentInput users={users} teams={teams} onSubmit={(text) => onAddComment(task.id, text)} />
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500"><IconClock className="w-3.5 h-3.5" />Created {timeAgo(task.createdAt)}</div>
          </div>
        </div>

        {/* footer */}
        <div className="border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={() => { onDelete(task.id); onClose() }} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"><IconTrash className="w-4 h-4" />Delete task</button>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── task card ────────────────────────── */

function TaskCard({ task, project, users, teams, columns, onAssign, onDragStart, onDragEnd, registerEl, onSelect, isNew, bulkSelected, onBulkToggle, bulkMode }) {
  const resolved = resolveAssignee(task.assigneeId, users, teams ?? [])
  const assignee = resolved?.type === 'user' ? resolved.entity : null
  const assignedTeam = resolved?.type === 'team' ? resolved.entity : null
  const teamColor = assignedTeam ? TEAM_COLORS.find((c) => c.id === assignedTeam.color) ?? TEAM_COLORS[0] : null
  const statusInfo = (columns ?? DEFAULT_COLUMNS).find((s) => s.id === task.status)
  const overdue = isOverdue(task.dueDate) && task.status !== 'done'
  const commentCount = (task.comments ?? []).length

  return (
    <div ref={(el) => registerEl?.(task.id, el)} data-task-id={task.id} draggable onDragStart={(e) => onDragStart?.(e, task.id)} onDragEnd={onDragEnd} onClick={(e) => { if (e.shiftKey || bulkMode) { e.stopPropagation(); onBulkToggle?.(task.id) } else { onSelect?.(task.id) } }}
      className={['group cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-all duration-150 hover:shadow-md active:cursor-grabbing active:shadow-lg density-card', bulkSelected ? 'border-cyan-400 ring-2 ring-cyan-200/50 bg-cyan-50/30' : overdue ? 'border-red-200 hover:border-red-300' : 'border-slate-200 hover:border-slate-300', isNew ? 'animate-[slideUp_250ms_ease-out]' : ''].join(' ')}>
      <div className="flex items-start gap-2.5">
        {bulkMode ? (
          <button type="button" onClick={(e) => { e.stopPropagation(); onBulkToggle?.(task.id) }} className={['mt-1 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-all', bulkSelected ? 'border-cyan-500 bg-cyan-500' : 'border-slate-300 hover:border-cyan-400'].join(' ')} aria-label="Select task">
            {bulkSelected && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
          </button>
        ) : statusInfo ? <span className={['mt-1.5 h-2 w-2 shrink-0 rounded-full', statusInfo.dot].join(' ')} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-slate-900 leading-snug flex-1">{task.title}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              {task.priority && <PriorityBadge priority={task.priority} />}
              {project && <TaskId prefix={project.prefix} number={task.number} />}
            </div>
              </div>
          {task.description && <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{task.description}</p>}
          {task.tags?.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{task.tags.map((t) => <TagPill key={t} tag={t} />)}</div>}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {assignee ? (
              <div className="flex items-center gap-1.5"><Avatar name={assignee.name} size="sm" /><span className="text-[11px] text-slate-500">{assignee.name.split(' ')[0]}</span></div>
            ) : assignedTeam && teamColor ? (
              <span className={['inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', teamColor.pill].join(' ')}><span className={['h-1.5 w-1.5 rounded-full', teamColor.dot].join(' ')} />{assignedTeam.name}</span>
            ) : (
              <select value="" onChange={(e) => { e.stopPropagation(); onAssign(task.id, e.target.value || null) }} onClick={(e) => e.stopPropagation()} className="h-6 rounded border border-dashed border-slate-200 bg-transparent px-1 text-[10px] text-slate-400 hover:border-slate-300 focus:outline-none" aria-label="Assign">
                <option value="">+ Assign</option>
                {users.length > 0 && <optgroup label="Users">{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</optgroup>}
                {(teams ?? []).length > 0 && <optgroup label="Teams">{(teams ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>}
              </select>
            )}
            <SubtaskProgress subtasks={task.subtasks} />
            {task.dueDate && <span className={['inline-flex items-center gap-1 text-[11px]', overdue ? 'text-red-600 font-semibold' : 'text-slate-400'].join(' ')}><IconCalendar className="w-3 h-3" />{formatDate(task.dueDate)}</span>}
            {commentCount > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><IconChat className="w-3 h-3" />{commentCount}</span>}
            {(task.blockedBy ?? []).length > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-orange-500 font-medium"><IconLink className="w-3 h-3" />Blocked</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── list view ─────────────────────────── */

function ListView({ tasks, projects, users, teams, columns, onSelect }) {
  return (
    <div className="divide-y divide-slate-100">
      <div className="grid grid-cols-[70px_1fr_80px_80px_100px_90px_70px] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>ID</span><span>Task</span><span>Priority</span><span>Status</span><span>Assignee</span><span>Due</span><span>Subtasks</span>
      </div>
      {tasks.length === 0 && <div className="py-12 text-center text-sm text-slate-400">No tasks match your filters</div>}
      {tasks.map((t) => {
        const resolved = resolveAssignee(t.assigneeId, users, teams ?? [])
        const status = (columns ?? DEFAULT_COLUMNS).find((s) => s.id === t.status)
        const proj = projects.find((p) => p.id === t.projectId)
        const overdue = isOverdue(t.dueDate) && t.status !== 'done'
        const assignLabel = resolved?.type === 'user' ? resolved.entity.name.split(' ')[0] : resolved?.type === 'team' ? resolved.entity.name : '—'
        const tc = resolved?.type === 'team' ? TEAM_COLORS.find((c) => c.id === resolved.entity.color) ?? TEAM_COLORS[0] : null
        return (
          <button key={t.id} type="button" onClick={() => onSelect(t.id)} className="grid grid-cols-[70px_1fr_80px_80px_100px_90px_70px] gap-3 px-4 py-3 w-full text-left hover:bg-slate-50 transition-colors items-center density-list-row">
            <div>{proj && <TaskId prefix={proj.prefix} number={t.number} />}</div>
            <div className="flex items-center gap-2 min-w-0">
              <span className={['h-2 w-2 rounded-full shrink-0', status?.dot].join(' ')} />
              <span className="text-sm text-slate-900 truncate">{t.title}</span>
            </div>
            <div>{t.priority && <PriorityBadge priority={t.priority} />}</div>
            <div className="text-[11px] text-slate-500">{status?.label}</div>
            <div>{tc ? <span className={['inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold', tc.pill].join(' ')}>{assignLabel}</span> : <span className="text-[11px] text-slate-500 truncate">{assignLabel}</span>}</div>
            <div className={['text-[11px]', overdue ? 'text-red-600 font-semibold' : 'text-slate-400'].join(' ')}>{t.dueDate ? formatDate(t.dueDate) : '—'}</div>
            <div><SubtaskProgress subtasks={t.subtasks} /></div>
              </button>
        )
      })}
          </div>
  )
}

/* ───────────────────────── board stats bar ────────────────────── */

function BoardStats({ tasks, activeProjectId }) {
  const pt = tasks.filter((t) => t.projectId === activeProjectId)
  const total = pt.length, done = pt.filter((t) => t.status === 'done').length
  const over = pt.filter((t) => isOverdue(t.dueDate) && t.status !== 'done').length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="flex items-center gap-4 text-[11px] text-slate-500">
      <span><strong className="text-slate-700">{total}</strong> tasks</span>
      <span className="h-3 w-px bg-slate-200" />
      <span><strong className="text-emerald-600">{pct}%</strong> done</span>
      {over > 0 && <><span className="h-3 w-px bg-slate-200" /><span className="text-red-600"><strong>{over}</strong> overdue</span></>}
      <div className="ml-auto h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
  )
}

/* ───────────────────────── nudges panel ──────────────────────── */

const NUDGE_META = {
  overdue:    { icon: IconClock, bg: 'bg-red-50', iconColor: 'text-red-500', badge: 'Overdue', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
  stale:      { icon: IconClock, bg: 'bg-amber-50', iconColor: 'text-amber-500', badge: 'Stuck', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700' },
  unassigned: { icon: IconUsers, bg: 'bg-orange-50', iconColor: 'text-orange-500', badge: 'Unassigned', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' },
  nodesc:     { icon: IconChat, bg: 'bg-slate-50', iconColor: 'text-slate-400', badge: 'Missing Info', badgeBg: 'bg-slate-100', badgeText: 'text-slate-600' },
  workload:   { icon: IconUsers, bg: 'bg-violet-50', iconColor: 'text-violet-500', badge: 'Workload', badgeBg: 'bg-violet-100', badgeText: 'text-violet-700' },
  idle:       { icon: IconClock, bg: 'bg-blue-50', iconColor: 'text-blue-500', badge: 'Idle', badgeBg: 'bg-blue-100', badgeText: 'text-blue-600' },
  blocked:    { icon: IconLink, bg: 'bg-orange-50', iconColor: 'text-orange-500', badge: 'Blocked', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' },
  ai:         { icon: IconSparkle, bg: 'bg-linear-to-br from-violet-50 to-cyan-50', iconColor: 'text-violet-500', badge: 'AI Insight', badgeBg: 'bg-linear-to-r from-violet-100 to-cyan-100', badgeText: 'text-violet-700' },
}

function NudgeCard({ nudge }) {
  const meta = NUDGE_META[nudge.type] ?? NUDGE_META.ai
  const Icon = meta.icon
  return (
    <div className={['rounded-xl border border-slate-200/80 p-3.5 shadow-sm', meta.bg].join(' ')} style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="flex items-start gap-3">
        <div className={['grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/80 ring-1 ring-slate-200/50', meta.iconColor].join(' ')}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={['inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold', meta.badgeBg, meta.badgeText].join(' ')}>{nudge.type === 'ai' && nudge.aiType === 'warning' ? 'AI Warning' : nudge.type === 'ai' && nudge.aiType === 'tip' ? 'AI Tip' : meta.badge}</span>
          </div>
          <p className="text-[13px] text-slate-700 leading-relaxed">{nudge.message}</p>
        </div>
      </div>
    </div>
  )
}

function NudgesPanel({ nudges, loading, onClose, onRefresh }) {
  const ruleNudges = nudges.filter((n) => n.type !== 'ai')
  const aiNudges = nudges.filter((n) => n.type === 'ai')
  const isEmpty = !loading && nudges.length === 0

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px] animate-[fadeIn_150ms_ease-out]" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideInRight_200ms_ease-out]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-violet-100 to-cyan-100 text-violet-600">
              <IconSparkle className="w-4 h-4" />
      </div>
            <div>
              <h2 className="text-sm font-semibold">Nudges</h2>
              <p className="text-[11px] text-slate-500">{nudges.length} suggestion{nudges.length !== 1 ? 's' : ''} for this board</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={onRefresh} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Refresh nudges">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>
            </button>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>
          </div>
        </div>

        {/* feed */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-500 mb-3">
                <IconCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">All clear!</p>
              <p className="mt-1 text-[12px] text-slate-500">No nudges right now. Your board looks healthy.</p>
          </div>
        )}

          {/* rule-based nudges */}
          {ruleNudges.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">Board Issues</div>
              {ruleNudges.map((n) => <NudgeCard key={n.id} nudge={n} />)}
      </div>
          )}

          {/* AI nudges */}
          {(aiNudges.length > 0 || loading) && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-1.5">
                <IconSparkle className="w-3 h-3 text-violet-400" />AI Insights
    </div>
              {loading && aiNudges.length === 0 && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-200/60" />
                        <div className="flex-1 space-y-2 pt-1">
                          <div className="h-3 w-16 rounded bg-slate-200/60" />
                          <div className="h-3 w-full rounded bg-slate-200/60" />
                          <div className="h-3 w-2/3 rounded bg-slate-200/60" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {aiNudges.map((n) => <NudgeCard key={n.id} nudge={n} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── nudge helpers ─────────────────────── */

const DAY_MS = 86400000

function computeRuleNudges(tasks, users, activeProjectId) {
  const nudges = []
  const pt = tasks.filter((t) => t.projectId === activeProjectId)
  const now = Date.now()

  // 1. Overdue tasks
  const overdue = pt.filter((t) => t.status !== 'done' && isOverdue(t.dueDate))
  for (const t of overdue) {
    const days = Math.ceil((now - new Date(t.dueDate).getTime()) / DAY_MS)
    const who = t.assigneeId ? users.find((u) => u.id === t.assigneeId)?.name : null
    nudges.push({ id: `overdue-${t.id}`, type: 'overdue', message: `"${t.title}" is ${days} day${days > 1 ? 's' : ''} overdue${who ? ` (assigned to ${who})` : ''}.`, priority: 0 })
  }

  // 2. Stale tasks (in "doing" for 3+ days with no recent comments)
  const stale = pt.filter((t) => {
    if (t.status !== 'doing') return false
    const age = (now - t.createdAt) / DAY_MS
    if (age < 3) return false
    const lastComment = (t.comments ?? []).reduce((latest, c) => Math.max(latest, c.createdAt ?? 0), 0)
    return !lastComment || (now - lastComment) / DAY_MS > 3
  })
  for (const t of stale) {
    const days = Math.floor((now - t.createdAt) / DAY_MS)
    nudges.push({ id: `stale-${t.id}`, type: 'stale', message: `"${t.title}" has been in progress for ${days} days with no updates. Stuck?`, priority: 1 })
  }

  // 3. Unassigned high-priority tasks
  const unassignedHigh = pt.filter((t) => !t.assigneeId && (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'done')
  for (const t of unassignedHigh) {
    const p = PRIORITIES.find((x) => x.id === t.priority)
    nudges.push({ id: `unassigned-${t.id}`, type: 'unassigned', message: `${p?.label ?? 'High'}-priority "${t.title}" has no owner. Assign someone?`, priority: 2 })
  }

  // 4. Tasks with no description
  const noDesc = pt.filter((t) => t.status !== 'done' && (!t.description || !t.description.trim()))
  if (noDesc.length > 0) {
    if (noDesc.length <= 2) {
      for (const t of noDesc) nudges.push({ id: `nodesc-${t.id}`, type: 'nodesc', message: `"${t.title}" has no description. Add context so the team knows what to do.`, priority: 4 })
    } else {
      nudges.push({ id: 'nodesc-bulk', type: 'nodesc', message: `${noDesc.length} tasks have no description. Adding context helps the team move faster.`, priority: 4 })
    }
  }

  // 5. Workload imbalance
  if (users.length >= 2) {
    const load = {}
    for (const u of users) load[u.id] = 0
    for (const t of pt) { if (t.assigneeId && t.status !== 'done' && load[t.assigneeId] !== undefined) load[t.assigneeId]++ }
    const counts = Object.entries(load).filter(([, v]) => v > 0)
    if (counts.length >= 2) {
      const max = counts.reduce((a, b) => a[1] >= b[1] ? a : b)
      const min = counts.reduce((a, b) => a[1] <= b[1] ? a : b)
      if (max[1] >= 3 * Math.max(min[1], 1)) {
        const maxName = users.find((u) => u.id === max[0])?.name ?? 'Someone'
        const minName = users.find((u) => u.id === min[0])?.name ?? 'someone'
        nudges.push({ id: 'workload', type: 'workload', message: `${maxName} has ${max[1]} tasks while ${minName} has ${min[1]}. Consider rebalancing.`, priority: 3 })
      }
    }
  }

  // 6. Idle board (no tasks in "doing")
  const doingCount = pt.filter((t) => t.status === 'doing').length
  if (pt.length > 0 && doingCount === 0) {
    nudges.push({ id: 'idle', type: 'idle', message: 'No tasks are currently in progress. Is the team blocked or between sprints?', priority: 3 })
  }

  // 7. Blocked tasks with unresolved blockers
  const blocked = pt.filter((t) => (t.blockedBy ?? []).length > 0 && t.status !== 'done')
  for (const t of blocked) {
    const blockerTasks = (t.blockedBy ?? []).map((bid) => tasks.find((bt) => bt.id === bid)).filter(Boolean)
    const unresolvedBlockers = blockerTasks.filter((bt) => bt.status !== 'done')
    if (unresolvedBlockers.length > 0) {
      const who = t.assigneeId ? users.find((u) => u.id === t.assigneeId)?.name : null
      nudges.push({ id: `blocked-${t.id}`, type: 'blocked', message: `"${t.title}" is blocked by ${unresolvedBlockers.length} unresolved task${unresolvedBlockers.length > 1 ? 's' : ''}${who ? `. ${who} may be waiting.` : '.'}`, priority: 1 })
    }
  }

  nudges.sort((a, b) => a.priority - b.priority)
  return nudges
}

function buildBoardSummary(tasks, users, project) {
  const pt = tasks.filter((t) => t.projectId === project.id)
  const now = Date.now()
  const cols = getProjectColumns(project)
  const byStatus = {}
  for (const s of cols) byStatus[s.id] = pt.filter((t) => t.status === s.id).length
  const done = byStatus.done ?? 0
  const total = pt.length

  const overdue = pt.filter((t) => t.status !== 'done' && isOverdue(t.dueDate)).map((t) => ({
    title: t.title,
    daysOverdue: Math.ceil((now - new Date(t.dueDate).getTime()) / DAY_MS),
    assignee: t.assigneeId ? users.find((u) => u.id === t.assigneeId)?.name ?? null : null,
  }))

  const stale = pt.filter((t) => {
    if (t.status !== 'doing') return false
    return (now - t.createdAt) / DAY_MS >= 3
  }).map((t) => ({
    title: t.title,
    status: t.status,
    daysSinceCreated: Math.floor((now - t.createdAt) / DAY_MS),
  }))

  const unassigned = pt.filter((t) => !t.assigneeId && (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'done')
    .map((t) => ({ title: t.title, priority: t.priority }))

  const noDescription = pt.filter((t) => t.status !== 'done' && (!t.description || !t.description.trim())).map((t) => t.title)

  const workload = {}
  for (const u of users) workload[u.name] = 0
  let unassignedCount = 0
  for (const t of pt) {
    if (t.status === 'done') continue
    if (t.assigneeId) { const u = users.find((x) => x.id === t.assigneeId); if (u) workload[u.name]++ }
    else unassignedCount++
  }
  workload['unassigned'] = unassignedCount

  return {
    projectName: project.name,
    totalTasks: total,
    byStatus,
    overdue,
    stale,
    unassigned,
    noDescription,
    workload,
    highPriorityCount: pt.filter((t) => (t.priority === 'p0' || t.priority === 'p1') && t.status !== 'done').length,
    completionRate: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%',
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DemoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(() => getInitialState())
  const { projects, users, teams, tasks, activeProjectId, view, settings } = data
  const sidebarCollapsed = settings?.sidebarCollapsed ?? false

  const [newUserName, setNewUserName] = useState('')
  const [query, setQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [boardView, setBoardView] = useState(BOARD_VIEWS.kanban)
  const [activeFilters, setActiveFilters] = useState([])
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showCmdPalette, setShowCmdPalette] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showProjectComments, setShowProjectComments] = useState(false)
  const [editingPrefix, setEditingPrefix] = useState(false)
  const [prefixDraft, setPrefixDraft] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [projFormName, setProjFormName] = useState('')
  const [projFormPrefix, setProjFormPrefix] = useState('')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [taskFormTitle, setTaskFormTitle] = useState('')
  const [taskFormDesc, setTaskFormDesc] = useState('')
  const [taskFormPriority, setTaskFormPriority] = useState('')
  const [taskFormStatus, setTaskFormStatus] = useState('inbox')
  const [taskFormAssignee, setTaskFormAssignee] = useState('')
  const [taskFormTags, setTaskFormTags] = useState('')
  const [taskFormDueDate, setTaskFormDueDate] = useState('')
  const [taskFormTemplate, setTaskFormTemplate] = useState(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiPreview, setAiPreview] = useState(null) // { projectName, tasks[] }
  const [editingTeam, setEditingTeam] = useState(null) // null | 'new' | team.id
  const [teamFormName, setTeamFormName] = useState('')
  const [teamFormColor, setTeamFormColor] = useState(TEAM_COLORS[0].id)
  const [teamFormMembers, setTeamFormMembers] = useState([])
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [draggingColId, setDraggingColId] = useState(null)
  const [dragOverColIdx, setDragOverColIdx] = useState(null)
  const [renamingColId, setRenamingColId] = useState(null)
  const [renameColValue, setRenameColValue] = useState('')
  const [showNudges, setShowNudges] = useState(false)
  const [nudges, setNudges] = useState([])
  const [nudgesLoading, setNudgesLoading] = useState(false)
  const nudgesFetchedRef = useRef(null) // track which project we already fetched for
  // NLP quick task
  const [nlpInput, setNlpInput] = useState('')
  const [nlpLoading, setNlpLoading] = useState(false)
  const [nlpResult, setNlpResult] = useState(null)
  const [showNlpBar, setShowNlpBar] = useState(false)
  // AI standup
  const [showStandup, setShowStandup] = useState(false)
  const [standupData, setStandupData] = useState(null)
  const [standupLoading, setStandupLoading] = useState(false)
  // Focus mode
  const [focusMode, setFocusMode] = useState(false)
  // Task templates
  const [showTemplates, setShowTemplates] = useState(false)
  // Toolbar menus
  // removed showNewTaskMenu — merged into create task modal
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  // removed searchExpanded — project-level search removed
  // Duplicate detection
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  // Saved views
  const [savedViews, setSavedViews] = useState(() => { try { const sv = localStorage.getItem('nudgeai_saved_views'); return sv ? JSON.parse(sv) : [] } catch { return [] } })
  const [showSaveView, setShowSaveView] = useState(false)
  const [viewNameDraft, setViewNameDraft] = useState('')
  // Workload heatmap (no extra state needed, computed via useMemo)
  // AI Retro
  const [showRetro, setShowRetro] = useState(false)
  const [retroData, setRetroData] = useState(null)
  const [retroLoading, setRetroLoading] = useState(false)
  // Timeline
  const [timelineDragTask, setTimelineDragTask] = useState(null)
  const [newTaskIds, setNewTaskIds] = useState(new Set())
  const newTaskTimerRef = useRef(null)
  const [bulkSelectedIds, setBulkSelectedIds] = useState(new Set())
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const cardElsRef = useRef(new Map())
  const prevRectsRef = useRef(new Map())
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  const registerEl = useCallback((id, el) => { if (!id) return; if (el) cardElsRef.current.set(id, el); else cardElsRef.current.delete(id) }, [])

  /* ── build shareable URLs ── */
  const buildProjectUrl = useCallback((prefix) => {
    return `${window.location.origin}/demo?project=${encodeURIComponent(prefix)}`
  }, [])

  const buildTaskUrl = useCallback((prefix, number) => {
    return `${window.location.origin}/demo?task=${encodeURIComponent(taskKey(prefix, number))}`
  }, [])

  /* ── URL param navigation on mount ── */
  useEffect(() => {
    const taskParam = searchParams.get('task')
    const projectParam = searchParams.get('project')
    if (taskParam) {
      const dashIdx = taskParam.lastIndexOf('-')
      if (dashIdx > 0) {
        const prefix = taskParam.slice(0, dashIdx).toUpperCase()
        const num = parseInt(taskParam.slice(dashIdx + 1))
        if (!isNaN(num)) {
          const proj = projects.find((p) => p.prefix === prefix)
          if (proj) {
            const task = tasks.find((t) => t.projectId === proj.id && t.number === num)
            if (task) {
              setData((prev) => ({ ...prev, view: NAV.board, activeProjectId: proj.id }))
              setSelectedTaskId(task.id)
              return
            }
          }
        }
      }
    }
    if (projectParam) {
      const proj = projects.find((p) => p.prefix === projectParam.toUpperCase())
      if (proj) {
        setData((prev) => ({ ...prev, view: NAV.board, activeProjectId: proj.id }))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── sync URL with current view ── */
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId)
      const proj = task ? projects.find((p) => p.id === task.projectId) : null
      if (task && proj) {
        setSearchParams({ task: taskKey(proj.prefix, task.number) }, { replace: true })
        return
      }
    }
    if (view === NAV.board && activeProjectId) {
      const proj = projects.find((p) => p.id === activeProjectId)
      if (proj) {
        setSearchParams({ project: proj.prefix }, { replace: true })
        return
      }
    }
    // projects list or users view — clean URL
    setSearchParams({}, { replace: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, activeProjectId, selectedTaskId])

  /* ── persist ── */
  useEffect(() => { if (projects.length) saveState({ projects, users, teams, tasks, activeProjectId, view, settings }) }, [projects, users, teams, tasks, activeProjectId, view, settings])

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') { if (bulkSelectedIds.size > 0) { setBulkSelectedIds(new Set()); return } if (showFilterMenu) { setShowFilterMenu(false); return } if (showMoreMenu) { setShowMoreMenu(false); return } if (showSaveView) { setShowSaveView(false); setViewNameDraft(''); return } if (showTemplates) { setShowTemplates(false); return } if (showNlpBar) { setShowNlpBar(false); setNlpInput(''); setNlpResult(null); return } if (showStandup) { setShowStandup(false); setStandupData(null); return } if (showRetro) { setShowRetro(false); setRetroData(null); return } if (focusMode) { setFocusMode(false); return } if (addingColumn) { setAddingColumn(false); setNewColName(''); return } if (renamingColId) { setRenamingColId(null); setRenameColValue(''); return } if (showColumnSettings) { setShowColumnSettings(false); return } if (showCreateProject) { setShowCreateProject(false); return } if (showCreateTask) { setShowCreateTask(false); return } }
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCmdPalette((p) => !p); return }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) { setShowShortcuts((p) => !p); return }
      if (e.key === 'n' || e.key === 'N') { if (view === NAV.board) { e.preventDefault(); openCreateTask() } }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [view, showCreateProject, showCreateTask, showColumnSettings, addingColumn, renamingColId])

  /* ── AI nudges: auto-trigger on board load ── */
  const fetchAiNudges = useCallback(async (projectTasks, projectUsers, project) => {
    setNudgesLoading(true)
    try {
      const summary = buildBoardSummary(projectTasks, projectUsers, project)
      const res = await fetch('/api/ai/nudges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Nudge generation failed')
      return (body.nudges ?? []).map((n, i) => ({ id: `ai-${i}`, type: 'ai', aiType: n.type, message: n.message, priority: 10 + i }))
    } catch (err) {
      console.error('[nudges] AI fetch error:', err)
      return []
    } finally {
      setNudgesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view !== NAV.board || !activeProjectId) {
      setShowNudges(false)
      setNudges([])
      nudgesFetchedRef.current = null
      return
    }
    // Compute rule-based nudges silently (don't auto-open panel)
    const ruleNudges = computeRuleNudges(tasks, users, activeProjectId)
    setNudges(ruleNudges)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, activeProjectId])

  const refreshNudges = useCallback(() => {
    if (!activeProjectId) return
    const ruleNudges = computeRuleNudges(tasks, users, activeProjectId)
    setNudges(ruleNudges)
    // Only fetch AI nudges if within limit
    if (getAiCallCount() >= AI_LIMIT) return
    const proj = projects.find((p) => p.id === activeProjectId)
    if (!proj) return
    incAiCallCount()
    fetchAiNudges(tasks, users, proj).then((aiNudges) => {
      setNudges((prev) => [...prev.filter((n) => n.type !== 'ai'), ...aiNudges])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, users, projects, activeProjectId, fetchAiNudges])

  const navigate = (nextView, projectId = null) => {
    setData((prev) => ({ ...prev, view: nextView, activeProjectId: projectId ?? prev.activeProjectId }))
    if (nextView === NAV.board) setBoardView(settings.defaultView === 'list' ? BOARD_VIEWS.list : BOARD_VIEWS.kanban)
    setQuery(''); setTagQuery(''); setSelectedTaskId(null); setActiveFilters([]); setShowProjectComments(false); setBulkSelectedIds(new Set())
  }

  const updateSettings = (patch) => setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  const toggleSidebar = () => updateSettings({ sidebarCollapsed: !sidebarCollapsed })

  const activeColumns = getProjectColumns(activeProject)
  const visibleColumns = activeProject?.visibleColumns ?? activeColumns.map((s) => s.id)
  const toggleColumn = (colId) => {
    if (!activeProjectId) return
    const current = activeProject?.visibleColumns ?? activeColumns.map((s) => s.id)
    const next = current.includes(colId) ? current.filter((c) => c !== colId) : [...current, colId]
    if (next.length === 0) return // must keep at least one
    updateProject(activeProjectId, { visibleColumns: next })
  }

  /* ── column management ── */
  const addColumn = (name) => {
    if (!activeProjectId || !name.trim()) return
    const cols = [...activeColumns]
    const usedColors = cols.map((c) => c.dot)
    const dot = CUSTOM_COL_COLORS.find((c) => !usedColors.includes(c)) || CUSTOM_COL_COLORS[cols.length % CUSTOM_COL_COLORS.length]
    const newCol = { id: uid(), label: name.trim(), dot }
    // Insert before 'done' (last item)
    const doneIdx = cols.findIndex((c) => c.id === 'done')
    if (doneIdx >= 0) cols.splice(doneIdx, 0, newCol); else cols.push(newCol)
    const vis = activeProject?.visibleColumns ? [...activeProject.visibleColumns, newCol.id] : cols.map((c) => c.id)
    updateProject(activeProjectId, { columns: cols, visibleColumns: vis })
    setAddingColumn(false); setNewColName('')
  }

  const deleteColumn = (colId) => {
    if (!activeProjectId || colId === 'inbox' || colId === 'done') return
    const cols = activeColumns.filter((c) => c.id !== colId)
    const vis = (activeProject?.visibleColumns ?? activeColumns.map((c) => c.id)).filter((id) => id !== colId)
    // Move tasks in deleted column to inbox
    setData((p) => ({
      ...p,
      projects: p.projects.map((pr) => pr.id === activeProjectId ? { ...pr, columns: cols, visibleColumns: vis } : pr),
      tasks: p.tasks.map((t) => t.projectId === activeProjectId && t.status === colId ? { ...t, status: 'inbox' } : t),
    }))
  }

  const renameColumn = (colId, newLabel) => {
    if (!activeProjectId || !newLabel.trim()) { setRenamingColId(null); return }
    const cols = activeColumns.map((c) => c.id === colId ? { ...c, label: newLabel.trim() } : c)
    updateProject(activeProjectId, { columns: cols })
    setRenamingColId(null); setRenameColValue('')
  }

  const reorderColumns = (fromId, toIdx) => {
    if (!activeProjectId) return
    const cols = [...activeColumns]
    const fromIdx = cols.findIndex((c) => c.id === fromId)
    if (fromIdx < 0 || fromIdx === toIdx) return
    // Don't allow placing before inbox (idx 0) or after done (last idx)
    if (toIdx <= 0 || toIdx >= cols.length) return
    const [moved] = cols.splice(fromIdx, 1)
    cols.splice(toIdx, 0, moved)
    // Ensure inbox is first and done is last
    const inbox = cols.find((c) => c.id === 'inbox')
    const done = cols.find((c) => c.id === 'done')
    const mid = cols.filter((c) => c.id !== 'inbox' && c.id !== 'done')
    const final = inbox ? [inbox, ...mid, ...(done ? [done] : [])] : [...mid, ...(done ? [done] : [])]
    updateProject(activeProjectId, { columns: final })
  }

  const onColDragStart = (e, colId) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/column', colId)
    setDraggingColId(colId)
  }
  const onColDragEnd = () => { setDraggingColId(null); setDragOverColIdx(null) }
  const onColDragOver = (e, idx) => { e.preventDefault(); setDragOverColIdx(idx) }
  const onColDrop = (e, toIdx) => {
    e.preventDefault()
    const colId = e.dataTransfer.getData('text/column') || draggingColId
    if (colId) reorderColumns(colId, toIdx)
    setDraggingColId(null); setDragOverColIdx(null)
  }

  /* ── filtered tasks ── */
  const nq = query.trim().toLowerCase()
  const nt = tagQuery.trim().toLowerCase()

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!activeProjectId || t.projectId !== activeProjectId) return false
      if (nq && !t.title.toLowerCase().includes(nq)) return false
      if (nt && !(t.tags ?? []).some((x) => x.toLowerCase().includes(nt))) return false
      for (const f of activeFilters) {
        if (f.type === 'status' && f.value === 'assigned' && !t.assigneeId) return false
        if (f.type === 'status' && f.value === 'unassigned' && t.assigneeId) return false
        if (f.type === 'status' && f.value === 'overdue' && (!isOverdue(t.dueDate) || t.status === 'done')) return false
        if (f.type === 'priority' && t.priority !== f.value) return false
        if (f.type === 'assignee' && t.assigneeId !== f.value) return false
        if (f.type === 'team' && t.assigneeId !== f.value) return false
      }
      return true
    })
  }, [tasks, activeProjectId, nq, nt, activeFilters])

  const byStatus = useMemo(() => {
    const cols = getProjectColumns(activeProject)
    const m = Object.fromEntries(cols.map((s) => [s.id, []]))
    for (const t of filtered) { if (m[t.status]) m[t.status].push(t); else if (m.inbox) m.inbox.push(t) }
    for (const s of cols) m[s.id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return m
  }, [filtered, activeProject])

  /* ── FLIP ── */
  useLayoutEffect(() => {
    const next = new Map()
    for (const [id, el] of cardElsRef.current.entries()) if (el) next.set(id, el.getBoundingClientRect())
    const prev = prevRectsRef.current; prevRectsRef.current = next
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
    for (const [id, nr] of next.entries()) {
      const pr = prev.get(id); if (!pr) continue
      const el = cardElsRef.current.get(id); if (!el) continue
      const dx = pr.left - nr.left, dy = pr.top - nr.top
      if (!dx && !dy) continue
      el.animate?.([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'translate(0,0)' }], { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' })
    }
  }, [tasks])

  /* ── actions ── */
  const openCreateProject = () => { setProjFormName(''); setProjFormPrefix(''); setShowCreateProject(true) }
  const submitCreateProject = () => {
    const n = projFormName.trim(); if (!n) return
    const prefix = projFormPrefix.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || derivePrefix(n)
    setData((p) => ({ ...p, projects: [...p.projects, { id: uid(), name: n, prefix, taskCounter: 1, columns: DEFAULT_COLUMNS.map((c) => ({ ...c })), comments: [], createdAt: Date.now() }] }))
    setShowCreateProject(false)
  }
  const addUser = (e) => { e.preventDefault(); const n = newUserName.trim(); if (!n) return; setData((p) => ({ ...p, users: [...p.users, { id: uid(), name: n, initials: initials(n), createdAt: Date.now() }] })); setNewUserName('') }
  const removeUser = (userId) => setData((p) => ({ ...p, users: p.users.filter((u) => u.id !== userId), tasks: p.tasks.map((t) => t.assigneeId === userId ? { ...t, assigneeId: null } : t), teams: (p.teams ?? []).map((t) => ({ ...t, memberIds: t.memberIds.filter((id) => id !== userId) })) }))
  const deleteProject = (pid) => setData((p) => ({ ...p, projects: p.projects.filter((x) => x.id !== pid), tasks: p.tasks.filter((t) => t.projectId !== pid), activeProjectId: p.activeProjectId === pid ? null : p.activeProjectId, view: p.activeProjectId === pid ? NAV.projects : p.view }))
  const assignTask = (tid, aid) => setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === tid ? { ...t, assigneeId: aid } : t) }))
  const updateTask = (tid, u) => setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === tid ? { ...t, ...u } : t) }))
  const deleteTask = (tid) => { if (tid === selectedTaskId) setSelectedTaskId(null); setData((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== tid) })) }

  /* ── bulk operations ── */
  const toggleBulkSelect = (taskId) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }
  const clearBulkSelection = () => setBulkSelectedIds(new Set())
  const bulkMoveTo = (status) => {
    setData((p) => ({
      ...p,
      tasks: p.tasks.map((t) => bulkSelectedIds.has(t.id) ? { ...t, status } : t),
    }))
    clearBulkSelection()
  }
  const bulkDelete = () => {
    if (selectedTaskId && bulkSelectedIds.has(selectedTaskId)) setSelectedTaskId(null)
    setData((p) => ({ ...p, tasks: p.tasks.filter((t) => !bulkSelectedIds.has(t.id)) }))
    clearBulkSelection()
  }
  const bulkAssign = (assigneeId) => {
    setData((p) => ({
      ...p,
      tasks: p.tasks.map((t) => bulkSelectedIds.has(t.id) ? { ...t, assigneeId: assigneeId || null } : t),
    }))
    clearBulkSelection()
  }
  const selectAllVisible = () => {
    const ids = filtered.filter((t) => visibleColumns.includes(t.status)).map((t) => t.id)
    setBulkSelectedIds(new Set(ids))
  }

  const updateProject = (pid, u) => setData((p) => ({ ...p, projects: p.projects.map((x) => x.id === pid ? { ...x, ...u } : x) }))

  const commitPrefix = () => {
    const trimmed = prefixDraft.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (trimmed && activeProjectId) updateProject(activeProjectId, { prefix: trimmed })
    setEditingPrefix(false)
  }

  const openCreateTask = () => {
    setTaskFormTitle(''); setTaskFormDesc(''); setTaskFormPriority(''); setTaskFormStatus('inbox'); setTaskFormAssignee(''); setTaskFormTags(''); setTaskFormDueDate(''); setTaskFormTemplate(null)
    setDuplicateWarning(null); setShowCreateTask(true)
  }
  const submitCreateTask = () => {
    const title = taskFormTitle.trim(); if (!title || !activeProjectId) return
    const tags = taskFormTags.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 6)
    const id = uid()
    setData((p) => {
      const proj = p.projects.find((x) => x.id === activeProjectId)
      const number = proj?.taskCounter ?? 1
      return {
        ...p,
        projects: p.projects.map((x) => x.id === activeProjectId ? { ...x, taskCounter: number + 1 } : x),
        tasks: normalizeOrders([{ id, projectId: activeProjectId, number, title, description: taskFormDesc.trim(), tags, status: taskFormStatus || 'inbox', priority: taskFormPriority || null, dueDate: taskFormDueDate || null, subtasks: (taskFormTemplate?.fields?.subtasks ?? []).map((s) => ({ id: uid(), title: s, done: false })), comments: [], assigneeId: taskFormAssignee || null, blockedBy: [], order: -1, createdAt: Date.now() }, ...p.tasks], activeProjectId),
      }
    })
    setNewTaskIds((p) => new Set(p).add(id))
    if (newTaskTimerRef.current) clearTimeout(newTaskTimerRef.current)
    newTaskTimerRef.current = setTimeout(() => setNewTaskIds(new Set()), 400)
    setShowCreateTask(false)
  }

  /* ── task comments ── */
  const addTaskComment = (taskId, text) => {
    const authorId = users[0]?.id ?? null
    setData((p) => ({
      ...p,
      tasks: p.tasks.map((t) => t.id === taskId ? { ...t, comments: [...(t.comments ?? []), { id: uid(), authorId, text, createdAt: Date.now() }] } : t),
    }))
  }
  const deleteTaskComment = (taskId, commentId) => {
    setData((p) => ({
      ...p,
      tasks: p.tasks.map((t) => t.id === taskId ? { ...t, comments: (t.comments ?? []).filter((c) => c.id !== commentId) } : t),
    }))
  }

  /* ── project comments ── */
  const addProjectComment = (projectId, text) => {
    const authorId = users[0]?.id ?? null
    setData((p) => ({
      ...p,
      projects: p.projects.map((x) => x.id === projectId ? { ...x, comments: [...(x.comments ?? []), { id: uid(), authorId, text, createdAt: Date.now() }] } : x),
    }))
  }
  const deleteProjectComment = (projectId, commentId) => {
    setData((p) => ({
      ...p,
      projects: p.projects.map((x) => x.id === projectId ? { ...x, comments: (x.comments ?? []).filter((c) => c.id !== commentId) } : x),
    }))
  }

  /* ── team actions ── */
  const addTeam = (team) => setData((p) => ({ ...p, teams: [...(p.teams ?? []), { id: uid(), ...team, createdAt: Date.now() }] }))
  const updateTeam = (tid, u) => setData((p) => ({ ...p, teams: (p.teams ?? []).map((t) => t.id === tid ? { ...t, ...u } : t) }))
  const deleteTeam = (tid) => setData((p) => ({ ...p, teams: (p.teams ?? []).filter((t) => t.id !== tid), tasks: p.tasks.map((t) => t.assigneeId === tid ? { ...t, assigneeId: null } : t) }))

  const openTeamForm = (teamId = 'new') => {
    if (teamId === 'new') {
      setTeamFormName(''); setTeamFormColor(TEAM_COLORS[0].id); setTeamFormMembers([])
    } else {
      const t = teams.find((x) => x.id === teamId)
      if (t) { setTeamFormName(t.name); setTeamFormColor(t.color); setTeamFormMembers([...t.memberIds]) }
    }
    setEditingTeam(teamId)
  }

  const submitTeamForm = () => {
    const name = teamFormName.trim()
    if (!name) return
    if (editingTeam === 'new') {
      addTeam({ name, color: teamFormColor, memberIds: teamFormMembers })
    } else if (editingTeam) {
      updateTeam(editingTeam, { name, color: teamFormColor, memberIds: teamFormMembers })
    }
    setEditingTeam(null)
  }

  const toggleTeamMember = (userId) => {
    setTeamFormMembers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId])
  }

  /* ── AI project generation ── */
  const AI_LIMIT_KEY = 'nudgeai_ai_calls'
  const AI_LIMIT = 5
  const getAiCallCount = () => { try { return parseInt(localStorage.getItem(AI_LIMIT_KEY) || '0') } catch { return 0 } }
  const incAiCallCount = () => { try { localStorage.setItem(AI_LIMIT_KEY, String(getAiCallCount() + 1)) } catch { /* */ } }

  const generateWithAi = async () => {
    const trimmed = aiPrompt.trim()
    if (!trimmed || aiLoading) return
    if (getAiCallCount() >= AI_LIMIT) {
      setAiError('You\'ve reached the generation limit for this session. Reset demo data to start fresh.')
      return
    }
    setAiLoading(true)
    setAiError('')
    setAiPreview(null)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Generation failed')
      setAiPreview(body)
      incAiCallCount()
    } catch (err) {
      setAiError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const createAiProject = () => {
    if (!aiPreview) return
    const projectId = uid()
    const prefix = derivePrefix(aiPreview.projectName)
    const newTasks = (aiPreview.tasks || []).map((t, idx) => ({
      id: uid(),
      projectId,
      number: idx + 1,
      title: t.title || 'Untitled',
      description: t.description || '',
      tags: t.tags || [],
      status: t.status || 'inbox',
      priority: t.priority || 'p2',
      dueDate: null,
      subtasks: (t.subtasks || []).map((s) => ({ id: uid(), title: s.text || s.title || '', done: false })),
      comments: [],
      assigneeId: null,
      order: idx,
      createdAt: Date.now(),
    }))
    const project = {
      id: projectId,
      name: aiPreview.projectName,
      prefix,
      taskCounter: newTasks.length + 1,
      columns: DEFAULT_COLUMNS.map((c) => ({ ...c })),
      comments: [],
      createdAt: Date.now(),
    }
    setData((p) => ({
      ...p,
      projects: [...p.projects, project],
      tasks: [...p.tasks, ...newTasks],
      activeProjectId: projectId,
      view: NAV.board,
    }))
    // clean up modal
    setShowAiModal(false)
    setAiPrompt('')
    setAiPreview(null)
    setAiError('')
  }

  /* ── NLP quick task creation ── */
  const nlpCreateTask = async () => {
    const text = nlpInput.trim()
    if (!text || nlpLoading) return
    if (getAiCallCount() >= AI_LIMIT) { setNlpResult({ error: 'AI call limit reached. Reset demo to start fresh.' }); return }
    setNlpLoading(true); setNlpResult(null)
    try {
      const ctx = {
        users: users.map((u) => u.name),
        teams: teams.map((t) => t.name),
        projects: projects.map((p) => p.name),
        tags: [...new Set(tasks.flatMap((t) => t.tags ?? []))].slice(0, 30),
      }
      const res = await fetch('/api/ai/quicktask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, context: ctx }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to parse task')
      incAiCallCount()
      // resolve assignee and project
      const assignee = body.assigneeName ? users.find((u) => u.name.toLowerCase() === body.assigneeName.toLowerCase()) ?? teams.find((t) => t.name.toLowerCase() === body.assigneeName.toLowerCase()) : null
      const targetProj = body.projectName ? projects.find((p) => p.name.toLowerCase() === body.projectName.toLowerCase()) : activeProject
      const pid = targetProj?.id ?? activeProjectId
      if (!pid) { setNlpResult({ error: 'No project selected. Open a project first.' }); return }
      const id = uid()
      setData((p) => {
        const proj = p.projects.find((x) => x.id === pid)
        const number = proj?.taskCounter ?? 1
        return {
          ...p,
          projects: p.projects.map((x) => x.id === pid ? { ...x, taskCounter: number + 1 } : x),
          tasks: normalizeOrders([{ id, projectId: pid, number, title: body.title, description: body.description || '', tags: body.tags || [], status: body.status || 'inbox', priority: body.priority || null, dueDate: null, subtasks: [], comments: [], assigneeId: assignee?.id ?? null, blockedBy: [], order: -1, createdAt: Date.now() }, ...p.tasks], pid),
        }
      })
      setNewTaskIds((p) => new Set(p).add(id))
      if (newTaskTimerRef.current) clearTimeout(newTaskTimerRef.current)
      newTaskTimerRef.current = setTimeout(() => setNewTaskIds(new Set()), 400)
      setNlpResult({ success: true, title: body.title, assignee: assignee?.name || null, priority: body.priority })
      // Navigate to the project board if not already there
      if (view !== NAV.board || activeProjectId !== pid) {
        setData((p) => ({ ...p, view: NAV.board, activeProjectId: pid }))
      }
      setTimeout(() => { setNlpInput(''); setNlpResult(null); setShowNlpBar(false) }, 2000)
    } catch (err) {
      setNlpResult({ error: err.message })
    } finally {
      setNlpLoading(false)
    }
  }

  /* ── AI standup generator ── */
  const buildStandupSummary = () => {
    if (!activeProjectId || !activeProject) return null
    const pt = tasks.filter((t) => t.projectId === activeProjectId)
    const now = Date.now()
    const DAY = 86400000
    const memberData = users.map((u) => {
      const userTasks = pt.filter((t) => t.assigneeId === u.id)
      return {
        name: u.name,
        done: userTasks.filter((t) => t.status === 'done').map((t) => t.title),
        inProgress: userTasks.filter((t) => t.status === 'doing').map((t) => t.title),
        blocked: userTasks.filter((t) => (isOverdue(t.dueDate) && t.status !== 'done') || (t.status === 'doing' && (now - t.createdAt) / DAY >= 3)).map((t) => t.title),
        totalAssigned: userTasks.length,
      }
    })
    const cols = getProjectColumns(activeProject)
    const byStatus = {}; for (const c of cols) byStatus[c.label] = pt.filter((t) => t.status === c.id).length
    return { projectName: activeProject.name, totalTasks: pt.length, byStatus, members: memberData, overdue: pt.filter((t) => isOverdue(t.dueDate) && t.status !== 'done').length }
  }

  const generateStandup = async () => {
    const summary = buildStandupSummary()
    if (!summary) return
    if (getAiCallCount() >= AI_LIMIT) { setStandupData({ error: 'AI call limit reached.' }); return }
    setStandupLoading(true); setStandupData(null); setShowStandup(true)
    try {
      const res = await fetch('/api/ai/standup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to generate standup')
      incAiCallCount()
      setStandupData(body)
    } catch (err) {
      setStandupData({ error: err.message })
    } finally {
      setStandupLoading(false)
    }
  }

  const copyStandup = () => {
    if (!standupData || standupData.error) return
    const lines = [`📋 Daily Standup — ${activeProject?.name ?? 'Project'}`, `${standupData.summary ?? ''}\n`]
    for (const m of standupData.members ?? []) {
      lines.push(`**${m.name}**`)
      if (m.done?.length) lines.push(`  ✅ Done: ${m.done.join(', ')}`)
      if (m.inProgress?.length) lines.push(`  🔄 In Progress: ${m.inProgress.join(', ')}`)
      if (m.blocked?.length) lines.push(`  🚫 Blocked: ${m.blocked.join(', ')}`)
      if (m.highlights) lines.push(`  💡 ${m.highlights}`)
      lines.push('')
    }
    if (standupData.teamHighlights?.length) {
      lines.push('**Team Highlights**')
      standupData.teamHighlights.forEach((h) => lines.push(`  • ${h}`))
    }
    try { navigator.clipboard.writeText(lines.join('\n')) } catch { /* */ }
  }


  /* ── Task dependencies ── */
  const addBlocker = (taskId, blockerId) => {
    if (taskId === blockerId) return
    setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, blockedBy: [...new Set([...(t.blockedBy ?? []), blockerId])] } : t) }))
  }
  const removeBlocker = (taskId, blockerId) => {
    setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, blockedBy: (t.blockedBy ?? []).filter((id) => id !== blockerId) } : t) }))
  }

  /* ── Duplicate detection ── */
  const checkDuplicate = useCallback((title) => {
    if (!title || title.length < 5 || !activeProjectId) { setDuplicateWarning(null); return }
    const projTasks = tasks.filter((t) => t.projectId === activeProjectId)
    let bestMatch = null; let bestScore = 0
    for (const t of projTasks) {
      const score = stringSimilarity(title, t.title)
      if (score > bestScore && score > 0.45) { bestScore = score; bestMatch = t }
    }
    if (bestMatch) {
      const proj = projects.find((p) => p.id === bestMatch.projectId)
      setDuplicateWarning({ task: bestMatch, key: proj ? taskKey(proj.prefix, bestMatch.number) : null, score: bestScore })
    } else {
      setDuplicateWarning(null)
    }
  }, [tasks, activeProjectId, projects])

  /* ── Focus mode tasks ── */
  const focusTasks = useMemo(() => {
    if (!focusMode) return []
    const myId = users[0]?.id
    if (!myId) return []
    return tasks
      .filter((t) => t.assigneeId === myId && t.status !== 'done')
      .sort((a, b) => {
        // Priority sort: p0 > p1 > p2 > p3 > null
        const pa = a.priority ? parseInt(a.priority[1]) : 9
        const pb = b.priority ? parseInt(b.priority[1]) : 9
        if (pa !== pb) return pa - pb
        // Overdue first
        const ao = isOverdue(a.dueDate) ? 0 : 1
        const bo = isOverdue(b.dueDate) ? 0 : 1
        if (ao !== bo) return ao - bo
        // Due date ascending
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate)
        if (a.dueDate) return -1
        if (b.dueDate) return 1
        return 0
      })
  }, [focusMode, tasks, users])

  /* ── Saved views ── */
  useEffect(() => { try { localStorage.setItem('nudgeai_saved_views', JSON.stringify(savedViews)) } catch { /* */ } }, [savedViews])
  const saveCurrentView = () => {
    const name = viewNameDraft.trim()
    if (!name || !activeProjectId) return
    const newView = { id: uid(), name, projectId: activeProjectId, filters: { query, tagQuery, activeFilters, boardView, focusMode }, createdAt: Date.now() }
    setSavedViews((p) => [...p, newView])
    setShowSaveView(false); setViewNameDraft('')
  }
  const applySavedView = (sv) => {
    if (sv.projectId !== activeProjectId) {
      setData((p) => ({ ...p, view: NAV.board, activeProjectId: sv.projectId }))
    }
    if (sv.filters.query !== undefined) setQuery(sv.filters.query)
    if (sv.filters.tagQuery !== undefined) setTagQuery(sv.filters.tagQuery)
    if (sv.filters.activeFilters !== undefined) setActiveFilters(sv.filters.activeFilters)
    else if (sv.filters.quickFilter !== undefined) { /* legacy compat */ const qf = sv.filters.quickFilter; if (qf === 'mine') setActiveFilters([{ type: 'status', value: 'assigned', label: 'Assigned' }]); else if (qf === 'unassigned') setActiveFilters([{ type: 'status', value: 'unassigned', label: 'Unassigned' }]); else if (qf === 'overdue') setActiveFilters([{ type: 'status', value: 'overdue', label: 'Overdue' }]); else if (qf?.startsWith('team:')) { const tid = qf.slice(5); const team = teams.find((t) => t.id === tid); setActiveFilters([{ type: 'team', value: tid, label: team?.name ?? 'Team' }]) } else setActiveFilters([]) }
    if (sv.filters.boardView !== undefined) setBoardView(sv.filters.boardView)
    if (sv.filters.focusMode !== undefined) setFocusMode(sv.filters.focusMode)
  }
  const deleteSavedView = (svId) => setSavedViews((p) => p.filter((v) => v.id !== svId))
  const projectSavedViews = savedViews.filter((sv) => sv.projectId === activeProjectId)

  /* ── AI Retrospective ── */
  const buildRetroSummary = () => {
    if (!activeProjectId || !activeProject) return null
    const pt = tasks.filter((t) => t.projectId === activeProjectId)
    const now = Date.now()
    const DAY = 86400000
    const WEEK = 7 * DAY
    const cols = getProjectColumns(activeProject)
    const byStatus = {}; for (const c of cols) byStatus[c.label] = pt.filter((t) => t.status === c.id).length
    const completedThisWeek = pt.filter((t) => t.status === 'done' && (now - t.createdAt) < WEEK).length
    const overdueTasks = pt.filter((t) => isOverdue(t.dueDate) && t.status !== 'done').map((t) => {
      const days = Math.ceil((now - new Date(t.dueDate).getTime()) / DAY)
      const who = t.assigneeId ? users.find((u) => u.id === t.assigneeId)?.name ?? 'Unassigned' : 'Unassigned'
      return { title: t.title, daysPastDue: days, assignee: who }
    })
    const workload = {}; for (const u of users) { const ut = pt.filter((t) => t.assigneeId === u.id && t.status !== 'done'); workload[u.name] = { active: ut.length, inProgress: ut.filter((t) => t.status === 'doing').length } }
    const staleTasks = pt.filter((t) => t.status === 'doing' && (now - t.createdAt) / DAY >= 3).map((t) => t.title)
    const blockedTasks = pt.filter((t) => (t.blockedBy ?? []).length > 0 && t.status !== 'done').map((t) => ({ title: t.title, blockerCount: (t.blockedBy ?? []).length }))
    return { projectName: activeProject.name, totalTasks: pt.length, byStatus, completedThisWeek, completionRate: pt.length > 0 ? Math.round(pt.filter((t) => t.status === 'done').length / pt.length * 100) : 0, overdueTasks, staleTasks, blockedTasks, workload, unassigned: pt.filter((t) => !t.assigneeId && t.status !== 'done').length }
  }

  const generateRetro = async () => {
    const summary = buildRetroSummary()
    if (!summary) return
    if (getAiCallCount() >= AI_LIMIT) { setRetroData({ error: 'AI call limit reached.' }); setShowRetro(true); return }
    setRetroLoading(true); setRetroData(null); setShowRetro(true)
    try {
      const res = await fetch('/api/ai/retro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary }) })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Failed to generate retro')
      incAiCallCount()
      setRetroData(body)
    } catch (err) {
      setRetroData({ error: err.message })
    } finally {
      setRetroLoading(false)
    }
  }

  /* ── Workload heatmap data ── */
  const heatmapData = useMemo(() => {
    if (boardView !== BOARD_VIEWS.heatmap || !activeProjectId) return null
    const pt = tasks.filter((t) => t.projectId === activeProjectId && t.status !== 'done')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      days.push(d.toISOString().slice(0, 10))
    }
    const grid = users.map((u) => {
      const userTasks = pt.filter((t) => t.assigneeId === u.id)
      const byDay = {}
      for (const day of days) {
        byDay[day] = userTasks.filter((t) => t.dueDate === day).map((t) => ({ id: t.id, title: t.title, priority: t.priority }))
      }
      const noDate = userTasks.filter((t) => !t.dueDate)
      return { user: u, byDay, noDate, total: userTasks.length }
    })
    // also unassigned
    const unassigned = pt.filter((t) => !t.assigneeId)
    const unassignedByDay = {}
    for (const day of days) unassignedByDay[day] = unassigned.filter((t) => t.dueDate === day)
    const unassignedNoDate = unassigned.filter((t) => !t.dueDate)
    return { days, grid, unassigned: { byDay: unassignedByDay, noDate: unassignedNoDate, total: unassigned.length } }
  }, [boardView, activeProjectId, tasks, users])

  /* ── Timeline / Gantt data ── */
  const timelineData = useMemo(() => {
    if (boardView !== BOARD_VIEWS.timeline || !activeProjectId) return null
    const pt = tasks.filter((t) => t.projectId === activeProjectId)
    const withDates = pt.filter((t) => t.dueDate)
    const noDates = pt.filter((t) => !t.dueDate)
    if (withDates.length === 0) return { tasks: [], noDates, days: [], startDate: null }
    const allDates = withDates.map((t) => t.dueDate).sort()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const minDate = new Date(Math.min(today.getTime(), new Date(allDates[0]).getTime()))
    minDate.setDate(minDate.getDate() - 1)
    const maxDate = new Date(allDates[allDates.length - 1])
    maxDate.setDate(maxDate.getDate() + 3)
    const days = []
    const d = new Date(minDate)
    while (d <= maxDate) {
      days.push(new Date(d).toISOString().slice(0, 10))
      d.setDate(d.getDate() + 1)
    }
    return { tasks: withDates, noDates, days, startDate: minDate.toISOString().slice(0, 10), todayIdx: days.indexOf(today.toISOString().slice(0, 10)) }
  }, [boardView, activeProjectId, tasks])

  const updateTaskDueDate = (taskId, newDate) => {
    setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === taskId ? { ...t, dueDate: newDate } : t) }))
  }

  /* ── drag & drop ── */
  const computeIdx = (c, y) => { const els = Array.from(c.querySelectorAll('[data-task-id]')).filter((e) => e.getAttribute('data-task-id') !== draggingId); let i = els.length; for (let j = 0; j < els.length; j++) { const r = els[j].getBoundingClientRect(); if (y < r.top + r.height / 2) { i = j; break } } return i }
  const onDragStart = (e, id) => { e.stopPropagation(); try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id) } catch { /* */ } setDraggingId(id) }
  const onDragEnd = () => { setDraggingId(null); setDragOverStatus(null) }
  const moveTask = (id, ns, idx = null) => setData((p) => { const c = p.tasks.find((t) => t.id === id); if (!c) return p; const pid = c.projectId; const proj = p.projects.find((x) => x.id === pid); const cols = getProjectColumns(proj); const keep = p.tasks.filter((t) => t.projectId !== pid); const scoped = p.tasks.filter((t) => t.projectId === pid && t.id !== id); const by = Object.fromEntries(cols.map((s) => [s.id, []])); for (const t of scoped) { if (by[t.status]) by[t.status].push({ ...t }); else if (by.inbox) by.inbox.push({ ...t, status: 'inbox' }) } for (const s of cols) by[s.id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); const tgt = by[ns] ?? []; tgt.splice(typeof idx === 'number' ? clamp(idx, 0, tgt.length) : tgt.length, 0, { ...c, status: ns }); by[ns] = tgt; const rebuilt = []; for (const s of cols) by[s.id].forEach((t, i) => rebuilt.push({ ...t, status: s.id, order: i })); return { ...p, tasks: [...keep, ...rebuilt] } })
  const onDragOverCol = (e, s) => { e.preventDefault(); setDragOverStatus(s) }
  const onDropTask = (e, s) => { e.preventDefault(); let id; try { id = e.dataTransfer.getData('text/plain') } catch { /* */ } const nid = id || draggingId; if (!nid) return; moveTask(nid, s, computeIdx(e.currentTarget.querySelector(`[data-column-list="${s}"]`) ?? e.currentTarget, e.clientY)); setDraggingId(null); setDragOverStatus(null) }

  const resetDemo = () => { try { localStorage.removeItem(STORAGE_KEY) } catch { /* */ } setSelectedTaskId(null); setBulkSelectedIds(new Set()); const u = seedUsers(); const t = seedTeams(u); const p = seedProjects(u); setData({ projects: p, users: u, teams: t, tasks: seedTasks(p[0].id, p[1].id, u, t), activeProjectId: null, view: NAV.projects, settings: { ...DEFAULT_SETTINGS } }) }

  const projectStats = useMemo(() => { const m = {}; for (const p of projects) m[p.id] = { total: 0, done: 0 }; for (const t of tasks) { if (m[t.projectId]) { m[t.projectId].total++; if (t.status === 'done') m[t.projectId].done++ } } return m }, [projects, tasks])

  /* ═══ RENDER ═══ */
  return (
    <div className={[settings.theme === 'dark' ? 'theme-dark' : 'theme-light', `density-${settings.density ?? 'comfortable'}`, 'demo-root flex h-screen overflow-hidden transition-colors duration-200'].join(' ')}>
      {/* SIDEBAR */}
      <div className={['relative shrink-0 transition-all duration-200', sidebarCollapsed ? 'w-[56px]' : 'w-[240px]'].join(' ')}>
        <aside className="flex h-full flex-col border-r sidebar-aside">
        {/* logo */}
          <div className={['flex h-14 items-center border-b sidebar-header', sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-5'].join(' ')}>
            <Link to="/" className="flex items-center gap-2.5" title="Nudge AI">
              <img src="/favicon.png" alt="Nudge AI" className="h-7 w-7 rounded-md shrink-0" />
              {!sidebarCollapsed && <span className="text-sm font-semibold tracking-tight sidebar-text">Nudge AI</span>}
          </Link>
            {!sidebarCollapsed && <span className="ml-auto rounded-full sidebar-badge px-2 py-0.5 text-[10px] font-semibold">Demo</span>}
        </div>
          <nav className={['flex-1 overflow-y-auto py-4 space-y-0.5', sidebarCollapsed ? 'px-1.5' : 'px-3'].join(' ')}>
            {/* search */}
            <button type="button" onClick={() => setShowCmdPalette(true)} className={['flex w-full items-center rounded-lg text-[13px] font-medium transition-colors sidebar-item-muted', sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2'].join(' ')} title="Search (⌘K)">
              <IconSearch className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <><span>Search</span><kbd className="ml-auto rounded sidebar-kbd px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd></>}
          </button>
            <div className={['my-2 sidebar-divider', sidebarCollapsed ? 'mx-1' : ''].join(' ')} />
            {/* projects */}
            <button type="button" onClick={() => navigate(NAV.projects)} className={['flex w-full items-center rounded-lg text-[13px] font-medium transition-colors', sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2', view === NAV.projects ? 'sidebar-item-active' : 'sidebar-item'].join(' ')} title="Projects">
              <IconFolder className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Projects</span>}
            </button>
            {!sidebarCollapsed && projects.length > 0 && (
              <div className="ml-4 border-l sidebar-sublist pl-2 space-y-0.5">
              {projects.map((p) => (
                  <button key={p.id} type="button" onClick={() => navigate(NAV.board, p.id)} className={['flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors truncate', view === NAV.board && activeProjectId === p.id ? 'sidebar-subitem-active' : 'sidebar-subitem'].join(' ')}>
                    <IconKanban className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}
            {/* users */}
            <button type="button" onClick={() => navigate(NAV.users)} className={['flex w-full items-center rounded-lg text-[13px] font-medium transition-colors', sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2', view === NAV.users ? 'sidebar-item-active' : 'sidebar-item'].join(' ')} title="Users">
              <IconUsers className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Users</span>}
          </button>
            {/* teams */}
            <button type="button" onClick={() => navigate(NAV.teams)} className={['flex w-full items-center rounded-lg text-[13px] font-medium transition-colors', sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2', view === NAV.teams ? 'sidebar-item-active' : 'sidebar-item'].join(' ')} title="Teams">
              <IconTeam className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Teams</span>}
          </button>
            {/* settings */}
            <button type="button" onClick={() => navigate(NAV.settings)} className={['flex w-full items-center rounded-lg text-[13px] font-medium transition-colors', sidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2', view === NAV.settings ? 'sidebar-item-active' : 'sidebar-item'].join(' ')} title="Dashboard Settings">
              <IconGear className="w-[18px] h-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
          </nav>
          {!sidebarCollapsed && (
            <div className="border-t sidebar-footer px-3 py-3 space-y-1">
              <button type="button" onClick={resetDemo} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium sidebar-item-muted transition-colors">Reset demo</button>
              <Link to="/#waitlist" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors">Get early access</Link>
        </div>
          )}
      </aside>
        {/* collapse/expand edge — clickable border strip + protruding semicircle handle */}
        <button type="button" onClick={toggleSidebar} className="sidebar-edge-handle group absolute top-0 right-0 h-full w-3 translate-x-full z-10 cursor-pointer" title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {/* semicircle tab */}
          <span className="sidebar-handle absolute top-1/2 left-0 -translate-y-1/2 flex items-center justify-center h-7 w-3.5 rounded-r-full" style={{ background: 'var(--demo-surface)', borderTop: '1px solid var(--demo-border)', borderRight: '1px solid var(--demo-border)', borderBottom: '1px solid var(--demo-border)' }}>
            {sidebarCollapsed ? <IconChevronRight className="w-2.5 h-2.5 ml-px" style={{ color: 'var(--demo-text-muted)' }} /> : <IconChevronLeft className="w-2.5 h-2.5 ml-px" style={{ color: 'var(--demo-text-muted)' }} />}
          </span>
        </button>
      </div>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--demo-bg)' }}>
        {/* PROJECTS */}
        {view === NAV.projects && (
          <div className="mx-auto max-w-4xl px-8 py-8">
            <h1 className="text-xl font-semibold tracking-tight demo-heading">Projects</h1>
            <p className="mt-1 text-sm demo-muted">Select a project to open its board.</p>
            <div className="mt-6 flex items-center gap-3">
              <button type="button" onClick={openCreateProject} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"><IconPlus className="w-4 h-4" />New project</button>
              <button type="button" onClick={() => setShowAiModal(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-linear-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"><IconSparkle className="w-4 h-4" />Generate with AI</button>
              </div>
            <div className="mt-6 space-y-2">
              {projects.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center"><IconFolder className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No projects yet.</p></div>}
              {projects.map((p) => {
                const st = projectStats[p.id] ?? { total: 0, done: 0 }; const pct = st.total > 0 ? Math.round((st.done / st.total) * 100) : 0
                return (
                  <div key={p.id} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                    <button type="button" onClick={() => navigate(NAV.board, p.id)} className="flex flex-1 items-center gap-4 min-w-0 text-left cursor-pointer focus:outline-none" aria-label={`Open ${p.name}`}>
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-linear-to-br from-cyan-50 to-slate-100 text-slate-600 ring-1 ring-slate-200/60"><IconKanban className="w-5 h-5" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2"><span className="text-sm font-semibold">{p.name}</span><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500">{p.prefix}</span></div>
                        <div className="mt-0.5 text-[12px] text-slate-500">{st.total} task{st.total !== 1 ? 's' : ''} · {pct}% done · Created {timeAgo(p.createdAt)}</div>
                        </div>
                      <div className="hidden sm:flex items-center gap-3 w-32"><div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div><span className="text-[11px] font-medium text-slate-400 w-8 text-right">{pct}%</span></div>
                    </button>
                    <CopyButton text={buildProjectUrl(p.prefix)} label="Copy project link" />
                    <button type="button" onClick={() => deleteProject(p.id)} className="shrink-0 rounded-md px-2 py-1 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all">Delete</button>
                      </div>
                )
              })}
                        </div>
                      </div>
        )}

        {/* USERS */}
        {view === NAV.users && (
          <div className="mx-auto max-w-3xl px-8 py-8">
            <h1 className="text-xl font-semibold tracking-tight demo-heading">Users</h1>
            <p className="mt-1 text-sm demo-muted">Manage team members.</p>
            <form onSubmit={addUser} className="mt-6 flex items-center gap-3">
              <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Full name…" className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30" />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"><IconPlus className="w-4 h-4" />Add user</button>
            </form>
            <div className="mt-6 space-y-2">
              {users.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center"><IconUsers className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No users yet.</p></div>}
              {users.map((u) => {
                const a = tasks.filter((t) => t.assigneeId === u.id).length
                return (
                  <div key={u.id} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <Avatar name={u.name} size="md" />
                    <div className="min-w-0 flex-1"><div className="text-sm font-semibold">{u.name}</div><div className="text-[12px] text-slate-500">{a} task{a !== 1 ? 's' : ''} assigned · Added {timeAgo(u.createdAt)}</div></div>
                    <button type="button" onClick={() => removeUser(u.id)} className="rounded-md px-2 py-1 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all">Remove</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TEAMS */}
        {view === NAV.teams && (
          <div className="mx-auto max-w-3xl px-8 py-8">
            <h1 className="text-xl font-semibold tracking-tight demo-heading">Teams</h1>
            <p className="mt-1 text-sm demo-muted">Create and manage teams. Assign teams to tasks and mention them in comments.</p>
            <div className="mt-6">
              <button type="button" onClick={() => openTeamForm('new')} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"><IconPlus className="w-4 h-4" />Create team</button>
            </div>

            {/* team form modal */}
            {editingTeam && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setEditingTeam(null) }}>
                <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-sm font-semibold">{editingTeam === 'new' ? 'Create Team' : 'Edit Team'}</h2>
                    <button type="button" onClick={() => setEditingTeam(null)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>
                  </div>
                  <div className="px-6 py-5 space-y-5">
                    {/* name */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Team name</label>
                      <input value={teamFormName} onChange={(e) => setTeamFormName(e.target.value)} placeholder="e.g. Engineering" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30" autoFocus />
                    </div>
                    {/* color */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Color</label>
                      <div className="mt-2 flex gap-2">
                        {TEAM_COLORS.map((c) => (
                          <button key={c.id} type="button" onClick={() => setTeamFormColor(c.id)} className={['h-8 w-8 rounded-full transition-all', c.dot, teamFormColor === c.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'].join(' ')} aria-label={c.id} />
                        ))}
                      </div>
                    </div>
                    {/* members */}
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Members</label>
                      <div className="mt-2 space-y-1">
                        {users.length === 0 && <p className="text-xs text-slate-400 py-2">No users yet. Add users first.</p>}
                        {users.map((u) => (
                          <button key={u.id} type="button" onClick={() => toggleTeamMember(u.id)} className={['flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors', teamFormMembers.includes(u.id) ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>
                            <Avatar name={u.name} size="sm" />
                            <span className="flex-1 text-left">{u.name}</span>
                            {teamFormMembers.includes(u.id) && <IconCheck className="w-4 h-4 text-cyan-600" />}
              </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
                    <button type="button" onClick={() => setEditingTeam(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="button" onClick={submitTeamForm} disabled={!teamFormName.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{editingTeam === 'new' ? 'Create' : 'Save'}</button>
                  </div>
                </div>
                </div>
              )}

            {/* teams list */}
            <div className="mt-6 space-y-2">
              {teams.length === 0 && <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center"><IconTeam className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm text-slate-500">No teams yet. Create one to get started.</p></div>}
              {teams.map((team) => {
                const tc = TEAM_COLORS.find((c) => c.id === team.color) ?? TEAM_COLORS[0]
                const members = users.filter((u) => team.memberIds.includes(u.id))
                const taskCount = tasks.filter((t) => t.assigneeId === team.id).length
                return (
                  <div key={team.id} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                    <div className={['grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1', tc.bg, tc.ring].join(' ')}>
                      <span className={['h-3 w-3 rounded-full', tc.dot].join(' ')} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{team.name}</span>
                        <span className={['rounded-md px-2 py-0.5 text-[10px] font-semibold', tc.pill].join(' ')}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {members.length > 0 ? (
                          <div className="flex -space-x-1.5">
                            {members.slice(0, 5).map((u) => <Avatar key={u.id} name={u.name} size="sm" />)}
                            {members.length > 5 && <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 ring-1 ring-white">+{members.length - 5}</span>}
                    </div>
                        ) : (
                          <span className="text-[12px] text-slate-400">No members</span>
                        )}
                        <span className="text-[12px] text-slate-400 ml-2">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => openTeamForm(team.id)} className="shrink-0 rounded-md p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 transition-all" aria-label="Edit team"><IconPencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => deleteTeam(team.id)} className="shrink-0 rounded-md px-2 py-1 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all">Delete</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {view === NAV.settings && (
          <div className="mx-auto max-w-2xl px-8 py-8">
            <h1 className="text-xl font-semibold tracking-tight demo-heading">Dashboard Settings</h1>
            <p className="mt-1 text-sm demo-muted">Customize your dashboard experience.</p>

            {/* theme */}
            <div className="mt-8">
              <h2 className="text-sm font-semibold demo-heading">Theme</h2>
              <p className="mt-0.5 text-[12px] demo-muted">Switch between light and dark mode.</p>
              <div className="mt-3 flex gap-3">
                {[{ id: 'light', label: 'Light', icon: IconSun }, { id: 'dark', label: 'Dark', icon: IconMoon }].map((opt) => (
                  <button key={opt.id} type="button" onClick={() => updateSettings({ theme: opt.id })} className={['flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all', settings.theme === opt.id ? 'settings-option-active' : 'settings-option'].join(' ')}>
                    <opt.icon className="w-4 h-4" />{opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* layout prefs */}
            <div className="mt-8">
              <h2 className="text-sm font-semibold demo-heading">Layout</h2>
              <p className="mt-0.5 text-[12px] demo-muted">Set your preferred defaults.</p>
              <div className="mt-3 space-y-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider demo-muted">Default board view</label>
                  <div className="mt-2 flex gap-3">
                    {[{ id: 'kanban', label: 'Board', icon: IconKanban }, { id: 'list', label: 'List', icon: IconList }].map((opt) => (
                      <button key={opt.id} type="button" onClick={() => updateSettings({ defaultView: opt.id })} className={['flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all', settings.defaultView === opt.id ? 'settings-option-active' : 'settings-option'].join(' ')}>
                        <opt.icon className="w-4 h-4" />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider demo-muted">Sidebar default</label>
                  <div className="mt-2 flex gap-3">
                    {[{ id: false, label: 'Expanded' }, { id: true, label: 'Collapsed' }].map(({ id, label }) => (
                      <button key={String(id)} type="button" onClick={() => updateSettings({ sidebarCollapsed: id })} className={['flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all', settings.sidebarCollapsed === id ? 'settings-option-active' : 'settings-option'].join(' ')}>
                        {id ? <IconChevronRight className="w-4 h-4" /> : <IconChevronLeft className="w-4 h-4" />}{label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* density */}
            <div className="mt-8">
              <h2 className="text-sm font-semibold demo-heading">Display density</h2>
              <p className="mt-0.5 text-[12px] demo-muted">Control spacing and sizing of task cards and list rows.</p>
              <div className="mt-3 flex gap-3">
                {[{ id: 'compact', label: 'Compact', desc: 'Tighter spacing' }, { id: 'comfortable', label: 'Comfortable', desc: 'Default spacing' }, { id: 'spacious', label: 'Spacious', desc: 'More breathing room' }].map(({ id, label, desc }) => (
                  <button key={id} type="button" onClick={() => updateSettings({ density: id })} className={['flex flex-col items-start rounded-xl border px-5 py-3 text-left transition-all', settings.density === id ? 'settings-option-active' : 'settings-option'].join(' ')}>
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-[11px] demo-muted mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BOARD */}
        {view === NAV.board && (
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b px-8 py-3 space-y-2.5" style={{ borderColor: 'var(--demo-border)', background: 'var(--demo-surface)' }}>
              {/* row 1: project header */}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => navigate(NAV.projects)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"><IconArrowLeft className="w-3 h-3" /></button>
                <h1 className="text-base font-semibold tracking-tight truncate">{activeProject?.name ?? 'Untitled'}</h1>
                {activeProject && (
                  editingPrefix ? (
                    <input value={prefixDraft} onChange={(e) => setPrefixDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} onBlur={commitPrefix} onKeyDown={(e) => { if (e.key === 'Enter') commitPrefix(); if (e.key === 'Escape') setEditingPrefix(false) }} className="w-16 rounded bg-cyan-50 border border-cyan-300 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-cyan-700 focus:outline-none" autoFocus />
                  ) : (
                    <button type="button" onClick={() => { setPrefixDraft(activeProject.prefix); setEditingPrefix(true) }} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 hover:bg-slate-200 transition-colors" title="Click to edit prefix">{activeProject.prefix}</button>
                  )
                )}
                {activeProject && <CopyButton text={buildProjectUrl(activeProject.prefix)} label="Copy project link" />}
                <div className="flex-1" />
                {/* comments */}
                <button type="button" onClick={() => setShowProjectComments((p) => !p)} className={['inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors', showProjectComments ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'].join(' ')} title="Project comments">
                  <IconChat className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Comments</span>
                  {(activeProject?.comments ?? []).length > 0 && <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-slate-200 text-[9px] font-bold text-slate-600 px-1">{(activeProject?.comments ?? []).length}</span>}
                </button>
                {/* nudges */}
                <button type="button" onClick={() => { setShowNudges((p) => { if (!p) { if (nudgesFetchedRef.current !== activeProjectId && getAiCallCount() < AI_LIMIT) { nudgesFetchedRef.current = activeProjectId; incAiCallCount(); const proj = projects.find((x) => x.id === activeProjectId); if (proj) fetchAiNudges(tasks, users, proj).then((aiN) => setNudges((prev) => [...prev.filter((n) => n.type !== 'ai'), ...aiN])) } } return !p }) }} className={['inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors relative', showNudges ? 'bg-violet-50 text-violet-700 border border-violet-200' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'].join(' ')} title="AI Nudges">
                  <IconSparkle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nudges</span>
                  {nudges.length > 0 && <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-violet-500 text-[9px] font-bold text-white px-1">{nudges.length}</span>}
                </button>
                {/* settings gear menu */}
                <div className="relative">
                  <button type="button" onClick={() => setShowMoreMenu((p) => !p)} className={['inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors', showMoreMenu ? 'bg-slate-100 text-slate-700 border border-slate-300' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'].join(' ')} title="Project options">
                    <IconSliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Options</span>
                  </button>
                  {showMoreMenu && (
                    <><div className="fixed inset-0 z-20" onClick={() => setShowMoreMenu(false)} /><div className="absolute right-0 top-full mt-1 z-30 w-60 rounded-xl border border-slate-200 shadow-lg bg-white p-1.5 overflow-hidden" style={{ animation: 'fadeIn 0.1s ease-out' }}>
                      <button type="button" onClick={() => { setShowColumnSettings(true); setShowMoreMenu(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"><IconGear className="w-4 h-4 text-slate-400" />Column settings</button>
                      <button type="button" onClick={() => { generateStandup(); setShowMoreMenu(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"><IconSparkle className="w-4 h-4 text-violet-500" />Generate standup</button>
                      <button type="button" onClick={() => { generateRetro(); setShowMoreMenu(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"><IconSparkle className="w-4 h-4 text-violet-500" />Weekly digest</button>
                      <div className="my-1 h-px bg-slate-100" />
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Views</div>
                      <button type="button" onClick={() => { setBoardView(BOARD_VIEWS.kanban); setShowMoreMenu(false) }} className={['flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors', boardView === BOARD_VIEWS.kanban ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}><IconKanban className="w-4 h-4 text-slate-400" />Board</button>
                      <button type="button" onClick={() => { setBoardView(BOARD_VIEWS.list); setShowMoreMenu(false) }} className={['flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors', boardView === BOARD_VIEWS.list ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}><IconList className="w-4 h-4 text-slate-400" />List</button>
                      <button type="button" onClick={() => { setBoardView(BOARD_VIEWS.timeline); setShowMoreMenu(false) }} className={['flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors', boardView === BOARD_VIEWS.timeline ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}><IconTimeline className="w-4 h-4 text-slate-400" />Timeline</button>
                      <button type="button" onClick={() => { setBoardView(BOARD_VIEWS.heatmap); setShowMoreMenu(false) }} className={['flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors', boardView === BOARD_VIEWS.heatmap ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}><IconHeatmap className="w-4 h-4 text-slate-400" />Workload heatmap</button>
                      <div className="my-1 h-px bg-slate-100" />
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Saved Filters</div>
                      {projectSavedViews.map((sv) => (
                        <div key={sv.id} className="group flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                          <button type="button" onClick={() => { applySavedView(sv); setShowMoreMenu(false) }} className="flex-1 text-left text-[13px] text-slate-700 truncate"><IconFilter className="w-3 h-3 inline mr-1.5 text-slate-400" />{sv.name}</button>
                          <button type="button" onClick={() => deleteSavedView(sv.id)} className="rounded p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><IconX className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <button type="button" onClick={() => { setShowSaveView(true); setShowMoreMenu(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-500 hover:bg-slate-50 transition-colors"><IconBookmark className="w-4 h-4 text-slate-400" />Save current view…</button>
                      <div className="my-1 h-px bg-slate-100" />
                      <button type="button" onClick={() => { resetDemo(); setShowMoreMenu(false) }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors"><IconTrash className="w-4 h-4 text-red-400" />Reset demo data</button>
                    </div></>
                  )}
                </div>
              </div>

              {/* project comments section */}
              {showProjectComments && activeProject && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 animate-[slideUp_150ms_ease-out]">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project Comments</div>
                  <CommentList comments={activeProject.comments ?? []} users={users} teams={teams} onDelete={(cid) => deleteProjectComment(activeProject.id, cid)} />
                  <CommentInput users={users} teams={teams} onSubmit={(text) => addProjectComment(activeProject.id, text)} />
                </div>
              )}

              {/* save view modal (triggered from more menu) */}
              {showSaveView && (
                <div className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50/50 px-4 py-2.5 animate-[slideUp_150ms_ease-out]">
                  <IconBookmark className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span className="text-[12px] text-slate-600 shrink-0">Save view as:</span>
                  <input value={viewNameDraft} onChange={(e) => setViewNameDraft(e.target.value)} placeholder="View name…" className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-cyan-400/70 focus:outline-none" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') saveCurrentView(); if (e.key === 'Escape') { setShowSaveView(false); setViewNameDraft('') } }} />
                  <button type="button" onClick={saveCurrentView} disabled={!viewNameDraft.trim()} className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0">Save</button>
                  <button type="button" onClick={() => { setShowSaveView(false); setViewNameDraft('') }} className="rounded p-1 text-slate-400 hover:text-slate-600"><IconX className="w-3 h-3" /></button>
                </div>
              )}

              {/* row 2: create + focus */}
              <div className="flex items-center gap-2">
                {/* new task button */}
                <button type="button" onClick={openCreateTask} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-slate-800 transition-colors"><IconPlus className="w-3.5 h-3.5" />New task</button>
                {/* focus toggle */}
                <button type="button" onClick={() => setFocusMode((p) => !p)} className={['inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-[13px] font-medium transition-colors', focusMode ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'].join(' ')} title="Focus mode"><IconTarget className="w-3.5 h-3.5" /><span className="hidden sm:inline">Focus</span></button>
              </div>
              {/* NLP quick-create bar */}
              {showNlpBar && (
                <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/50 px-4 py-2.5 animate-[slideUp_150ms_ease-out]">
                  <IconSparkle className="w-4 h-4 text-violet-500 shrink-0" />
                  <input value={nlpInput} onChange={(e) => setNlpInput(e.target.value)} placeholder='Describe a task… e.g. "fix the auth bug, assign to Sam, urgent"' className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-violet-400/70 focus:outline-none" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') nlpCreateTask(); if (e.key === 'Escape') { setShowNlpBar(false); setNlpInput(''); setNlpResult(null) } }} />
                  {nlpLoading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin shrink-0" />
                  ) : nlpResult?.success ? (
                    <span className="text-[12px] font-medium text-emerald-600 shrink-0">Created "{nlpResult.title}"</span>
                  ) : nlpResult?.error ? (
                    <span className="text-[12px] font-medium text-red-500 shrink-0">{nlpResult.error}</span>
                  ) : (
                    <button type="button" onClick={nlpCreateTask} disabled={!nlpInput.trim()} className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-40 transition-colors shrink-0">Create</button>
                  )}
                </div>
              )}
              {/* row 3: expandable filters + stats */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* + Filter button */}
                <div className="relative">
                  <button type="button" onClick={() => setShowFilterMenu((p) => !p)} className={['inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors', showFilterMenu ? 'border-cyan-400 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'].join(' ')}>
                    <IconFilter className="w-3.5 h-3.5" />Filter
                  </button>
                  {showFilterMenu && (
                    <><div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} /><div className="absolute left-0 top-full mt-1 z-30 w-56 rounded-xl border border-slate-200 shadow-lg bg-white p-1.5 max-h-80 overflow-y-auto" style={{ animation: 'fadeIn 0.1s ease-out' }}>
                      {/* Status */}
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</div>
                      {[{ value: 'assigned', label: 'Assigned' }, { value: 'unassigned', label: 'Unassigned' }, { value: 'overdue', label: 'Overdue' }].map((opt) => {
                        const active = activeFilters.some((f) => f.type === 'status' && f.value === opt.value)
                        return <button key={opt.value} type="button" onClick={() => { if (active) setActiveFilters((p) => p.filter((f) => !(f.type === 'status' && f.value === opt.value))); else setActiveFilters((p) => [...p, { type: 'status', value: opt.value, label: opt.label }]); }} className={['flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors', active ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>{active ? <span className="w-4 h-4 text-center text-cyan-600 text-[11px]">✓</span> : <span className="w-4" />}{opt.label}</button>
                      })}
                      <div className="my-1 h-px bg-slate-100" />
                      {/* Priority */}
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Priority</div>
                      {PRIORITIES.map((p) => {
                        const active = activeFilters.some((f) => f.type === 'priority' && f.value === p.id)
                        return <button key={p.id} type="button" onClick={() => { if (active) setActiveFilters((prev) => prev.filter((f) => !(f.type === 'priority' && f.value === p.id))); else setActiveFilters((prev) => [...prev, { type: 'priority', value: p.id, label: `${p.short} ${p.label}` }]); }} className={['flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors', active ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>{active ? <span className="w-4 h-4 text-center text-cyan-600 text-[11px]">✓</span> : <span className={['w-2 h-2 rounded-full ml-1 mr-1', p.dot].join(' ')} />}{p.short} – {p.label}</button>
                      })}
                      <div className="my-1 h-px bg-slate-100" />
                      {/* Assignee */}
                      <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Assignee</div>
                      {users.map((u) => {
                        const active = activeFilters.some((f) => f.type === 'assignee' && f.value === u.id)
                        return <button key={u.id} type="button" onClick={() => { if (active) setActiveFilters((prev) => prev.filter((f) => !(f.type === 'assignee' && f.value === u.id))); else setActiveFilters((prev) => [...prev, { type: 'assignee', value: u.id, label: u.name }]); }} className={['flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors', active ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>{active ? <span className="w-4 h-4 text-center text-cyan-600 text-[11px]">✓</span> : <span className="w-4" />}{u.name}</button>
                      })}
                      {teams.length > 0 && <>
                        <div className="my-1 h-px bg-slate-100" />
                        {/* Team */}
                        <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Team</div>
                        {teams.map((t) => {
                          const tc = TEAM_COLORS.find((c) => c.id === t.color) ?? TEAM_COLORS[0]
                          const active = activeFilters.some((f) => f.type === 'team' && f.value === t.id)
                          return <button key={t.id} type="button" onClick={() => { if (active) setActiveFilters((prev) => prev.filter((f) => !(f.type === 'team' && f.value === t.id))); else setActiveFilters((prev) => [...prev, { type: 'team', value: t.id, label: t.name }]); }} className={['flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors', active ? 'bg-cyan-50 text-cyan-700 font-medium' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>{active ? <span className="w-4 h-4 text-center text-cyan-600 text-[11px]">✓</span> : <span className={['w-2 h-2 rounded-full ml-1 mr-1', tc.dot].join(' ')} />}{t.name}</button>
                        })}
                      </>}
                    </div></>
                  )}
                </div>
                {/* active filter pills */}
                {activeFilters.map((f, i) => (
                  <span key={`${f.type}-${f.value}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700 animate-[fadeIn_100ms_ease-out]">
                    <span className="text-[10px] text-cyan-500 uppercase">{f.type === 'status' ? '' : `${f.type}: `}</span>{f.label}
                    <button type="button" onClick={() => setActiveFilters((p) => p.filter((_, j) => j !== i))} className="rounded-full p-0.5 text-cyan-400 hover:text-cyan-600 hover:bg-cyan-100 transition-colors"><IconX className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
                {activeFilters.length > 0 && (
                  <button type="button" onClick={() => setActiveFilters([])} className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">Clear all</button>
                )}
                <div className="flex-1" />
                <BoardStats tasks={tasks} activeProjectId={activeProjectId} />
              </div>
            </div>

            {/* bulk action bar */}
            {bulkSelectedIds.size > 0 && (
              <div className="shrink-0 border-b px-8 py-2 flex items-center gap-3 animate-[fadeIn_150ms_ease-out]" style={{ borderColor: 'var(--demo-border)', background: 'var(--demo-surface)' }}>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={clearBulkSelection} className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Clear selection">
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[13px] font-semibold text-cyan-700">{bulkSelectedIds.size} selected</span>
                  <button type="button" onClick={selectAllVisible} className="text-[11px] text-cyan-600 hover:text-cyan-700 underline underline-offset-2 transition-colors">Select all</button>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                {/* move to */}
                <div className="relative group/bulkmove">
                  <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <IconArrowRight className="w-3 h-3" />Move to
                    <IconChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  <div className="absolute left-0 top-full mt-1 z-30 w-44 rounded-xl border border-slate-200 shadow-lg bg-white p-1 hidden group-hover/bulkmove:block">
                    {activeColumns.map((col) => (
                      <button key={col.id} type="button" onClick={() => bulkMoveTo(col.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors">
                        <span className={['h-2 w-2 rounded-full shrink-0', col.dot].join(' ')} />
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* assign to */}
                <div className="relative group/bulkassign">
                  <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <IconUsers className="w-3 h-3" />Assign
                    <IconChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  <div className="absolute left-0 top-full mt-1 z-30 w-48 rounded-xl border border-slate-200 shadow-lg bg-white p-1 hidden group-hover/bulkassign:block">
                    <button type="button" onClick={() => bulkAssign(null)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-slate-500 hover:bg-slate-50 transition-colors italic">Unassign</button>
                    {users.map((u) => (
                      <button key={u.id} type="button" onClick={() => bulkAssign(u.id)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors">
                        <Avatar name={u.name} size="sm" />{u.name}
                      </button>
                    ))}
                  </div>
                </div>
                {/* delete */}
                <button type="button" onClick={bulkDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <IconTrash className="w-3 h-3" />Delete
                </button>
                <div className="flex-1" />
                <span className="text-[10px] text-slate-400">Shift+click or use checkboxes to select</span>
              </div>
            )}

            {/* board body */}
            {focusMode ? (
              <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="mx-auto max-w-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <IconTarget className="w-5 h-5 text-cyan-500" />
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Focus Mode</h2>
                      <p className="text-[12px] text-slate-500">Your tasks, sorted by priority. {focusTasks.length === 0 ? 'Nothing assigned to you!' : `${focusTasks.length} task${focusTasks.length !== 1 ? 's' : ''} to focus on.`}</p>
                    </div>
                  </div>
                  {focusTasks.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
                      <div className="text-3xl mb-2">🎉</div>
                      <p className="text-sm text-slate-500">You're all caught up! No tasks assigned to you.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {focusTasks.map((t, idx) => {
                        const proj = projects.find((p) => p.id === t.projectId)
                        const overdue = isOverdue(t.dueDate) && t.status !== 'done'
                        const statusInfo = activeColumns.find((c) => c.id === t.status)
                        const blockers = (t.blockedBy ?? []).map((bid) => tasks.find((bt) => bt.id === bid)).filter(Boolean)
                        return (
                          <button key={t.id} type="button" onClick={() => setSelectedTaskId(t.id)} className={['w-full text-left rounded-xl border p-4 transition-all hover:shadow-md', overdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white hover:border-slate-300'].join(' ')}>
                            <div className="flex items-start gap-3">
                              <span className="mt-1 text-lg font-semibold text-slate-300 w-6 text-right">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {statusInfo && <span className={['h-2 w-2 rounded-full shrink-0', statusInfo.dot].join(' ')} />}
                                  <span className="text-[13px] font-medium text-slate-900 truncate">{t.title}</span>
                                  {t.priority && <PriorityBadge priority={t.priority} />}
                                  {proj && <TaskId prefix={proj.prefix} number={t.number} />}
                                </div>
                                <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                                  {t.dueDate && <span className={['inline-flex items-center gap-1 text-[11px]', overdue ? 'text-red-600 font-semibold' : 'text-slate-400'].join(' ')}><IconCalendar className="w-3 h-3" />{formatDate(t.dueDate)}{overdue && ' (overdue)'}</span>}
                                  {(t.tags ?? []).map((tag) => <TagPill key={tag} tag={tag} />)}
                                  {blockers.length > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-orange-600 font-medium"><IconLink className="w-3 h-3" />Blocked by {blockers.length} task{blockers.length > 1 ? 's' : ''}</span>}
                                  <SubtaskProgress subtasks={t.subtasks} />
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : boardView === BOARD_VIEWS.kanban ? (
            <div className="flex-1 overflow-x-auto overflow-y-auto px-8 py-6">
              <div className="flex gap-5 h-full">
                  {activeColumns.filter((s) => visibleColumns.includes(s.id)).map((s) => {
                    const isPinned = s.id === 'inbox' || s.id === 'done'
                    const colIdx = activeColumns.findIndex((c) => c.id === s.id)
                    const count = (byStatus[s.id] ?? []).length

                    return (
                      <div key={s.id} className={['w-[280px] shrink-0 flex flex-col', draggingColId === s.id ? 'opacity-40' : ''].join(' ')}
                        draggable={!isPinned}
                        onDragStart={!isPinned ? (e) => { if (e.target.closest('[data-task-id]')) return; e.stopPropagation(); onColDragStart(e, s.id) } : undefined}
                        onDragEnd={!isPinned ? onColDragEnd : undefined}
                        onDragOver={!isPinned ? (e) => { if (draggingColId) { onColDragOver(e, colIdx) } else { onDragOverCol(e, s.id) } } : (e) => onDragOverCol(e, s.id)}
                        onDrop={(e) => { if (draggingColId) { onColDrop(e, colIdx) } else { onDropTask(e, s.id) } }}
                      >
                        {/* column header */}
                        <div className={['flex items-center gap-2.5 px-1 pb-3 group/header', !isPinned ? 'cursor-grab active:cursor-grabbing' : ''].join(' ')}>
                          {dragOverColIdx === colIdx && draggingColId && <div className="absolute left-0 top-0 w-0.5 h-full bg-cyan-400 rounded-full" />}
                          <span className={['h-2.5 w-2.5 rounded-full', s.dot].join(' ')} />
                          {renamingColId === s.id ? (
                            <input value={renameColValue} onChange={(e) => setRenameColValue(e.target.value)} autoFocus className="flex-1 rounded border border-cyan-300 bg-cyan-50/30 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-600 focus:outline-none" onBlur={() => renameColumn(s.id, renameColValue)} onKeyDown={(e) => { if (e.key === 'Enter') renameColumn(s.id, renameColValue); if (e.key === 'Escape') { setRenamingColId(null); setRenameColValue('') } }} />
                          ) : (
                            <span className={['text-xs font-semibold uppercase tracking-wider text-slate-500', !isPinned ? 'cursor-text' : ''].join(' ')} onDoubleClick={!isPinned ? () => { setRenamingColId(s.id); setRenameColValue(s.label) } : undefined}>{s.label}</span>
                          )}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
                        </div>
                        <div className={['flex-1 space-y-2 rounded-xl p-2 min-h-[120px] transition-colors duration-150', dragOverStatus === s.id && !draggingColId ? 'bg-cyan-50/70 ring-2 ring-cyan-200/70' : 'bg-slate-50/60'].join(' ')} data-column-list={s.id} onDragOver={(e) => { if (!draggingColId) onDragOverCol(e, s.id) }} onDrop={(e) => { if (!draggingColId) onDropTask(e, s.id) }}>
                    {(byStatus[s.id] ?? []).map((t) => (
                            <TaskCard key={t.id} task={t} project={activeProject} users={users} teams={teams} columns={activeColumns} onAssign={assignTask} onDragStart={onDragStart} onDragEnd={onDragEnd} registerEl={registerEl} onSelect={setSelectedTaskId} isNew={newTaskIds.has(t.id)} bulkSelected={bulkSelectedIds.has(t.id)} onBulkToggle={toggleBulkSelect} bulkMode={bulkSelectedIds.size > 0} />
                          ))}
                          {count === 0 && <div className="flex h-24 flex-col items-center justify-center gap-1 text-slate-400"><div className="h-8 w-8 rounded-lg border-2 border-dashed border-slate-200 grid place-items-center"><IconPlus className="w-3.5 h-3.5 text-slate-300" /></div><span className="text-[11px]">Drop here</span></div>}
              </div>
            </div>
                    )
                  })}
                </div>
              </div>
            ) : boardView === BOARD_VIEWS.list ? (
              <div className="flex-1 overflow-y-auto">
                <ListView tasks={filtered.filter((t) => visibleColumns.includes(t.status))} projects={projects} users={users} teams={teams} columns={activeColumns} onSelect={setSelectedTaskId} />
              </div>
            ) : boardView === BOARD_VIEWS.timeline ? (
              /* ── Timeline / Gantt view ── */
              <div className="flex-1 overflow-auto px-8 py-6">
                {timelineData && timelineData.days.length > 0 ? (
                  <div>
                    {/* header row with day labels */}
                    <div className="flex items-end mb-2" style={{ paddingLeft: 180 }}>
                      {timelineData.days.map((day, i) => {
                        const d = new Date(day + 'T00:00:00')
                        const isToday = i === timelineData.todayIdx
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6
                        return (
                          <div key={day} className={['flex-shrink-0 text-center text-[10px] leading-tight', isToday ? 'font-bold text-cyan-600' : isWeekend ? 'text-slate-300' : 'text-slate-400'].join(' ')} style={{ width: 44 }}>
                            <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className={isToday ? 'bg-cyan-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px] font-bold' : ''}>{d.getDate()}</div>
                          </div>
                        )
                      })}
                    </div>
                    {/* task rows */}
                    <div className="space-y-1">
                      {timelineData.tasks.sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')).map((t) => {
                        const statusInfo = activeColumns.find((c) => c.id === t.status)
                        const dayIdx = timelineData.days.indexOf(t.dueDate)
                        const overdue = isOverdue(t.dueDate) && t.status !== 'done'
                        const isDone = t.status === 'done'
                        return (
                          <div key={t.id} className="flex items-center group" style={{ minHeight: 32 }}>
                            {/* task label */}
                            <div className="w-[180px] shrink-0 pr-3 flex items-center gap-2 truncate">
                              {statusInfo && <span className={['h-2 w-2 rounded-full shrink-0', statusInfo.dot].join(' ')} />}
                              <button type="button" onClick={() => setSelectedTaskId(t.id)} className={['text-[12px] truncate text-left hover:text-cyan-600 transition-colors', isDone ? 'text-slate-400 line-through' : 'text-slate-700 font-medium'].join(' ')}>{t.title}</button>
                              {t.priority && <PriorityBadge priority={t.priority} />}
                            </div>
                            {/* timeline bar */}
                            <div className="flex-1 flex relative" style={{ height: 28 }}>
                              {timelineData.days.map((day, i) => {
                                const isToday = i === timelineData.todayIdx
                                const dObj = new Date(day + 'T00:00:00')
                                const isWeekend = dObj.getDay() === 0 || dObj.getDay() === 6
                                return (
                                  <div key={day} className={['flex-shrink-0 border-r', isToday ? 'border-cyan-300 bg-cyan-50/40' : isWeekend ? 'border-slate-100 bg-slate-50/30' : 'border-slate-100'].join(' ')} style={{ width: 44, height: 28 }}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-cyan-100/60') }}
                                    onDragLeave={(e) => e.currentTarget.classList.remove('bg-cyan-100/60')}
                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-cyan-100/60'); if (timelineDragTask) { updateTaskDueDate(timelineDragTask, day); setTimelineDragTask(null) } }}
                                  />
                                )
                              })}
                              {/* the marker dot */}
                              {dayIdx >= 0 && (
                                <div className={['absolute top-1/2 -translate-y-1/2 h-5 rounded-full flex items-center gap-1 px-2 text-[10px] font-medium cursor-grab active:cursor-grabbing shadow-sm transition-all', overdue ? 'bg-red-500 text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'].join(' ')} style={{ left: dayIdx * 44 + 4, minWidth: 36 }}
                                  draggable onDragStart={() => setTimelineDragTask(t.id)} onDragEnd={() => setTimelineDragTask(null)}
                                >
                                  {formatDate(t.dueDate)}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* tasks without due dates */}
                    {timelineData.noDates.length > 0 && (
                      <div className="mt-6 border-t border-dashed border-slate-200 pt-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">No due date ({timelineData.noDates.length})</div>
                        <div className="flex flex-wrap gap-2">
                          {timelineData.noDates.map((t) => (
                            <button key={t.id} type="button" onClick={() => setSelectedTaskId(t.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 py-1.5 text-[12px] text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-colors">
                              <span className={['h-1.5 w-1.5 rounded-full', activeColumns.find((c) => c.id === t.status)?.dot ?? 'bg-slate-400'].join(' ')} />
                              {t.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <IconTimeline className="w-10 h-10 text-slate-300" />
                    <p className="text-sm text-slate-500">Add due dates to tasks to see them on the timeline.</p>
                  </div>
                )}
              </div>
            ) : boardView === BOARD_VIEWS.heatmap ? (
              /* ── Workload Heatmap view ── */
              <div className="flex-1 overflow-auto px-8 py-6">
                {heatmapData ? (
                  <div>
                    <div className="flex items-center gap-3 mb-5">
                      <IconHeatmap className="w-5 h-5 text-slate-500" />
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">Workload Heatmap</h2>
                        <p className="text-[11px] text-slate-500">Task distribution per team member over the next 2 weeks. Click a cell to see tasks.</p>
                      </div>
                      <div className="flex-1" />
                      <div className="flex items-center gap-3 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-100" /> 1</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-200" /> 2-3</span>
                        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-300" /> 4+</span>
                      </div>
                    </div>
                    {/* header */}
                    <div className="flex items-end mb-1" style={{ paddingLeft: 160 }}>
                      {heatmapData.days.map((day) => {
                        const d = new Date(day + 'T00:00:00')
                        const isToday = day === new Date().toISOString().slice(0, 10)
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6
                        return (
                          <div key={day} className={['flex-shrink-0 text-center text-[10px] leading-tight', isToday ? 'font-bold text-cyan-600' : isWeekend ? 'text-slate-300' : 'text-slate-400'].join(' ')} style={{ width: 48 }}>
                            <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                            <div className={isToday ? 'bg-cyan-500 text-white rounded-full w-5 h-5 inline-flex items-center justify-center text-[10px] font-bold' : ''}>{d.getDate()}</div>
                          </div>
                        )
                      })}
                      <div className="flex-shrink-0 text-center text-[10px] text-slate-400" style={{ width: 60 }}>No date</div>
                    </div>
                    {/* user rows */}
                    {heatmapData.grid.map((row) => (
                      <div key={row.user.id} className="flex items-center group" style={{ minHeight: 38 }}>
                        <div className="w-[160px] shrink-0 pr-3 flex items-center gap-2">
                          <Avatar name={row.user.name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-medium text-slate-700 truncate">{row.user.name}</div>
                            <div className="text-[10px] text-slate-400">{row.total} task{row.total !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        {heatmapData.days.map((day) => {
                          const ct = row.byDay[day]?.length ?? 0
                          const bg = ct === 0 ? 'bg-slate-50' : ct === 1 ? 'bg-emerald-100' : ct <= 3 ? 'bg-amber-200' : 'bg-red-300'
                          const textColor = ct === 0 ? 'text-transparent' : ct <= 3 ? 'text-slate-700' : 'text-red-900'
                          return (
                            <div key={day} className={['flex-shrink-0 flex items-center justify-center rounded-md mx-0.5 text-[11px] font-semibold cursor-default transition-colors hover:ring-2 hover:ring-cyan-300', bg, textColor].join(' ')} style={{ width: 44, height: 30 }} title={ct > 0 ? row.byDay[day].map((t) => t.title).join(', ') : 'No tasks'}>
                              {ct > 0 ? ct : ''}
                            </div>
                          )
                        })}
                        <div className="flex-shrink-0 flex items-center justify-center rounded-md mx-0.5 text-[11px] font-medium text-slate-400" style={{ width: 56, height: 30 }}>
                          {row.noDate.length > 0 ? <span className="rounded bg-slate-100 px-2 py-0.5">{row.noDate.length}</span> : '—'}
                        </div>
                      </div>
                    ))}
                    {/* unassigned row */}
                    <div className="flex items-center mt-1 pt-1 border-t border-dashed border-slate-200" style={{ minHeight: 38 }}>
                      <div className="w-[160px] shrink-0 pr-3 flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 grid place-items-center text-[10px] text-slate-400 font-bold">?</div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-slate-500">Unassigned</div>
                          <div className="text-[10px] text-slate-400">{heatmapData.unassigned.total} task{heatmapData.unassigned.total !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                      {heatmapData.days.map((day) => {
                        const ct = heatmapData.unassigned.byDay[day]?.length ?? 0
                        const bg = ct === 0 ? 'bg-slate-50' : ct === 1 ? 'bg-slate-100' : 'bg-slate-200'
                        return (
                          <div key={day} className={['flex-shrink-0 flex items-center justify-center rounded-md mx-0.5 text-[11px] font-medium text-slate-500 transition-colors', bg].join(' ')} style={{ width: 44, height: 30 }}>
                            {ct > 0 ? ct : ''}
                          </div>
                        )
                      })}
                      <div className="flex-shrink-0 flex items-center justify-center rounded-md mx-0.5 text-[11px] font-medium text-slate-400" style={{ width: 56, height: 30 }}>
                        {heatmapData.unassigned.noDate.length > 0 ? <span className="rounded bg-slate-100 px-2 py-0.5">{heatmapData.unassigned.noDate.length}</span> : '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <IconHeatmap className="w-10 h-10 text-slate-300" />
                    <p className="text-sm text-slate-500">No data to display.</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* overlays */}
      {selectedTask && (
        <TaskDetailPanel
          key={selectedTask.id}
          task={selectedTask}
          project={projects.find((p) => p.id === selectedTask.projectId)}
          columns={getProjectColumns(projects.find((p) => p.id === selectedTask.projectId))}
          allTasks={tasks}
          users={users}
          teams={teams}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onAddComment={addTaskComment}
          onDeleteComment={deleteTaskComment}
          onAddBlocker={addBlocker}
          onRemoveBlocker={removeBlocker}
          buildTaskUrl={buildTaskUrl}
        />
      )}
      {showNudges && !selectedTask && view === NAV.board && (
        <NudgesPanel
          nudges={nudges}
          loading={nudgesLoading}
          onClose={() => setShowNudges(false)}
          onRefresh={refreshNudges}
        />
      )}
      {showCmdPalette && <CommandPalette tasks={tasks} projects={projects} users={users} teams={teams} onClose={() => setShowCmdPalette(false)} onSelectTask={(id, projectId) => { setData((prev) => ({ ...prev, view: NAV.board, activeProjectId: projectId })); setSelectedTaskId(id) }} onNavigate={navigate} />}
      {showShortcuts && <ShortcutHelp onClose={() => setShowShortcuts(false)} />}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateProject(false) }}>
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600"><IconFolder className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-sm font-semibold">New Project</h2>
                  <p className="text-[11px] text-slate-500">Create a new project to organize your tasks</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreateProject(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project name <span className="text-red-400">*</span></label>
                <input value={projFormName} onChange={(e) => setProjFormName(e.target.value)} placeholder="e.g. Mobile App Redesign" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') submitCreateProject() }} />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Prefix <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">(auto-derived if empty)</span></label>
                <input value={projFormPrefix} onChange={(e) => setProjFormPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} placeholder="e.g. MAR" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" onKeyDown={(e) => { if (e.key === 'Enter') submitCreateProject() }} />
                <p className="mt-1 text-[11px] text-slate-400">Used for task IDs, e.g. {projFormPrefix.trim() || (projFormName.trim() ? derivePrefix(projFormName) : 'PRJ')}-1</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button type="button" onClick={() => setShowCreateProject(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="button" onClick={submitCreateProject} disabled={!projFormName.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Create project</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateTask(false) }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600"><IconPlus className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-sm font-semibold">New Task</h2>
                  <p className="text-[11px] text-slate-500">Add a task to <span className="font-medium text-slate-700">{activeProject?.name ?? 'project'}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setShowCreateTask(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* quick start: templates + AI */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Quick start <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">— or fill in manually below</span></label>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {TASK_TEMPLATES.map((tpl) => (
                    <button key={tpl.name} type="button" onClick={() => { const active = taskFormTemplate?.name === tpl.name; if (active) { setTaskFormTemplate(null); setTaskFormTags(''); setTaskFormPriority('') } else { setTaskFormTemplate(tpl); setTaskFormTags(tpl.fields.tags?.join(', ') ?? ''); setTaskFormPriority(tpl.fields.priority ?? '') } }} className={['inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] transition-colors', taskFormTemplate?.name === tpl.name ? 'border-cyan-400 bg-cyan-50 text-cyan-700 font-medium' : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'].join(' ')}>
                      <span>{tpl.icon}</span>{tpl.name}
                    </button>
                  ))}
                  <button type="button" onClick={() => { setShowCreateTask(false); setShowNlpBar(true); setNlpResult(null) }} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/50 px-2.5 py-1.5 text-[12px] text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-colors">
                    <IconSparkle className="w-3.5 h-3.5" />Create with AI
                  </button>
                </div>
                {taskFormTemplate && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-[12px] text-slate-500 animate-[fadeIn_150ms_ease-out]">
                    <span className="shrink-0 mt-0.5">📋</span>
                    <span>Will include {taskFormTemplate.fields.subtasks?.length ?? 0} subtask checklist items, tagged <span className="font-medium text-slate-700">{taskFormTemplate.fields.tags?.join(', ')}</span>, priority <span className="font-medium text-slate-700">{taskFormTemplate.fields.priority?.toUpperCase()}</span></span>
                  </div>
                )}
              </div>
              <div className="h-px bg-slate-100" />
              {/* title */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title <span className="text-red-400">*</span></label>
                <input value={taskFormTitle} onChange={(e) => { setTaskFormTitle(e.target.value); checkDuplicate(e.target.value) }} placeholder="What needs to be done?" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" autoFocus />
                {duplicateWarning && (
                  <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-700 animate-[fadeIn_150ms_ease-out]">
                    <span className="font-medium shrink-0">⚠️ Possible duplicate:</span>
                    <span className="truncate">{duplicateWarning.key && <span className="font-mono text-[11px] bg-amber-100 rounded px-1 mr-1">{duplicateWarning.key}</span>}{duplicateWarning.task.title}</span>
                    <span className="text-[10px] text-amber-500 shrink-0">({Math.round(duplicateWarning.score * 100)}% match)</span>
                  </div>
                )}
              </div>
              {/* description */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</label>
                <textarea value={taskFormDesc} onChange={(e) => setTaskFormDesc(e.target.value)} placeholder="Add more details…" rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm placeholder:text-slate-400 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
              </div>
              {/* status + priority row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</label>
                  <select value={taskFormStatus} onChange={(e) => setTaskFormStatus(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors appearance-none cursor-pointer">
                    {activeColumns.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Priority</label>
                  <select value={taskFormPriority} onChange={(e) => setTaskFormPriority(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors appearance-none cursor-pointer">
                    <option value="">None</option>
                    {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.short} – {p.label}</option>)}
                  </select>
                </div>
              </div>
              {/* assignee + due date row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assignee</label>
                  <select value={taskFormAssignee} onChange={(e) => setTaskFormAssignee(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors appearance-none cursor-pointer">
                    <option value="">Unassigned</option>
                    <optgroup label="Users">
                      {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </optgroup>
                    {teams.length > 0 && <optgroup label="Teams">
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </optgroup>}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Due date</label>
                  <input type="date" value={taskFormDueDate} onChange={(e) => setTaskFormDueDate(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
                </div>
              </div>
              {/* tags */}
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tags <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">(comma-separated, max 6)</span></label>
                <input value={taskFormTags} onChange={(e) => setTaskFormTags(e.target.value)} placeholder="e.g. frontend, bug, urgent" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button type="button" onClick={() => setShowCreateTask(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="button" onClick={submitCreateTask} disabled={!taskFormTitle.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Create task</button>
            </div>
          </div>
        </div>
      )}

      {/* Column Settings Modal */}
      {showColumnSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setShowColumnSettings(false); setAddingColumn(false); setNewColName('') } }}>
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><IconGear className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Board Columns</h2>
                  <p className="text-[11px] text-slate-500">Add, remove, reorder, and toggle visibility</p>
                </div>
              </div>
              <button type="button" onClick={() => { setShowColumnSettings(false); setAddingColumn(false); setNewColName('') }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>
            </div>

            {/* body */}
            <div className="px-6 py-4 space-y-1">
              {activeColumns.map((s, idx) => {
                const active = visibleColumns.includes(s.id)
                const isLast = visibleColumns.length === 1 && active
                const isPinned = s.id === 'inbox' || s.id === 'done'
                const isDraggingThis = draggingColId === s.id
                const isDropTarget = dragOverColIdx === idx && draggingColId && !isPinned
                return (
                  <div key={s.id}
                    draggable={!isPinned}
                    onDragStart={!isPinned ? (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/column', s.id); setDraggingColId(s.id) } : undefined}
                    onDragEnd={() => { setDraggingColId(null); setDragOverColIdx(null) }}
                    onDragOver={!isPinned ? (e) => { e.preventDefault(); setDragOverColIdx(idx) } : undefined}
                    onDrop={!isPinned ? (e) => { e.preventDefault(); const fromId = e.dataTransfer.getData('text/column') || draggingColId; if (fromId) reorderColumns(fromId, idx); setDraggingColId(null); setDragOverColIdx(null) } : undefined}
                    className={['flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm group/col-row transition-all', isDraggingThis ? 'opacity-30' : '', isDropTarget ? 'ring-2 ring-cyan-300 bg-cyan-50/40' : 'hover:bg-slate-50'].join(' ')}
                  >
                    {!isPinned ? (
                      <span className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0 transition-colors" title="Drag to reorder">
                        <IconGripVertical className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-4 shrink-0" />
                    )}
                    <span className={['h-3 w-3 rounded-full shrink-0', s.dot].join(' ')} />
                    <span className="flex-1 text-left text-[14px] font-medium text-slate-700">{s.label}</span>
                    {isPinned && <span className="text-[11px] text-slate-400">(pinned)</span>}
                    {!isPinned && (
                      <button type="button" onClick={() => deleteColumn(s.id)} className="rounded-md p-1 text-slate-300 opacity-0 group-hover/col-row:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete column" aria-label={`Delete ${s.label}`}>
                        <IconX className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button type="button" onClick={() => !isLast && toggleColumn(s.id)} className={['rounded-md p-1 transition-colors', isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'].join(' ')} disabled={isLast} title={active ? 'Hide column' : 'Show column'}>
                      {active ? <IconEye className="w-4 h-4 text-slate-400" /> : <IconEyeOff className="w-4 h-4 text-slate-300" />}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* footer — add column */}
            <div className="border-t border-slate-100 px-6 py-4">
              {addingColumn ? (
                <div className="space-y-2.5">
                  <input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="Column name…" autoFocus className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" onKeyDown={(e) => { if (e.key === 'Enter' && newColName.trim()) addColumn(newColName); if (e.key === 'Escape') { setAddingColumn(false); setNewColName('') } }} />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => { setAddingColumn(false); setNewColName('') }} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button type="button" onClick={() => addColumn(newColName)} disabled={!newColName.trim()} className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Add column</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAddingColumn(true)} className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3.5 py-2 text-sm text-slate-500 hover:border-cyan-400 hover:text-cyan-600 hover:bg-cyan-50/30 transition-colors w-full justify-center">
                  <IconPlus className="w-3.5 h-3.5" />
                  Add column
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget && !aiLoading) { setShowAiModal(false); setAiPreview(null); setAiError('') } }}>
          <div className="w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-violet-100 to-cyan-100 text-violet-600"><IconSparkle className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-sm font-semibold">Generate Project with AI</h2>
                  <p className="text-[11px] text-slate-500">Describe what you're building and we'll create a structured plan</p>
                </div>
              </div>
              {!aiLoading && <button type="button" onClick={() => { setShowAiModal(false); setAiPreview(null); setAiError('') }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>}
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {/* prompt input */}
              {!aiPreview && (
                <div>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe your project in a few sentences… e.g. 'A SaaS dashboard for managing restaurant reservations with table management, online booking, and customer notifications'"
                    className="w-full h-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder:text-slate-400 resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors"
                    disabled={aiLoading}
                    maxLength={1000}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generateWithAi() }}
                  />
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{aiPrompt.length}/1000</span>
                    <span>⌘+Enter to generate</span>
                  </div>

                  {/* example prompts */}
                  <div className="mt-4">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">Try an example</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'An internal tool for employee onboarding with checklists, document collection, and IT setup tracking',
                        'A mobile fitness app with workout tracking, meal plans, progress photos, and social challenges',
                        'A developer portfolio site with blog, project showcase, contact form, and analytics dashboard',
                      ].map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => setAiPrompt(ex)}
                          disabled={aiLoading}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[12px] text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 transition-colors leading-snug"
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* loading */}
              {aiLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-10 w-10 rounded-full border-2 border-slate-200 border-t-violet-500 animate-spin" />
                  <p className="mt-4 text-sm font-medium text-slate-600">Planning your project...</p>
                  <p className="mt-1 text-[12px] text-slate-400">This usually takes 2-3 seconds</p>
                </div>
              )}

              {/* error */}
              {aiError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{aiError}</div>
              )}

              {/* preview */}
              {aiPreview && !aiLoading && (
                <div>
                  <div className="mb-4">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-1">Generated Project</div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">{aiPreview.projectName}</h3>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500">{derivePrefix(aiPreview.projectName)}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-500">{aiPreview.tasks?.length ?? 0} tasks generated</p>
                  </div>

                  <div className="space-y-2">
                    {(aiPreview.tasks ?? []).map((t, idx) => {
                      const pri = PRIORITIES.find((p) => p.id === t.priority)
                      return (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                          <div className="flex items-start gap-2">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-500 mt-0.5">{derivePrefix(aiPreview.projectName)}-{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-800">{t.title}</span>
                                {pri && <span className={['inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold', pri.bg, pri.text].join(' ')}>{pri.short}</span>}
                              </div>
                              {t.description && <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">{t.description}</p>}
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                {(t.tags ?? []).map((tag) => {
                                  const c = TAG_PALETTE[tagColorIdx(tag)]
                                  return <span key={tag} className={['rounded-md px-2 py-0.5 text-[10px] font-medium', c.bg, c.text].join(' ')}>{tag}</span>
                                })}
                                {t.subtasks?.length > 0 && <span className="text-[11px] text-slate-400">{t.subtasks.length} subtask{t.subtasks.length > 1 ? 's' : ''}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              {!aiPreview ? (
                <>
                  <div className="text-[11px] text-slate-400">{AI_LIMIT - getAiCallCount()} AI calls remaining</div>
                  <button
                    type="button"
                    onClick={generateWithAi}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Generating...</> : <><IconSparkle className="w-4 h-4" />Generate</>}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { setAiPreview(null); setAiError('') }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <IconSparkle className="w-4 h-4" />Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={createAiProject}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    <IconPlus className="w-4 h-4" />Create Project
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Retro / Weekly Digest Modal */}
      {showRetro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setShowRetro(false); setRetroData(null) } }}>
          <div className="w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-violet-100 to-cyan-100 text-violet-600"><IconSparkle className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-sm font-semibold">Weekly Digest</h2>
                  <p className="text-[11px] text-slate-500">{activeProject?.name ?? 'Project'} — AI Health Report</p>
                </div>
              </div>
              <button type="button" onClick={() => { setShowRetro(false); setRetroData(null) }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
              {retroLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-violet-500 animate-spin" />
                  <p className="text-sm text-slate-500">Analyzing project health…</p>
                </div>
              ) : retroData?.error ? (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{retroData.error}</div>
              ) : retroData ? (
                <div className="space-y-5">
                  {/* health score */}
                  <div className="flex items-center gap-4">
                    <div className={['grid h-16 w-16 place-items-center rounded-2xl text-xl font-bold shrink-0', (retroData.healthScore ?? 0) >= 80 ? 'bg-emerald-50 text-emerald-600' : (retroData.healthScore ?? 0) >= 60 ? 'bg-amber-50 text-amber-600' : (retroData.healthScore ?? 0) >= 40 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'].join(' ')}>{retroData.healthScore ?? '—'}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={['text-sm font-semibold', (retroData.healthScore ?? 0) >= 80 ? 'text-emerald-700' : (retroData.healthScore ?? 0) >= 60 ? 'text-amber-700' : 'text-red-700'].join(' ')}>{retroData.healthLabel ?? 'Unknown'}</span>
                        {retroData.velocity && <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', retroData.velocity.trend === 'up' ? 'bg-emerald-100 text-emerald-700' : retroData.velocity.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'].join(' ')}>{retroData.velocity.trend === 'up' ? '↑' : retroData.velocity.trend === 'down' ? '↓' : '→'} {retroData.velocity.completedThisWeek ?? 0} done this week</span>}
                      </div>
                      <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{retroData.summary ?? ''}</p>
                    </div>
                  </div>

                  {retroData.velocity?.note && <p className="text-[12px] text-slate-500 italic bg-slate-50 rounded-lg px-4 py-2">{retroData.velocity.note}</p>}

                  {/* risks */}
                  {retroData.risks?.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Risks</div>
                      <div className="space-y-2">
                        {retroData.risks.map((r, i) => (
                          <div key={i} className={['rounded-xl border p-3', r.severity === 'high' ? 'border-red-200 bg-red-50/50' : r.severity === 'medium' ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200 bg-slate-50/50'].join(' ')}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={['rounded-md px-1.5 py-0.5 text-[10px] font-semibold', r.severity === 'high' ? 'bg-red-100 text-red-700' : r.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'].join(' ')}>{r.severity}</span>
                              <span className="text-[13px] font-medium text-slate-800">{r.title}</span>
                            </div>
                            <p className="text-[12px] text-slate-600">{r.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* wins */}
                  {retroData.wins?.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Wins</div>
                      <ul className="space-y-1">
                        {retroData.wins.map((w, i) => <li key={i} className="text-[13px] text-slate-600 flex gap-2"><span className="text-emerald-500 shrink-0">✓</span>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* recommendations */}
                  {retroData.recommendations?.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Recommendations</div>
                      <ul className="space-y-1">
                        {retroData.recommendations.map((r, i) => <li key={i} className="text-[13px] text-slate-600 flex gap-2"><span className="text-cyan-500 shrink-0">→</span>{r}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* workload summary */}
                  {retroData.workloadSummary && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Workload</div>
                      <p className="text-[13px] text-slate-600">{retroData.workloadSummary}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Standup Modal */}
      {showStandup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setShowStandup(false); setStandupData(null) } }}>
          <div className="w-full max-w-2xl mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 overflow-hidden" style={{ animation: 'fadeIn 0.15s ease-out' }}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-linear-to-br from-violet-100 to-cyan-100 text-violet-600"><IconSparkle className="w-4 h-4" /></div>
                <div>
                  <h2 className="text-sm font-semibold">Daily Standup</h2>
                  <p className="text-[11px] text-slate-500">{activeProject?.name ?? 'Project'} — Generated by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {standupData && !standupData.error && (
                  <button type="button" onClick={copyStandup} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"><IconClipboard className="w-3.5 h-3.5" />Copy for Slack</button>
                )}
                <button type="button" onClick={() => { setShowStandup(false); setStandupData(null) }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"><IconX className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {standupLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-cyan-500 animate-spin" />
                  <p className="text-sm text-slate-500">Generating standup summary…</p>
                </div>
              ) : standupData?.error ? (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{standupData.error}</div>
              ) : standupData ? (
                <div className="space-y-5">
                  {standupData.summary && <p className="text-sm text-slate-600 leading-relaxed">{standupData.summary}</p>}
                  {(standupData.members ?? []).map((m, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar name={m.name} size="sm" />
                        <span className="text-sm font-semibold text-slate-900">{m.name}</span>
                      </div>
                      <div className="space-y-2 text-[13px]">
                        {m.done?.length > 0 && (
                          <div className="flex gap-2"><span className="text-emerald-500 font-medium shrink-0 w-24">✅ Done</span><span className="text-slate-600">{m.done.join(', ')}</span></div>
                        )}
                        {m.inProgress?.length > 0 && (
                          <div className="flex gap-2"><span className="text-blue-500 font-medium shrink-0 w-24">🔄 In Progress</span><span className="text-slate-600">{m.inProgress.join(', ')}</span></div>
                        )}
                        {m.blocked?.length > 0 && (
                          <div className="flex gap-2"><span className="text-red-500 font-medium shrink-0 w-24">🚫 Blocked</span><span className="text-slate-600">{m.blocked.join(', ')}</span></div>
                        )}
                        {m.highlights && <div className="mt-1 text-[12px] text-slate-500 italic">💡 {m.highlights}</div>}
                        {!m.done?.length && !m.inProgress?.length && !m.blocked?.length && <div className="text-slate-400 text-[12px]">No assigned tasks</div>}
                      </div>
                    </div>
                  ))}
                  {standupData.teamHighlights?.length > 0 && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Team Highlights</div>
                      <ul className="space-y-1">
                        {standupData.teamHighlights.map((h, i) => <li key={i} className="text-[13px] text-slate-600 flex gap-2"><span className="text-slate-400">•</span>{h}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
