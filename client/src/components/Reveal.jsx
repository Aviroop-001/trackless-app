import { useEffect, useMemo, useRef, useState } from 'react'

export default function Reveal(props) {
  const { as = 'div', children, className = '', delay = 0, once = true } = props
  const Tag = as
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  const style = useMemo(() => ({ '--reveal-delay': `${delay}ms` }), [delay])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setShown(false)
          }
        }
      },
      {
        root: null,
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  return (
    <Tag
      ref={ref}
      style={style}
      className={['reveal', shown ? 'is-revealed' : '', className].join(' ')}
    >
      {children}
    </Tag>
  )
}

