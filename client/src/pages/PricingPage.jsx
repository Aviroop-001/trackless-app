import Reveal from '../components/Reveal.jsx'
import SiteHeader from '../components/SiteHeader.jsx'

function CheckIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.293a1 1 0 0 1-1.42 0L3.29 9.247a1 1 0 1 1 1.42-1.404l3.039 3.074 6.542-6.588a1 1 0 0 1 1.413-.038Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function SectionEyebrow({ children }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
      {children}
    </div>
  )
}

function PricingCard({ name, price, tagline, bullets, highlight = false }) {
  return (
    <div
      className={[
        'rounded-2xl glass p-6',
        highlight ? 'glow-accent border-cyan-300/40' : 'border-white/16',
        'transition duration-200 ease-out hover:-translate-y-0.5 hover:ring-white/15',
        'motion-reduce:transform-none motion-reduce:transition-none',
      ].join(' ')}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-base font-semibold text-white">{name}</div>
        {highlight ? (
          <div className="rounded-full bg-(--accent) px-2.5 py-1 text-xs font-semibold text-slate-950">
            Popular
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-end gap-2">
        <div className="text-3xl font-semibold tracking-tight text-white">{price}</div>
        <div className="pb-1 text-sm text-white/60">/month</div>
      </div>

      <div className="mt-2 text-sm leading-6 text-white/70">{tagline}</div>

      <ul className="mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-white/80">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-(--accent)" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <a
          href="/#waitlist"
          className={[
            'inline-flex w-full items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold',
            highlight
              ? 'bg-(--accent) text-slate-950 hover:bg-cyan-300'
              : 'bg-white/5 text-white hover:bg-white/10 ring-1 ring-white/10',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg)',
          ].join(' ')}
        >
          Join waitlist
        </a>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <div className="theme-dark relative bg-(--bg)">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-linear-to-b from-white/10 to-transparent"
        aria-hidden="true"
      />

      <SiteHeader productName="Nudge AI" />

      <main className="container-page pt-12 pb-20 sm:pt-16 sm:pb-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Pricing</SectionEyebrow>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Simple pricing. Simple product.
          </h1>
          <p className="mt-3 text-base leading-7 text-white/70">
            No add-ons, no seat math games. Just pick a plan and ship.
          </p>
          <p className="mt-4 text-xs font-semibold text-white/60">
            Placeholder while we build—join the waitlist to shape it.
          </p>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          <Reveal delay={0}>
            <PricingCard
              name="Free"
              price="$0"
              tagline="For personal tracking and tiny teams."
              bullets={['Unlimited items', 'Basic views', 'Tags']}
            />
          </Reveal>
          <Reveal delay={90}>
            <PricingCard
              name="Pro"
              price="$12"
              tagline="For people who live in their tracker."
              bullets={['Everything in Free', 'Saved filters', 'Fast search']}
              highlight
            />
          </Reveal>
          <Reveal delay={180}>
            <PricingCard
              name="Team"
              price="$24"
              tagline="For teams that want clarity without bloat."
              bullets={['Everything in Pro', 'Shared views', 'Permissions (simple)']}
            />
          </Reveal>
        </div>

        <div className="mx-auto mt-12 max-w-3xl rounded-3xl glass p-7 text-center">
          <div className="text-sm font-semibold text-white">Want early access?</div>
          <div className="mt-2 text-sm text-white/70">
            We’re shipping invites in small batches. If you want in, join the waitlist.
          </div>
          <div className="mt-6">
            <a
              href="/#waitlist"
              className={[
                'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-950',
                'btn-glass-primary',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg)',
              ].join(' ')}
            >
              Join the waitlist
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

