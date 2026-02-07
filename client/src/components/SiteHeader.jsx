import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PRODUCT } from '../constants/landingConstants'

function LogoMark({ className = '' }) {
  return (
    <div
      className={[
        'grid h-8 w-8 place-items-center rounded-lg',
        'bg-linear-to-br from-violet-500/80 to-cyan-400/80',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
        <path d="M7 7l5 5-5 5" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 7l5 5-5 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function SiteHeader({ productName = PRODUCT }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const href = (hash) => (isHome ? hash : `/${hash}`)

  const navLinks = [
    { href: href('#features'), label: 'Features' },
    { href: href('#how'), label: 'How it works' },
    { href: '/demo', label: 'Try it out' },
    { href: '/pricing', label: 'Pricing' },
    { href: href('#faq'), label: 'FAQ' },
  ]

  const NavLink = ({ link }) => {
    const cls = 'text-[13px] font-medium text-white/60 hover:text-white transition-colors duration-200'
    return link.href === '/pricing' || link.href === '/demo' ? (
      <Link to={link.href} className={cls}>{link.label}</Link>
    ) : (
      <a href={link.href} className={cls}>{link.label}</a>
    )
  }

  return (
    <>
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'py-2' : 'py-4',
        ].join(' ')}
      >
        <div
          className={[
            'mx-auto flex h-12 max-w-5xl items-center justify-between rounded-2xl px-5 transition-all duration-300',
            scrolled
              ? 'bg-white/6 border border-white/8 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
              : 'bg-transparent border border-transparent',
          ].join(' ')}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <LogoMark />
            <span className="text-sm font-semibold tracking-tight text-white">{productName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {navLinks.map((l) => (
              <NavLink key={l.href} link={l} />
            ))}
          </nav>

          {/* CTA + mobile toggle */}
          <div className="flex items-center gap-3">
            <a
              href={href('#waitlist')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-1.5 text-[13px] font-semibold text-slate-950 transition hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.35)]"
            >
              Get early access
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </a>

            {/* mobile hamburger */}
            <button
              className="md:hidden flex flex-col items-center justify-center gap-1 h-8 w-8 rounded-lg hover:bg-white/10 transition"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span className={['block h-0.5 w-4 rounded-full bg-white/70 transition-all duration-200', mobileOpen ? 'rotate-45 translate-y-1.5' : ''].join(' ')} />
              <span className={['block h-0.5 w-4 rounded-full bg-white/70 transition-all duration-200', mobileOpen ? 'opacity-0' : ''].join(' ')} />
              <span className={['block h-0.5 w-4 rounded-full bg-white/70 transition-all duration-200', mobileOpen ? '-rotate-45 -translate-y-1.5' : ''].join(' ')} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden mx-auto mt-2 max-w-5xl rounded-2xl bg-white/6 border border-white/8 backdrop-blur-xl p-4 space-y-1 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
            {navLinks.map((l) => (
              l.href === '/pricing' || l.href === '/demo' ? (
                <Link
                  key={l.href}
                  to={l.href}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </a>
              )
            ))}
            <a
              href={href('#waitlist')}
              className="block rounded-lg bg-cyan-400/15 border border-cyan-400/25 px-4 py-2.5 text-sm font-semibold text-cyan-300 text-center mt-2 hover:bg-cyan-400/25 transition"
              onClick={() => setMobileOpen(false)}
            >
              Get early access
            </a>
          </div>
        )}
      </header>
    </>
  )
}
