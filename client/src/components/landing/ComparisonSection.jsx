import ScrollSection from './ScrollSection'
import { PRODUCT, COMPARE } from '../../constants/landingConstants'

export default function ComparisonSection() {
  return (
    <section id="features" className="relative py-32 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-6">
        <ScrollSection>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">
            The difference
          </p>
          <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Traditional trackers turn tracking into work.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/40">
            Less ceremony. Less configuration. A UI that disappears—so your team ships.
          </p>
        </ScrollSection>

        <div className="mt-16 space-y-0">
          {/* Header row */}
          <ScrollSection delay={80}>
            <div className="grid grid-cols-[100px_1fr_1fr] gap-4 border-b border-white/10 pb-4 mb-2">
              <div />
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400/70">Traditional</div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/70">{PRODUCT}</div>
            </div>
          </ScrollSection>

          {COMPARE.map((row, i) => (
            <ScrollSection key={row.area} delay={120 + i * 80}>
              <div className="grid grid-cols-[100px_1fr_1fr] gap-4 py-5 border-b border-white/5 hover:bg-white/2 transition-colors rounded-lg px-2 -mx-2">
                <div className="text-sm font-bold text-white/80">{row.area}</div>
                <div className="text-sm text-red-300/60 leading-relaxed">{row.old}</div>
                <div className="text-sm text-cyan-300/90 leading-relaxed">{row.neu}</div>
              </div>
            </ScrollSection>
          ))}
        </div>
      </div>
    </section>
  )
}
