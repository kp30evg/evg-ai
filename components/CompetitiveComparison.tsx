'use client'

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Shield, TrendingUp, Zap } from 'lucide-react'

export default function CompetitiveComparison() {
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  const competitors = [
    {
      name: 'Salesforce',
      logo: '☁️',
      problems: [
        '60+ acquisitions = 60+ databases',
        'MuleSoft exists because nothing connects',
        'Each cloud is a different product',
        '$200K+ annual contracts',
        '9-month implementation'
      ],
      migrationTime: '48 hours'
    },
    {
      name: 'Microsoft',
      logo: '🪟',
      problems: [
        '7 separate Dynamics products',
        'Different Copilots for each silo',
        'Teams doesn\'t know Finance exists',
        'Azure dependency lock-in',
        'Complex licensing models'
      ],
      migrationTime: '48 hours'
    },
    {
      name: 'SAP',
      logo: '🏢',
      problems: [
        '14,000 database tables',
        '5-year implementations standard',
        'ABAP code from 1992',
        'Consultants required forever',
        '$1M+ minimum spend'
      ],
      migrationTime: '48 hours'
    },
    {
      name: 'Oracle',
      logo: '🔴',
      problems: [
        'Hostile acquisition strategy',
        'Vendor lock-in by design',
        'Separate systems never integrate',
        'Hidden fees everywhere',
        'Legacy Java architecture'
      ],
      migrationTime: '48 hours'
    }
  ]

  const evergreenAdvantages = [
    { icon: Shield, text: 'Built from scratch with AI-first architecture' },
    { icon: Zap, text: 'One unified data model, not 130 databases' },
    { icon: TrendingUp, text: 'Natural language eliminates training costs' },
    { icon: CheckCircle, text: '48-hour migration guaranteed or $10K' }
  ]

  const styles = {
    section: {
      padding: '120px 24px',
      backgroundColor: '#FAFBFC',
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
      backgroundColor: colors.white,
      border: `1px solid ${colors.lightGray}`,
      color: colors.mediumGray,
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
    competitorsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '48px'
    },
    competitorCard: {
      backgroundColor: '#FFF5F5',
      borderRadius: '20px',
      padding: '32px',
      border: '1px solid #FEE2E2',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    redLine: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)'
    },
    competitorHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px'
    },
    competitorLogo: {
      fontSize: '32px',
      width: '48px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      borderRadius: '12px'
    },
    competitorName: {
      fontSize: '20px',
      fontWeight: '600',
      color: colors.charcoal
    },
    problemsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      marginBottom: '24px'
    },
    problem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      fontSize: '14px',
      color: colors.charcoal
    },
    migrationBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '12px 16px',
      backgroundColor: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}`
    },
    migrationLabel: {
      fontSize: '12px',
      color: colors.mediumGray,
      fontWeight: '500'
    },
    migrationTime: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.evergreen
    },
    evergreenCard: {
      backgroundColor: colors.softGreen,
      borderRadius: '24px',
      padding: '48px',
      border: `2px solid ${colors.evergreen}30`,
      marginTop: '48px',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    greenGradient: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at top right, ${colors.evergreen}10 0%, transparent 60%)`,
      pointerEvents: 'none' as const
    },
    evergreenHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      marginBottom: '32px'
    },
    evergreenLogo: {
      fontSize: '48px',
      fontWeight: '700',
      color: colors.evergreen,
      letterSpacing: '-0.02em'
    },
    advantagesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '24px',
      marginBottom: '40px'
    },
    advantage: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '20px',
      backgroundColor: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.evergreen}20`
    },
    advantageIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '10px',
      backgroundColor: colors.softGreen,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    advantageText: {
      fontSize: '14px',
      color: colors.charcoal,
      lineHeight: 1.5,
      fontWeight: '500'
    },
    ctaContainer: {
      textAlign: 'center' as const,
      marginTop: '40px'
    },
    primaryCta: {
      padding: '16px 32px',
      backgroundColor: colors.evergreen,
      color: colors.white,
      border: 'none',
      borderRadius: '14px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 120ms ease-out',
      boxShadow: '0 4px 12px rgba(29, 82, 56, 0.15)'
    },
    comparisonTable: {
      marginTop: '80px',
      overflowX: 'auto' as const
    },
    table: {
      width: '100%',
      backgroundColor: colors.white,
      borderRadius: '20px',
      overflow: 'hidden',
      border: `1px solid ${colors.lightGray}50`
    },
    tableHeader: {
      backgroundColor: colors.softGreen,
      borderBottom: `2px solid ${colors.evergreen}20`
    },
    tableRow: {
      display: 'grid',
      gridTemplateColumns: '200px repeat(5, 1fr)',
      padding: '20px',
      borderBottom: `1px solid ${colors.lightGray}50`,
      alignItems: 'center'
    },
    tableCell: {
      fontSize: '14px',
      color: colors.charcoal,
      textAlign: 'center' as const
    },
    tableCellFirst: {
      textAlign: 'left' as const,
      fontWeight: '600'
    },
    checkmark: {
      color: colors.evergreen,
      fontWeight: '600'
    },
    cross: {
      color: '#EF4444',
      opacity: 0.5
    }
  }

  const comparisonData = [
    { feature: 'Natural Language Control', evergreen: true, salesforce: false, microsoft: false, sap: false, oracle: false },
    { feature: 'Unified Data Model', evergreen: true, salesforce: false, microsoft: false, sap: false, oracle: false },
    { feature: '48-Hour Migration', evergreen: true, salesforce: false, microsoft: false, sap: false, oracle: false },
    { feature: 'No Consultants Required', evergreen: true, salesforce: false, microsoft: false, sap: false, oracle: false },
    { feature: 'Real-Time Execution', evergreen: true, salesforce: false, microsoft: true, sap: false, oracle: false },
    { feature: 'Transparent Pricing', evergreen: true, salesforce: false, microsoft: false, sap: false, oracle: false }
  ]

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
              <Shield size={14} />
              COMPETITIVE ADVANTAGE
            </div>
            <h2 style={styles.title}>
              Why They Can't Build This
            </h2>
            <p style={styles.subtitle}>
              Legacy architecture is their permanent prison. 
              We started from zero with AI at the core.
            </p>
          </motion.div>
        </div>

        <div style={styles.competitorsGrid}>
          {competitors.map((competitor, index) => (
            <motion.div
              key={competitor.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              style={styles.competitorCard}
            >
              <div style={styles.redLine} />
              <div style={styles.competitorHeader}>
                <div style={styles.competitorLogo}>
                  {competitor.logo}
                </div>
                <h3 style={styles.competitorName}>{competitor.name}</h3>
              </div>

              <div style={styles.problemsList}>
                {competitor.problems.map((problem, i) => (
                  <div key={i} style={styles.problem}>
                    <XCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{problem}</span>
                  </div>
                ))}
              </div>

              <div style={styles.migrationBadge}>
                <span style={styles.migrationLabel}>Our migration time:</span>
                <span style={styles.migrationTime}>{competitor.migrationTime}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={styles.evergreenCard}
        >
          <div style={styles.greenGradient} />
          <div style={styles.evergreenHeader}>
            <div style={styles.evergreenLogo}>
              evergreen<span style={{ fontWeight: '400' }}>OS</span>
            </div>
          </div>

          <div style={styles.advantagesGrid}>
            {evergreenAdvantages.map((advantage, index) => {
              const Icon = advantage.icon
              return (
                <div key={index} style={styles.advantage}>
                  <div style={styles.advantageIcon}>
                    <Icon size={20} color={colors.evergreen} strokeWidth={1.5} />
                  </div>
                  <span style={styles.advantageText}>{advantage.text}</span>
                </div>
              )
            })}
          </div>

          <div style={styles.ctaContainer}>
            <button 
              style={styles.primaryCta}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(29, 82, 56, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 82, 56, 0.15)'
              }}
            >
              See Migration Process →
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={styles.comparisonTable}
        >
          <div style={styles.table}>
            <div style={{ ...styles.tableRow, ...styles.tableHeader }}>
              <div style={{ ...styles.tableCell, ...styles.tableCellFirst }}>Feature</div>
              <div style={styles.tableCell}><strong>evergreenOS</strong></div>
              <div style={styles.tableCell}>Salesforce</div>
              <div style={styles.tableCell}>Microsoft</div>
              <div style={styles.tableCell}>SAP</div>
              <div style={styles.tableCell}>Oracle</div>
            </div>
            {comparisonData.map((row, index) => (
              <div key={index} style={styles.tableRow}>
                <div style={{ ...styles.tableCell, ...styles.tableCellFirst }}>{row.feature}</div>
                <div style={styles.tableCell}>
                  {row.evergreen ? <CheckCircle size={20} color={colors.evergreen} /> : <XCircle size={20} color="#EF4444" />}
                </div>
                <div style={styles.tableCell}>
                  {row.salesforce ? <CheckCircle size={20} color={colors.evergreen} /> : <XCircle size={20} color="#EF4444" />}
                </div>
                <div style={styles.tableCell}>
                  {row.microsoft ? <CheckCircle size={20} color={colors.evergreen} /> : <XCircle size={20} color="#EF4444" />}
                </div>
                <div style={styles.tableCell}>
                  {row.sap ? <CheckCircle size={20} color={colors.evergreen} /> : <XCircle size={20} color="#EF4444" />}
                </div>
                <div style={styles.tableCell}>
                  {row.oracle ? <CheckCircle size={20} color={colors.evergreen} /> : <XCircle size={20} color="#EF4444" />}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}