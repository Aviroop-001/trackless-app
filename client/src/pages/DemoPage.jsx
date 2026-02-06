import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

/* ───────────────────────── constants ───────────────────────── */

const STORAGE_KEY = 'trackless_demo_v4'

const STATUSES = [
  { id: 'inbox', label: 'Inbox', dot: 'bg-slate-400' },
  { id: 'planned', label: 'Planned', dot: 'bg-amber-400' },
  { id: 'doing', label: 'In Progress', dot: 'bg-blue-500' },
  { id: 'done', label: 'Done', dot: 'bg-emerald-500' },
]

const PRIORITIES = [
  { id: 'p0', label: 'Urgent', short: 'P0', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  { id: 'p1', label: 'High', short: 'P1', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  { id: 'p2', label: 'Medium', short: 'P2', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  { id: 'p3', label: 'Low', short: 'P3', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
]

const NAV = { projects: 'projects', users: 'users', board: 'board' }
const BOARD_VIEWS = { kanban: 'kanban', list: 'list' }

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

function taskKey(prefix, number) { return `${prefix}-${number}` }

/** Render comment text with highlighted @mentions */
function renderMentionText(text, userNames) {
  const parts = []
  let remaining = text
  let key = 0
  while (remaining) {
    const atIdx = remaining.indexOf('@')
    if (atIdx === -1) { parts.push(remaining); break }
    if (atIdx > 0) parts.push(remaining.slice(0, atIdx))
    remaining = remaining.slice(atIdx)
    let matched = false
    for (const name of userNames) {
      if (remaining.slice(1).startsWith(name)) {
        parts.push(<span key={key++} className="inline-block bg-cyan-100 text-cyan-700 rounded px-1 font-medium text-[12px]">@{name}</span>)
        remaining = remaining.slice(1 + name.length)
        matched = true
        break
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
    { id: uid(), name: 'MVP Launch', prefix: 'MVP', taskCounter: 6, comments: [
      { id: uid(), authorId: users[0]?.id, text: 'Kicked off the MVP sprint. Let\'s aim for launch by end of month. @Sam Chen can you own the infra tickets?', createdAt: now - 1000 * 60 * 60 * 24 },
    ], createdAt: now - 1000 * 60 * 60 * 48 },
    { id: uid(), name: 'Growth Experiments', prefix: 'GROWTH', taskCounter: 3, comments: [], createdAt: now - 1000 * 60 * 60 * 24 },
  ]
}

function seedUsers() {
  const now = Date.now()
  return ['Avi Banerjee', 'Sam Chen', 'Riya Patel'].map((n, i) => ({
    id: uid(), name: n, initials: initials(n), createdAt: now - i * 1000,
  }))
}

function seedTasks(p1, p2, users) {
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
    { id: uid(), projectId: p1, number: 3, title: 'Write API docs for public endpoints', description: '', tags: ['docs'], status: 'planned', priority: 'p2', dueDate: in7days, subtasks: [{ id: uid(), title: 'Document /auth endpoints', done: false }, { id: uid(), title: 'Document /tasks CRUD', done: false }], comments: [], assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 60 * 2 },
    { id: uid(), projectId: p1, number: 4, title: 'Set up error monitoring (Sentry)', description: '', tags: ['infra'], status: 'inbox', priority: 'p1', dueDate: in3days, subtasks: [], comments: [], assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 25 },
    { id: uid(), projectId: p1, number: 5, title: 'Nudge AI: auto-tag + detect duplicates', description: 'Research feasibility of using embeddings to detect duplicate tasks and suggest tags based on title + description content.', tags: ['ai', 'v2'], status: 'inbox', priority: 'p3', dueDate: null, subtasks: [], comments: [], assigneeId: null, order: 1, createdAt: now - 1000 * 60 * 8 },
    { id: uid(), projectId: p2, number: 1, title: 'A/B test pricing page copy', description: '', tags: ['experiment'], status: 'doing', priority: 'p2', dueDate: in3days, subtasks: [{ id: uid(), title: 'Set up Vercel split test', done: true }, { id: uid(), title: 'Monitor for 7 days', done: false }], comments: [], assigneeId: users[2]?.id ?? null, order: 0, createdAt: now - 1000 * 60 * 60 },
    { id: uid(), projectId: p2, number: 2, title: 'Set up referral program', description: '', tags: ['growth'], status: 'planned', priority: 'p2', dueDate: null, subtasks: [], comments: [], assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 30 },
  ]
}

function normalizeOrders(tasks, pid) {
  const out = tasks.map((t) => ({ ...t }))
  for (const s of STATUSES) {
    const g = out.filter((t) => t.projectId === pid && t.status === s.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    g.forEach((t, i) => { t.order = i })
  }
  return out
}

function getInitialState() {
  const s = typeof window !== 'undefined' ? loadState() : null
  if (s?.projects && s?.users && s?.tasks) return { projects: s.projects, users: s.users, tasks: s.tasks, activeProjectId: s.activeProjectId ?? null, view: s.view ?? NAV.projects }
  const users = seedUsers()
  const projects = seedProjects(users)
  return { projects, users, tasks: seedTasks(projects[0].id, projects[1].id, users), activeProjectId: null, view: NAV.projects }
}

/* ───────────────────────── SVG icons ───────────────────────── */

function IconFolder({ className = 'w-5 h-5' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.06-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg> }
function IconUsers({ className = 'w-5 h-5' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> }
function IconPlus({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> }
function IconArrowLeft({ className = 'w-4 h-4' }) { return <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg> }
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

function CommentInput({ users, onSubmit }) {
  const [text, setText] = useState('')
  const [mentionQ, setMentionQ] = useState(null)
  const [mentionIdx, setMentionIdx] = useState(0)
  const ref = useRef(null)

  const filteredUsers = mentionQ !== null
    ? users.filter((u) => u.name.toLowerCase().includes(mentionQ.toLowerCase())).slice(0, 5)
    : []

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

  const insertMention = (user) => {
    const cur = ref.current?.selectionStart ?? text.length
    const before = text.slice(0, cur)
    const atIdx = before.lastIndexOf('@')
    const after = text.slice(cur)
    const next = text.slice(0, atIdx) + `@${user.name} ` + after
    setText(next)
    setMentionQ(null)
    setTimeout(() => {
      const pos = atIdx + user.name.length + 2
      ref.current?.setSelectionRange(pos, pos)
      ref.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (mentionQ !== null && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIdx((i) => Math.min(i + 1, filteredUsers.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setMentionIdx((i) => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filteredUsers[mentionIdx]) }
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
      {mentionQ !== null && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-10">
          {filteredUsers.map((u, i) => (
            <button key={u.id} type="button" onClick={() => insertMention(u)} className={['flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors', i === mentionIdx ? 'bg-cyan-50 text-cyan-700' : 'text-slate-700 hover:bg-slate-50'].join(' ')}>
              <Avatar name={u.name} size="sm" /><span>{u.name}</span>
            </button>
          ))}
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

function CommentList({ comments, users, onDelete }) {
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
              <p className="mt-0.5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{renderMentionText(c.text, userNames)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ───────────────────────── command palette ─────────────────── */

function CommandPalette({ tasks, projects, users, onClose, onSelectTask, onNavigate }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { const fn = (e) => { if (e.key === 'Escape') onClose() }; window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn) }, [onClose])

  const results = useMemo(() => {
    const lower = q.trim().toLowerCase()
    if (!lower) return { tasks: [], projects: [], users: [] }
    return {
      tasks: tasks.filter((t) => {
        const proj = projects.find((p) => p.id === t.projectId)
        const key = proj ? taskKey(proj.prefix, t.number).toLowerCase() : ''
        return t.title.toLowerCase().includes(lower) || key.includes(lower)
      }).slice(0, 6),
      projects: projects.filter((p) => p.name.toLowerCase().includes(lower) || p.prefix.toLowerCase().includes(lower)).slice(0, 3),
      users: users.filter((u) => u.name.toLowerCase().includes(lower)).slice(0, 3),
    }
  }, [q, tasks, projects, users])

  const hasResults = results.tasks.length + results.projects.length + results.users.length > 0

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
                        <span className={['h-2 w-2 rounded-full shrink-0', STATUSES.find((s) => s.id === t.status)?.dot].join(' ')} />
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

function TaskDetailPanel({ task, project, users, onClose, onUpdate, onDelete, onAddComment, onDeleteComment, buildTaskUrl }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [descDraft, setDescDraft] = useState(task.description ?? '')
  const [editingDesc, setEditingDesc] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newSubtask, setNewSubtask] = useState('')
  const titleRef = useRef(null)
  const descRef = useRef(null)

  const statusInfo = STATUSES.find((s) => s.id === task.status)
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
                {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
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
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
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

          {/* Comments */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Comments {(task.comments ?? []).length > 0 && <span className="text-slate-500 normal-case">({(task.comments ?? []).length})</span>}
            </label>
            <div className="mt-3">
              <CommentList comments={task.comments ?? []} users={users} onDelete={(cid) => onDeleteComment(task.id, cid)} />
            </div>
            <div className="mt-3">
              <CommentInput users={users} onSubmit={(text) => onAddComment(task.id, text)} />
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

function TaskCard({ task, project, users, onAssign, onDragStart, onDragEnd, registerEl, onSelect, isNew }) {
  const assignee = users.find((u) => u.id === task.assigneeId) || null
  const statusInfo = STATUSES.find((s) => s.id === task.status)
  const overdue = isOverdue(task.dueDate) && task.status !== 'done'
  const commentCount = (task.comments ?? []).length

  return (
    <div ref={(el) => registerEl?.(task.id, el)} data-task-id={task.id} draggable onDragStart={(e) => onDragStart?.(e, task.id)} onDragEnd={onDragEnd} onClick={() => onSelect?.(task.id)}
      className={['group cursor-grab rounded-lg border bg-white p-3 shadow-sm transition-all duration-150 hover:shadow-md active:cursor-grabbing active:shadow-lg', overdue ? 'border-red-200 hover:border-red-300' : 'border-slate-200 hover:border-slate-300', isNew ? 'animate-[slideUp_250ms_ease-out]' : ''].join(' ')}>
      <div className="flex items-start gap-2.5">
        {statusInfo && <span className={['mt-1.5 h-2 w-2 shrink-0 rounded-full', statusInfo.dot].join(' ')} />}
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
            ) : (
              <select value="" onChange={(e) => { e.stopPropagation(); onAssign(task.id, e.target.value || null) }} onClick={(e) => e.stopPropagation()} className="h-6 rounded border border-dashed border-slate-200 bg-transparent px-1 text-[10px] text-slate-400 hover:border-slate-300 focus:outline-none" aria-label="Assign user">
                <option value="">+ Assign</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            <SubtaskProgress subtasks={task.subtasks} />
            {task.dueDate && <span className={['inline-flex items-center gap-1 text-[11px]', overdue ? 'text-red-600 font-semibold' : 'text-slate-400'].join(' ')}><IconCalendar className="w-3 h-3" />{formatDate(task.dueDate)}</span>}
            {commentCount > 0 && <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><IconChat className="w-3 h-3" />{commentCount}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── kanban column ────────────────────── */

function Column({ title, dot, count, children, status, isDropActive, onDropTask, onDragOverColumn }) {
  return (
    <div className="w-[280px] shrink-0 flex flex-col" onDragOver={(e) => onDragOverColumn?.(e, status)} onDrop={(e) => onDropTask?.(e, status)}>
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <span className={['h-2.5 w-2.5 rounded-full', dot].join(' ')} />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
      </div>
      <div className={['flex-1 space-y-2 rounded-xl p-2 min-h-[120px] transition-colors duration-150', isDropActive ? 'bg-cyan-50/70 ring-2 ring-cyan-200/70' : 'bg-slate-50/60'].join(' ')} data-column-list={status}>
        {children}
        {count === 0 && <div className="flex h-24 flex-col items-center justify-center gap-1 text-slate-400"><div className="h-8 w-8 rounded-lg border-2 border-dashed border-slate-200 grid place-items-center"><IconPlus className="w-3.5 h-3.5 text-slate-300" /></div><span className="text-[11px]">Drop here</span></div>}
      </div>
    </div>
  )
}

/* ───────────────────────── list view ─────────────────────────── */

function ListView({ tasks, projects, users, onSelect }) {
  return (
    <div className="divide-y divide-slate-100">
      <div className="grid grid-cols-[70px_1fr_80px_80px_100px_90px_70px] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span>ID</span><span>Task</span><span>Priority</span><span>Status</span><span>Assignee</span><span>Due</span><span>Subtasks</span>
      </div>
      {tasks.length === 0 && <div className="py-12 text-center text-sm text-slate-400">No tasks match your filters</div>}
      {tasks.map((t) => {
        const assignee = users.find((u) => u.id === t.assigneeId)
        const status = STATUSES.find((s) => s.id === t.status)
        const proj = projects.find((p) => p.id === t.projectId)
        const overdue = isOverdue(t.dueDate) && t.status !== 'done'
        return (
          <button key={t.id} type="button" onClick={() => onSelect(t.id)} className="grid grid-cols-[70px_1fr_80px_80px_100px_90px_70px] gap-3 px-4 py-3 w-full text-left hover:bg-slate-50 transition-colors items-center">
            <div>{proj && <TaskId prefix={proj.prefix} number={t.number} />}</div>
            <div className="flex items-center gap-2 min-w-0">
              <span className={['h-2 w-2 rounded-full shrink-0', status?.dot].join(' ')} />
              <span className="text-sm text-slate-900 truncate">{t.title}</span>
            </div>
            <div>{t.priority && <PriorityBadge priority={t.priority} />}</div>
            <div className="text-[11px] text-slate-500">{status?.label}</div>
            <div className="text-[11px] text-slate-500 truncate">{assignee?.name?.split(' ')[0] ?? '—'}</div>
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

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DemoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(() => getInitialState())
  const { projects, users, tasks, activeProjectId, view } = data

  const [newProjectName, setNewProjectName] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTags, setNewTags] = useState('')
  const [query, setQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [boardView, setBoardView] = useState(BOARD_VIEWS.kanban)
  const [quickFilter, setQuickFilter] = useState(null)
  const [showCmdPalette, setShowCmdPalette] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showProjectComments, setShowProjectComments] = useState(false)
  const [editingPrefix, setEditingPrefix] = useState(false)
  const [prefixDraft, setPrefixDraft] = useState('')
  const [newTaskIds, setNewTaskIds] = useState(new Set())
  const newTaskTimerRef = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const cardElsRef = useRef(new Map())
  const prevRectsRef = useRef(new Map())
  const taskInputRef = useRef(null)
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
  useEffect(() => { if (projects.length) saveState({ projects, users, tasks, activeProjectId, view }) }, [projects, users, tasks, activeProjectId, view])

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const fn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowCmdPalette((p) => !p); return }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) { setShowShortcuts((p) => !p); return }
      if (e.key === 'n' || e.key === 'N') { if (view === NAV.board && taskInputRef.current) { e.preventDefault(); taskInputRef.current.focus() } }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [view])

  const navigate = (nextView, projectId = null) => {
    setData((prev) => ({ ...prev, view: nextView, activeProjectId: projectId ?? prev.activeProjectId }))
    setQuery(''); setTagQuery(''); setSelectedTaskId(null); setQuickFilter(null); setShowProjectComments(false)
  }

  /* ── filtered tasks ── */
  const nq = query.trim().toLowerCase()
  const nt = tagQuery.trim().toLowerCase()

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!activeProjectId || t.projectId !== activeProjectId) return false
      if (nq && !t.title.toLowerCase().includes(nq)) return false
      if (nt && !(t.tags ?? []).some((x) => x.toLowerCase().includes(nt))) return false
      if (quickFilter === 'mine' && !t.assigneeId) return false
      if (quickFilter === 'unassigned' && t.assigneeId) return false
      if (quickFilter === 'overdue' && (!isOverdue(t.dueDate) || t.status === 'done')) return false
      return true
    })
  }, [tasks, activeProjectId, nq, nt, quickFilter])

  const byStatus = useMemo(() => {
    const m = Object.fromEntries(STATUSES.map((s) => [s.id, []]))
    for (const t of filtered) m[t.status]?.push(t)
    for (const s of STATUSES) m[s.id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return m
  }, [filtered])

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
  const addProject = (e) => {
    e.preventDefault()
    const n = newProjectName.trim(); if (!n) return
    const prefix = derivePrefix(n)
    setData((p) => ({ ...p, projects: [...p.projects, { id: uid(), name: n, prefix, taskCounter: 1, comments: [], createdAt: Date.now() }] }))
    setNewProjectName('')
  }
  const addUser = (e) => { e.preventDefault(); const n = newUserName.trim(); if (!n) return; setData((p) => ({ ...p, users: [...p.users, { id: uid(), name: n, initials: initials(n), createdAt: Date.now() }] })); setNewUserName('') }
  const removeUser = (userId) => setData((p) => ({ ...p, users: p.users.filter((u) => u.id !== userId), tasks: p.tasks.map((t) => t.assigneeId === userId ? { ...t, assigneeId: null } : t) }))
  const deleteProject = (pid) => setData((p) => ({ ...p, projects: p.projects.filter((x) => x.id !== pid), tasks: p.tasks.filter((t) => t.projectId !== pid), activeProjectId: p.activeProjectId === pid ? null : p.activeProjectId, view: p.activeProjectId === pid ? NAV.projects : p.view }))
  const assignTask = (tid, aid) => setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === tid ? { ...t, assigneeId: aid } : t) }))
  const updateTask = (tid, u) => setData((p) => ({ ...p, tasks: p.tasks.map((t) => t.id === tid ? { ...t, ...u } : t) }))
  const deleteTask = (tid) => { if (tid === selectedTaskId) setSelectedTaskId(null); setData((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== tid) })) }

  const updateProject = (pid, u) => setData((p) => ({ ...p, projects: p.projects.map((x) => x.id === pid ? { ...x, ...u } : x) }))

  const commitPrefix = () => {
    const trimmed = prefixDraft.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (trimmed && activeProjectId) updateProject(activeProjectId, { prefix: trimmed })
    setEditingPrefix(false)
  }

  const submitTask = () => {
    const title = newTitle.trim(); if (!title || !activeProjectId) return
    const tags = newTags.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 6)
    const id = uid()
    setData((p) => {
      const proj = p.projects.find((x) => x.id === activeProjectId)
      const number = proj?.taskCounter ?? 1
      return {
        ...p,
        projects: p.projects.map((x) => x.id === activeProjectId ? { ...x, taskCounter: number + 1 } : x),
        tasks: normalizeOrders([{ id, projectId: activeProjectId, number, title, description: '', tags, status: 'inbox', priority: null, dueDate: null, subtasks: [], comments: [], assigneeId: null, order: -1, createdAt: Date.now() }, ...p.tasks], activeProjectId),
      }
    })
    setNewTaskIds((p) => new Set(p).add(id))
    if (newTaskTimerRef.current) clearTimeout(newTaskTimerRef.current)
    newTaskTimerRef.current = setTimeout(() => setNewTaskIds(new Set()), 400)
    setNewTitle(''); setNewTags('')
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

  /* ── drag & drop ── */
  const computeIdx = (c, y) => { const els = Array.from(c.querySelectorAll('[data-task-id]')).filter((e) => e.getAttribute('data-task-id') !== draggingId); let i = els.length; for (let j = 0; j < els.length; j++) { const r = els[j].getBoundingClientRect(); if (y < r.top + r.height / 2) { i = j; break } } return i }
  const onDragStart = (e, id) => { try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id) } catch { /* */ } setDraggingId(id) }
  const onDragEnd = () => { setDraggingId(null); setDragOverStatus(null) }
  const moveTask = (id, ns, idx = null) => setData((p) => { const c = p.tasks.find((t) => t.id === id); if (!c) return p; const pid = c.projectId; const keep = p.tasks.filter((t) => t.projectId !== pid); const scoped = p.tasks.filter((t) => t.projectId === pid && t.id !== id); const by = Object.fromEntries(STATUSES.map((s) => [s.id, []])); for (const t of scoped) by[t.status]?.push({ ...t }); for (const s of STATUSES) by[s.id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); const tgt = by[ns] ?? []; tgt.splice(typeof idx === 'number' ? clamp(idx, 0, tgt.length) : tgt.length, 0, { ...c, status: ns }); by[ns] = tgt; const rebuilt = []; for (const s of STATUSES) by[s.id].forEach((t, i) => rebuilt.push({ ...t, status: s.id, order: i })); return { ...p, tasks: [...keep, ...rebuilt] } })
  const onDragOverCol = (e, s) => { e.preventDefault(); setDragOverStatus(s) }
  const onDropTask = (e, s) => { e.preventDefault(); let id; try { id = e.dataTransfer.getData('text/plain') } catch { /* */ } const nid = id || draggingId; if (!nid) return; moveTask(nid, s, computeIdx(e.currentTarget.querySelector(`[data-column-list="${s}"]`) ?? e.currentTarget, e.clientY)); setDraggingId(null); setDragOverStatus(null) }

  const resetDemo = () => { try { localStorage.removeItem(STORAGE_KEY) } catch { /* */ } setSelectedTaskId(null); const u = seedUsers(); const p = seedProjects(u); setData({ projects: p, users: u, tasks: seedTasks(p[0].id, p[1].id, u), activeProjectId: null, view: NAV.projects }) }

  const projectStats = useMemo(() => { const m = {}; for (const p of projects) m[p.id] = { total: 0, done: 0 }; for (const t of tasks) { if (m[t.projectId]) { m[t.projectId].total++; if (t.status === 'done') m[t.projectId].done++ } } return m }, [projects, tasks])

  /* ═══ RENDER ═══ */
  return (
    <div className="theme-light flex h-screen bg-[#f8f9fb] text-slate-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-100 px-5">
          <Link to="/" className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-white"><span className="text-[11px] font-bold tracking-tight">T</span></div><span className="text-sm font-semibold tracking-tight text-slate-900">Trackless</span></Link>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Demo</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <button type="button" onClick={() => navigate(NAV.projects)} className={['flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors', view === NAV.projects ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'].join(' ')}>
            <IconFolder className="w-[18px] h-[18px]" />Projects<span className="ml-auto text-[11px] font-normal text-slate-400">{projects.length}</span>
          </button>
          {projects.length > 0 && (
            <div className="ml-4 border-l border-slate-100 pl-2 space-y-0.5">
              {projects.map((p) => (
                <button key={p.id} type="button" onClick={() => navigate(NAV.board, p.id)} className={['flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors truncate', view === NAV.board && activeProjectId === p.id ? 'bg-cyan-50 text-cyan-700 font-semibold' : 'text-slate-500 hover:bg-slate-50'].join(' ')}>
                  <IconKanban className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={() => navigate(NAV.users)} className={['flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors', view === NAV.users ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'].join(' ')}>
            <IconUsers className="w-[18px] h-[18px]" />Users<span className="ml-auto text-[11px] font-normal text-slate-400">{users.length}</span>
          </button>
        </nav>
        <div className="border-t border-slate-100 px-3 py-3 space-y-1">
          <button type="button" onClick={() => setShowCmdPalette(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 transition-colors"><IconCommand className="w-[18px] h-[18px]" />Search<kbd className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">⌘K</kbd></button>
          <button type="button" onClick={resetDemo} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 transition-colors">Reset demo</button>
          <Link to="/#waitlist" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors">Get early access</Link>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        {/* PROJECTS */}
        {view === NAV.projects && (
          <div className="mx-auto max-w-4xl px-8 py-8">
            <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">Select a project to open its board.</p>
            <form onSubmit={addProject} className="mt-6 flex items-center gap-3">
              <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="New project name…" className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30" />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"><IconPlus className="w-4 h-4" />Create</button>
            </form>
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
            <h1 className="text-xl font-semibold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-slate-500">Manage team members.</p>
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

        {/* BOARD */}
        {view === NAV.board && (
          <div className="flex h-full flex-col">
            <div className="shrink-0 border-b border-slate-200 bg-white px-8 py-4 space-y-3">
              {/* row 1: nav + title + prefix + view toggle */}
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => navigate(NAV.projects)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"><IconArrowLeft className="w-3.5 h-3.5" />Back</button>
                <h1 className="text-lg font-semibold tracking-tight truncate">{activeProject?.name ?? 'Untitled'}</h1>
                {/* editable prefix badge */}
                {activeProject && (
                  editingPrefix ? (
                    <input value={prefixDraft} onChange={(e) => setPrefixDraft(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} onBlur={commitPrefix} onKeyDown={(e) => { if (e.key === 'Enter') commitPrefix(); if (e.key === 'Escape') setEditingPrefix(false) }} className="w-20 rounded bg-cyan-50 border border-cyan-300 px-2 py-0.5 text-[11px] font-mono font-semibold text-cyan-700 focus:outline-none" autoFocus />
                  ) : (
                    <button type="button" onClick={() => { setPrefixDraft(activeProject.prefix); setEditingPrefix(true) }} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-500 hover:bg-slate-200 transition-colors" title="Click to edit prefix">{activeProject.prefix}</button>
                  )
                )}
                {activeProject && <CopyButton text={buildProjectUrl(activeProject.prefix)} label="Copy project link" />}
                <div className="flex-1" />
                {/* project comments toggle */}
                <button type="button" onClick={() => setShowProjectComments((p) => !p)} className={['inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors', showProjectComments ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'].join(' ')}>
                  <IconChat className="w-3.5 h-3.5" />
                  {(activeProject?.comments ?? []).length > 0 && <span>{(activeProject?.comments ?? []).length}</span>}
                </button>
                {/* view toggle */}
                <div className="hidden sm:flex items-center rounded-lg border border-slate-200 p-0.5">
                  <button type="button" onClick={() => setBoardView(BOARD_VIEWS.kanban)} className={['rounded-md px-2.5 py-1 text-xs font-medium transition-colors', boardView === BOARD_VIEWS.kanban ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}><IconKanban className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />Board</button>
                  <button type="button" onClick={() => setBoardView(BOARD_VIEWS.list)} className={['rounded-md px-2.5 py-1 text-xs font-medium transition-colors', boardView === BOARD_VIEWS.list ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'].join(' ')}><IconList className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />List</button>
                </div>
              </div>

              {/* project comments section */}
              {showProjectComments && activeProject && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 animate-[slideUp_150ms_ease-out]">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Project Comments</div>
                  <CommentList comments={activeProject.comments ?? []} users={users} onDelete={(cid) => deleteProjectComment(activeProject.id, cid)} />
                  <CommentInput users={users} onSubmit={(text) => addProjectComment(activeProject.id, text)} />
                </div>
              )}

              {/* row 2: add task + search */}
              <div className="flex items-center gap-6">
                <form onSubmit={(e) => { e.preventDefault(); submitTask() }} className="flex flex-1 items-center gap-2">
                  <input ref={taskInputRef} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTask() } }} placeholder="New task… (press N)" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
                  <input value={newTags} onChange={(e) => setNewTags(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTask() } }} placeholder="Tags…" className="hidden md:block w-28 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
                  <button type="submit" className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"><IconPlus className="w-3.5 h-3.5" />Add</button>
                </form>
                <div className="hidden sm:block h-6 w-px bg-slate-200" />
                <div className="hidden sm:flex items-center gap-2">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="w-32 rounded-lg border border-slate-200 bg-[#f8f9fb] pl-8 pr-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus:bg-white transition-colors" />
                    {query && <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"><IconX className="w-3 h-3" /></button>}
                  </div>
                </div>
              </div>
              {/* row 3: quick filters + stats */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {[{ key: null, label: 'All' }, { key: 'mine', label: 'Assigned' }, { key: 'unassigned', label: 'Unassigned' }, { key: 'overdue', label: 'Overdue' }].map((f) => (
                    <button key={f.key ?? 'all'} type="button" onClick={() => setQuickFilter(f.key)} className={['rounded-full px-3 py-1 text-[11px] font-medium transition-colors', quickFilter === f.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'].join(' ')}>{f.label}</button>
                  ))}
                </div>
                <div className="flex-1" />
                <BoardStats tasks={tasks} activeProjectId={activeProjectId} />
              </div>
            </div>

            {/* board body */}
            {boardView === BOARD_VIEWS.kanban ? (
              <div className="flex-1 overflow-x-auto overflow-y-auto px-8 py-6">
                <div className="flex gap-5 h-full">
                  {STATUSES.map((s) => (
                    <Column key={s.id} title={s.label} dot={s.dot} status={s.id} count={(byStatus[s.id] ?? []).length} isDropActive={dragOverStatus === s.id} onDropTask={onDropTask} onDragOverColumn={onDragOverCol}>
                      {(byStatus[s.id] ?? []).map((t) => (
                        <TaskCard key={t.id} task={t} project={activeProject} users={users} onAssign={assignTask} onDragStart={onDragStart} onDragEnd={onDragEnd} registerEl={registerEl} onSelect={setSelectedTaskId} isNew={newTaskIds.has(t.id)} />
                      ))}
                    </Column>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <ListView tasks={filtered} projects={projects} users={users} onSelect={setSelectedTaskId} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* overlays */}
      {selectedTask && (
        <TaskDetailPanel
          key={selectedTask.id}
          task={selectedTask}
          project={projects.find((p) => p.id === selectedTask.projectId)}
          users={users}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onAddComment={addTaskComment}
          onDeleteComment={deleteTaskComment}
          buildTaskUrl={buildTaskUrl}
        />
      )}
      {showCmdPalette && <CommandPalette tasks={tasks} projects={projects} users={users} onClose={() => setShowCmdPalette(false)} onSelectTask={(id, projectId) => { setData((prev) => ({ ...prev, view: NAV.board, activeProjectId: projectId })); setSelectedTaskId(id) }} onNavigate={navigate} />}
      {showShortcuts && <ShortcutHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  )
}
