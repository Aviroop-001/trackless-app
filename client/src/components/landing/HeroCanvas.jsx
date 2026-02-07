import { useEffect, useRef, useCallback } from 'react'

export default function HeroCanvas() {
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

    const orbs = [
      { x: 0.2, y: 0.2, r: 300, color: [34, 211, 238], speed: 0.0003, phase: 0, drift: 50 },
      { x: 0.75, y: 0.3, r: 250, color: [96, 165, 250], speed: 0.00025, phase: 2, drift: 40 },
      { x: 0.5, y: 0.7, r: 220, color: [34, 211, 238], speed: 0.00035, phase: 4, drift: 35 },
    ]

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

        const pg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 6)
        pg.addColorStop(0, `rgba(34,211,238,${a * 0.3})`)
        pg.addColorStop(1, 'rgba(34,211,238,0)')
        ctx.fillStyle = pg
        ctx.fillRect(px - p.size * 6, py - p.size * 6, p.size * 12, p.size * 12)

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
