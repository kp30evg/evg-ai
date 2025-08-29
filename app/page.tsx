'use client'

import Header from '@/components/Header'
import AnnouncementBanner from '@/components/AnnouncementBanner'
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
      <AnnouncementBanner />
      <div style={{ paddingTop: '72px' }}>
        <Header />
      </div>
      <HeroSection />
      <OpportunitySection />
      <ProductArchitecture />
      <ScenariosCarousel />
      <CompetitiveComparison />
      <ConversionSection />
      <Footer />
    </div>
  )
}