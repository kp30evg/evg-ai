'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  Sparkles, 
  Terminal, 
  Zap, 
  TrendingUp, 
  Clock,
  Users,
  Shield,
  ChevronRight,
  Send,
  DollarSign,
  Cpu,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function LandingPage() {
  const [command, setCommand] = useState('')
  const [waitlistPosition, setWaitlistPosition] = useState(47833)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  
  // Countdown timer
  useEffect(() => {
    const targetDate = new Date('2025-09-19').getTime()
    
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const difference = targetDate - now
      
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Animated command examples
  const commandExamples = [
    "Show me why margins are dropping...",
    "Prepare for Series B fundraise...",
    "Fire unprofitable customers...",
    "Optimize supply chain by 20%...",
    "Why did Customer X churn?..."
  ]

  const [currentExample, setCurrentExample] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % commandExamples.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Brand colors
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.white,
      color: colors.charcoal,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    },
    heroSection: {
      position: 'relative' as const,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px',
      background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.softGreen} 100%)`
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 20px',
      borderRadius: '24px',
      backgroundColor: colors.softGreen,
      border: `1px solid ${colors.evergreen}`,
      color: colors.evergreen,
      marginBottom: '32px',
      fontSize: '14px',
      fontWeight: '600'
    },
    headline: {
      fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
      fontWeight: '700',
      marginBottom: '24px',
      textAlign: 'center' as const,
      lineHeight: 1.1,
      color: colors.charcoal,
      letterSpacing: '-0.02em'
    },
    headlineAccent: {
      color: colors.evergreen,
      display: 'inline-block'
    },
    subheadline: {
      fontSize: 'clamp(1.125rem, 3vw, 1.375rem)',
      color: colors.mediumGray,
      marginBottom: '48px',
      maxWidth: '720px',
      margin: '0 auto 48px',
      textAlign: 'center' as const,
      lineHeight: 1.6,
      fontWeight: '400'
    },
    commandInterface: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '840px',
      width: '100%',
      margin: '0 auto 48px',
      border: `1px solid ${colors.lightGray}`,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)'
    },
    commandBar: {
      backgroundColor: '#F9FAFB',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      border: `1px solid ${colors.lightGray}`
    },
    input: {
      flex: 1,
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      fontSize: '16px',
      color: colors.charcoal,
      fontFamily: 'Inter, -apple-system, sans-serif'
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 24px',
      borderRadius: '16px',
      backgroundColor: colors.evergreen,
      color: colors.white,
      border: 'none',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 120ms ease-out',
      boxShadow: '0 2px 8px rgba(29, 82, 56, 0.15)'
    },
    goldButton: {
      background: `linear-gradient(135deg, ${colors.gold}, #FACC15)`,
      color: colors.charcoal,
      boxShadow: '0 4px 16px rgba(255, 214, 0, 0.3)',
      fontSize: '16px',
      padding: '14px 28px',
      fontWeight: '600',
      borderRadius: '16px'
    },
    outlineButton: {
      backgroundColor: 'transparent',
      border: `2px solid ${colors.evergreen}`,
      color: colors.evergreen,
      fontWeight: '600'
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '16px',
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: `1px solid ${colors.lightGray}`
    },
    metric: {
      textAlign: 'center' as const
    },
    metricValue: {
      fontSize: '24px',
      fontWeight: '600',
      color: colors.evergreen
    },
    metricLabel: {
      fontSize: '12px',
      color: colors.mediumGray,
      marginTop: '4px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px'
    },
    ctaContainer: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: '16px',
      justifyContent: 'center',
      flexWrap: 'wrap' as const
    },
    trustIndicators: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
      gap: '32px',
      marginTop: '48px',
      fontSize: '14px',
      color: colors.mediumGray
    },
    section: {
      padding: '96px 24px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    sectionLight: {
      backgroundColor: colors.white
    },
    sectionSoft: {
      backgroundColor: '#FAFBFC'
    },
    sectionTitle: {
      fontSize: 'clamp(2rem, 5vw, 3rem)',
      fontWeight: '600',
      marginBottom: '16px',
      textAlign: 'center' as const,
      color: colors.charcoal,
      letterSpacing: '-0.01em'
    },
    sectionSubtitle: {
      fontSize: '18px',
      color: colors.mediumGray,
      maxWidth: '720px',
      margin: '0 auto 56px',
      textAlign: 'center' as const,
      lineHeight: 1.6
    },
    grid3: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '32px',
      border: `1px solid ${colors.lightGray}`,
      transition: 'all 120ms ease-out',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    },
    competitorCard: {
      position: 'relative' as const,
      backgroundColor: '#FFF5F5',
      border: '1px solid #FEE2E2'
    },
    greenCard: {
      backgroundColor: colors.softGreen,
      border: `1px solid ${colors.evergreen}20`
    },
    countdownGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '16px',
      maxWidth: '600px',
      margin: '0 auto'
    },
    countdownCard: {
      backgroundColor: colors.softGreen,
      borderRadius: '16px',
      padding: '24px',
      textAlign: 'center' as const,
      border: `1px solid ${colors.evergreen}20`
    },
    countdownValue: {
      fontSize: '36px',
      fontWeight: '600',
      color: colors.evergreen
    },
    countdownLabel: {
      fontSize: '11px',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      marginTop: '8px',
      fontWeight: '500'
    },
    finalCta: {
      textAlign: 'center' as const,
      padding: '120px 24px',
      background: `linear-gradient(180deg, ${colors.softGreen} 0%, ${colors.white} 100%)`
    },
    formCard: {
      backgroundColor: colors.white,
      borderRadius: '16px',
      padding: '48px',
      maxWidth: '480px',
      margin: '0 auto 32px',
      border: `1px solid ${colors.lightGray}`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
    },
    formInput: {
      width: '100%',
      padding: '14px 20px',
      borderRadius: '12px',
      backgroundColor: '#F9FAFB',
      border: `1px solid ${colors.lightGray}`,
      color: colors.charcoal,
      fontSize: '16px',
      marginBottom: '16px',
      outline: 'none',
      fontFamily: 'Inter, -apple-system, sans-serif',
      transition: 'border 120ms ease-out'
    }
  }

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={styles.badge}
        >
          <Sparkles size={16} />
          <span>Launching September 19, 2025</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={styles.headline}
        >
          Run Your Entire Business
          <br />
          <span style={styles.headlineAccent}>
            By Typing Commands
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={styles.subheadline}
        >
          The AI OS that replaces 130+ business tools with one unified platform. 
          Natural language commands control everything. 48-hour migration guaranteed.
        </motion.p>

        {/* ChatGPT-style Command Interface */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          style={styles.commandInterface}
        >
          <div style={{marginBottom: '20px'}}>
            <span style={{fontSize: '12px', fontWeight: '600', color: colors.mediumGray, textTransform: 'uppercase', letterSpacing: '0.5px'}}>
              Live Command Center
            </span>
          </div>

          <div style={styles.commandBar}>
            <Terminal size={20} color={colors.evergreen} />
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={commandExamples[currentExample]}
              style={styles.input}
            />
            <button style={styles.button}>
              <Send size={14} />
              Execute
            </button>
          </div>

          <div style={styles.metricsGrid}>
            <div style={styles.metric}>
              <div style={styles.metricValue}>0.3s</div>
              <div style={styles.metricLabel}>Response</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>20+</div>
              <div style={styles.metricLabel}>Modules</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>100%</div>
              <div style={styles.metricLabel}>Natural</div>
            </div>
            <div style={styles.metric}>
              <div style={styles.metricValue}>∞</div>
              <div style={styles.metricLabel}>Possible</div>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={styles.ctaContainer}
        >
          <button style={styles.goldButton}>
            Join Waitlist → Position #{waitlistPosition.toLocaleString()}
          </button>
          <button style={{...styles.button, ...styles.outlineButton}}>
            Watch It Replace Salesforce
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={styles.trustIndicators}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Users size={16} color={colors.evergreen} />
            <span>10,847 companies waiting</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <DollarSign size={16} color={colors.evergreen} />
            <span>$73M costs eliminated</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Clock size={16} color={colors.evergreen} />
            <span>48-hour migration</span>
          </div>
        </motion.div>
      </section>

      {/* One Platform Section */}
      <section style={{...styles.section, ...styles.sectionSoft}}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={styles.sectionTitle}>
            One Command.
            <span style={{color: colors.evergreen}}> Every Department.</span>
          </h2>
          <p style={styles.sectionSubtitle}>
            Watch a single command orchestrate across your entire business instantly
          </p>

          <div style={styles.grid3}>
            {[
              {
                title: "Sales",
                command: '"Close the Johnson deal"',
                effects: ["✓ Invoice generated", "✓ Inventory allocated", "✓ Commission calculated", "✓ Shipping scheduled"],
                icon: TrendingUp,
                color: colors.evergreen
              },
              {
                title: "Operations", 
                command: '"Optimize supply chain 20%"',
                effects: ["✓ Vendors analyzed", "✓ Costs renegotiated", "✓ Routes optimized", "✓ Inventory adjusted"],
                icon: Cpu,
                color: colors.evergreen
              },
              {
                title: "Finance",
                command: '"Forecast Q4 recession"',
                effects: ["✓ Scenarios modeled", "✓ Costs identified", "✓ Cash preserved", "✓ Teams notified"],
                icon: DollarSign,
                color: colors.evergreen
              }
            ].map((dept, i) => {
              const Icon = dept.icon
              return (
                <motion.div
                  key={dept.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  style={styles.card}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <Icon size={32} color={dept.color} strokeWidth={1.5} />
                  <h3 style={{fontSize: '20px', fontWeight: '600', margin: '16px 0', color: colors.charcoal}}>
                    {dept.title}
                  </h3>
                  <div style={{backgroundColor: colors.softGreen, borderRadius: '8px', padding: '12px 16px', marginBottom: '20px'}}>
                    <code style={{color: colors.evergreen, fontSize: '13px', fontWeight: '500'}}>
                      {dept.command}
                    </code>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    {dept.effects.map((effect, j) => (
                      <div key={j} style={{display: 'flex', alignItems: 'center', gap: '8px', color: colors.mediumGray, fontSize: '14px'}}>
                        <span style={{color: colors.evergreen}}>{effect}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </section>

      {/* Countdown Timer Section */}
      <section style={{...styles.section, ...styles.sectionLight}}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={styles.sectionTitle}>
            The Revolution Begins In
          </h2>
          <p style={styles.sectionSubtitle}>
            First 10,000 companies get founder pricing forever
          </p>

          <div style={styles.countdownGrid}>
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} style={styles.countdownCard}>
                <div style={styles.countdownValue}>
                  {value.toString().padStart(2, '0')}
                </div>
                <div style={styles.countdownLabel}>
                  {unit}
                </div>
              </div>
            ))}
          </div>

          <div style={{textAlign: 'center', marginTop: '48px'}}>
            <button style={{...styles.goldButton, fontSize: '18px', padding: '16px 40px'}}>
              Reserve Your Position Now →
            </button>
            <p style={{color: colors.mediumGray, marginTop: '16px', fontSize: '14px'}}>
              Jump 1,000 spots for every referral
            </p>
          </div>
        </motion.div>
      </section>

      {/* Competitor Comparison */}
      <section style={{...styles.section, ...styles.sectionSoft}}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 style={styles.sectionTitle}>
            Why They Can't Build This
          </h2>
          <p style={styles.sectionSubtitle}>
            Legacy architecture is their permanent prison
          </p>

          <div style={styles.grid3}>
            {[
              {
                company: "Salesforce",
                problems: ["60+ acquisitions = 60+ databases", "MuleSoft exists because nothing connects", "Each cloud is a different product"],
                migration: "48 hours"
              },
              {
                company: "Microsoft", 
                problems: ["7 separate Dynamics products", "Different Copilots for each silo", "Teams doesn't know Finance exists"],
                migration: "48 hours"
              },
              {
                company: "SAP",
                problems: ["14,000 database tables", "5-year implementations standard", "ABAP code from 1992"],
                migration: "48 hours"
              }
            ].map((competitor, i) => (
              <motion.div
                key={competitor.company}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={styles.competitorCard}
              >
                <h3 style={{fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: colors.charcoal}}>
                  {competitor.company}
                </h3>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px'}}>
                  {competitor.problems.map((problem, j) => (
                    <div key={j} style={{display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px'}}>
                      <XCircle size={16} color="#EF4444" style={{marginTop: '2px', flexShrink: 0}} />
                      <span style={{color: colors.mediumGray}}>{problem}</span>
                    </div>
                  ))}
                </div>
                <div style={{paddingTop: '20px', borderTop: `1px solid ${colors.lightGray}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{color: colors.mediumGray, fontSize: '14px'}}>Our migration time:</span>
                  <span style={{fontSize: '20px', fontWeight: '600', color: colors.evergreen}}>
                    {competitor.migration}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{textAlign: 'center', marginTop: '48px'}}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              borderRadius: '24px',
              backgroundColor: colors.softGreen,
              border: `1px solid ${colors.evergreen}20`
            }}>
              <TrendingUp size={18} color={colors.evergreen} />
              <span style={{fontSize: '16px'}}>
                <span style={{fontWeight: '600', color: colors.evergreen}}>437</span>
                <span style={{color: colors.mediumGray}}> companies switching today</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section style={styles.finalCta}>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 style={{...styles.sectionTitle, fontSize: 'clamp(2.5rem, 6vw, 3.5rem)'}}>
            The Last Software Decision
            <br />
            <span style={{color: colors.evergreen}}>
              You'll Ever Make
            </span>
          </h2>
          <p style={{...styles.sectionSubtitle, fontSize: '20px', marginBottom: '48px'}}>
            Join 10,847 companies abandoning fragmented tools 
            for unified intelligence
          </p>

          <div style={styles.formCard}>
            <h3 style={{fontSize: '24px', fontWeight: '600', marginBottom: '32px', color: colors.charcoal}}>
              Secure Your Position
            </h3>
            <div>
              <input
                type="email"
                placeholder="your@company.com"
                style={styles.formInput}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.evergreen}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.lightGray}
              />
              <input
                type="text"
                placeholder="Company Name"
                style={styles.formInput}
                onFocus={(e) => e.currentTarget.style.borderColor = colors.evergreen}
                onBlur={(e) => e.currentTarget.style.borderColor = colors.lightGray}
              />
              <button style={{...styles.goldButton, width: '100%', fontSize: '16px', padding: '16px'}}>
                Reserve Position #{(waitlistPosition + 1).toLocaleString()} →
              </button>
            </div>

            <div style={{marginTop: '32px', paddingTop: '32px', borderTop: `1px solid ${colors.lightGray}`}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', color: colors.mediumGray}}>
                <Shield size={16} color={colors.evergreen} />
                <span>SOC 2 Type II • GDPR • HIPAA Compliant</span>
              </div>
            </div>
          </div>

          <p style={{color: colors.mediumGray, fontSize: '14px'}}>
            If we can't migrate you in 48 hours, we pay YOU $10,000
          </p>
        </motion.div>
      </section>
    </div>
  )
}