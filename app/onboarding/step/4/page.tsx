'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight, ArrowLeft, Database, Upload, FileText, Users
} from 'lucide-react'
import { useOrganization } from '@clerk/nextjs'

export default function OnboardingStep4() {
  const router = useRouter()
  const { organization } = useOrganization()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC'
  }

  const importOptions = [
    { id: 'contacts', name: 'Contacts', icon: Users, description: 'Customer data' },
    { id: 'emails', name: 'Emails', icon: FileText, description: 'Email history' },
    { id: 'files', name: 'Files', icon: Database, description: 'Documents & files' }
  ]

  const toggleOption = (id: string) => {
    setSelectedOptions(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleImport = async () => {
    setIsLoading(true)
    
    try {
      if (selectedOptions.length > 0) {
        await fetch('/api/onboarding/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedOptions,
            organizationId: organization?.id
          })
        })
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/onboarding/step/5')
    } catch (error) {
      console.error('Error importing data:', error)
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
            Import Your Data
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.mediumGray
          }}>
            Bring your existing data into evergreenOS
          </p>
        </div>

        {/* Import Options */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: '600',
            color: colors.mediumGray,
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Select Data to Import
          </label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {importOptions.map((option) => {
              const Icon = option.icon
              const isSelected = selectedOptions.includes(option.id)
              
              return (
                <motion.button
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    padding: '14px',
                    background: isSelected 
                      ? colors.softGreen
                      : colors.white,
                    border: `1px solid ${isSelected ? colors.evergreen : colors.lightGray}80`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 200ms ease'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: isSelected 
                      ? `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 100%)`
                      : colors.softGreen + '60',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={16} color={isSelected ? colors.white : colors.evergreen} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      marginBottom: '2px'
                    }}>
                      {option.name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: colors.mediumGray
                    }}>
                      {option.description}
                    </div>
                  </div>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? colors.evergreen : colors.lightGray}`,
                    background: isSelected ? colors.evergreen : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isSelected && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: colors.white,
                        borderRadius: '50%'
                      }} />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Info Box */}
        <div style={{
          padding: '12px',
          background: colors.softGreen + '40',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Upload size={14} color={colors.evergreen} />
            <p style={{
              fontSize: '12px',
              color: colors.charcoal,
              margin: 0
            }}>
              You can always import more data later from the settings page
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <motion.button
            onClick={() => router.push('/onboarding/step/3')}
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <motion.button
              onClick={() => router.push('/onboarding/step/5')}
              style={{
                padding: '14px 24px',
                background: 'transparent',
                color: colors.mediumGray,
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
              whileHover={{ color: colors.charcoal }}
            >
              Skip for now
            </motion.button>

            <motion.button
              onClick={handleImport}
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
              {isLoading ? 'Importing...' : (
                <>
                  {selectedOptions.length > 0 ? 'Import & Continue' : 'Continue'}
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}