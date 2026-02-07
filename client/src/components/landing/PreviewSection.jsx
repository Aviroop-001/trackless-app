import { Link } from 'react-router-dom'
import ScrollSection from './ScrollSection'

export default function PreviewSection() {
  return (
    <section id="preview" className="relative py-32 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollSection>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">
            See it in action
          </p>
          <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            A board that thinks alongside you.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-base text-white/40">
            Kanban board on the left, AI nudges on the right. No signup needed—try it now.
          </p>
        </ScrollSection>

        <ScrollSection delay={200}>
          <div className="mt-14 rounded-2xl border border-white/10 bg-white/3 p-1.5 shadow-2xl shadow-cyan-500/5 backdrop-blur-sm overflow-hidden">
            {/* mock browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
              </div>
              <div className="flex-1 mx-8 rounded-md bg-white/6 px-3 py-1 text-[11px] text-white/30 text-center font-mono">nudge-ai.vercel.app/demo</div>
            </div>

            {/* mock app layout */}
            <div className="flex min-h-[360px]">
              {/* mock sidebar */}
              <div className="hidden sm:flex w-[160px] shrink-0 flex-col border-r border-white/8 p-3 gap-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-5 w-5 rounded bg-linear-to-br from-violet-500 to-cyan-400" />
                  <span className="text-[11px] font-semibold text-white/70">Nudge AI</span>
                </div>
                <div className="rounded-md bg-white/8 px-2.5 py-1.5 text-[10px] font-medium text-white/60">Search</div>
                <div className="rounded-md bg-white/8 px-2.5 py-1.5 text-[10px] font-medium text-white/60">Projects</div>
                <div className="ml-2 rounded-md bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-medium text-cyan-400">MVP Launch</div>
                <div className="ml-2 rounded-md px-2.5 py-1.5 text-[10px] text-white/30">Growth Exp.</div>
                <div className="rounded-md px-2.5 py-1.5 text-[10px] text-white/40">Users</div>
                <div className="rounded-md px-2.5 py-1.5 text-[10px] text-white/40">Teams</div>
                <div className="rounded-md px-2.5 py-1.5 text-[10px] text-white/40">Dashboard</div>
              </div>

              {/* mock board */}
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-white/80">MVP Launch</span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-white/40">MVP</span>
                  <div className="flex-1" />
                  <div className="rounded-md bg-white/6 border border-white/10 px-2 py-1 text-[10px] text-white/50 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                    Comments
                  </div>
                  <div className="rounded-md bg-violet-500/20 border border-violet-400/30 px-2 py-1 text-[10px] font-semibold text-violet-300 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                    Nudges
                    <span className="inline-flex items-center justify-center h-3.5 min-w-3.5 rounded-full bg-violet-500 text-[7px] font-bold text-white px-0.5">3</span>
                  </div>
                  <div className="rounded-md bg-white/6 border border-white/10 px-2 py-1 text-[10px] text-white/50 flex items-center gap-1">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
                    Options
                  </div>
                </div>
                {/* mock toolbar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-semibold text-white/70">+ New task</div>
                  <div className="rounded-md bg-white/6 border border-white/8 px-2 py-1 text-[9px] text-white/40 flex items-center gap-1">
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                    Filter
                  </div>
                  <div className="rounded-full bg-cyan-400/15 border border-cyan-400/25 px-1.5 py-0.5 text-[8px] font-medium text-cyan-300 flex items-center gap-1">P0 Urgent <span className="text-cyan-400/60">x</span></div>
                  <div className="flex-1" />
                  <div className="text-[9px] text-white/30">5 tasks</div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { col: 'Inbox', dot: 'bg-white/30', cards: [{ t: 'Set up Sentry', tag: 'infra', p: 'P1' }] },
                    { col: 'Planned', dot: 'bg-amber-400', cards: [{ t: 'Write API docs', tag: 'docs', p: 'P2' }] },
                    { col: 'In Progress', dot: 'bg-blue-400', cards: [{ t: 'Fix auth redirect', tag: 'bug', p: 'P0' }, { t: 'Ship onboarding', tag: 'launch', p: 'P1' }] },
                    { col: 'Done', dot: 'bg-emerald-400', cards: [{ t: 'Deploy staging', tag: 'infra', p: 'P2' }] },
                  ].map((c) => (
                    <div key={c.col} className="space-y-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className={['h-2 w-2 rounded-full', c.dot].join(' ')} />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{c.col}</span>
                        <span className="text-[10px] text-white/20 ml-auto">{c.cards.length}</span>
                      </div>
                      {c.cards.map((card) => (
                        <div key={card.t} className="rounded-lg border border-white/8 bg-white/4 p-2.5 hover:border-white/15 transition-colors">
                          <div className="text-[11px] font-medium text-white/70 leading-snug">{card.t}</div>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[8px] font-medium text-cyan-300">{card.tag}</span>
                            <span className={['rounded px-1 py-0.5 text-[8px] font-bold', card.p === 'P0' ? 'bg-red-400/15 text-red-300' : card.p === 'P1' ? 'bg-orange-400/15 text-orange-300' : 'bg-white/10 text-white/40'].join(' ')}>{card.p}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* mock nudges panel */}
              <div className="hidden md:flex w-[200px] shrink-0 flex-col border-l border-white/8 p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <svg className="h-3.5 w-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                  <span className="text-[11px] font-semibold text-white/60">Nudges</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-2">
                    <div className="text-[8px] font-semibold text-red-300 uppercase tracking-wider mb-1">Overdue</div>
                    <div className="text-[10px] text-white/50 leading-snug">&quot;Fix auth redirect&quot; is 2 days overdue</div>
                  </div>
                  <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-2">
                    <div className="text-[8px] font-semibold text-amber-300 uppercase tracking-wider mb-1">Stuck</div>
                    <div className="text-[10px] text-white/50 leading-snug">&quot;Write API docs&quot; — no updates in 5 days</div>
                  </div>
                  <div className="rounded-lg bg-violet-400/10 border border-violet-400/20 p-2">
                    <div className="text-[8px] font-semibold text-violet-300 uppercase tracking-wider mb-1">AI Insight</div>
                    <div className="text-[10px] text-white/50 leading-snug">Batch infra tasks into a focused sprint</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* secondary previews: AI standup + NLP task creation + weekly digest */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* AI Standup */}
          <ScrollSection delay={350}>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-white/70">AI Standup</div>
                  <div className="text-[9px] text-white/30">Generated in 1 click</div>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="rounded-lg bg-white/4 border border-white/6 p-2.5">
                  <div className="text-[9px] font-semibold text-cyan-400 mb-1">Sam</div>
                  <div className="text-[9px] text-white/40 leading-relaxed">Done: Deploy staging<br />In progress: Ship onboarding<br />Blocked: Fix auth redirect</div>
                </div>
                <div className="rounded-lg bg-white/4 border border-white/6 p-2.5">
                  <div className="text-[9px] font-semibold text-cyan-400 mb-1">Riya</div>
                  <div className="text-[9px] text-white/40 leading-relaxed">Done: —<br />In progress: Write API docs<br />Blocked: —</div>
                </div>
              </div>
              <div className="mt-3 rounded-md bg-blue-500/15 border border-blue-400/20 px-2.5 py-1.5 text-[9px] text-blue-300 text-center font-medium">Copy for Slack</div>
            </div>
          </ScrollSection>

          {/* NLP Task Creation */}
          <ScrollSection delay={450}>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-white/70">Create with AI</div>
                  <div className="text-[9px] text-white/30">Natural language input</div>
                </div>
              </div>
              <div className="rounded-lg bg-violet-500/10 border border-violet-400/20 px-3 py-2.5 mb-3">
                <div className="text-[10px] text-violet-300/70 italic">&quot;fix the auth bug, assign to Sam, urgent&quot;</div>
              </div>
              <div className="text-[9px] text-white/30 mb-2 flex items-center gap-1.5">
                <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                Task created
              </div>
              <div className="rounded-lg bg-white/4 border border-white/6 p-2.5 space-y-1.5">
                <div className="text-[10px] font-medium text-white/60">Fix auth redirect bug</div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-red-400/15 px-1 py-0.5 text-[7px] font-bold text-red-300">P0</span>
                  <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] font-medium text-cyan-300">auth</span>
                  <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] font-medium text-cyan-300">bug</span>
                  <span className="text-[8px] text-white/30 ml-auto">→ Sam</span>
                </div>
              </div>
            </div>
          </ScrollSection>

          {/* Weekly Digest */}
          <ScrollSection delay={550}>
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 h-full">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-white/70">Weekly Digest</div>
                  <div className="text-[9px] text-white/30">AI health report</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative h-14 w-14">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="66 22" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-cyan-400">75</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-emerald-400">Good</div>
                  <div className="text-[9px] text-white/35 leading-relaxed">3 done this week<br />1 overdue, 0 blocked</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 rounded-lg bg-emerald-400/8 border border-emerald-400/15 px-2.5 py-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span className="text-[9px] text-white/45 leading-snug">Team shipped 3 tasks ahead of target</span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-amber-400/8 border border-amber-400/15 px-2.5 py-1.5">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-[9px] text-white/45 leading-snug">Auth tasks stalling—consider pairing</span>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>

        <ScrollSection delay={700}>
          <div className="mt-12 text-center">
            <Link
              to="/demo"
              className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 hover:border-white/25 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            >
              <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
              Try the live demo
            </Link>
          </div>
        </ScrollSection>
      </div>
    </section>
  )
}
