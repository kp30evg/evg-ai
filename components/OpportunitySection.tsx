'use client'

import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Building2, Globe2, Cpu, Users } from 'lucide-react'

export default function OpportunitySection() {
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  const opportunities = [
    {
      icon: DollarSign,
      title: '$2 Trillion',
      subtitle: 'Business Software Market',
      description: 'The fragmented SaaS market is ripe for unification',
      highlight: true
    },
    {
      icon: Building2,
      title: '130+ Tools',
      subtitle: 'Average Enterprise Stack',
      description: 'Each requiring separate logins, training, and contracts'
    },
    {
      icon: Users,
      title: '73% Waste',
      subtitle: 'Software Spending',
      description: 'Most features never used, licenses underutilized'
    },
    {
      icon: Globe2,
      title: '10M+ Companies',
      subtitle: 'Ready to Switch',
      description: 'Tired of juggling dozens of disconnected tools'
    },
    {
      icon: Cpu,
      title: 'AI Revolution',
      subtitle: 'Perfect Timing',
      description: 'Natural language finally makes unified systems possible'
    },
    {
      icon: TrendingUp,
      title: '48-Hour Migration',
      subtitle: 'Our Guarantee',
      description: 'Or we pay you $10,000 for your time'
    }
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
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: '20px',
      padding: '32px',
      border: `1px solid ${colors.lightGray}50`,
      transition: 'all 120ms ease-out',
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    highlightCard: {
      backgroundColor: colors.softGreen,
      border: `2px solid ${colors.evergreen}30`,
      gridColumn: 'span 2' as any,
      background: `linear-gradient(135deg, ${colors.softGreen} 0%, ${colors.white} 100%)`
    },
    cardGlow: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at top left, ${colors.evergreen}10 0%, transparent 60%)`,
      opacity: 0,
      transition: 'opacity 300ms ease-out',
      pointerEvents: 'none' as const
    },
    iconContainer: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      backgroundColor: colors.softGreen,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px'
    },
    cardTitle: {
      fontSize: '32px',
      fontWeight: '700',
      color: colors.evergreen,
      marginBottom: '8px',
      letterSpacing: '-0.02em'
    },
    cardSubtitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.charcoal,
      marginBottom: '12px'
    },
    cardDescription: {
      fontSize: '14px',
      color: colors.mediumGray,
      lineHeight: 1.5
    },
    statsContainer: {
      marginTop: '80px',
      padding: '40px',
      backgroundColor: colors.white,
      borderRadius: '24px',
      border: `1px solid ${colors.lightGray}50`,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '32px',
      textAlign: 'center' as const
    },
    stat: {
      borderRight: `1px solid ${colors.lightGray}`,
      paddingRight: '32px',
      '&:last-child': {
        borderRight: 'none'
      }
    },
    statValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: colors.evergreen,
      marginBottom: '8px'
    },
    statLabel: {
      fontSize: '14px',
      color: colors.mediumGray
    },
    mobileOptimized: `
      @media (max-width: 768px) {
        .highlight-card { grid-column: span 1 !important; }
      }
    `
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles.mobileOptimized }} />
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.header}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div style={styles.badge}>
                <TrendingUp size={14} />
                THE OPPORTUNITY
              </div>
              <h2 style={styles.title}>
                The $2 Trillion Problem
                <br />
                <span style={{ color: colors.evergreen }}>We're Solving</span>
              </h2>
              <p style={styles.subtitle}>
                Business software is broken. 130+ tools. Zero integration. 
                Infinite complexity. Until now.
              </p>
            </motion.div>
          </div>

          <div style={styles.grid}>
            {opportunities.map((opp, index) => {
              const Icon = opp.icon
              const cardStyle = opp.highlight 
                ? { ...styles.card, ...styles.highlightCard } 
                : styles.card

              return (
                <motion.div
                  key={opp.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={opp.highlight ? 'highlight-card' : ''}
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.08)'
                    const glow = e.currentTarget.querySelector('.card-glow') as HTMLElement
                    if (glow) glow.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    const glow = e.currentTarget.querySelector('.card-glow') as HTMLElement
                    if (glow) glow.style.opacity = '0'
                  }}
                >
                  <div className="card-glow" style={styles.cardGlow} />
                  <div style={{
                    ...styles.iconContainer,
                    backgroundColor: opp.highlight ? colors.evergreen + '20' : colors.softGreen
                  }}>
                    <Icon 
                      size={24} 
                      color={opp.highlight ? colors.evergreen : colors.evergreen}
                      strokeWidth={1.5}
                    />
                  </div>
                  <h3 style={styles.cardTitle}>{opp.title}</h3>
                  <p style={styles.cardSubtitle}>{opp.subtitle}</p>
                  <p style={styles.cardDescription}>{opp.description}</p>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            style={styles.statsContainer}
          >
            <div style={styles.stat}>
              <div style={styles.statValue}>87%</div>
              <div style={styles.statLabel}>Cost Reduction</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>4.2x</div>
              <div style={styles.statLabel}>Productivity Gain</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statValue}>100%</div>
              <div style={styles.statLabel}>Data Unified</div>
            </div>
            <div style={{ ...styles.stat, borderRight: 'none' }}>
              <div style={styles.statValue}>48hr</div>
              <div style={styles.statLabel}>Full Migration</div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}