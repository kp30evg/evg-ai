'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  Layers, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  BarChart3,
  Brain,
  Shield,
  Zap,
  CheckCircle
} from 'lucide-react'

export default function ProductArchitecture() {
  const [openSection, setOpenSection] = useState(0)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  const architectureSections = [
    {
      icon: TrendingUp,
      title: 'Revenue Operations',
      subtitle: 'Sales, Marketing, Customer Success',
      features: [
        'Natural language CRM commands',
        'AI-powered lead scoring and routing',
        'Automated campaign orchestration',
        'Real-time pipeline forecasting',
        'Customer health monitoring',
        'Churn prediction and prevention'
      ],
      replaces: ['Salesforce', 'HubSpot', 'Marketo', 'Gainsight']
    },
    {
      icon: DollarSign,
      title: 'Financial Operations',
      subtitle: 'Accounting, Planning, Analytics',
      features: [
        'Voice-commanded bookkeeping',
        'Automated invoice processing',
        'Real-time cash flow management',
        'Scenario planning with AI',
        'Expense categorization',
        'Financial forecasting'
      ],
      replaces: ['QuickBooks', 'NetSuite', 'Expensify', 'Anaplan']
    },
    {
      icon: Users,
      title: 'People Operations',
      subtitle: 'HR, Recruiting, Payroll',
      features: [
        'Conversational HR assistant',
        'Automated onboarding workflows',
        'Performance review automation',
        'Payroll processing via chat',
        'Benefits administration',
        'Compliance monitoring'
      ],
      replaces: ['Workday', 'BambooHR', 'Gusto', 'Greenhouse']
    },
    {
      icon: Package,
      title: 'Supply Chain & Operations',
      subtitle: 'Inventory, Logistics, Manufacturing',
      features: [
        'Command-based inventory control',
        'Predictive supply planning',
        'Automated vendor management',
        'Route optimization AI',
        'Quality control automation',
        'Demand forecasting'
      ],
      replaces: ['SAP', 'Oracle SCM', 'Fishbowl', 'ShipStation']
    },
    {
      icon: BarChart3,
      title: 'Business Intelligence',
      subtitle: 'Analytics, Reporting, Insights',
      features: [
        'Natural language queries',
        'Automated report generation',
        'Cross-functional dashboards',
        'Predictive analytics',
        'Anomaly detection',
        'Real-time KPI monitoring'
      ],
      replaces: ['Tableau', 'Power BI', 'Looker', 'Domo']
    }
  ]

  const styles = {
    section: {
      padding: '120px 24px',
      backgroundColor: colors.white,
      position: 'relative' as const
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '80px'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 16px',
      borderRadius: '20px',
      backgroundColor: colors.softGreen,
      border: `1px solid ${colors.evergreen}30`,
      color: colors.evergreen,
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '24px'
    },
    title: {
      fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
      fontWeight: '600',
      color: colors.charcoal,
      letterSpacing: '-0.02em',
      marginBottom: '16px',
      lineHeight: 1.1
    },
    subtitle: {
      fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
      color: colors.mediumGray,
      fontWeight: '400',
      maxWidth: '700px',
      margin: '0 auto',
      lineHeight: 1.5
    },
    accordionContainer: {
      maxWidth: '900px',
      margin: '0 auto'
    },
    accordionItem: {
      marginBottom: '16px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: `1px solid ${colors.lightGray}50`,
      transition: 'all 120ms ease-out'
    },
    accordionHeader: {
      padding: '24px 32px',
      backgroundColor: colors.white,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 120ms ease-out',
      border: 'none',
      width: '100%',
      textAlign: 'left' as const
    },
    accordionHeaderActive: {
      backgroundColor: colors.softGreen,
      borderColor: `${colors.evergreen}30`
    },
    accordionLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flex: 1
    },
    iconContainer: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      backgroundColor: colors.softGreen,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    accordionTitleContainer: {
      flex: 1
    },
    accordionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: colors.charcoal,
      marginBottom: '4px'
    },
    accordionSubtitle: {
      fontSize: '14px',
      color: colors.mediumGray
    },
    chevron: {
      transition: 'transform 120ms ease-out'
    },
    accordionContent: {
      padding: '32px',
      backgroundColor: '#FAFBFC',
      borderTop: `1px solid ${colors.lightGray}50`
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    feature: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px'
    },
    featureText: {
      fontSize: '14px',
      color: colors.charcoal,
      lineHeight: 1.5
    },
    replacesSection: {
      marginTop: '24px',
      padding: '20px',
      backgroundColor: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}50`
    },
    replacesLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '12px'
    },
    replacesLogos: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px'
    },
    replaceLogo: {
      padding: '6px 12px',
      backgroundColor: '#FFF5F5',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#DC2626',
      border: '1px solid #FEE2E2',
      textDecoration: 'line-through'
    },
    coreCapabilities: {
      marginTop: '80px',
      padding: '48px',
      backgroundColor: colors.softGreen,
      borderRadius: '24px',
      border: `1px solid ${colors.evergreen}30`
    },
    capabilitiesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '32px',
      marginTop: '32px'
    },
    capability: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      textAlign: 'center' as const
    },
    capabilityIcon: {
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      backgroundColor: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '16px',
      boxShadow: '0 4px 12px rgba(29, 82, 56, 0.08)'
    },
    capabilityTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.charcoal,
      marginBottom: '8px'
    },
    capabilityDescription: {
      fontSize: '13px',
      color: colors.mediumGray,
      lineHeight: 1.5
    }
  }

  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={styles.badge}>
              <Layers size={14} />
              UNIFIED ARCHITECTURE
            </div>
            <h2 style={styles.title}>
              One Platform.
              <br />
              <span style={{ color: colors.evergreen }}>Every Department.</span>
            </h2>
            <p style={styles.subtitle}>
              See how natural language commands orchestrate across your entire business instantly
            </p>
          </motion.div>
        </div>

        <div style={styles.accordionContainer}>
          {architectureSections.map((section, index) => {
            const Icon = section.icon
            const isOpen = openSection === index

            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                style={styles.accordionItem}
              >
                <button
                  style={{
                    ...styles.accordionHeader,
                    ...(isOpen ? styles.accordionHeaderActive : {})
                  }}
                  onClick={() => setOpenSection(isOpen ? -1 : index)}
                  onMouseEnter={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.backgroundColor = '#FAFBFC'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) {
                      e.currentTarget.style.backgroundColor = colors.white
                    }
                  }}
                >
                  <div style={styles.accordionLeft}>
                    <div style={{
                      ...styles.iconContainer,
                      backgroundColor: isOpen ? colors.white : colors.softGreen
                    }}>
                      <Icon size={24} color={colors.evergreen} strokeWidth={1.5} />
                    </div>
                    <div style={styles.accordionTitleContainer}>
                      <h3 style={styles.accordionTitle}>{section.title}</h3>
                      <p style={styles.accordionSubtitle}>{section.subtitle}</p>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    color={colors.mediumGray}
                    style={{
                      ...styles.chevron,
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={styles.accordionContent}>
                        <div style={styles.featuresGrid}>
                          {section.features.map((feature, i) => (
                            <div key={i} style={styles.feature}>
                              <CheckCircle size={16} color={colors.evergreen} style={{ flexShrink: 0 }} />
                              <span style={styles.featureText}>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div style={styles.replacesSection}>
                          <p style={styles.replacesLabel}>Replaces These Tools</p>
                          <div style={styles.replacesLogos}>
                            {section.replaces.map((tool) => (
                              <span key={tool} style={styles.replaceLogo}>
                                {tool}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={styles.coreCapabilities}
        >
          <h3 style={{ ...styles.accordionTitle, fontSize: '24px', textAlign: 'center', marginBottom: '8px' }}>
            Core AI Capabilities
          </h3>
          <p style={{ ...styles.accordionSubtitle, textAlign: 'center' }}>
            Powering every command across your business
          </p>

          <div style={styles.capabilitiesGrid}>
            <div style={styles.capability}>
              <div style={styles.capabilityIcon}>
                <Brain size={28} color={colors.evergreen} strokeWidth={1.5} />
              </div>
              <h4 style={styles.capabilityTitle}>Natural Language</h4>
              <p style={styles.capabilityDescription}>
                Control everything with simple commands
              </p>
            </div>
            <div style={styles.capability}>
              <div style={styles.capabilityIcon}>
                <Zap size={28} color={colors.evergreen} strokeWidth={1.5} />
              </div>
              <h4 style={styles.capabilityTitle}>Real-Time Execution</h4>
              <p style={styles.capabilityDescription}>
                Commands execute in under 0.3 seconds
              </p>
            </div>
            <div style={styles.capability}>
              <div style={styles.capabilityIcon}>
                <Shield size={28} color={colors.evergreen} strokeWidth={1.5} />
              </div>
              <h4 style={styles.capabilityTitle}>Enterprise Security</h4>
              <p style={styles.capabilityDescription}>
                SOC 2, GDPR, HIPAA compliant
              </p>
            </div>
            <div style={styles.capability}>
              <div style={styles.capabilityIcon}>
                <Layers size={28} color={colors.evergreen} strokeWidth={1.5} />
              </div>
              <h4 style={styles.capabilityTitle}>Unified Data</h4>
              <p style={styles.capabilityDescription}>
                All your data in one intelligent system
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}