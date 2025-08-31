'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Users, 
  Users2, 
  Building, 
  Building2, 
  Globe,
  Code2,
  ShoppingCart,
  DollarSign,
  HeartHandshake,
  Factory,
  GraduationCap,
  Home,
  Briefcase,
  BarChart3,
  Cog,
  Wallet,
  UserCheck,
  Megaphone,
  Sparkles
} from 'lucide-react'
import { useOrganization, useUser } from '@clerk/nextjs'

export default function OnboardingStep1() {
  const router = useRouter()
  const { organization } = useOrganization()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    companySize: '',
    industry: '',
    primaryUseCase: ''
  })

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC'
  }

  const companySizes = [
    { value: '1-10', label: '1-10', icon: Users },
    { value: '11-50', label: '11-50', icon: Users2 },
    { value: '51-200', label: '51-200', icon: Building },
    { value: '201-500', label: '201-500', icon: Building2 },
    { value: '500+', label: '500+', icon: Globe }
  ]

  const industries = [
    { value: 'saas', label: 'SaaS', icon: Code2 },
    { value: 'ecommerce', label: 'E-commerce', icon: ShoppingCart },
    { value: 'finance', label: 'Finance', icon: DollarSign },
    { value: 'healthcare', label: 'Healthcare', icon: HeartHandshake },
    { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
    { value: 'education', label: 'Education', icon: GraduationCap },
    { value: 'realestate', label: 'Real Estate', icon: Home },
    { value: 'consulting', label: 'Consulting', icon: Briefcase },
    { value: 'other', label: 'Other', icon: Globe }
  ]

  const useCases = [
    { value: 'sales', label: 'Sales & CRM', icon: BarChart3 },
    { value: 'operations', label: 'Operations', icon: Cog },
    { value: 'finance', label: 'Finance', icon: Wallet },
    { value: 'hr', label: 'HR', icon: UserCheck },
    { value: 'marketing', label: 'Marketing', icon: Megaphone },
    { value: 'all', label: 'Everything', icon: Sparkles }
  ]

  const handleSubmit = async () => {
    if (!formData.companySize || !formData.industry || !formData.primaryUseCase) {
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/onboarding/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          companyName: organization?.name,
          organizationId: organization?.id
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // Add a small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push('/onboarding/step/2')
      } else {
        console.error('Failed to save company data:', data.error)
      }
    } catch (error) {
      console.error('Error saving company data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const isFormComplete = formData.companySize && formData.industry && formData.primaryUseCase

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: colors.white,
          borderRadius: '12px',
          padding: '24px 32px',
          boxShadow: '0 4px 24px rgba(29, 82, 56, 0.08)',
          border: `1px solid ${colors.lightGray}40`,
          width: '100%'
        }}
      >
        {/* Header with gradient accent */}
        <div style={{ 
          marginBottom: '24px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60px',
            height: '2px',
            background: `linear-gradient(90deg, ${colors.evergreen} 0%, ${colors.softGreen} 100%)`,
            borderRadius: '2px'
          }} />
          <h1 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '6px',
            paddingTop: '8px'
          }}>
            Welcome, {user?.firstName || 'there'}
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.mediumGray
          }}>
            Let's customize evergreenOS for {organization?.name || 'your company'}
          </p>
        </div>

        {/* Compact Form Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Company Size - Single Row */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: colors.mediumGray,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Team Size
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px'
            }}>
              {companySizes.map((size) => {
                const Icon = size.icon
                const isSelected = formData.companySize === size.value
                return (
                  <motion.button
                    key={size.value}
                    onClick={() => setFormData({ ...formData, companySize: size.value })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 6px',
                      background: isSelected 
                        ? `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 100%)`
                        : colors.white,
                      border: `1px solid ${isSelected ? colors.evergreen : colors.lightGray}80`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      color: isSelected ? colors.white : colors.charcoal,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isSelected ? '0 4px 12px rgba(29, 82, 56, 0.15)' : 'none'
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ fontSize: '12px', fontWeight: '500' }}>{size.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Industry - 2 Rows */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: colors.mediumGray,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Industry
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px'
            }}>
              {industries.map((industry) => {
                const Icon = industry.icon
                const isSelected = formData.industry === industry.value
                return (
                  <motion.button
                    key={industry.value}
                    onClick={() => setFormData({ ...formData, industry: industry.value })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 6px',
                      background: isSelected 
                        ? `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 100%)`
                        : colors.white,
                      border: `1px solid ${isSelected ? colors.evergreen : colors.lightGray}80`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      color: isSelected ? colors.white : colors.charcoal,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isSelected ? '0 4px 12px rgba(29, 82, 56, 0.15)' : 'none'
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>{industry.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Primary Use Case - Single Row */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '600',
              color: colors.mediumGray,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Primary Focus
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px'
            }}>
              {useCases.map((useCase) => {
                const Icon = useCase.icon
                const isSelected = formData.primaryUseCase === useCase.value
                return (
                  <motion.button
                    key={useCase.value}
                    onClick={() => setFormData({ ...formData, primaryUseCase: useCase.value })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      padding: '10px 6px',
                      background: isSelected 
                        ? `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 100%)`
                        : colors.white,
                      border: `1px solid ${isSelected ? colors.evergreen : colors.lightGray}80`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      color: isSelected ? colors.white : colors.charcoal,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isSelected ? '0 4px 12px rgba(29, 82, 56, 0.15)' : 'none'
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>{useCase.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Continue Button with gradient */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <motion.button
            onClick={handleSubmit}
            disabled={!isFormComplete || isLoading}
            whileHover={isFormComplete ? { scale: 1.02 } : {}}
            whileTap={isFormComplete ? { scale: 0.98 } : {}}
            style={{
              padding: '14px 32px',
              background: isFormComplete 
                ? `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 100%)`
                : colors.lightGray,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isFormComplete ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 200ms ease',
              boxShadow: isFormComplete ? '0 4px 16px rgba(29, 82, 56, 0.2)' : 'none'
            }}
          >
            {isLoading ? 'Saving...' : 'Continue'}
            <ArrowRight size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}