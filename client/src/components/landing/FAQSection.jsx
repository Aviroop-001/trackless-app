import ScrollSection from './ScrollSection'
import { FAQ } from '../../constants/landingConstants'

export default function FAQSection() {
  return (
    <section id="faq" className="relative py-32 scroll-mt-20">
      <div className="mx-auto max-w-2xl px-6">
        <ScrollSection>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">FAQ</p>
          <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
            The short answers
          </h2>
        </ScrollSection>

        <div className="mt-16 space-y-6">
          {FAQ.map((item, i) => (
            <ScrollSection key={i} delay={i * 60}>
              <details className="group rounded-xl border border-white/8 bg-white/2 transition hover:border-white/12">
                <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-sm font-semibold text-white/90 [&::-webkit-details-marker]:hidden list-none">
                  {item.q}
                  <svg className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-white/50">
                  {item.a}
                </div>
              </details>
            </ScrollSection>
          ))}
        </div>
      </div>
    </section>
  )
}
