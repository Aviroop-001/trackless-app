import { useEffect, useState } from 'react'

export default function SplashOverlay() {
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
      className="fixed inset-0 z-100 flex items-center justify-center"
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
