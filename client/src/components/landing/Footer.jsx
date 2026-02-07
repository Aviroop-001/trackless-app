import { PRODUCT } from '../../constants/landingConstants'

export default function Footer() {
  return (
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
  )
}
