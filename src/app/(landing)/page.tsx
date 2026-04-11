import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
    </div>
  )
}
