import { Link } from 'react-router-dom'
import ScrollSection from './ScrollSection'
import { POWER_FEATURES } from '../../constants/landingConstants'

export default function AICapabilitiesSection() {
  return (
    <section id="ai" className="relative py-32 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollSection>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">
            Built-in AI
          </p>
          <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            AI that manages, not just tracks.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/40">
            Most tools bolt on AI as a chatbot. Nudge AI bakes intelligence into every layer of your workflow.
          </p>
        </ScrollSection>

        {/* row 1: primary AI features with visual mocks */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {/* Smart Nudges */}
          <ScrollSection delay={0}>
            <div className="group rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5 h-full">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br from-violet-500 to-violet-600 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Smart Nudges</h3>
              <p className="mt-1 text-[13px] text-white/45">Spots issues before they block you.</p>
              <div className="mt-4 space-y-1.5">
                <div className="rounded-lg bg-red-400/10 border border-red-400/15 px-3 py-2 flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span className="text-[10px] text-white/50">&quot;Fix auth&quot; is 2 days overdue</span>
                </div>
                <div className="rounded-lg bg-amber-400/10 border border-amber-400/15 px-3 py-2 flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-[10px] text-white/50">Sam has 5 tasks, Riya has 1</span>
                </div>
                <div className="rounded-lg bg-violet-400/10 border border-violet-400/15 px-3 py-2 flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <span className="text-[10px] text-white/50">&quot;Deploy&quot; blocked by 2 tasks</span>
                </div>
              </div>
            </div>
          </ScrollSection>

          {/* AI Project Generation */}
          <ScrollSection delay={120}>
            <div className="group rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5 h-full">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br from-cyan-500 to-cyan-600 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">AI Project Generation</h3>
              <p className="mt-1 text-[13px] text-white/45">Describe it. Get a full project.</p>
              <div className="mt-4 rounded-lg bg-cyan-500/10 border border-cyan-400/20 px-3 py-2 mb-2">
                <div className="text-[10px] text-cyan-300/70 italic">&quot;Build an employee onboarding tool&quot;</div>
              </div>
              <div className="space-y-1">
                {['Set up auth flow', 'Design welcome screen', 'Build progress tracker', 'Add team directory'].map((t) => (
                  <div key={t} className="flex items-center gap-2 rounded bg-white/4 px-2.5 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <span className="text-[9px] text-white/45">{t}</span>
                    <span className="text-[7px] text-white/20 ml-auto">P2</span>
                  </div>
                ))}
                <div className="text-[9px] text-white/25 text-center mt-1">+ 4 more tasks</div>
              </div>
            </div>
          </ScrollSection>

          {/* Natural Language Tasks */}
          <ScrollSection delay={240}>
            <div className="group rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5 h-full">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Natural Language Tasks</h3>
              <p className="mt-1 text-[13px] text-white/45">Type a sentence. Get a task.</p>
              <div className="mt-4 rounded-lg bg-violet-500/10 border border-violet-400/20 px-3 py-2 mb-2">
                <div className="text-[10px] text-violet-300/70 italic">&quot;fix login timeout, assign Riya, P0&quot;</div>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 mb-2">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                Created instantly
              </div>
              <div className="rounded-lg bg-white/4 border border-white/6 p-2.5">
                <div className="text-[10px] font-medium text-white/60">Fix login timeout</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="rounded bg-red-400/15 px-1 py-0.5 text-[7px] font-bold text-red-300">P0</span>
                  <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] text-cyan-300">auth</span>
                  <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] text-cyan-300">bug</span>
                  <span className="text-[8px] text-white/30 ml-auto">Riya</span>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>

        {/* row 2: more AI + smart features with visual mocks */}
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {/* AI Standup */}
          <ScrollSection delay={400}>
            <div className="group rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5 h-full">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">AI Standup Generator</h3>
              <p className="mt-1 text-[13px] text-white/45">One click. Slack-ready summary.</p>
              <div className="mt-4 space-y-1.5">
                <div className="rounded-lg bg-white/4 border border-white/6 p-2">
                  <div className="text-[9px] font-semibold text-cyan-400 mb-0.5">Sam</div>
                  <div className="text-[9px] text-white/40">Done: Deploy staging</div>
                  <div className="text-[9px] text-white/40">Doing: Ship onboarding</div>
                </div>
                <div className="rounded-lg bg-white/4 border border-white/6 p-2">
                  <div className="text-[9px] font-semibold text-cyan-400 mb-0.5">Riya</div>
                  <div className="text-[9px] text-white/40">Doing: Write API docs</div>
                  <div className="text-[9px] text-white/40">Blocked: Auth fix</div>
                </div>
              </div>
              <div className="mt-2 rounded-md bg-blue-500/15 border border-blue-400/20 px-2.5 py-1.5 text-[9px] text-blue-300 text-center font-medium">Copy for Slack</div>
            </div>
          </ScrollSection>

          {/* Weekly Digest */}
          <ScrollSection delay={520}>
            <div className="group rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5 h-full">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Weekly Digest</h3>
              <p className="mt-1 text-[13px] text-white/45">Health score. Risks. Wins. Actions.</p>
              <div className="mt-4 flex items-center gap-3 mb-3">
                <div className="relative h-14 w-14 shrink-0">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="66 22" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-cyan-400">75</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-emerald-400">Good</div>
                  <div className="text-[9px] text-white/35 leading-relaxed">3 shipped this week<br />1 at risk</div>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-400/8 border border-emerald-400/15 px-2.5 py-1.5 text-[9px] text-white/45 flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                Team ahead of sprint target
              </div>
            </div>
          </ScrollSection>

          {/* Duplicate Detection */}
          <ScrollSection delay={640}>
            <div className="group rounded-2xl border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5 h-full">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br from-rose-500 to-rose-600 text-white shadow-lg">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Duplicate Detection</h3>
              <p className="mt-1 text-[13px] text-white/45">Flags similar tasks as you type.</p>
              <div className="mt-4 rounded-lg bg-white/4 border border-white/6 p-2.5 mb-2">
                <div className="text-[9px] text-white/30 mb-1">Title</div>
                <div className="text-[10px] text-white/60">Fix authentication redirect</div>
              </div>
              <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-3 py-2 flex items-center gap-2">
                <span className="text-[10px]">&#9888;&#65039;</span>
                <div>
                  <div className="text-[9px] text-amber-300 font-medium">Possible duplicate</div>
                  <div className="text-[9px] text-white/40">&quot;Fix auth redirect bug&quot; — <span className="text-amber-300/70">87% match</span></div>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>

        {/* row 3: power features strip */}
        <ScrollSection delay={800}>
          <div className="mt-12 rounded-2xl border border-white/8 bg-white/3 p-6">
            <h3 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/40 mb-6">Also built in</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {POWER_FEATURES.map((f) => (
                <div key={f.label} className="rounded-lg bg-white/4 border border-white/6 px-4 py-3 text-center">
                  <div className="text-[13px] font-semibold text-white/70">{f.label}</div>
                  <div className="text-[11px] text-white/35 mt-0.5">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollSection>

        <ScrollSection delay={400}>
          <div className="mt-16 text-center">
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-white/25 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
            >
              Try all AI features in the demo
              <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </Link>
          </div>
        </ScrollSection>
      </div>
    </section>
  )
}
