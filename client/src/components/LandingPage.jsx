import { useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from './SiteHeader.jsx'
import WaitlistForm from './WaitlistForm.jsx'

const PRODUCT = 'Trackless'

/* ═══════════════════════════════════════════════════════════════
   SCROLL-DRIVEN SECTION — fades + translates in on scroll
   ═══════════════════════════════════════════════════════════════ */

function useScrollReveal() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (mq?.matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          io.unobserve(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}

function ScrollSection({ children, className = '', delay = 0 }) {
  const ref = useScrollReveal()
  return (
    <div
      ref={ref}
      className={['scroll-section', className].join(' ')}
      style={{ '--delay': `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HERO CANVAS — animated orbs, grid, particles
   ═══════════════════════════════════════════════════════════════ */

function HeroCanvas() {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    return { ctx, w, h }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (mq?.matches) return

    let t = 0

    // Orbs
    const orbs = [
      { x: 0.2, y: 0.2, r: 300, color: [34, 211, 238], speed: 0.0003, phase: 0, drift: 50 },
      { x: 0.75, y: 0.3, r: 250, color: [96, 165, 250], speed: 0.00025, phase: 2, drift: 40 },
      { x: 0.5, y: 0.7, r: 220, color: [34, 211, 238], speed: 0.00035, phase: 4, drift: 35 },
    ]

    // Particles
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random(), y: Math.random(),
      vy: -0.08 - Math.random() * 0.15,
      vx: (Math.random() - 0.5) * 0.08,
      size: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      life: Math.random() * 800,
      maxLife: 600 + Math.random() * 600,
    }))

    const loop = () => {
      t++
      const result = draw()
      if (!result) { rafRef.current = requestAnimationFrame(loop); return }
      const { ctx, w, h } = result

      ctx.clearRect(0, 0, w, h)

      // Grid
      const gridSize = 80
      const gridAlpha = 0.025 + Math.sin(t * 0.006) * 0.01
      ctx.strokeStyle = `rgba(255,255,255,${gridAlpha})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      for (let x = 0; x <= w; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = 0; y <= h; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()

      // Grid vignette
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.35, Math.min(w, h) * 0.15, w * 0.5, h * 0.35, Math.max(w, h) * 0.65)
      vig.addColorStop(0, 'rgba(7,10,18,0)')
      vig.addColorStop(0.6, 'rgba(7,10,18,0.7)')
      vig.addColorStop(1, 'rgba(7,10,18,1)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      // Orbs
      for (const o of orbs) {
        const time = t * o.speed + o.phase
        const ox = o.x * w + Math.sin(time * 3.5) * o.drift
        const oy = o.y * h + Math.cos(time * 2.7) * o.drift * 0.6
        const pulse = 1 + Math.sin(time * 4.5) * 0.15
        const r = o.r * pulse
        const [cr, cg, cb] = o.color
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, r)
        g.addColorStop(0, `rgba(${cr},${cg},${cb},0.3)`)
        g.addColorStop(0.5, `rgba(${cr},${cg},${cb},0.08)`)
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = g
        ctx.fillRect(ox - r, oy - r, r * 2, r * 2)
      }

      // Particles
      for (const p of particles) {
        p.life++
        if (p.life > p.maxLife) {
          p.x = Math.random(); p.y = 1.05; p.life = 0
          p.maxLife = 600 + Math.random() * 600
        }
        p.x += p.vx / w
        p.y += p.vy / h
        const lr = p.life / p.maxLife
        const fade = lr < 0.15 ? lr / 0.15 : lr > 0.75 ? (1 - lr) / 0.25 : 1
        const a = p.opacity * fade
        const px = p.x * w, py = p.y * h

        // Glow
        const pg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 6)
        pg.addColorStop(0, `rgba(34,211,238,${a * 0.3})`)
        pg.addColorStop(1, 'rgba(34,211,238,0)')
        ctx.fillStyle = pg
        ctx.fillRect(px - p.size * 6, py - p.size * 6, p.size * 12, p.size * 12)

        // Dot
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34,211,238,${a})`
        ctx.fill()
      }

      // Beam
      const bp = (t % 700) / 700
      const bx = -w * 0.3 + bp * w * 1.6
      const ba = bp < 0.1 ? bp / 0.1 : bp > 0.6 ? (1 - bp) / 0.4 : 1
      const bg = ctx.createLinearGradient(bx - 250, 0, bx + 250, 0)
      bg.addColorStop(0, 'rgba(34,211,238,0)')
      bg.addColorStop(0.5, `rgba(34,211,238,${0.05 * ba})`)
      bg.addColorStop(1, 'rgba(34,211,238,0)')
      ctx.save()
      ctx.translate(w / 2, h / 2)
      ctx.rotate(-0.12)
      ctx.translate(-w / 2, -h / 2)
      ctx.fillStyle = bg
      ctx.fillRect(bx - 250, 0, 500, h)
      ctx.restore()

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)

    const onResize = () => draw()
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPARISON ROW
   ═══════════════════════════════════════════════════════════════ */

const COMPARE = [
  { area: 'Capture', old: 'Forms, required fields, metadata first.', neu: 'Inbox-first. Type → enter. Done.' },
  { area: 'Organize', old: 'Rigid projects & boards force process early.', neu: 'Optional tags + views only when it matters.' },
  { area: 'Ship', old: 'Status meetings & manual updates.', neu: 'Simple states. Momentum stays visible.' },
  { area: 'AI', old: 'Bolted-on copilots nobody asked for.', neu: 'Nudge: auto-tag, detect duplicates, draft updates.' },
]

/* ═══════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════ */

const FAQ = [
  { q: 'Is this trying to replace every JIRA feature?', a: 'No. We replace the 20% of JIRA that 80% of teams actually use—task capture, lightweight organization, and shipping visibility—without the bloat.' },
  { q: 'Can I track non-engineering work too?', a: 'Absolutely. Trackless is intentionally generic. Marketing campaigns, hiring pipelines, personal to-dos—if it\'s work, it fits.' },
  { q: 'Do you support projects/boards?', a: 'Yes. Projects with Kanban boards, optional tags, search and filtering. Try the live demo.' },
  { q: 'When can I try it?', a: 'The interactive demo is live right now. Full product access rolls out to waitlist members first.' },
]

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="theme-dark">
      <SiteHeader productName={PRODUCT} />

      {/* ═══ HERO ═══ */}
      <section
        id="top"
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ isolation: 'isolate' }}
      >
        <HeroCanvas />

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <ScrollSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80">
              The JIRA alternative for people who hate tools
            </p>
          </ScrollSection>

          <ScrollSection delay={120}>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl leading-[1.05]">
              Track everything.
              <br />
              <span className="text-white/40">Ship faster.</span>
            </h1>
          </ScrollSection>

          <ScrollSection delay={250}>
            <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-white/50">
              Dead-simple task tracking that stays out of your way.
              No setup. No ceremony. Just capture, organize, and ship.
            </p>
          </ScrollSection>

          <ScrollSection delay={380}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#waitlist"
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
          </ScrollSection>
        </div>

        {/* scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" aria-hidden="true">
          <div className="flex flex-col items-center gap-2 text-white/30">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Scroll</span>
            <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
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

          <div className="mt-20 grid gap-16 md:grid-cols-2">
            {[
              { num: '01', title: 'Capture', desc: 'Type it. Hit enter. It\'s saved. No forms, no required fields, no ceremony. Your inbox catches everything.', accent: 'from-cyan-400 to-cyan-600' },
              { num: '02', title: 'Organize', desc: 'Add tags when you want. Create views when you need them. Structure is optional—never forced.', accent: 'from-blue-400 to-blue-600' },
              { num: '03', title: 'Ship', desc: 'Move tasks through simple states. Keep momentum visible. Close the loop without status meetings.', accent: 'from-emerald-400 to-emerald-600' },
              { num: '04', title: 'Nudge', desc: 'AI suggests tags, detects duplicates, and drafts updates. It helps—never gets in your way.', accent: 'from-violet-400 to-violet-600' },
            ].map((step, i) => (
              <ScrollSection key={step.num} delay={i * 100}>
                <div className="group">
                  <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${step.accent} text-white text-sm font-bold shadow-lg`}>
                    {step.num}
                  </div>
                  <h3 className="mt-5 text-2xl font-bold text-white">{step.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-white/50">{step.desc}</p>
                  <div className={`mt-4 h-px w-16 rounded-full bg-gradient-to-r ${step.accent} opacity-40 group-hover:opacity-80 group-hover:w-24 transition-all duration-500`} />
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
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
                <div className="grid grid-cols-[100px_1fr_1fr] gap-4 py-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2">
                  <div className="text-sm font-bold text-white/80">{row.area}</div>
                  <div className="text-sm text-red-300/60 leading-relaxed">{row.old}</div>
                  <div className="text-sm text-cyan-300/90 leading-relaxed">{row.neu}</div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DEMO CTA ═══ */}
      <section className="relative py-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <ScrollSection>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              See it in action.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/40">
              No signup needed. Play with projects, tasks, and a full Kanban board—right in your browser.
            </p>
            <div className="mt-10">
              <Link
                to="/demo"
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10 hover:border-white/25 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
              >
                <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
                Try the live demo
              </Link>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
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
                <details className="group rounded-xl border border-white/8 bg-white/[0.02] transition hover:border-white/12">
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

      {/* ═══ WAITLIST ═══ */}
      <section id="waitlist" className="relative py-32 scroll-mt-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <ScrollSection>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Be first to use {PRODUCT}.
            </h2>
            <p className="mt-4 text-base text-white/40">
              No spam. Just a note when your invite is ready.
            </p>
          </ScrollSection>

          <ScrollSection delay={120}>
            <div className="mt-10">
              <WaitlistForm />
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/8 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
          <span className="text-xs text-white/30">&copy; {new Date().getFullYear()} {PRODUCT}. All rights reserved.</span>
          <div className="flex gap-6">
            {['Features', 'How it works', 'Pricing', 'FAQ'].map((l) => (
              <a
                key={l}
                href={l === 'Pricing' ? '/pricing' : `#${l.toLowerCase().replace(/ /g, '')}`}
                className="text-xs text-white/30 hover:text-white/60 transition"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
