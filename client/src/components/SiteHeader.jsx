import { Link, useLocation } from 'react-router-dom'

function LogoMark({ className = '' }) {
  return (
    <img
      src="/favicon.png"
      alt="Nudge AI"
      className={['h-9 w-9 rounded-xl', className].join(' ')}
    />
  )
}

function ArrowRightIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 0 1 .75-.75h10.69l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5c.3.3.3.77 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H3.75A.75.75 0 0 1 3 10Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export default function SiteHeader({ productName = 'Nudge AI' }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  const href = (hash) => (isHome ? hash : `/${hash}`)

  const navLinks = [
    { href: href('#features'), label: 'Features' },
    { href: href('#how'), label: 'How it works' },
    { href: '/demo', label: 'Try it out' },
    { href: '/pricing', label: 'Pricing' },
    { href: href('#faq'), label: 'FAQ' },
  ]

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-(--bg)/55 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <LogoMark />
          <span className="text-sm font-semibold tracking-tight text-white">{productName}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {navLinks.map((l) => (
            l.href === '/pricing' || l.href === '/demo' ? (
              <Link key={l.href} to={l.href} className="text-sm font-semibold text-white/70 hover:text-white">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm font-semibold text-white/70 hover:text-white">
                {l.label}
              </a>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={href('#waitlist')}
            className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg) sm:inline-flex"
          >
            Join waitlist
          </a>
          <a
            href={href('#waitlist')}
            className={[
              'inline-flex items-center justify-center gap-2 rounded-xl',
              'btn-glass-primary px-4 py-2 text-sm font-semibold text-slate-950',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg)',
            ].join(' ')}
          >
            Get early access
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-cyan-300/30 to-transparent"
        aria-hidden="true"
      />
    </header>
  )
}

