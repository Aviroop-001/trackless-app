import ScrollSection from './ScrollSection'

const STEPS = [
  {
    num: '01', title: 'Capture', tagline: 'One input. Zero friction.', accent: 'from-cyan-400 to-cyan-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <div className="rounded-lg border border-white/10 bg-white/4 px-3 py-2 flex items-center gap-2">
          <span className="text-[9px] text-white/25">+</span>
          <span className="text-[10px] text-white/60">Set up error tracking</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/4 px-3 py-2 flex items-center gap-2">
          <span className="text-[9px] text-white/25">+</span>
          <span className="text-[10px] text-white/60">Write onboarding copy</span>
        </div>
        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 flex items-center gap-2">
          <span className="text-[9px] text-cyan-400">+</span>
          <span className="text-[10px] text-cyan-300/70 animate-pulse">|</span>
        </div>
        <div className="text-[9px] text-white/25 text-center">Type → Enter → Done. No forms.</div>
      </div>
    ),
  },
  {
    num: '02', title: 'Organize', tagline: 'Drag, filter, customize.', accent: 'from-blue-400 to-blue-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="rounded-full bg-cyan-400/15 border border-cyan-400/20 px-1.5 py-0.5 text-[7px] text-cyan-300">Priority: P0 <span className="opacity-50">x</span></div>
          <div className="rounded-full bg-cyan-400/15 border border-cyan-400/20 px-1.5 py-0.5 text-[7px] text-cyan-300">Assignee: Sam <span className="opacity-50">x</span></div>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {['Inbox', 'Planned', 'Doing', 'Done'].map((col, i) => (
            <div key={col} className="rounded bg-white/4 p-1.5 text-center">
              <div className="text-[6px] font-semibold text-white/25 uppercase">{col}</div>
              {Array.from({ length: [1, 1, 2, 1][i] }).map((_, j) => (
                <div key={j} className={['mt-1 h-2.5 w-full rounded', i === 2 ? 'bg-blue-400/15' : i === 3 ? 'bg-emerald-400/15' : 'bg-white/6'].join(' ')} />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: '03', title: 'Ship', tagline: 'Focus on what matters today.', accent: 'from-emerald-400 to-emerald-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="rounded-md bg-emerald-500/15 border border-emerald-400/20 px-2 py-0.5 text-[8px] text-emerald-300 font-medium">Focus Mode</div>
          <span className="text-[8px] text-white/25">3 tasks for today</span>
        </div>
        {['Fix login redirect', 'Ship user settings', 'Review PR #42'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 rounded bg-white/4 px-2.5 py-1.5">
            <div className={['h-3.5 w-3.5 rounded border-2', i === 0 ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/15'].join(' ')} />
            <span className={['text-[9px]', i === 0 ? 'text-white/30 line-through' : 'text-white/55'].join(' ')}>{t}</span>
            <span className={['text-[7px] ml-auto', i === 1 ? 'text-red-300' : 'text-white/20'].join(' ')}>{['P2', 'P0', 'P1'][i]}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: '04', title: 'Iterate', tagline: 'AI shows you the bigger picture.', accent: 'from-violet-400 to-violet-600',
    mock: (
      <div className="mt-4 rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="66 22" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-cyan-400">75</div>
          </div>
          <div>
            <div className="text-[9px] font-semibold text-emerald-400">Project Health: Good</div>
            <div className="text-[8px] text-white/30">4 shipped · 1 at risk · 0 blocked</div>
          </div>
        </div>
        <div className="rounded bg-emerald-400/8 border border-emerald-400/15 px-2 py-1.5 text-[8px] text-white/40 flex items-start gap-1.5">
          <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
          Team velocity up 20% this week
        </div>
        <div className="rounded bg-amber-400/8 border border-amber-400/15 px-2 py-1.5 text-[8px] text-white/40 flex items-start gap-1.5">
          <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
          Consider pairing on auth tasks
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
