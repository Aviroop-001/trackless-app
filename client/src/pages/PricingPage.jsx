import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'
import HeroCanvas from '../components/landing/HeroCanvas.jsx'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Try the core PM tool. No credit card.',
    accent: 'border-white/10',
    cta: 'Start free',
    ctaStyle: 'border border-white/15 bg-white/5 text-white hover:bg-white/10',
    limits: '2 users · 2 projects',
    features: [
      { text: '2 users', included: true },
      { text: '2 projects', included: true },
      { text: 'Kanban + List views', included: true },
      { text: 'Task dependencies', included: true },
      { text: 'Custom columns', included: true },
      { text: 'Dark mode', included: true },
      { text: 'AI features', included: false },
      { text: 'Analytics & digests', included: false },
      { text: 'Timeline & heatmap', included: false },
    ],
  },
  {
    name: 'Starter',
    price: '$12',
    period: '/month flat',
    desc: 'AI-powered tracking for small teams.',
    accent: 'border-cyan-400/30 ring-1 ring-cyan-400/10',
    badge: 'Most popular',
    cta: 'Join the waitlist',
    ctaStyle: 'bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.2)]',
    limits: '5 users · 10 projects · 200 AI credits/mo',
    features: [
      { text: '5 users', included: true },
      { text: '10 projects', included: true },
      { text: '200 AI credits/month', included: true, highlight: true },
      { text: 'AI nudges & NLP tasks', included: true },
      { text: 'AI standup generator', included: true },
      { text: 'AI project generation', included: true },
      { text: 'Smart duplicate detection', included: true },
      { text: 'All views (timeline, heatmap, focus)', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Weekly digest & health score', included: false },
      { text: 'AI retrospective', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month flat',
    desc: 'Full AI + analytics for teams that ship fast.',
    accent: 'border-violet-400/30 ring-1 ring-violet-400/10',
    cta: 'Join the waitlist',
    ctaStyle: 'bg-linear-to-r from-violet-500 to-cyan-400 text-white font-bold hover:opacity-90 shadow-[0_0_30px_rgba(139,92,246,0.2)]',
    limits: '15 users · Unlimited projects · 1,000 AI credits/mo',
    features: [
      { text: '15 users', included: true },
      { text: 'Unlimited projects', included: true },
      { text: '1,000 AI credits/month', included: true, highlight: true },
      { text: 'Everything in Starter', included: true },
      { text: 'Weekly digest & health score', included: true },
      { text: 'AI retrospective', included: true },
      { text: 'Workload heatmap analytics', included: true },
      { text: 'Saved views & custom filters', included: true },
      { text: 'Team management', included: true },
      { text: 'Bulk operations', included: true },
      { text: 'Priority support', included: true },
    ],
  },
]


export default function PricingPage() {
  return (
    <div className="theme-dark relative min-h-screen flex flex-col">
      {/* animated background — same as landing page */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <HeroCanvas />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <SiteHeader productName="Nudge AI" />

        <main className="flex-1 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            {/* header */}
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80">Pricing</p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Flat pricing. No per-seat tax.
              </h1>
              <p className="mx-auto mt-4 max-w-lg text-base text-white/40">
                Pay for AI credits, not headcount. One price for your whole team.
                <br />
                <span className="text-cyan-400/70 text-sm font-medium">Early waitlist members get 3 months of Starter free.</span>
              </p>
            </div>

            {/* pricing cards */}
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={[
                    'relative rounded-2xl border bg-white/3 backdrop-blur-sm p-6 flex flex-col transition hover:bg-white/5',
                    plan.accent,
                  ].join(' ')}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-3 py-0.5 text-[10px] font-bold text-slate-950 uppercase tracking-wider">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="mt-1 text-sm text-white/40">{plan.desc}</p>
                  </div>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-white/30">{plan.period}</span>
                  </div>

                  <div className="mt-2 text-[11px] text-white/25 font-medium">{plan.limits}</div>

                  <a
                    href={plan.name === 'Free' ? '/demo' : '/#waitlist'}
                    className={[
                      'mt-5 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition',
                      plan.ctaStyle,
                    ].join(' ')}
                  >
                    {plan.cta}
                  </a>

                  <div className="mt-5 border-t border-white/8 pt-5 flex-1">
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f.text} className={['flex items-start gap-2.5 text-sm', f.included ? 'text-white/60' : 'text-white/20'].join(' ')}>
                          {f.included ? (
                            <svg className={['h-4 w-4 shrink-0 mt-0.5', f.highlight ? 'text-cyan-400' : 'text-cyan-400/50'].join(' ')} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 shrink-0 text-white/15 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className={f.highlight ? 'font-semibold text-cyan-300/80' : ''}>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* enterprise */}
            <div className="mt-10 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-sm p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/5 px-3 py-1 mb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="text-[10px] font-semibold text-violet-300/80 uppercase tracking-wider">Enterprise</span>
                </div>
                <h3 className="text-xl font-bold text-white">Need more? Let&apos;s talk.</h3>
                <p className="mt-2 text-sm text-white/40 max-w-md">
                  Unlimited users, unlimited projects, custom AI credit pools, SSO, advanced permissions, dedicated support, and SLAs — tailored to your org.
                </p>
                <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
                  {[
                    'Unlimited users',
                    'Custom AI credit pool',
                    'SSO / SAML',
                    'Advanced permissions',
                    'Dedicated account manager',
                    'Custom integrations',
                    'SLA & uptime guarantee',
                    'On-prem / private cloud',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/50">
                      <svg className="h-3.5 w-3.5 shrink-0 text-violet-400/70" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div className="text-3xl font-bold text-white">Custom</div>
                <div className="text-[11px] text-white/25">Annual billing</div>
                <a
                  href="mailto:aviroopbanerjee001@gmail.com?subject=Nudge%20AI%20Enterprise%20Inquiry"
                  className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 to-cyan-400 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(139,92,246,0.2)] transition hover:opacity-90"
                >
                  Contact sales
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                </a>
                <span className="text-[10px] text-white/20">Usually responds within 24h</span>
              </div>
            </div>

            {/* vs per-seat strip */}
            <div className="mt-10 rounded-2xl border border-white/6 bg-white/2 backdrop-blur-sm px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
                <div>
                  <div className="text-[11px] text-white/25 uppercase tracking-wider font-semibold">JIRA (10 users)</div>
                  <div className="text-lg font-bold text-white/40 line-through">$77.50<span className="text-sm text-white/20">/mo</span></div>
                </div>
                <div>
                  <div className="text-[11px] text-white/25 uppercase tracking-wider font-semibold">Linear (10 users)</div>
                  <div className="text-lg font-bold text-white/40 line-through">$80<span className="text-sm text-white/20">/mo</span></div>
                </div>
                <div className="h-8 w-px bg-white/10 hidden sm:block" />
                <div>
                  <div className="text-[11px] text-cyan-400/70 uppercase tracking-wider font-semibold">Nudge AI (10 users)</div>
                  <div className="text-lg font-bold text-cyan-400">$12<span className="text-sm text-cyan-400/60">/mo flat</span></div>
                </div>
              </div>
            </div>

            {/* bottom CTA */}
            <div className="mt-12 text-center">
              <p className="text-sm text-white/30">
                Not sure yet?{' '}
                <Link to="/demo" className="text-cyan-400 hover:text-cyan-300 font-medium transition">
                  Try the full demo
                </Link>
                {' '}— every feature works, no signup needed.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
