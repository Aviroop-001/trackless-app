import { useId, useState } from 'react'

export default function WaitlistForm() {
  const emailId = useId()
  const errorId = useId()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function validateEmail(nextEmail) {
    const trimmed = nextEmail.trim()

    if (!trimmed) return 'Email is required.'
    if (trimmed.length > 254) return 'Email looks too long.'

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Enter a valid email address.'
    }

    return ''
  }

  async function onSubmit(e) {
    e.preventDefault()

    const nextError = validateEmail(email)
    if (nextError) {
      setError(nextError)
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Something went wrong. Try again.')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err?.message || 'Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl glass px-4 py-3 text-sm text-white">
        <div className="font-semibold">You’re on the list.</div>
        <div className="mt-1 text-white/70">
          We’ll email <span className="font-semibold text-white">{email.trim()}</span>{' '}
          when early access opens.
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false)
            setIsSubmitting(false)
            setError('')
            setEmail('')
          }}
          className="mt-3 inline-flex rounded-xl glass-chip px-3 py-2 text-xs font-semibold text-white hover:border-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          Add another email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <label htmlFor={emailId} className="sr-only">
          Email address
        </label>
        <input
          id={emailId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={[
            'h-11 w-full rounded-xl glass-chip px-3 text-sm text-white',
            'placeholder:text-white/40',
            error
              ? 'ring-2 ring-red-400 focus:outline-none focus:ring-2 focus:ring-red-300'
              : 'ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300',
          ].join(' ')}
        />
        {error ? (
          <div id={errorId} className="mt-2 text-xs font-semibold text-red-200">
            {error}
          </div>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={[
          'h-11 shrink-0 rounded-xl btn-glass-primary px-4 text-sm font-semibold text-slate-950',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          'disabled:cursor-not-allowed disabled:opacity-70',
        ].join(' ')}
      >
        {isSubmitting ? 'Joining…' : 'Join waitlist'}
      </button>
    </form>
  )
}

