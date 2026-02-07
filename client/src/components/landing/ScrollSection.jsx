import { useEffect, useRef } from 'react'

export function useScrollReveal() {
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

export default function ScrollSection({ children, className = '', delay = 0 }) {
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
