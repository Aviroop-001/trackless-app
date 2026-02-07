import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader.jsx'

export default function PricingPage() {
  return (
    <div className="theme-dark relative bg-(--bg) min-h-screen flex flex-col">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-linear-to-b from-white/10 to-transparent"
        aria-hidden="true"
      />

      <SiteHeader productName="Nudge AI" />

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-lg text-center">
          {/* construction icon */}
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-white/[0.05] ring-1 ring-white/10">
            <svg className="h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.192-.14 1.743" />
            </svg>
          </div>

          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Pricing coming soon
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/50">
            We're still finalizing our plans. Join the waitlist to get early access and help shape our pricing — early users will get a special deal.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/#waitlist"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.3)] transition hover:bg-cyan-300 hover:shadow-[0_0_60px_rgba(34,211,238,0.45)]"
            >
              Join the waitlist
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </a>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white hover:border-white/25"
            >
              Try the demo
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
