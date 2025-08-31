'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight, ArrowLeft, UserPlus, Mail, Send
} from 'lucide-react'
import { useOrganization } from '@clerk/nextjs'

export default function OnboardingStep3() {
  const router = useRouter()
  const { organization } = useOrganization()
  const [isLoading, setIsLoading] = useState(false)
  const [invites, setInvites] = useState([
    { email: '', role: 'member' }
  ])

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC'
  }

  const roles = [
    { value: 'admin', label: 'Admin', description: 'Full access to all features' },
    { value: 'member', label: 'Member', description: 'Standard access' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' }
  ]

  const addInvite = () => {
    if (invites.length < 10) {
      setInvites([...invites, { email: '', role: 'member' }])
    }
  }

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index))
  }

  const updateInvite = (index: number, field: 'email' | 'role', value: string) => {
    const newInvites = [...invites]
    newInvites[index][field] = value
    setInvites(newInvites)
  }

  const handleSendInvites = async () => {
    setIsLoading(true)
    
    const validInvites = invites.filter(invite => invite.email.trim() !== '')
    
    if (validInvites.length > 0) {
      try {
        await fetch('/api/onboarding/invites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invites: validInvites,
            organizationId: organization?.id
          })
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Error sending invites:', error)
      }
    }
    
    router.push('/onboarding/step/4')
    setIsLoading(false)
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
            Invite Your Team
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.mediumGray
          }}>
            Add team members to collaborate in evergreenOS
          </p>
        </div>

        {/* Invite Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {invites.map((invite, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Mail size={14} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.mediumGray
                }} />
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={invite.email}
                  onChange={(e) => updateInvite(index, 'email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    border: `1px solid ${colors.lightGray}80`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: colors.charcoal,
                    outline: 'none',
                    transition: 'border-color 200ms ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.evergreen
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${colors.lightGray}80`
                  }}
                />
              </div>
              
              <select
                value={invite.role}
                onChange={(e) => updateInvite(index, 'role', e.target.value)}
                style={{
                  padding: '10px 12px',
                  border: `1px solid ${colors.lightGray}80`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: colors.charcoal,
                  background: colors.white,
                  cursor: 'pointer',
                  outline: 'none',
                  minWidth: '120px'
                }}
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>

              {invites.length > 1 && (
                <motion.button
                  onClick={() => removeInvite(index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: colors.mediumGray,
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: 1
                  }}
                >
                  ×
                </motion.button>
              )}
            </div>
          ))}
        </div>

        {/* Add More Button */}
        {invites.length < 10 && (
          <motion.button
            onClick={addInvite}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '10px 16px',
              background: colors.softGreen,
              color: colors.evergreen,
              border: `1px solid ${colors.evergreen}30`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '24px'
            }}
          >
            <UserPlus size={14} />
            Add another
          </motion.button>
        )}

        {/* Role Descriptions */}
        <div style={{
          padding: '12px',
          background: colors.softGreen + '40',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: '600',
            color: colors.mediumGray,
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Role Permissions
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {roles.map(role => (
              <div key={role.value} style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  minWidth: '60px'
                }}>
                  {role.label}:
                </span>
                <span style={{
                  fontSize: '12px',
                  color: colors.mediumGray
                }}>
                  {role.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <motion.button
            onClick={() => router.push('/onboarding/step/2')}
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
              onClick={() => router.push('/onboarding/step/4')}
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
              onClick={handleSendInvites}
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
              {isLoading ? 'Sending...' : (
                <>
                  Send Invites
                  <Send size={16} />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}