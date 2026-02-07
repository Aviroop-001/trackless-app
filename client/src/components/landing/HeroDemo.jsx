import { useState, useEffect, useCallback } from 'react'

/* ─── timing config ─── */
const NLP_TEXT = 'fix login bug, assign Sam, urgent'
const TYPE_SPEED = 55
const PAUSE_AFTER_TYPE = 600
const PROCESS_DURATION = 900
const CARD_DELAY = 400
const NUDGE_1_DELAY = 1000
const NUDGE_2_DELAY = 700
const HOLD_DURATION = 3000
const RESET_FADE = 600

const SparkleIcon = ({ className = 'h-3.5 w-3.5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
  </svg>
)

export default function HeroDemo() {
  const [typedText, setTypedText] = useState('')
  const [phase, setPhase] = useState('idle')
  const [opacity, setOpacity] = useState(1)

  const runSequence = useCallback(() => {
    setTypedText('')
    setPhase('idle')
    setOpacity(1)

    const startTimer = setTimeout(() => {
      setPhase('typing')
      let i = 0
      const typeInterval = setInterval(() => {
        i++
        setTypedText(NLP_TEXT.slice(0, i))
        if (i >= NLP_TEXT.length) {
          clearInterval(typeInterval)
          setTimeout(() => {
            setPhase('processing')
            setTimeout(() => {
              setPhase('card')
              setTimeout(() => {
                setPhase('nudge1')
                setTimeout(() => {
                  setPhase('nudge2')
                  setTimeout(() => {
                    setPhase('hold')
                    setTimeout(() => {
                      setOpacity(0)
                      setTimeout(() => runSequence(), RESET_FADE)
                    }, HOLD_DURATION)
                  }, NUDGE_2_DELAY)
                }, NUDGE_1_DELAY)
              }, CARD_DELAY)
            }, PROCESS_DURATION)
          }, PAUSE_AFTER_TYPE)
        }
      }, TYPE_SPEED)
      return () => clearInterval(typeInterval)
    }, 800)

    return () => clearTimeout(startTimer)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (mq?.matches) {
      setPhase('nudge2')
      setTypedText(NLP_TEXT)
      return
    }
    const cleanup = runSequence()
    return cleanup
  }, [runSequence])

  const showCard = ['card', 'nudge1', 'nudge2', 'hold'].includes(phase)
  const showNudge1 = ['nudge1', 'nudge2', 'hold'].includes(phase)
  const showNudge2 = ['nudge2', 'hold'].includes(phase)
  const isProcessing = phase === 'processing'

  return (
    <div
      className="transition-opacity"
      style={{ opacity, transitionDuration: `${RESET_FADE}ms` }}
    >
      <div className="rounded-2xl border border-white/10 bg-white/4 p-1 shadow-2xl shadow-cyan-500/5 backdrop-blur-sm overflow-hidden">
        {/* mini browser chrome */}
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-white/6">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-white/15" />
            <div className="h-2 w-2 rounded-full bg-white/15" />
            <div className="h-2 w-2 rounded-full bg-white/15" />
          </div>
          <div className="flex-1 mx-6 rounded-md bg-white/5 px-2.5 py-0.5 text-[10px] text-white/25 text-center font-mono">
            nudge-ai.vercel.app/demo
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* NLP input bar */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="h-5 w-5 rounded-md bg-linear-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <SparkleIcon className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-[9px] font-semibold text-white/35 hidden sm:inline">Create with AI</span>
            </div>

            <div className="flex-1">
              <div className={[
                'rounded-lg border px-3 py-2 text-[12px] font-medium transition-all duration-300 flex items-center min-h-[34px]',
                isProcessing
                  ? 'border-violet-400/30 bg-violet-500/8 text-violet-300'
                  : typedText
                    ? 'border-white/12 bg-white/4 text-white/70'
                    : 'border-white/8 bg-white/3 text-white/20',
              ].join(' ')}>
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full border-[1.5px] border-violet-400 border-t-transparent animate-spin" />
                    <span className="text-[10px]">Parsing task...</span>
                  </span>
                ) : (
                  <>
                    <span>{typedText || 'Describe a task in plain English...'}</span>
                    {phase === 'typing' && (
                      <span className="inline-block w-px h-3.5 bg-cyan-400 ml-0.5 animate-pulse" />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* generated task card */}
          <div
            className={[
              'transition-all duration-500 overflow-hidden',
              showCard ? 'max-h-36 opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-2',
            ].join(' ')}
          >
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                <span className="text-[10px] font-semibold text-emerald-400">Task created</span>
                <span className="text-[8px] text-white/20 ml-auto font-mono">MVP-14</span>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/5 p-2.5">
                <div className="text-[12px] font-semibold text-white/80">Fix login bug</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-red-400/20 px-1.5 py-0.5 text-[8px] font-bold text-red-300">P0</span>
                  <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[8px] font-medium text-cyan-300">auth</span>
                  <span className="rounded bg-cyan-400/15 px-1.5 py-0.5 text-[8px] font-medium text-cyan-300">bug</span>
                  <span className="text-[9px] text-white/30 ml-auto flex items-center gap-1">
                    <span className="h-3.5 w-3.5 rounded-full bg-blue-400/20 inline-flex items-center justify-center text-[6px] font-bold text-blue-300">S</span>
                    Sam
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* nudge notifications */}
          <div className="space-y-1.5">
            <div className={['transition-all duration-500', showNudge1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'].join(' ')}>
              <div className="rounded-lg bg-red-400/8 border border-red-400/15 px-3 py-2 flex items-start gap-2">
                <SparkleIcon className="h-3 w-3 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[8px] font-semibold text-red-300/80 uppercase tracking-wider">Nudge</span>
                  <div className="text-[10px] text-white/45 mt-0.5">&quot;Fix auth redirect&quot; is 2 days overdue — reassign or escalate?</div>
                </div>
              </div>
            </div>

            <div className={['transition-all duration-500', showNudge2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6'].join(' ')}>
              <div className="rounded-lg bg-amber-400/8 border border-amber-400/15 px-3 py-2 flex items-start gap-2">
                <SparkleIcon className="h-3 w-3 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-[8px] font-semibold text-amber-300/80 uppercase tracking-wider">Nudge</span>
                  <div className="text-[10px] text-white/45 mt-0.5">Sam has 6 tasks, Riya has 1 — rebalance workload?</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
