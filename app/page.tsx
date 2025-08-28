'use client'

import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import OpportunitySection from '@/components/OpportunitySection'
import ProductArchitecture from '@/components/ProductArchitecture'
import CompetitiveComparison from '@/components/CompetitiveComparison'
import ScenariosCarousel from '@/components/ScenariosCarousel'

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>
      <Header />
      <HeroSection />
      <OpportunitySection />
      <ProductArchitecture />
      <ScenariosCarousel />
      <CompetitiveComparison />
    </div>
  )
}