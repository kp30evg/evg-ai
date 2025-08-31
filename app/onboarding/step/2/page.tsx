'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowRight, ArrowLeft, 
  Mail, MessageSquare, Users, FileText, CreditCard, Calendar,
  Database, Cloud, Shield, Globe, Code2, DollarSign
} from 'lucide-react'
import { useOrganization } from '@clerk/nextjs'

export default function OnboardingStep2() {
  const router = useRouter()
  const { organization } = useOrganization()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC'
  }

  const popularIntegrations = [
    { id: 'gmail', name: 'Gmail', icon: Mail },
    { id: 'slack', name: 'Slack', icon: MessageSquare },
    { id: 'salesforce', name: 'Salesforce', icon: Cloud },
    { id: 'quickbooks', name: 'QuickBooks', icon: DollarSign }
  ]

  const communicationTools = [
    { id: 'teams', name: 'Teams', icon: Users },
    { id: 'zoom', name: 'Zoom', icon: Users },
    { id: 'discord', name: 'Discord', icon: MessageSquare },
    { id: 'outlook', name: 'Outlook', icon: Mail }
  ]

  const productivityTools = [
    { id: 'gdrive', name: 'Google Drive', icon: FileText },
    { id: 'gcalendar', name: 'Calendar', icon: Calendar },
    { id: 'notion', name: 'Notion', icon: FileText },
    { id: 'asana', name: 'Asana', icon: Database },
    { id: 'trello', name: 'Trello', icon: Database },
    { id: 'jira', name: 'Jira', icon: Shield }
  ]

  const toggleIntegration = (id: string) => {
    setSelectedIntegrations(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleContinue = async () => {
    setIsLoading(true)
    
    try {
      await fetch('/api/onboarding/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrations: selectedIntegrations,
          organizationId: organization?.id
        })
      })
      
      // Add a small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push('/onboarding/step/3')
    } catch (error) {
      console.error('Error saving integrations:', error)
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
            Connect Your Tools
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.mediumGray
          }}>
            Select the tools you want to integrate with evergreenOS
          </p>
        </div>

        {/* Compact Form Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Popular Integrations */}
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
              Popular
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {popularIntegrations.map((integration) => {
                const Icon = integration.icon
                const isSelected = selectedIntegrations.includes(integration.id)
                return (
                  <motion.button
                    key={integration.id}
                    onClick={() => toggleIntegration(integration.id)}
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
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>{integration.name}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Communication Tools */}
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
              Communication
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {communicationTools.map((tool) => {
                const Icon = tool.icon
                const isSelected = selectedIntegrations.includes(tool.id)
                return (
                  <motion.button
                    key={tool.id}
                    onClick={() => toggleIntegration(tool.id)}
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
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>{tool.name}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Productivity Tools */}
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
              Productivity
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px'
            }}>
              {productivityTools.map((tool) => {
                const Icon = tool.icon
                const isSelected = selectedIntegrations.includes(tool.id)
                return (
                  <motion.button
                    key={tool.id}
                    onClick={() => toggleIntegration(tool.id)}
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
                    <span style={{ fontSize: '11px', fontWeight: '500' }}>{tool.name}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <motion.button
            onClick={() => router.push('/onboarding/step/1')}
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
              onClick={() => router.push('/onboarding/step/3')}
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
              onClick={handleContinue}
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
              {isLoading ? 'Saving...' : 'Continue'}
              <ArrowRight size={18} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}