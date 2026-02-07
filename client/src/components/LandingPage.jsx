import SiteHeader from './SiteHeader'
import SplashOverlay from './landing/SplashOverlay'
import FloatingNav from './landing/FloatingNav'
import HeroCanvas from './landing/HeroCanvas'
import HeroSection from './landing/HeroSection'
import HowItWorksSection from './landing/HowItWorksSection'
import AICapabilitiesSection from './landing/AICapabilitiesSection'
import AudienceSection from './landing/AudienceSection'
import ComparisonSection from './landing/ComparisonSection'
import FAQSection from './landing/FAQSection'
import FounderSection from './landing/FounderSection'
import WaitlistSection from './landing/WaitlistSection'
import Footer from './landing/Footer'

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
        <SiteHeader />
        <HeroSection />
        <HowItWorksSection />
        <AICapabilitiesSection />
        <AudienceSection />
        <ComparisonSection />
        <FounderSection />
        <FAQSection />
        <WaitlistSection />
        <Footer />
      </div>
    </div>
  )
}
