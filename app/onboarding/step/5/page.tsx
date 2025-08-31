'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight, ArrowLeft, CheckCircle, Rocket
} from 'lucide-react'
import { useOrganization, useUser } from '@clerk/nextjs'

export default function OnboardingStep5() {
  const router = useRouter()
  const { organization } = useOrganization()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC'
  }

  const completeOnboarding = async () => {
    setIsLoading(true)
    
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization?.id,
          userId: user?.id
        })
      })
      
      // Mark onboarding as complete
      if (organization?.id) {
        localStorage.setItem(`onboarding_completed_${organization.id}`, 'true')
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
          marginBottom: '32px',
          position: 'relative',
          textAlign: 'center'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '2px',
            background: `linear-gradient(90deg, ${colors.evergreen} 0%, ${colors.softGreen} 100%)`,
            borderRadius: '2px'
          }} />
          
          <div style={{
            width: '64px',
            height: '64px',
            background: `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 100%)`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            marginTop: '16px'
          }}>
            <CheckCircle size={32} color={colors.white} />
          </div>
          
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '8px'
          }}>
            You're All Set!
          </h1>
          <p style={{
            fontSize: '16px',
            color: colors.mediumGray,
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            {organization?.name} is ready to use evergreenOS. Let's get started!
          </p>
        </div>

        {/* Summary */}
        <div style={{
          background: colors.softGreen + '40',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '12px'
          }}>
            Setup Complete
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color={colors.evergreen} />
              <span style={{ fontSize: '13px', color: colors.charcoal }}>
                Company profile configured
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color={colors.evergreen} />
              <span style={{ fontSize: '13px', color: colors.charcoal }}>
                Integrations connected
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color={colors.evergreen} />
              <span style={{ fontSize: '13px', color: colors.charcoal }}>
                Team invited
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color={colors.evergreen} />
              <span style={{ fontSize: '13px', color: colors.charcoal }}>
                Data imported
              </span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: colors.charcoal,
            marginBottom: '12px'
          }}>
            What's Next?
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{
              padding: '12px',
              background: colors.white,
              border: `1px solid ${colors.lightGray}60`,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: colors.charcoal,
                marginBottom: '4px'
              }}>
                Explore the dashboard
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.mediumGray
              }}>
                Get familiar with your new command center
              </div>
            </div>
            
            <div style={{
              padding: '12px',
              background: colors.white,
              border: `1px solid ${colors.lightGray}60`,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: colors.charcoal,
                marginBottom: '4px'
              }}>
                Try natural language commands
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.mediumGray
              }}>
                Type anything to control your business
              </div>
            </div>
            
            <div style={{
              padding: '12px',
              background: colors.white,
              border: `1px solid ${colors.lightGray}60`,
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: colors.charcoal,
                marginBottom: '4px'
              }}>
                Customize your workspace
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.mediumGray
              }}>
                Tailor evergreenOS to your workflow
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <motion.button
            onClick={() => router.push('/onboarding/step/4')}
            style={{
              padding: '14px 32px',
              background: colors.white,
              color: colors.charcoal,
              border: `2px solid ${colors.lightGray}60`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 200ms ease'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>

          <motion.button
            onClick={completeOnboarding}
            disabled={isLoading}
            style={{
              padding: '14px 32px',
              background: `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 100%)`,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 200ms ease',
              boxShadow: '0 4px 16px rgba(29, 82, 56, 0.2)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? 'Launching...' : (
              <>
                <Rocket size={18} />
                Launch evergreenOS
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}