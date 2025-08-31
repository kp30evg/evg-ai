'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const currentStep = parseInt(pathname.split('/step/')[1] || '1')
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600',
    successGreen: '#10B981'
  }

  const steps = [
    { number: 1, title: 'Company Profile', description: 'Tell us about your business' },
    { number: 2, title: 'Connect Tools', description: 'Integrate your existing systems' },
    { number: 3, title: 'Import Data', description: 'Bring in your business data' },
    { number: 4, title: 'Invite Team', description: 'Add your colleagues' },
    { number: 5, title: 'Take the Tour', description: 'Learn the basics' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colors.softGreen}20 0%, ${colors.white} 50%, ${colors.softGreen}10 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 20% 80%, ${colors.evergreen}05 0%, transparent 50%)`,
        animation: 'float 20s ease-in-out infinite'
      }} />
      
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '40px 24px'
      }}>
        {/* Progress Bar */}
        <div style={{
          maxWidth: '800px',
          margin: '0 auto 48px',
          background: colors.white,
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 10px 40px rgba(29, 82, 56, 0.08)'
        }}>
          {/* Step Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            position: 'relative'
          }}>
            {/* Progress Line Background */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '40px',
              right: '40px',
              height: '2px',
              backgroundColor: colors.lightGray,
              zIndex: 0
            }} />
            
            {/* Animated Progress Line */}
            <motion.div
              style={{
                position: 'absolute',
                top: '20px',
                left: '40px',
                height: '2px',
                background: `linear-gradient(90deg, ${colors.evergreen} 0%, ${colors.successGreen} 100%)`,
                zIndex: 1
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / 4) * (100 - 10)}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            
            {steps.map((step) => (
              <div
                key={step.number}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              >
                <motion.div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 300ms ease-out',
                    backgroundColor: 
                      step.number < currentStep ? colors.successGreen :
                      step.number === currentStep ? colors.evergreen :
                      colors.white,
                    color: 
                      step.number <= currentStep ? colors.white : colors.mediumGray,
                    border: 
                      step.number <= currentStep ? 'none' : `2px solid ${colors.lightGray}`,
                    boxShadow: 
                      step.number === currentStep ? `0 0 20px ${colors.evergreen}40` : 'none'
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  animate={
                    step.number === currentStep
                      ? {
                          boxShadow: [
                            `0 0 20px ${colors.evergreen}40`,
                            `0 0 30px ${colors.evergreen}60`,
                            `0 0 20px ${colors.evergreen}40`
                          ]
                        }
                      : {}
                  }
                  transition={
                    step.number === currentStep
                      ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0.2 }
                  }
                >
                  {step.number < currentStep ? (
                    <Check size={20} />
                  ) : (
                    step.number
                  )}
                </motion.div>
                
                <div style={{
                  marginTop: '12px',
                  textAlign: 'center',
                  maxWidth: '120px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: step.number === currentStep ? '600' : '500',
                    color: step.number === currentStep ? colors.charcoal : colors.mediumGray,
                    marginBottom: '4px'
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: colors.mediumGray,
                    lineHeight: 1.3,
                    display: step.number === currentStep ? 'block' : 'none'
                  }}>
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Current Step Progress */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            backgroundColor: colors.softGreen + '30',
            borderRadius: '12px',
            border: `1px solid ${colors.evergreen}20`
          }}>
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: colors.evergreen,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '4px'
              }}>
                Step {currentStep} of 5
              </div>
              <div style={{
                fontSize: '14px',
                color: colors.charcoal
              }}>
                {steps[currentStep - 1]?.title}
              </div>
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              background: `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.successGreen} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {Math.round(((currentStep - 1) / 4) * 100)}%
            </div>
          </div>
        </div>

        {/* Content Area */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      </div>
      
      {/* Add floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(1deg); }
          66% { transform: translate(-20px, 20px) rotate(-1deg); }
        }
      `}</style>
    </div>
  )
}