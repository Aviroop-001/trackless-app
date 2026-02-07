import ScrollSection from './ScrollSection'

const STEPS = [
  {
    num: '01', title: 'Capture', tagline: 'Describe it. AI does the rest.', accent: 'from-cyan-400 to-cyan-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <div className="rounded-lg bg-violet-500/10 border border-violet-400/20 px-3 py-2">
          <div className="text-[10px] text-violet-300/70 italic">&quot;fix login bug, assign Sam, urgent&quot;</div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
          Task created with P0, tags, assignee
        </div>
      </div>
    ),
  },
  {
    num: '02', title: 'Organize', tagline: 'Filters, views, columns—your way.', accent: 'from-blue-400 to-blue-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="rounded-md bg-white/10 px-1.5 py-0.5 text-[8px] text-white/50 flex items-center gap-1">
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
            Filter
          </div>
          <div className="rounded-full bg-cyan-400/15 border border-cyan-400/20 px-1.5 py-0.5 text-[7px] text-cyan-300">P0 Urgent <span className="opacity-50">x</span></div>
          <div className="rounded-full bg-cyan-400/15 border border-cyan-400/20 px-1.5 py-0.5 text-[7px] text-cyan-300">Sam <span className="opacity-50">x</span></div>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded bg-white/4 p-1.5 text-center"><div className="text-[7px] font-semibold text-white/30 uppercase">Inbox</div><div className="mt-1 h-3 w-full rounded bg-white/6" /></div>
          <div className="rounded bg-blue-400/8 p-1.5 text-center"><div className="text-[7px] font-semibold text-blue-300/50 uppercase">Doing</div><div className="mt-1 h-3 w-full rounded bg-blue-400/15" /><div className="mt-1 h-3 w-full rounded bg-blue-400/15" /></div>
          <div className="rounded bg-emerald-400/8 p-1.5 text-center"><div className="text-[7px] font-semibold text-emerald-300/50 uppercase">Done</div><div className="mt-1 h-3 w-full rounded bg-emerald-400/15" /></div>
        </div>
      </div>
    ),
  },
  {
    num: '03', title: 'Ship', tagline: 'AI standups. Focus mode. Ship fast.', accent: 'from-emerald-400 to-emerald-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <div className="rounded-lg bg-white/4 border border-white/6 p-2">
          <div className="text-[8px] font-semibold text-cyan-400 mb-0.5">Daily Standup</div>
          <div className="text-[9px] text-white/40">Sam: shipped onboarding, fixing auth</div>
          <div className="text-[9px] text-white/40">Riya: writing API docs</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-emerald-500/15 border border-emerald-400/20 px-2 py-1 text-[8px] text-emerald-300 font-medium">Focus: 3 tasks</div>
          <div className="rounded-md bg-blue-500/15 border border-blue-400/20 px-2 py-1 text-[8px] text-blue-300 font-medium">Copy for Slack</div>
        </div>
      </div>
    ),
  },
  {
    num: '04', title: 'Nudge', tagline: 'AI spots issues before you do.', accent: 'from-violet-400 to-violet-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 space-y-1.5">
        <div className="rounded-lg bg-red-400/10 border border-red-400/15 px-2.5 py-1.5 flex items-start gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
          <span className="text-[9px] text-white/45">&quot;Fix auth&quot; is 2 days overdue</span>
        </div>
        <div className="rounded-lg bg-amber-400/10 border border-amber-400/15 px-2.5 py-1.5 flex items-start gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          <span className="text-[9px] text-white/45">Sam has 5 tasks, Riya has 1</span>
        </div>
        <div className="rounded-lg bg-violet-400/10 border border-violet-400/15 px-2.5 py-1.5 flex items-start gap-2">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
          <span className="text-[9px] text-white/45">Batch infra tasks into a sprint</span>
        </div>
      </div>
    ),
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how" className="relative py-32 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-6">
        <ScrollSection>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">
            How it works
          </p>
          <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Four steps. Zero friction.
          </h2>
        </ScrollSection>

        <div className="mt-20 grid gap-8 md:grid-cols-2">
          {STEPS.map((step, i) => (
            <ScrollSection key={step.num} delay={i * 100}>
              <div className="group">
                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-linear-to-br ${step.accent} text-white text-sm font-bold shadow-lg`}>
                  {step.num}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-white">{step.title}</h3>
                <p className="mt-1 text-sm text-white/50">{step.tagline}</p>
                {step.mock}
              </div>
            </ScrollSection>
          ))}
        </div>
      </div>
    </section>
  )
}
