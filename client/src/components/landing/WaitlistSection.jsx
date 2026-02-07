import ScrollSection from './ScrollSection'
import WaitlistForm from '../WaitlistForm'
import { PRODUCT } from '../../constants/landingConstants'

export default function WaitlistSection() {
  return (
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
  )
}
