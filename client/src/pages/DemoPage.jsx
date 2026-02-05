import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

/* ───────────────────────── constants ───────────────────────── */

const STORAGE_KEY = 'trackless_demo_v2'

const STATUSES = [
  { id: 'inbox', label: 'Inbox', dot: 'bg-slate-400', ring: 'ring-slate-300' },
  { id: 'planned', label: 'Planned', dot: 'bg-amber-400', ring: 'ring-amber-300' },
  { id: 'doing', label: 'In Progress', dot: 'bg-blue-500', ring: 'ring-blue-300' },
  { id: 'done', label: 'Done', dot: 'bg-emerald-500', ring: 'ring-emerald-300' },
]

const NAV = { projects: 'projects', users: 'users', board: 'board' }

/* ───────────────────────── helpers ──────────────────────────── */

function uid() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`
  }
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? '?'
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return `${first}${last}`.toUpperCase()
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/* ───────────────────────── persistence ──────────────────────── */

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

/* ───────────────────────── seed data ───────────────────────── */

function seedProjects() {
  const now = Date.now()
  return [
    { id: uid(), name: 'Website Redesign', createdAt: now - 1000 * 60 * 60 * 48 },
    { id: uid(), name: 'Mobile App', createdAt: now - 1000 * 60 * 60 * 24 },
  ]
}

function seedUsers() {
  const now = Date.now()
  return ['Avi Banerjee', 'Sam Chen', 'Riya Patel'].map((n, i) => ({
    id: uid(),
    name: n,
    initials: initials(n),
    createdAt: now - i * 1000,
  }))
}

function seedTasks(p1, p2) {
  const now = Date.now()
  return [
    { id: uid(), projectId: p1, title: 'Fix login redirect loop on refresh', tags: ['auth', 'bug'], status: 'doing', assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 60 * 3 },
    { id: uid(), projectId: p1, title: 'Add "Try it out" CTA to landing', tags: ['marketing'], status: 'done', assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 60 * 10 },
    { id: uid(), projectId: p1, title: 'Draft onboarding checklist', tags: ['docs'], status: 'planned', assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 60 * 2 },
    { id: uid(), projectId: p1, title: 'Investigate search performance', tags: ['perf'], status: 'inbox', assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 25 },
    { id: uid(), projectId: p1, title: 'Nudge: suggest tags + detect duplicates', tags: ['ai', 'coming-soon'], status: 'inbox', assigneeId: null, order: 1, createdAt: now - 1000 * 60 * 8 },
    { id: uid(), projectId: p2, title: 'Set up React Native scaffold', tags: ['setup'], status: 'doing', assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 60 },
    { id: uid(), projectId: p2, title: 'Design bottom tab navigation', tags: ['design'], status: 'planned', assigneeId: null, order: 0, createdAt: now - 1000 * 60 * 30 },
  ]
}

function normalizeOrdersForProject(tasks, projectId) {
  const out = (Array.isArray(tasks) ? tasks : []).map((t) => ({ ...t }))
  for (const s of STATUSES) {
    const group = out
      .filter((t) => t?.projectId === projectId && t?.status === s.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    for (let i = 0; i < group.length; i++) group[i].order = i
  }
  return out
}

function getInitialState() {
  const saved = typeof window !== 'undefined' ? loadState() : null

  if (saved?.projects && saved?.users && saved?.tasks) {
    return {
      projects: Array.isArray(saved.projects) ? saved.projects : [],
      users: Array.isArray(saved.users) ? saved.users : [],
      tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
      activeProjectId: saved.activeProjectId ?? null,
      view: saved.view ?? NAV.projects,
    }
  }

  try {
    const v1 = localStorage.getItem('trackless_demo_v1')
    if (v1) {
      const old = JSON.parse(v1)
      if (old?.projects && old?.tasks) {
        return {
          projects: old.projects,
          users: old.users ?? seedUsers(),
          tasks: old.tasks,
          activeProjectId: old.activeProjectId ?? old.projects?.[0]?.id ?? null,
          view: NAV.projects,
        }
      }
    }
  } catch {
    /* ignore */
  }

  const projects = seedProjects()
  const users = seedUsers()
  const allTasks = seedTasks(projects[0].id, projects[1].id)
  return {
    projects,
    users,
    tasks: allTasks,
    activeProjectId: null,
    view: NAV.projects,
  }
}

/* ───────────────────────── SVG icons ───────────────────────── */

function IconFolder({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.06-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  )
}

function IconUsers({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function IconPlus({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function IconArrowLeft({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  )
}

function IconSearch({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function IconKanban({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function IconX({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}

function IconTrash({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

function IconClock({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

/* ───────────────────────── shared components ───────────────── */

function Avatar({ name, size = 'sm' }) {
  const init = initials(name)
  const sizes = {
    sm: 'h-7 w-7 text-[11px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  }
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded-full font-semibold',
        'bg-linear-to-br from-cyan-50 to-slate-100 text-slate-600 ring-1 ring-slate-200/80',
        sizes[size] ?? sizes.sm,
      ].join(' ')}
    >
      {init}
    </span>
  )
}

function Pill({ children, color = 'slate', onRemove }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    cyan: 'bg-cyan-50 text-cyan-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
  }
  return (
    <span className={['inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium', colors[color] ?? colors.slate].join(' ')}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-sm p-0.5 hover:bg-black/5 transition-colors"
          aria-label={`Remove ${children}`}
        >
          <IconX className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  )
}

/* ───────────────────────── task detail panel ─────────────────── */

function TaskDetailPanel({ task, users, onClose, onUpdate, onDelete }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [newTag, setNewTag] = useState('')
  const titleRef = useRef(null)
  const panelRef = useRef(null)

  const statusInfo = STATUSES.find((s) => s.id === task.status)
  const assignee = users.find((u) => u.id === task.assigneeId) || null

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle && titleRef.current) titleRef.current.focus()
  }, [editingTitle])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const commitTitle = () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== task.title) onUpdate(task.id, { title: trimmed })
    setEditingTitle(false)
  }

  const addTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (!tag) return
    if (!(task.tags ?? []).includes(tag)) {
      onUpdate(task.id, { tags: [...(task.tags ?? []), tag].slice(0, 8) })
    }
    setNewTag('')
  }

  const removeTag = (tag) => {
    onUpdate(task.id, { tags: (task.tags ?? []).filter((t) => t !== tag) })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[slideInRight_200ms_ease-out]"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            {statusInfo && <span className={['h-2.5 w-2.5 rounded-full', statusInfo.dot].join(' ')} />}
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{statusInfo?.label}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Title */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Title</label>
            {editingTitle ? (
              <input
                ref={titleRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') { setTitleDraft(task.title); setEditingTitle(false) }
                }}
                className="mt-1 w-full rounded-lg border border-cyan-300 bg-cyan-50/30 px-3 py-2 text-sm font-medium text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setTitleDraft(task.title); setEditingTitle(true) }}
                className="mt-1 w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-50 hover:border-slate-200 transition-colors cursor-text"
              >
                {task.title}
              </button>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdate(task.id, { status: s.id })}
                  className={[
                    'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    task.status === s.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
                  ].join(' ')}
                >
                  <span className={['h-2 w-2 rounded-full', task.status === s.id ? 'bg-white' : s.dot].join(' ')} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Assignee</label>
            {assignee ? (
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                <Avatar name={assignee.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-900">{assignee.name}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate(task.id, { assigneeId: null })}
                  className="rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <select
                value=""
                onChange={(e) => { if (e.target.value) onUpdate(task.id, { assigneeId: e.target.value }) }}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400"
              >
                <option value="">Select a team member…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tags</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(task.tags ?? []).map((tag) => (
                <Pill key={tag} onRemove={() => removeTag(tag)}>{tag}</Pill>
              ))}
              {(task.tags ?? []).length === 0 && !newTag && (
                <span className="text-xs text-slate-400 py-1">No tags yet</span>
              )}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); addTag() }}
              className="mt-2 flex items-center gap-2"
            >
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag…"
                className="flex-1 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400 focus:bg-white transition-colors"
              />
              <button
                type="submit"
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Add
              </button>
            </form>
          </div>

          {/* Metadata */}
          <div className="rounded-lg bg-slate-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <IconClock className="w-3.5 h-3.5" />
              Created {timeAgo(task.createdAt)}
            </div>
          </div>
        </div>

        {/* Panel footer */}
        <div className="border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={() => {
              onDelete(task.id)
              onClose()
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <IconTrash className="w-4 h-4" />
            Delete task
          </button>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── task card ────────────────────────── */

function TaskCard({ task, users, onAssign, onDragStart, onDragEnd, registerEl, onSelect, isNew }) {
  const assignee = users.find((u) => u.id === task.assigneeId) || null
  const statusInfo = STATUSES.find((s) => s.id === task.status)

  return (
    <div
      ref={(el) => registerEl?.(task.id, el)}
      data-task-id={task.id}
      draggable
      onDragStart={(e) => onDragStart?.(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect?.(task.id)}
      className={[
        'group cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-150',
        'hover:shadow-md hover:border-slate-300 active:cursor-grabbing active:shadow-lg',
        isNew ? 'animate-[slideUp_250ms_ease-out]' : '',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        {statusInfo && <span className={['mt-1.5 h-2 w-2 shrink-0 rounded-full', statusInfo.dot].join(' ')} />}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-slate-900 leading-snug">{task.title}</div>
          {task.tags?.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {task.tags.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2">
            {assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar name={assignee.name} size="sm" />
                <span className="text-[11px] text-slate-500">{assignee.name.split(' ')[0]}</span>
              </div>
            ) : (
              <select
                value=""
                onChange={(e) => { e.stopPropagation(); onAssign(task.id, e.target.value || null) }}
                onClick={(e) => e.stopPropagation()}
                className="h-7 rounded-md border border-dashed border-slate-200 bg-transparent px-1.5 text-[11px] text-slate-400 hover:border-slate-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40"
                aria-label="Assign user"
              >
                <option value="">+ Assign</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            )}
            {assignee && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onAssign(task.id, null) }}
                className="text-[10px] text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                clear
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── kanban column ────────────────────── */

function Column({ title, dot, count, children, status, isDropActive, onDropTask, onDragOverColumn }) {
  return (
    <div
      className="w-[280px] shrink-0 flex flex-col"
      onDragOver={(e) => onDragOverColumn?.(e, status)}
      onDrop={(e) => onDropTask?.(e, status)}
    >
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <span className={['h-2.5 w-2.5 rounded-full', dot].join(' ')} />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
      </div>
      <div
        className={[
          'flex-1 space-y-2 rounded-xl p-2 min-h-[120px] transition-colors duration-150',
          isDropActive ? 'bg-cyan-50/70 ring-2 ring-cyan-200/70' : 'bg-slate-50/60',
        ].join(' ')}
        data-column-list={status}
      >
        {children}
        {count === 0 && (
          <div className="flex h-24 flex-col items-center justify-center gap-1 text-slate-400">
            <div className="h-8 w-8 rounded-lg border-2 border-dashed border-slate-200 grid place-items-center">
              <IconPlus className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <span className="text-[11px]">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function DemoPage() {
  const [data, setData] = useState(() => getInitialState())
  const { projects, users, tasks, activeProjectId, view } = data

  /* ── form state ── */
  const [newProjectName, setNewProjectName] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newTags, setNewTags] = useState('')
  const [query, setQuery] = useState('')
  const [tagQuery, setTagQuery] = useState('')

  /* ── detail panel ── */
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null

  /* ── track new tasks for animation ── */
  const [newTaskIds, setNewTaskIds] = useState(new Set())
  const newTaskTimerRef = useRef(null)

  /* ── drag state ── */
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)

  /* ── FLIP refs ── */
  const cardElsRef = useRef(new Map())
  const prevRectsRef = useRef(new Map())
  const registerEl = (id, el) => {
    if (!id) return
    if (el) cardElsRef.current.set(id, el)
    else cardElsRef.current.delete(id)
  }

  /* ── persist ── */
  useEffect(() => {
    if (!projects.length) return
    saveState({ projects, users, tasks, activeProjectId, view })
  }, [projects, users, tasks, activeProjectId, view])

  /* ── navigate ── */
  const navigate = (nextView, projectId = null) => {
    setData((prev) => ({ ...prev, view: nextView, activeProjectId: projectId ?? prev.activeProjectId }))
    setQuery('')
    setTagQuery('')
    setSelectedTaskId(null)
  }

  /* ── filtered tasks (board) ── */
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedTag = tagQuery.trim().toLowerCase()

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (!activeProjectId || t.projectId !== activeProjectId) return false
      if (normalizedQuery && !t.title.toLowerCase().includes(normalizedQuery)) return false
      if (normalizedTag) {
        const tags = (t.tags ?? []).map((x) => String(x).toLowerCase())
        if (!tags.some((x) => x.includes(normalizedTag))) return false
      }
      return true
    })
  }, [tasks, activeProjectId, normalizedQuery, normalizedTag])

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s.id, []]))
    for (const t of filtered) map[t.status]?.push(t)
    for (const s of STATUSES) map[s.id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return map
  }, [filtered])

  /* ── FLIP animations ── */
  useLayoutEffect(() => {
    const nextRects = new Map()
    for (const [id, el] of cardElsRef.current.entries()) {
      if (el) nextRects.set(id, el.getBoundingClientRect())
    }
    const prevRects = prevRectsRef.current
    prevRectsRef.current = nextRects
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (mq?.matches) return
    for (const [id, next] of nextRects.entries()) {
      const prev = prevRects.get(id)
      if (!prev) continue
      const el = cardElsRef.current.get(id)
      if (!el) continue
      const dx = prev.left - next.left
      const dy = prev.top - next.top
      if (!dx && !dy) continue
      if (typeof el.animate === 'function') {
        el.animate(
          [{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'translate(0,0)' }],
          { duration: 200, easing: 'cubic-bezier(.2,.8,.2,1)' },
        )
      }
    }
  }, [tasks])

  /* ── actions ── */
  const addProject = (e) => {
    e.preventDefault()
    const name = newProjectName.trim()
    if (!name) return
    const p = { id: uid(), name, createdAt: Date.now() }
    setData((prev) => ({ ...prev, projects: [...(prev.projects ?? []), p] }))
    setNewProjectName('')
  }

  const addUser = (e) => {
    e.preventDefault()
    const name = newUserName.trim()
    if (!name) return
    const u = { id: uid(), name, initials: initials(name), createdAt: Date.now() }
    setData((prev) => ({ ...prev, users: [...(prev.users ?? []), u] }))
    setNewUserName('')
  }

  const removeUser = (userId) => {
    setData((prev) => ({
      ...prev,
      users: (prev.users ?? []).filter((u) => u.id !== userId),
      tasks: (prev.tasks ?? []).map((t) => (t.assigneeId === userId ? { ...t, assigneeId: null } : t)),
    }))
  }

  const submitTask = () => {
    const title = newTitle.trim()
    if (!title || !activeProjectId) return
    const tags = newTags.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 6)
    const taskId = uid()
    setData((prev) => ({
      ...prev,
      tasks: normalizeOrdersForProject(
        [{ id: taskId, projectId: activeProjectId, title, tags, status: 'inbox', assigneeId: null, order: -1, createdAt: Date.now() }, ...(prev.tasks ?? [])],
        activeProjectId,
      ),
    }))
    // Track new task for animation
    setNewTaskIds((prev) => new Set(prev).add(taskId))
    if (newTaskTimerRef.current) clearTimeout(newTaskTimerRef.current)
    newTaskTimerRef.current = setTimeout(() => setNewTaskIds(new Set()), 400)
    setNewTitle('')
    setNewTags('')
  }

  const assignTask = (taskId, assigneeId) => {
    setData((prev) => ({
      ...prev,
      tasks: (prev.tasks ?? []).map((t) => (t.id === taskId ? { ...t, assigneeId } : t)),
    }))
  }

  const updateTask = (taskId, updates) => {
    setData((prev) => ({
      ...prev,
      tasks: (prev.tasks ?? []).map((t) => {
        if (t.id !== taskId) return t
        const next = { ...t, ...updates }
        return next
      }),
    }))
  }

  const deleteTask = (taskId) => {
    setData((prev) => ({
      ...prev,
      tasks: (prev.tasks ?? []).filter((t) => t.id !== taskId),
    }))
  }

  const deleteProject = (pid) => {
    setData((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).filter((p) => p.id !== pid),
      tasks: (prev.tasks ?? []).filter((t) => t.projectId !== pid),
      activeProjectId: prev.activeProjectId === pid ? null : prev.activeProjectId,
      view: prev.activeProjectId === pid ? NAV.projects : prev.view,
    }))
  }

  /* ── drag & drop ── */
  const computeInsertIndex = (container, y) => {
    const els = Array.from(container.querySelectorAll('[data-task-id]')).filter(
      (el) => el.getAttribute('data-task-id') !== draggingId,
    )
    let idx = els.length
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect()
      if (y < r.top + r.height / 2) { idx = i; break }
    }
    return idx
  }

  const onDragStart = (e, id) => {
    try {
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', id)
    } catch { /* ignore */ }
    setDraggingId(id)
  }

  const onDragEnd = () => {
    setDraggingId(null)
    setDragOverStatus(null)
  }

  const moveTask = (id, nextStatus, insertIndex = null) => {
    setData((prev) => {
      const prevTasks = prev.tasks ?? []
      const current = prevTasks.find((t) => t.id === id)
      if (!current) return prev
      const pid = current.projectId
      const keep = prevTasks.filter((t) => t.projectId !== pid)
      const scoped = prevTasks.filter((t) => t.projectId === pid && t.id !== id)
      const by = Object.fromEntries(STATUSES.map((s) => [s.id, []]))
      for (const t of scoped) by[t.status]?.push({ ...t })
      for (const s of STATUSES) by[s.id].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const target = by[nextStatus] ?? []
      const idx = typeof insertIndex === 'number' ? clamp(insertIndex, 0, target.length) : target.length
      target.splice(idx, 0, { ...current, status: nextStatus })
      by[nextStatus] = target
      const rebuilt = []
      for (const s of STATUSES) {
        const list = by[s.id] ?? []
        for (let i = 0; i < list.length; i++) rebuilt.push({ ...list[i], status: s.id, order: i })
      }
      return { ...prev, tasks: [...keep, ...rebuilt] }
    })
  }

  const onDragOverColumn = (e, status) => {
    e.preventDefault()
    setDragOverStatus(status)
  }

  const onDropTask = (e, status) => {
    e.preventDefault()
    let id = null
    try { id = e.dataTransfer.getData('text/plain') } catch { /* ignore */ }
    const nextId = id || draggingId
    if (!nextId) return
    const list = e.currentTarget.querySelector(`[data-column-list="${status}"]`) ?? e.currentTarget
    moveTask(nextId, status, computeInsertIndex(list, e.clientY))
    setDraggingId(null)
    setDragOverStatus(null)
  }

  const resetDemo = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    try { localStorage.removeItem('trackless_demo_v1') } catch { /* ignore */ }
    setSelectedTaskId(null)
    setData(() => {
      const projects = seedProjects()
      const users = seedUsers()
      return { projects, users, tasks: seedTasks(projects[0].id, projects[1].id), activeProjectId: null, view: NAV.projects }
    })
  }

  /* ── derived data for projects view ── */
  const projectStats = useMemo(() => {
    const map = {}
    for (const p of projects) map[p.id] = { total: 0, done: 0 }
    for (const t of tasks) {
      if (map[t.projectId]) {
        map[t.projectId].total++
        if (t.status === 'done') map[t.projectId].done++
      }
    }
    return map
  }, [projects, tasks])

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  return (
    <div className="theme-light flex h-screen bg-[#f8f9fb] text-slate-900 overflow-hidden">

      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="flex w-[240px] shrink-0 flex-col border-r border-slate-200 bg-white">
        {/* logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-slate-100 px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-slate-900 text-white">
              <span className="text-[11px] font-bold tracking-tight">T</span>
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Trackless</span>
          </Link>
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Demo
          </span>
        </div>

        {/* nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {/* Projects nav item */}
          <button
            type="button"
            onClick={() => navigate(NAV.projects)}
            className={[
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              view === NAV.projects
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            ].join(' ')}
          >
            <IconFolder className="w-[18px] h-[18px]" />
            Projects
            <span className="ml-auto text-[11px] font-normal text-slate-400">{projects.length}</span>
          </button>

          {/* Project list in sidebar */}
          {projects.length > 0 && (
            <div className="ml-4 border-l border-slate-100 pl-2 space-y-0.5">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(NAV.board, p.id)}
                  className={[
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] transition-colors truncate',
                    view === NAV.board && activeProjectId === p.id
                      ? 'bg-cyan-50 text-cyan-700 font-semibold'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                  ].join(' ')}
                >
                  <IconKanban className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Users nav item */}
          <button
            type="button"
            onClick={() => navigate(NAV.users)}
            className={[
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              view === NAV.users
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            ].join(' ')}
          >
            <IconUsers className="w-[18px] h-[18px]" />
            Users
            <span className="ml-auto text-[11px] font-normal text-slate-400">{users.length}</span>
          </button>
        </nav>

        {/* bottom actions */}
        <div className="border-t border-slate-100 px-3 py-3 space-y-1">
          <button
            type="button"
            onClick={resetDemo}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          >
            Reset demo
          </button>
          <Link
            to="/#waitlist"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-cyan-600 hover:bg-cyan-50 transition-colors"
          >
            Get early access
          </Link>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 overflow-y-auto">

        {/* ═════════════ PROJECTS VIEW ═════════════ */}
        {view === NAV.projects && (
          <div className="mx-auto max-w-4xl px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Projects</h1>
                <p className="mt-1 text-sm text-slate-500">Select a project to open its board.</p>
              </div>
            </div>

            {/* new project */}
            <form onSubmit={addProject} className="mt-6 flex items-center gap-3">
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="New project name…"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 transition-colors"
              >
                <IconPlus className="w-4 h-4" />
                Create
              </button>
            </form>

            {/* project list */}
            <div className="mt-6 space-y-2">
              {projects.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center">
                  <IconFolder className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">No projects yet. Create one above.</p>
                </div>
              )}
              {projects.map((p) => {
                const stats = projectStats[p.id] ?? { total: 0, done: 0 }
                const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0
                return (
                  <div key={p.id} className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all">
                    <button
                      type="button"
                      onClick={() => navigate(NAV.board, p.id)}
                      className="flex flex-1 items-center gap-4 min-w-0 text-left cursor-pointer focus:outline-none"
                      aria-label={`Open ${p.name}`}
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-linear-to-br from-cyan-50 to-slate-100 text-slate-600 ring-1 ring-slate-200/60">
                        <IconKanban className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                        <div className="mt-0.5 text-[12px] text-slate-500">
                          {stats.total} task{stats.total !== 1 ? 's' : ''} &middot; {pct}% done &middot; Created {timeAgo(p.createdAt)}
                        </div>
                      </div>
                      {/* progress bar */}
                      <div className="hidden sm:flex items-center gap-3 w-32">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(p.id)}
                      className="shrink-0 rounded-md px-2 py-1 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═════════════ USERS VIEW ═════════════ */}
        {view === NAV.users && (
          <div className="mx-auto max-w-3xl px-8 py-8">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">Users</h1>
              <p className="mt-1 text-sm text-slate-500">Manage team members. Assign them to tasks on project boards.</p>
            </div>

            <form onSubmit={addUser} className="mt-6 flex items-center gap-3">
              <input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Full name…"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 transition-colors"
              >
                <IconPlus className="w-4 h-4" />
                Add user
              </button>
            </form>

            <div className="mt-6 space-y-2">
              {users.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center">
                  <IconUsers className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm text-slate-500">No users yet. Add someone above.</p>
                </div>
              )}
              {users.map((u) => {
                const assigned = tasks.filter((t) => t.assigneeId === u.id).length
                return (
                  <div
                    key={u.id}
                    className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <Avatar name={u.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                      <div className="text-[12px] text-slate-500">
                        {assigned} task{assigned !== 1 ? 's' : ''} assigned &middot; Added {timeAgo(u.createdAt)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="rounded-md px-2 py-1 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ═════════════ BOARD VIEW ═════════════ */}
        {view === NAV.board && (
          <div className="flex h-full flex-col">
            {/* board header */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-8 py-4">
              {/* top row: nav + title + task count */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => navigate(NAV.projects)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <IconArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-semibold tracking-tight text-slate-900 truncate">
                    {activeProject?.name ?? 'Untitled'}
                  </h1>
                </div>
                <span className="hidden sm:inline rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                  {filtered.length} task{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* bottom row: add task (left) + search/filter (right) */}
              <div className="mt-3 flex items-center gap-6">
                {/* add task */}
                <form
                  onSubmit={(e) => { e.preventDefault(); submitTask() }}
                  className="flex flex-1 items-center gap-2"
                >
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTask() } }}
                    placeholder="New task…"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400 focus:bg-white transition-colors"
                  />
                  <input
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitTask() } }}
                    placeholder="Tags…"
                    className="hidden md:block w-32 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                  >
                    <IconPlus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </form>

                {/* divider */}
                <div className="hidden sm:block h-6 w-px bg-slate-200" />

                {/* search + filter */}
                <div className="hidden sm:flex items-center gap-2">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search…"
                      className="w-36 rounded-lg border border-slate-200 bg-[#f8f9fb] pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400 focus:bg-white transition-colors"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                      >
                        <IconX className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      value={tagQuery}
                      onChange={(e) => setTagQuery(e.target.value)}
                      placeholder="Filter tag…"
                      className="hidden lg:block w-28 rounded-lg border border-slate-200 bg-[#f8f9fb] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/30 focus-visible:border-cyan-400 focus:bg-white transition-colors"
                    />
                    {tagQuery && (
                      <button
                        type="button"
                        onClick={() => setTagQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
                      >
                        <IconX className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* kanban columns */}
            <div className="flex-1 overflow-x-auto overflow-y-auto px-8 py-6">
              <div className="flex gap-5 h-full">
                {STATUSES.map((s) => (
                  <Column
                    key={s.id}
                    title={s.label}
                    dot={s.dot}
                    status={s.id}
                    count={(byStatus[s.id] ?? []).length}
                    isDropActive={dragOverStatus === s.id}
                    onDropTask={onDropTask}
                    onDragOverColumn={onDragOverColumn}
                  >
                    {(byStatus[s.id] ?? []).map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        users={users}
                        onAssign={assignTask}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        registerEl={registerEl}
                        onSelect={setSelectedTaskId}
                        isNew={newTaskIds.has(t.id)}
                      />
                    ))}
                  </Column>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── TASK DETAIL PANEL ─── */}
      {selectedTask && (
        <TaskDetailPanel
          key={selectedTask.id}
          task={selectedTask}
          users={users}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  )
}
