'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  TrendingUp, 
  Users, 
  DollarSign,
  Package,
  AlertTriangle,
  Target,
  Rocket,
  Building2,
  Globe2
} from 'lucide-react'

export default function ScenariosCarousel() {
  const [currentScenario, setCurrentScenario] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  const scenarios = [
    {
      icon: AlertTriangle,
      category: 'CRISIS MANAGEMENT',
      title: 'Customer Churn Emergency',
      command: '"Show me why Enterprise accounts are churning and fix it"',
      systemActions: [
        'Analyzed 2,847 customer interactions across all touchpoints',
        'Identified 3 critical service failures in last 30 days',
        'Auto-generated personalized retention offers for 23 at-risk accounts',
        'Scheduled executive calls with top 10 accounts',
        'Deployed emergency response team to 5 locations',
        'Projected save: $4.2M ARR'
      ],
      metrics: {
        time: '0.8s',
        impact: '$4.2M saved',
        accuracy: '98%'
      },
      color: colors.evergreen
    },
    {
      icon: Rocket,
      category: 'GROWTH ACCELERATION',
      title: 'Series B Fundraise Prep',
      command: '"Prepare everything for Series B fundraise next quarter"',
      systemActions: [
        'Generated 127-slide data room with real-time metrics',
        'Created 5 financial scenarios with sensitivity analysis',
        'Compiled competitive intelligence from 47 sources',
        'Prepared answers to 200 common investor questions',
        'Scheduled mock pitch sessions with advisors',
        'Built interactive investor dashboard'
      ],
      metrics: {
        time: '2.1s',
        impact: '60 hours saved',
        accuracy: '100%'
      },
      color: colors.evergreen
    },
    {
      icon: DollarSign,
      category: 'FINANCIAL OPTIMIZATION',
      title: 'Instant Cost Reduction',
      command: '"Cut operating expenses by 20% without affecting growth"',
      systemActions: [
        'Analyzed $47M in annual spending across 1,300 vendors',
        'Identified $9.4M in immediate savings opportunities',
        'Renegotiated 73 contracts automatically',
        'Consolidated 18 duplicate software subscriptions',
        'Optimized cloud infrastructure usage',
        'Restructured payment terms with 40 suppliers'
      ],
      metrics: {
        time: '1.3s',
        impact: '$9.4M saved',
        accuracy: '95%'
      },
      color: colors.evergreen
    },
    {
      icon: Package,
      category: 'SUPPLY CHAIN INTELLIGENCE',
      title: 'Supply Chain Disruption',
      command: '"Port strike in LA - minimize impact on Q4 deliveries"',
      systemActions: [
        'Rerouted 847 shipments through alternative ports',
        'Secured emergency air freight for critical items',
        'Notified 2,100 affected customers with new ETAs',
        'Adjusted production schedules at 3 facilities',
        'Negotiated priority slots with 5 carriers',
        'Updated financial forecasts automatically'
      ],
      metrics: {
        time: '1.1s',
        impact: '94% on-time',
        accuracy: '99%'
      },
      color: colors.evergreen
    },
    {
      icon: Users,
      category: 'TALENT OPERATIONS',
      title: 'Engineering Team Scale',
      command: '"Hire 50 engineers in 30 days matching our culture"',
      systemActions: [
        'Sourced 3,847 candidates from 12 platforms',
        'AI-screened resumes for technical and culture fit',
        'Scheduled 127 first-round interviews',
        'Coordinated 48 technical assessments',
        'Generated personalized offers for top 50',
        'Onboarding plans created for each hire'
      ],
      metrics: {
        time: '0.9s',
        impact: '85% accept rate',
        accuracy: '92%'
      },
      color: colors.evergreen
    },
    {
      icon: Globe2,
      category: 'MARKET EXPANSION',
      title: 'International Launch',
      command: '"Launch in European market by end of quarter"',
      systemActions: [
        'Analyzed regulatory requirements for 27 countries',
        'Set up legal entities in 5 key markets',
        'Localized pricing for 15 currencies',
        'Translated platform into 7 languages',
        'Hired country managers through AI recruiting',
        'Launched targeted campaigns in each region'
      ],
      metrics: {
        time: '3.2s',
        impact: '€12M pipeline',
        accuracy: '97%'
      },
      color: colors.evergreen
    }
  ]

  useEffect(() => {
    if (!isAutoPlaying) return
    
    const interval = setInterval(() => {
      setCurrentScenario((prev) => (prev + 1) % scenarios.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, scenarios.length])

  const nextScenario = () => {
    setIsAutoPlaying(false)
    setCurrentScenario((prev) => (prev + 1) % scenarios.length)
  }

  const prevScenario = () => {
    setIsAutoPlaying(false)
    setCurrentScenario((prev) => (prev - 1 + scenarios.length) % scenarios.length)
  }

  const styles = {
    section: {
      padding: '120px 24px',
      backgroundColor: colors.white,
      position: 'relative' as const,
      overflow: 'hidden'
    },
    backgroundPattern: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `radial-gradient(circle at 20% 50%, ${colors.softGreen}40 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, ${colors.softGreen}30 0%, transparent 50%)`,
      pointerEvents: 'none' as const
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative' as const
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
    carouselContainer: {
      position: 'relative' as const,
      maxWidth: '1000px',
      margin: '0 auto'
    },
    scenarioCard: {
      backgroundColor: colors.white,
      borderRadius: '24px',
      padding: '48px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
      border: `1px solid ${colors.lightGray}50`,
      minHeight: '500px'
    },
    scenarioHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '32px'
    },
    scenarioIcon: {
      width: '56px',
      height: '56px',
      borderRadius: '14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    scenarioMeta: {
      flex: 1
    },
    scenarioCategory: {
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '0.5px',
      marginBottom: '4px'
    },
    scenarioTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: colors.charcoal
    },
    commandBox: {
      backgroundColor: '#FAFBFC',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '32px',
      border: `1px solid ${colors.lightGray}`
    },
    commandLabel: {
      fontSize: '11px',
      fontWeight: '600',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    commandText: {
      fontSize: '16px',
      color: colors.evergreen,
      fontWeight: '500',
      fontFamily: 'monospace'
    },
    systemResponse: {
      marginBottom: '32px'
    },
    responseLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginBottom: '16px'
    },
    actionsList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px'
    },
    action: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: colors.softGreen + '50',
      borderRadius: '10px',
      border: `1px solid ${colors.evergreen}15`
    },
    actionNumber: {
      width: '24px',
      height: '24px',
      borderRadius: '6px',
      backgroundColor: colors.evergreen,
      color: colors.white,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '600',
      flexShrink: 0
    },
    actionText: {
      fontSize: '14px',
      color: colors.charcoal,
      lineHeight: 1.5
    },
    metricsBar: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      padding: '24px',
      backgroundColor: '#FAFBFC',
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}`
    },
    metric: {
      textAlign: 'center' as const
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    metricLabel: {
      fontSize: '11px',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px'
    },
    navigation: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: '32px'
    },
    navButton: {
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      backgroundColor: colors.white,
      border: `1px solid ${colors.lightGray}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 120ms ease-out'
    },
    indicators: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center'
    },
    indicator: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: colors.lightGray,
      cursor: 'pointer',
      transition: 'all 120ms ease-out'
    },
    indicatorActive: {
      width: '24px',
      borderRadius: '4px',
      backgroundColor: colors.evergreen
    }
  }

  return (
    <section style={styles.section}>
      <div style={styles.backgroundPattern} />
      <div style={styles.container}>
        <div style={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={styles.badge}>
              <Zap size={14} />
              REAL SCENARIOS
            </div>
            <h2 style={styles.title}>
              Commands That Run
              <br />
              <span style={{ color: colors.evergreen }}>Entire Companies</span>
            </h2>
            <p style={styles.subtitle}>
              Watch how a single command orchestrates hundreds of actions across 
              every department in seconds
            </p>
          </motion.div>
        </div>

        <div style={styles.carouselContainer}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScenario}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              style={styles.scenarioCard}
            >
              {(() => {
                const scenario = scenarios[currentScenario]
                const Icon = scenario.icon
                
                return (
                  <>
                    <div style={styles.scenarioHeader}>
                      <div style={{
                        ...styles.scenarioIcon,
                        backgroundColor: scenario.color + '20'
                      }}>
                        <Icon size={28} color={scenario.color} strokeWidth={1.5} />
                      </div>
                      <div style={styles.scenarioMeta}>
                        <p style={{
                          ...styles.scenarioCategory,
                          color: scenario.color
                        }}>
                          {scenario.category}
                        </p>
                        <h3 style={styles.scenarioTitle}>{scenario.title}</h3>
                      </div>
                    </div>

                    <div style={styles.commandBox}>
                      <p style={styles.commandLabel}>
                        <Zap size={12} />
                        YOUR COMMAND
                      </p>
                      <p style={styles.commandText}>{scenario.command}</p>
                    </div>

                    <div style={styles.systemResponse}>
                      <p style={styles.responseLabel}>SYSTEM ACTIONS (AUTOMATIC)</p>
                      <div style={styles.actionsList}>
                        {scenario.systemActions.slice(0, 4).map((action, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            style={styles.action}
                          >
                            <span style={styles.actionNumber}>{index + 1}</span>
                            <span style={styles.actionText}>{action}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div style={styles.metricsBar}>
                      <div style={styles.metric}>
                        <div style={{
                          ...styles.metricValue,
                          color: colors.evergreen
                        }}>
                          {scenario.metrics.time}
                        </div>
                        <div style={styles.metricLabel}>Response Time</div>
                      </div>
                      <div style={styles.metric}>
                        <div style={{
                          ...styles.metricValue,
                          color: colors.evergreen
                        }}>
                          {scenario.metrics.impact}
                        </div>
                        <div style={styles.metricLabel}>Business Impact</div>
                      </div>
                      <div style={styles.metric}>
                        <div style={{
                          ...styles.metricValue,
                          color: colors.evergreen
                        }}>
                          {scenario.metrics.accuracy}
                        </div>
                        <div style={styles.metricLabel}>Accuracy</div>
                      </div>
                    </div>
                  </>
                )
              })()}
            </motion.div>
          </AnimatePresence>

          <div style={styles.navigation}>
            <button 
              style={styles.navButton}
              onClick={prevScenario}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.softGreen
                e.currentTarget.style.borderColor = colors.evergreen + '30'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white
                e.currentTarget.style.borderColor = colors.lightGray
              }}
            >
              <ChevronLeft size={20} color={colors.charcoal} />
            </button>

            <div style={styles.indicators}>
              {scenarios.map((_, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.indicator,
                    ...(index === currentScenario ? styles.indicatorActive : {})
                  }}
                  onClick={() => {
                    setIsAutoPlaying(false)
                    setCurrentScenario(index)
                  }}
                />
              ))}
            </div>

            <button 
              style={styles.navButton}
              onClick={nextScenario}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.softGreen
                e.currentTarget.style.borderColor = colors.evergreen + '30'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white
                e.currentTarget.style.borderColor = colors.lightGray
              }}
            >
              <ChevronRight size={20} color={colors.charcoal} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}