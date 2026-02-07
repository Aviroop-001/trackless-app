import { Link } from 'react-router-dom'
import ScrollSection from './ScrollSection'
import HeroDemo from './HeroDemo'

export default function HeroSection() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6">

          {/* ── left: text + CTAs ── */}
          <div className="lg:w-[44%] shrink-0 relative z-10">
            <ScrollSection>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-medium text-cyan-300/80">AI-powered project tracker</span>
              </div>
            </ScrollSection>

            <ScrollSection delay={120}>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl xl:text-6xl leading-[1.08]">
                Don&apos;t just track.
                <br />
                <span className="bg-linear-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Get nudged.</span>
              </h1>
            </ScrollSection>

            <ScrollSection delay={250}>
              <p className="mt-5 max-w-[380px] text-[15px] leading-relaxed text-white/50">
                Your team spends more time updating JIRA than building. Nudge AI replaces that with smart nudges, auto-generated plans, and zero busywork.
              </p>
            </ScrollSection>

            <ScrollSection delay={380}>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#waitlist"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.25)] transition hover:bg-cyan-300 hover:shadow-[0_0_60px_rgba(34,211,238,0.4)]"
                >
                  Join the waitlist
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </a>
                <Link
                  to="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white hover:border-white/25"
                >
                  Try the demo
                </Link>
              </div>
            </ScrollSection>

            {/* mini social proof */}
            <ScrollSection delay={500}>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500'].map((c, i) => (
                    <div key={i} className={`h-7 w-7 rounded-full ${c} ring-2 ring-[#070a12] flex items-center justify-center text-[9px] font-bold text-white`}>
                      {['A', 'S', 'R', 'M'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[11px] font-medium text-white/60">Waitlist growing</div>
                  <div className="text-[10px] text-white/30">Join builders shipping faster</div>
                </div>
              </div>
            </ScrollSection>
          </div>

          {/* ── right: animated demo with depth ── */}
          <div className="lg:w-[56%] mt-10 lg:mt-0 relative">
            {/* ambient glow */}
            <div className="absolute -inset-8 z-0 pointer-events-none" aria-hidden="true">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[450px] rounded-full bg-cyan-500/8 blur-[100px]" />
              <div className="absolute top-1/4 right-1/4 h-[200px] w-[250px] rounded-full bg-violet-500/6 blur-[80px]" />
            </div>

            <ScrollSection delay={500}>
              <div
                className="relative z-10"
                style={{
                  transform: 'perspective(1200px) rotateY(-4deg) rotateX(2deg)',
                }}
              >
                <HeroDemo />
              </div>
            </ScrollSection>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10" aria-hidden="true">
        <div className="flex flex-col items-center gap-1.5 text-white/25">
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em]">Scroll</span>
          <div className="h-6 w-px bg-linear-to-b from-white/25 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  )
}
