'use client'

import Header from '@/components/Header'
import HeroSection from '@/components/HeroSection'
import OpportunitySection from '@/components/OpportunitySection'
import ProductArchitecture from '@/components/ProductArchitecture'
import CompetitiveComparison from '@/components/CompetitiveComparison'
import ScenariosCarousel from '@/components/ScenariosCarousel'
import LiveCommandPlayground from '@/components/LiveCommandPlayground'
import ConversionSection from '@/components/ConversionSection'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>
      <Header />
      <HeroSection />
      <LiveCommandPlayground />
      <OpportunitySection />
      <ProductArchitecture />
      <ScenariosCarousel />
      <CompetitiveComparison />
      <ConversionSection />
      <Footer />
    </div>
  )
}