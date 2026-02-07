import { useEffect, useState } from 'react'
import { SECTIONS } from '../../constants/landingConstants'

export default function FloatingNav() {
  const [active, setActive] = useState('top')

  useEffect(() => {
    const els = SECTIONS.map(s => document.getElementById(s.id)).filter(Boolean)
    if (!els.length) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )

    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <nav className="fixed right-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-end gap-3">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className="group flex items-center gap-2.5"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          {/* label — hidden by default, slides in on hover */}
          <span
            className={[
              'rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide transition-all duration-200',
              'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0',
              active === s.id
                ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/25'
                : 'bg-white/8 text-white/50 border border-white/10',
            ].join(' ')}
          >
            {s.label}
          </span>

          {/* dot */}
          <span
            className={[
              'block rounded-full transition-all duration-300',
              active === s.id
                ? 'h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                : 'h-1.5 w-1.5 bg-white/25 group-hover:bg-white/50',
            ].join(' ')}
          />
        </a>
      ))}
    </nav>
  )
}
