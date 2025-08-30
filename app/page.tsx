'use client'

import Header from '@/components/Header'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import NavigationBar from '@/components/NavigationBar'
import HeroSection from '@/components/HeroSection'
import ProductArchitecture from '@/components/ProductArchitecture'
import DepartmentCommandShowcase from '@/components/DepartmentCommandShowcase'
import CompetitiveComparison from '@/components/CompetitiveComparison'
import ScenariosCarousel from '@/components/ScenariosCarousel'
import LiveCommandPlayground from '@/components/LiveCommandPlayground'
import ConversionSection from '@/components/ConversionSection'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>
      <NavigationBar />
      <div style={{ paddingTop: '64px' }}>
        <HeroSection />
        <ProductArchitecture />
        <DepartmentCommandShowcase />
        <ScenariosCarousel />
        <CompetitiveComparison />
        <ConversionSection />
        <Footer />
      </div>
    </div>
  )
}