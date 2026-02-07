import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from './SiteHeader.jsx'
import WaitlistForm from './WaitlistForm.jsx'

const PRODUCT = 'Nudge AI'

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
   SPLASH OVERLAY — one-time welcome animation
   ═══════════════════════════════════════════════════════════════ */

function SplashOverlay() {
  const [phase, setPhase] = useState('visible') // 'visible' | 'fading' | 'done'

  useEffect(() => {
    if (phase !== 'visible') return

    const t = setTimeout(() => setPhase('fading'), 5000)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 'fading') return

    const t = setTimeout(() => setPhase('done'), 1000)
    return () => clearTimeout(t)
  }, [phase])

  if (phase === 'done') return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0a0f1e 0%, #050810 100%)',
        animation: phase === 'fading' ? 'splashOut 1s ease-in forwards' : undefined,
      }}
    >
      {/* subtle glow behind logo */}
      <div
        className="absolute h-64 w-64 rounded-full bg-cyan-500/20 blur-[100px]"
        style={{ animation: 'splashPulse 2s ease-in-out infinite' }}
      />
      <div
        className="absolute h-40 w-40 rounded-full bg-violet-500/15 blur-[80px]"
        style={{ animation: 'splashPulse 2.5s ease-in-out infinite 0.3s' }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* company logo */}
        <div
          className="flex items-center gap-4"
          style={{ animation: 'splashLogoIn 0.9s cubic-bezier(0.16,1,0.3,1) forwards' }}
        >
          {/* logo mark */}
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
            <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none">
              <path d="M7 7l5 5-5 5" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 7l5 5-5 5" stroke="url(#splashGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="splashGrad" x1="13" y1="7" x2="18" y2="17" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8b5cf6" />
                  <stop offset="1" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* text with sparkle above AI */}
        <div
          className="text-center"
          style={{ opacity: 0, animation: 'splashTextIn 0.8s cubic-bezier(0.16,1,0.3,1) 1.2s forwards' }}
        >
          <h1 className="text-3xl font-bold tracking-[0.15em] text-white sm:text-4xl">
            NUDGE AI<sup
              className="text-cyan-400 relative -top-3"
              style={{ opacity: 0, animation: 'splashSparkle 0.7s cubic-bezier(0.16,1,0.3,1) 2s forwards' }}
            ><svg className="inline h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg></sup>
          </h1>
        </div>

        <div
          style={{ opacity: 0, animation: 'splashSubIn 0.8s ease-out 2.8s forwards' }}
        >
          <p className="text-xs tracking-[0.2em] uppercase text-white/50">
            The project tracker that thinks with you
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FLOATING DOT NAV — tiny dots on the right edge, labels on hover
   ═══════════════════════════════════════════════════════════════ */

const SECTIONS = [
  { id: 'top', label: 'Home' },
  { id: 'how', label: 'How it works' },
  { id: 'ai', label: 'AI Features' },
  { id: 'audience', label: 'Who it\'s for' },
  { id: 'features', label: 'Comparison' },
  { id: 'preview', label: 'Preview' },
  { id: 'faq', label: 'FAQ' },
  { id: 'founder', label: 'Built by' },
  { id: 'waitlist', label: 'Waitlist' },
]

function FloatingNav() {
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
  { area: 'Capture', old: 'Forms, required fields, metadata first.', neu: 'Inbox-first. Type → enter. Or just describe it in natural language.' },
  { area: 'Organize', old: 'Rigid projects & boards force process early.', neu: 'Tags, templates, custom columns—only when you want them.' },
  { area: 'Ship', old: 'Status meetings & manual updates.', neu: 'AI standup generator. One click → Slack-ready summary.' },
  { area: 'Insights', old: 'Manual retrospectives nobody prepares for.', neu: 'Weekly digest with health score, risks & recommendations.' },
  { area: 'AI', old: 'Bolted-on copilots nobody asked for.', neu: 'Nudges, NLP tasks, duplicate detection—AI baked into every workflow.' },
  { area: 'Views', old: 'One board layout. Take it or leave it.', neu: 'Board, list, timeline, heatmap, focus mode + saved views.' },
]

/* ═══════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════ */

const FAQ = [
  { q: 'Is this trying to replace every JIRA feature?', a: 'No. We replace the 20% of JIRA that 80% of teams actually use—task capture, lightweight organization, and shipping visibility—with AI that actively helps you manage, not just track.' },
  { q: 'Can I track non-engineering work too?', a: 'Absolutely. Nudge AI is intentionally generic. Marketing campaigns, hiring pipelines, personal to-dos—if it\'s work, it fits.' },
  { q: 'What makes the AI different from other tools?', a: 'Most tools bolt on AI as a chatbot. Nudge AI bakes intelligence into every workflow—nudges watch your board, NLP creates tasks from plain English, standups are generated in one click, and weekly digests surface risks before you spot them.' },
  { q: 'What AI features are available?', a: 'Smart nudges, natural language task creation, AI project generation, standup generator, weekly health digest, and smart duplicate detection. All powered by AI, all built in—no plugins or add-ons.' },
  { q: 'What views does Nudge AI support?', a: 'Kanban board, list view, timeline/Gantt, workload heatmap, and focus mode. Plus custom saved views with multi-filter support so you can slice your board any way you want.' },
  { q: 'When can I try it?', a: 'The interactive demo is live right now—every feature works, including all AI capabilities. Full product access rolls out to waitlist members first.' },
]

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <div className="theme-dark relative">
      <SplashOverlay />

      {/* persistent animated background */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <HeroCanvas />
      </div>

      <FloatingNav />

      <div className="relative z-10">
      <SiteHeader productName={PRODUCT} />

      {/* ═══ HERO ═══ */}
      <section
        id="top"
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ isolation: 'isolate' }}
      >

        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <ScrollSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80">
              The AI-powered project tracker that manages alongside you
            </p>
          </ScrollSection>

          <ScrollSection delay={120}>
            <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl leading-[1.05]">
              Don't just track.
              <br />
              <span className="text-white/40">Get nudged.</span>
            </h1>
          </ScrollSection>

          <ScrollSection delay={250}>
            <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-white/50">
              AI-powered task tracking that actively manages alongside you.
              Smart nudges, auto-generated plans, and zero busywork.
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

          <div className="mt-20 grid gap-8 md:grid-cols-2">
            {[
              {
                num: '01', title: 'Capture', tagline: 'Describe it. AI does the rest.', accent: 'from-cyan-400 to-cyan-600',
                mock: (
                  <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-2">
                    <div className="rounded-lg bg-violet-500/10 border border-violet-400/20 px-3 py-2">
                      <div className="text-[10px] text-violet-300/70 italic">"fix login bug, assign Sam, urgent"</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                      Task created with P0, tags, assignee
                    </div>
                  </div>
                ),
              },
              {
                num: '02', title: 'Organize', tagline: 'Filters, views, columns—your way.', accent: 'from-blue-400 to-blue-600',
                mock: (
                  <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="rounded-md bg-white/10 px-1.5 py-0.5 text-[8px] text-white/50 flex items-center gap-1">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                        Filter
                      </div>
                      <div className="rounded-full bg-cyan-400/15 border border-cyan-400/20 px-1.5 py-0.5 text-[7px] text-cyan-300">P0 Urgent <span className="opacity-50">x</span></div>
                      <div className="rounded-full bg-cyan-400/15 border border-cyan-400/20 px-1.5 py-0.5 text-[7px] text-cyan-300">Sam <span className="opacity-50">x</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="rounded bg-white/[0.04] p-1.5 text-center"><div className="text-[7px] font-semibold text-white/30 uppercase">Inbox</div><div className="mt-1 h-3 w-full rounded bg-white/6" /></div>
                      <div className="rounded bg-blue-400/8 p-1.5 text-center"><div className="text-[7px] font-semibold text-blue-300/50 uppercase">Doing</div><div className="mt-1 h-3 w-full rounded bg-blue-400/15" /><div className="mt-1 h-3 w-full rounded bg-blue-400/15" /></div>
                      <div className="rounded bg-emerald-400/8 p-1.5 text-center"><div className="text-[7px] font-semibold text-emerald-300/50 uppercase">Done</div><div className="mt-1 h-3 w-full rounded bg-emerald-400/15" /></div>
                    </div>
                  </div>
                ),
              },
              {
                num: '03', title: 'Ship', tagline: 'AI standups. Focus mode. Ship fast.', accent: 'from-emerald-400 to-emerald-600',
                mock: (
                  <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-2">
                    <div className="rounded-lg bg-white/[0.04] border border-white/6 p-2">
                      <div className="text-[8px] font-semibold text-cyan-400 mb-0.5">Daily Standup</div>
                      <div className="text-[9px] text-white/40">Sam: shipped onboarding, fixing auth</div>
                      <div className="text-[9px] text-white/40">Riya: writing API docs</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-emerald-500/15 border border-emerald-400/20 px-2 py-1 text-[8px] text-emerald-300 font-medium">Focus: 3 tasks</div>
                      <div className="rounded-md bg-blue-500/15 border border-blue-400/20 px-2 py-1 text-[8px] text-blue-300 font-medium">Copy for Slack</div>
                    </div>
                  </div>
                ),
              },
              {
                num: '04', title: 'Nudge', tagline: 'AI spots issues before you do.', accent: 'from-violet-400 to-violet-600',
                mock: (
                  <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3 space-y-1.5">
                    <div className="rounded-lg bg-red-400/10 border border-red-400/15 px-2.5 py-1.5 flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      <span className="text-[9px] text-white/45">"Fix auth" is 2 days overdue</span>
                    </div>
                    <div className="rounded-lg bg-amber-400/10 border border-amber-400/15 px-2.5 py-1.5 flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span className="text-[9px] text-white/45">Sam has 5 tasks, Riya has 1</span>
                    </div>
                    <div className="rounded-lg bg-violet-400/10 border border-violet-400/15 px-2.5 py-1.5 flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      <span className="text-[9px] text-white/45">Batch infra tasks into a sprint</span>
                    </div>
                  </div>
                ),
              },
            ].map((step, i) => (
              <ScrollSection key={step.num} delay={i * 100}>
                <div className="group">
                  <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${step.accent} text-white text-sm font-bold shadow-lg`}>
                    {step.num}
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-white/50">{step.tagline}</p>
                  {step.mock}
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ AI CAPABILITIES ═══ */}
      <section id="ai" className="relative py-32 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">
              Built-in AI
            </p>
            <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
              AI that manages, not just tracks.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/40">
              Most tools bolt on AI as a chatbot. Nudge AI bakes intelligence into every layer of your workflow.
            </p>
          </ScrollSection>

          {/* row 1: primary AI features with visual mocks */}
          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {/* Smart Nudges */}
            <ScrollSection delay={0}>
              <div className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05] h-full">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Smart Nudges</h3>
                <p className="mt-1 text-[13px] text-white/45">Spots issues before they block you.</p>
                <div className="mt-4 space-y-1.5">
                  <div className="rounded-lg bg-red-400/10 border border-red-400/15 px-3 py-2 flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    <span className="text-[10px] text-white/50">"Fix auth" is 2 days overdue</span>
                  </div>
                  <div className="rounded-lg bg-amber-400/10 border border-amber-400/15 px-3 py-2 flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="text-[10px] text-white/50">Sam has 5 tasks, Riya has 1</span>
                  </div>
                  <div className="rounded-lg bg-violet-400/10 border border-violet-400/15 px-3 py-2 flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    <span className="text-[10px] text-white/50">"Deploy" blocked by 2 tasks</span>
                  </div>
                </div>
              </div>
            </ScrollSection>

            {/* AI Project Generation */}
            <ScrollSection delay={120}>
              <div className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05] h-full">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">AI Project Generation</h3>
                <p className="mt-1 text-[13px] text-white/45">Describe it. Get a full project.</p>
                <div className="mt-4 rounded-lg bg-cyan-500/10 border border-cyan-400/20 px-3 py-2 mb-2">
                  <div className="text-[10px] text-cyan-300/70 italic">"Build an employee onboarding tool"</div>
                </div>
                <div className="space-y-1">
                  {['Set up auth flow', 'Design welcome screen', 'Build progress tracker', 'Add team directory'].map((t) => (
                    <div key={t} className="flex items-center gap-2 rounded bg-white/[0.04] px-2.5 py-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      <span className="text-[9px] text-white/45">{t}</span>
                      <span className="text-[7px] text-white/20 ml-auto">P2</span>
                    </div>
                  ))}
                  <div className="text-[9px] text-white/25 text-center mt-1">+ 4 more tasks</div>
                </div>
              </div>
            </ScrollSection>

            {/* Natural Language Tasks */}
            <ScrollSection delay={240}>
              <div className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05] h-full">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Natural Language Tasks</h3>
                <p className="mt-1 text-[13px] text-white/45">Type a sentence. Get a task.</p>
                <div className="mt-4 rounded-lg bg-violet-500/10 border border-violet-400/20 px-3 py-2 mb-2">
                  <div className="text-[10px] text-violet-300/70 italic">"fix login timeout, assign Riya, P0"</div>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 mb-2">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  Created instantly
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/6 p-2.5">
                  <div className="text-[10px] font-medium text-white/60">Fix login timeout</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="rounded bg-red-400/15 px-1 py-0.5 text-[7px] font-bold text-red-300">P0</span>
                    <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] text-cyan-300">auth</span>
                    <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] text-cyan-300">bug</span>
                    <span className="text-[8px] text-white/30 ml-auto">Riya</span>
                  </div>
                </div>
              </div>
            </ScrollSection>
          </div>

          {/* row 2: more AI + smart features with visual mocks */}
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {/* AI Standup */}
            <ScrollSection delay={400}>
              <div className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05] h-full">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">AI Standup Generator</h3>
                <p className="mt-1 text-[13px] text-white/45">One click. Slack-ready summary.</p>
                <div className="mt-4 space-y-1.5">
                  <div className="rounded-lg bg-white/[0.04] border border-white/6 p-2">
                    <div className="text-[9px] font-semibold text-cyan-400 mb-0.5">Sam</div>
                    <div className="text-[9px] text-white/40">Done: Deploy staging</div>
                    <div className="text-[9px] text-white/40">Doing: Ship onboarding</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] border border-white/6 p-2">
                    <div className="text-[9px] font-semibold text-cyan-400 mb-0.5">Riya</div>
                    <div className="text-[9px] text-white/40">Doing: Write API docs</div>
                    <div className="text-[9px] text-white/40">Blocked: Auth fix</div>
                  </div>
                </div>
                <div className="mt-2 rounded-md bg-blue-500/15 border border-blue-400/20 px-2.5 py-1.5 text-[9px] text-blue-300 text-center font-medium">Copy for Slack</div>
              </div>
            </ScrollSection>

            {/* Weekly Digest */}
            <ScrollSection delay={520}>
              <div className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05] h-full">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Weekly Digest</h3>
                <p className="mt-1 text-[13px] text-white/45">Health score. Risks. Wins. Actions.</p>
                <div className="mt-4 flex items-center gap-3 mb-3">
                  <div className="relative h-14 w-14 shrink-0">
                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="66 22" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-cyan-400">75</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-400">Good</div>
                    <div className="text-[9px] text-white/35 leading-relaxed">3 shipped this week<br />1 at risk</div>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-400/8 border border-emerald-400/15 px-2.5 py-1.5 text-[9px] text-white/45 flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  Team ahead of sprint target
                </div>
              </div>
            </ScrollSection>

            {/* Duplicate Detection */}
            <ScrollSection delay={640}>
              <div className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05] h-full">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 0 1 0-5.304m5.304 0a3.75 3.75 0 0 1 0 5.304m-7.425 2.121a6.75 6.75 0 0 1 0-9.546m9.546 0a6.75 6.75 0 0 1 0 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">Duplicate Detection</h3>
                <p className="mt-1 text-[13px] text-white/45">Flags similar tasks as you type.</p>
                <div className="mt-4 rounded-lg bg-white/[0.04] border border-white/6 p-2.5 mb-2">
                  <div className="text-[9px] text-white/30 mb-1">Title</div>
                  <div className="text-[10px] text-white/60">Fix authentication redirect</div>
                </div>
                <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 px-3 py-2 flex items-center gap-2">
                  <span className="text-[10px]">&#9888;&#65039;</span>
                  <div>
                    <div className="text-[9px] text-amber-300 font-medium">Possible duplicate</div>
                    <div className="text-[9px] text-white/40">"Fix auth redirect bug" — <span className="text-amber-300/70">87% match</span></div>
                  </div>
                </div>
              </div>
            </ScrollSection>
          </div>

          {/* row 3: power features strip */}
          <ScrollSection delay={800}>
            <div className="mt-12 rounded-2xl border border-white/8 bg-white/[0.03] p-6">
              <h3 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/40 mb-6">Also built in</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Task Dependencies', desc: 'Block & unblock tasks' },
                  { label: 'Focus Mode', desc: 'See only what matters to you' },
                  { label: 'Task Templates', desc: 'Bug, feature, spike & more' },
                  { label: 'Saved Views', desc: 'Custom filter presets' },
                  { label: 'Timeline View', desc: 'Gantt-style date visualization' },
                  { label: 'Workload Heatmap', desc: 'See who\'s overloaded' },
                  { label: 'Keyboard Shortcuts', desc: 'Navigate without a mouse' },
                  { label: 'Dark Mode', desc: 'Easy on the eyes' },
                ].map((f) => (
                  <div key={f.label} className="rounded-lg bg-white/[0.04] border border-white/6 px-4 py-3 text-center">
                    <div className="text-[13px] font-semibold text-white/70">{f.label}</div>
                    <div className="text-[11px] text-white/35 mt-0.5">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollSection>

          <ScrollSection delay={400}>
            <div className="mt-16 text-center">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-white/25 hover:shadow-[0_0_40px_rgba(34,211,238,0.15)]"
              >
                Try all AI features in the demo
                <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              </Link>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* ═══ WHO IT'S FOR ═══ */}
      <section id="audience" className="relative py-32 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">
              Who it's for
            </p>
            <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Built for teams that ship, not teams that plan to plan.
            </h2>
          </ScrollSection>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>,
                title: 'Startup founders',
                desc: 'Stop configuring tools. Start shipping your MVP. Nudge AI gives you structure without ceremony—so you focus on what matters.',
              },
              {
                icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>,
                title: 'Small dev teams (2-10)',
                desc: 'All the structure you need, none of the bloat. Your team gets Kanban boards, smart nudges, and AI insights without a 3-day JIRA setup.',
              },
              {
                icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
                title: 'Solo builders',
                desc: 'Your personal PM that never sleeps. Describe what you\'re building, get a structured plan in seconds, and let AI keep you on track.',
              },
            ].map((p, i) => (
              <ScrollSection key={p.title} delay={i * 100}>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 text-center transition hover:border-white/15 hover:bg-white/[0.05]">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 text-cyan-400">
                    {p.icon}
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{p.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">{p.desc}</p>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TRUST SIGNALS ═══ */}
      <section className="relative py-16">
        <div className="mx-auto max-w-4xl px-6">
          <ScrollSection>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {[
                { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>, text: 'No credit card required' },
                { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>, text: 'Your data stays yours' },
                { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>, text: 'Set up in 30 seconds' },
                { icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>, text: 'Free tier forever' },
              ].map((t) => (
                <div key={t.text} className="flex items-center gap-2.5 text-white/50">
                  <span className="text-cyan-400/70">{t.icon}</span>
                  <span className="text-sm font-medium">{t.text}</span>
                </div>
              ))}
            </div>
          </ScrollSection>
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

      {/* ═══ PRODUCT PREVIEW ═══ */}
      <section id="preview" className="relative py-32 scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80 text-center">
              See it in action
            </p>
            <h2 className="mt-4 text-center text-4xl font-bold tracking-tight text-white sm:text-5xl">
              A board that thinks alongside you.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-center text-base text-white/40">
              Kanban board on the left, AI nudges on the right. No signup needed—try it now.
            </p>
          </ScrollSection>

          <ScrollSection delay={200}>
            <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-2xl shadow-cyan-500/5 backdrop-blur-sm overflow-hidden">
              {/* mock browser chrome */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/8">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                </div>
                <div className="flex-1 mx-8 rounded-md bg-white/[0.06] px-3 py-1 text-[11px] text-white/30 text-center font-mono">nudge-ai.vercel.app/demo</div>
              </div>

              {/* mock app layout */}
              <div className="flex min-h-[360px]">
                {/* mock sidebar */}
                <div className="hidden sm:flex w-[160px] shrink-0 flex-col border-r border-white/8 p-3 gap-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-5 w-5 rounded bg-gradient-to-br from-violet-500 to-cyan-400" />
                    <span className="text-[11px] font-semibold text-white/70">Nudge AI</span>
                  </div>
                  <div className="rounded-md bg-white/[0.08] px-2.5 py-1.5 text-[10px] font-medium text-white/60">Search</div>
                  <div className="rounded-md bg-white/[0.08] px-2.5 py-1.5 text-[10px] font-medium text-white/60">Projects</div>
                  <div className="ml-2 rounded-md bg-cyan-400/10 px-2.5 py-1.5 text-[10px] font-medium text-cyan-400">MVP Launch</div>
                  <div className="ml-2 rounded-md px-2.5 py-1.5 text-[10px] text-white/30">Growth Exp.</div>
                  <div className="rounded-md px-2.5 py-1.5 text-[10px] text-white/40">Users</div>
                  <div className="rounded-md px-2.5 py-1.5 text-[10px] text-white/40">Teams</div>
                  <div className="rounded-md px-2.5 py-1.5 text-[10px] text-white/40">Dashboard</div>
                </div>

                {/* mock board */}
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-white/80">MVP Launch</span>
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono text-white/40">MVP</span>
                    <div className="flex-1" />
                    <div className="rounded-md bg-white/[0.06] border border-white/10 px-2 py-1 text-[10px] text-white/50 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                      Comments
                    </div>
                    <div className="rounded-md bg-violet-500/20 border border-violet-400/30 px-2 py-1 text-[10px] font-semibold text-violet-300 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                      Nudges
                      <span className="inline-flex items-center justify-center h-3.5 min-w-3.5 rounded-full bg-violet-500 text-[7px] font-bold text-white px-0.5">3</span>
                    </div>
                    <div className="rounded-md bg-white/[0.06] border border-white/10 px-2 py-1 text-[10px] text-white/50 flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
                      Options
                    </div>
                  </div>
                  {/* mock toolbar */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-semibold text-white/70">+ New task</div>
                    <div className="rounded-md bg-white/[0.06] border border-white/8 px-2 py-1 text-[9px] text-white/40 flex items-center gap-1">
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" /></svg>
                      Filter
                    </div>
                    <div className="rounded-full bg-cyan-400/15 border border-cyan-400/25 px-1.5 py-0.5 text-[8px] font-medium text-cyan-300 flex items-center gap-1">P0 Urgent <span className="text-cyan-400/60">x</span></div>
                    <div className="flex-1" />
                    <div className="text-[9px] text-white/30">5 tasks</div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { col: 'Inbox', dot: 'bg-white/30', cards: [{ t: 'Set up Sentry', tag: 'infra', p: 'P1' }] },
                      { col: 'Planned', dot: 'bg-amber-400', cards: [{ t: 'Write API docs', tag: 'docs', p: 'P2' }] },
                      { col: 'In Progress', dot: 'bg-blue-400', cards: [{ t: 'Fix auth redirect', tag: 'bug', p: 'P0' }, { t: 'Ship onboarding', tag: 'launch', p: 'P1' }] },
                      { col: 'Done', dot: 'bg-emerald-400', cards: [{ t: 'Deploy staging', tag: 'infra', p: 'P2' }] },
                    ].map((c) => (
                      <div key={c.col} className="space-y-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className={['h-2 w-2 rounded-full', c.dot].join(' ')} />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{c.col}</span>
                          <span className="text-[10px] text-white/20 ml-auto">{c.cards.length}</span>
                        </div>
                        {c.cards.map((card) => (
                          <div key={card.t} className="rounded-lg border border-white/8 bg-white/[0.04] p-2.5 hover:border-white/15 transition-colors">
                            <div className="text-[11px] font-medium text-white/70 leading-snug">{card.t}</div>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[8px] font-medium text-cyan-300">{card.tag}</span>
                              <span className={['rounded px-1 py-0.5 text-[8px] font-bold', card.p === 'P0' ? 'bg-red-400/15 text-red-300' : card.p === 'P1' ? 'bg-orange-400/15 text-orange-300' : 'bg-white/10 text-white/40'].join(' ')}>{card.p}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* mock nudges panel */}
                <div className="hidden md:flex w-[200px] shrink-0 flex-col border-l border-white/8 p-3">
                  <div className="flex items-center gap-1.5 mb-3">
                    <svg className="h-3.5 w-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                    <span className="text-[11px] font-semibold text-white/60">Nudges</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-red-400/10 border border-red-400/20 p-2">
                      <div className="text-[8px] font-semibold text-red-300 uppercase tracking-wider mb-1">Overdue</div>
                      <div className="text-[10px] text-white/50 leading-snug">"Fix auth redirect" is 2 days overdue</div>
                    </div>
                    <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-2">
                      <div className="text-[8px] font-semibold text-amber-300 uppercase tracking-wider mb-1">Stuck</div>
                      <div className="text-[10px] text-white/50 leading-snug">"Write API docs" — no updates in 5 days</div>
                    </div>
                    <div className="rounded-lg bg-violet-400/10 border border-violet-400/20 p-2">
                      <div className="text-[8px] font-semibold text-violet-300 uppercase tracking-wider mb-1">AI Insight</div>
                      <div className="text-[10px] text-white/50 leading-snug">Batch infra tasks into a focused sprint</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollSection>

          {/* secondary previews: AI standup + NLP task creation + weekly digest */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* AI Standup */}
            <ScrollSection delay={350}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-white/70">AI Standup</div>
                    <div className="text-[9px] text-white/30">Generated in 1 click</div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-lg bg-white/[0.04] border border-white/6 p-2.5">
                    <div className="text-[9px] font-semibold text-cyan-400 mb-1">Sam</div>
                    <div className="text-[9px] text-white/40 leading-relaxed">Done: Deploy staging<br />In progress: Ship onboarding<br />Blocked: Fix auth redirect</div>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] border border-white/6 p-2.5">
                    <div className="text-[9px] font-semibold text-cyan-400 mb-1">Riya</div>
                    <div className="text-[9px] text-white/40 leading-relaxed">Done: —<br />In progress: Write API docs<br />Blocked: —</div>
                  </div>
                </div>
                <div className="mt-3 rounded-md bg-blue-500/15 border border-blue-400/20 px-2.5 py-1.5 text-[9px] text-blue-300 text-center font-medium">Copy for Slack</div>
              </div>
            </ScrollSection>

            {/* NLP Task Creation */}
            <ScrollSection delay={450}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-white/70">Create with AI</div>
                    <div className="text-[9px] text-white/30">Natural language input</div>
                  </div>
                </div>
                <div className="rounded-lg bg-violet-500/10 border border-violet-400/20 px-3 py-2.5 mb-3">
                  <div className="text-[10px] text-violet-300/70 italic">"fix the auth bug, assign to Sam, urgent"</div>
                </div>
                <div className="text-[9px] text-white/30 mb-2 flex items-center gap-1.5">
                  <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  Task created
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/6 p-2.5 space-y-1.5">
                  <div className="text-[10px] font-medium text-white/60">Fix auth redirect bug</div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-red-400/15 px-1 py-0.5 text-[7px] font-bold text-red-300">P0</span>
                    <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] font-medium text-cyan-300">auth</span>
                    <span className="rounded bg-cyan-400/15 px-1 py-0.5 text-[7px] font-medium text-cyan-300">bug</span>
                    <span className="text-[8px] text-white/30 ml-auto">→ Sam</span>
                  </div>
                </div>
              </div>
            </ScrollSection>

            {/* Weekly Digest */}
            <ScrollSection delay={550}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-white/70">Weekly Digest</div>
                    <div className="text-[9px] text-white/30">AI health report</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative h-14 w-14">
                    <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#22d3ee" strokeWidth="3" strokeDasharray="66 22" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-cyan-400">75</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-400">Good</div>
                    <div className="text-[9px] text-white/35 leading-relaxed">3 done this week<br />1 overdue, 0 blocked</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 rounded-lg bg-emerald-400/8 border border-emerald-400/15 px-2.5 py-1.5">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="text-[9px] text-white/45 leading-snug">Team shipped 3 tasks ahead of target</span>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-amber-400/8 border border-amber-400/15 px-2.5 py-1.5">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="text-[9px] text-white/45 leading-snug">Auth tasks stalling—consider pairing</span>
                  </div>
                </div>
              </div>
            </ScrollSection>
          </div>

          <ScrollSection delay={700}>
            <div className="mt-12 text-center">
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

      {/* ═══ BUILT BY ═══ */}
      <section id="founder" className="relative py-32 scroll-mt-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <ScrollSection>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400/80">
              Built by
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              A builder who was tired of bloated project tools.
            </h2>
          </ScrollSection>

          <ScrollSection delay={120}>
            <div className="mt-12 inline-flex flex-col items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 grid place-items-center text-2xl font-bold text-white shadow-lg shadow-cyan-500/20 ring-2 ring-white/10">
                A
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Aviroop Banerjee</p>
                <p className="text-sm text-white/40">Founder &amp; Developer</p>
              </div>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
                "I spent more time configuring JIRA than building my product. So I built the tracker I actually wanted—fast, minimal, and smart enough to nudge me when I drift."
              </p>
              <div className="mt-4 flex items-center gap-4">
                <a href="https://github.com/Aviroop-001" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" clipRule="evenodd" /></svg>
                </a>
                <a href="https://linkedin.com/in/aviroop-banerjee" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/60 transition">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>
          </ScrollSection>
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
    </div>
  )
}
