'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Terminal, ArrowRight, Send, Zap } from 'lucide-react'

export default function HeroSection() {
  const [command, setCommand] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  const commandExamples = [
    { text: "Fire unprofitable customers in Texas", time: "0.3s" },
    { text: "Show me why margins are dropping", time: "0.2s" },
    { text: "Prepare for Series B fundraise", time: "0.4s" },
    { text: "Optimize supply chain by 20%", time: "0.3s" },
    { text: "Why did Customer X churn?", time: "0.2s" },
    { text: "Schedule follow-ups for all deals closing this month", time: "0.3s" }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % commandExamples.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

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
    section: {
      minHeight: '100vh',
      paddingTop: '120px',
      paddingBottom: '80px',
      background: `linear-gradient(180deg, ${colors.white} 0%, ${colors.softGreen}20 50%, ${colors.white} 100%)`,
      position: 'relative' as const
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 24px'
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 20px',
      borderRadius: '24px',
      backgroundColor: colors.softGreen,
      border: `1px solid ${colors.evergreen}30`,
      color: colors.evergreen,
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '32px'
    },
    headline: {
      fontSize: 'clamp(3rem, 7vw, 5rem)',
      fontWeight: '700',
      lineHeight: 1.05,
      letterSpacing: '-0.03em',
      color: colors.charcoal,
      marginBottom: '24px',
      maxWidth: '900px'
    },
    subheadline: {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
      color: colors.mediumGray,
      lineHeight: 1.5,
      marginBottom: '48px',
      maxWidth: '700px',
      fontWeight: '400'
    },
    commandDemo: {
      backgroundColor: colors.white,
      borderRadius: '20px',
      padding: '40px',
      maxWidth: '900px',
      margin: '0 auto',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
      border: `1px solid ${colors.lightGray}50`,
      position: 'relative' as const,
      overflow: 'hidden'
    },
    glow: {
      position: 'absolute' as const,
      top: '-50%',
      left: '-50%',
      right: '-50%',
      bottom: '-50%',
      background: `radial-gradient(circle, ${colors.evergreen}05 0%, transparent 70%)`,
      pointerEvents: 'none' as const,
      animation: 'pulse 4s ease-in-out infinite'
    },
    commandHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    commandLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    statusIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#10B981',
      animation: 'pulse 2s ease-in-out infinite'
    },
    commandInput: {
      backgroundColor: '#FAFBFC',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      border: `1px solid ${colors.lightGray}`,
      transition: 'all 120ms ease-out'
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
    sendButton: {
      padding: '10px 20px',
      backgroundColor: colors.evergreen,
      color: colors.white,
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 120ms ease-out'
    },
    responsePreview: {
      marginTop: '24px',
      padding: '20px',
      backgroundColor: '#FAFBFC',
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}`
    },
    metrics: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
      gap: '16px',
      marginTop: '24px'
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
      fontSize: '11px',
      color: colors.mediumGray,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.5px',
      marginTop: '4px'
    },
    ctaContainer: {
      display: 'flex',
      gap: '16px',
      marginTop: '48px',
      flexWrap: 'wrap' as const
    },
    primaryCta: {
      padding: '16px 32px',
      backgroundColor: colors.gold,
      color: colors.charcoal,
      border: 'none',
      borderRadius: '14px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 16px rgba(255, 214, 0, 0.3)',
      transition: 'all 120ms ease-out'
    },
    secondaryCta: {
      padding: '16px 32px',
      backgroundColor: 'transparent',
      color: colors.evergreen,
      border: `2px solid ${colors.evergreen}`,
      borderRadius: '14px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 120ms ease-out'
    }
  }

  const pulseAnimation = `
    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseAnimation }} />
      <section style={styles.section}>
        <div style={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center' }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.badge}
            >
              <Sparkles size={16} />
              <span>Launching September 19, 2025</span>
            </motion.div>

            <h1 style={styles.headline}>
              Run Your Entire Business
              <br />
              <span style={{ color: colors.evergreen }}>
                By Typing Commands
              </span>
            </h1>

            <p style={styles.subheadline}>
              The AI OS that replaces 130+ business tools with one unified platform.
              <br />
              Natural language commands control everything.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={styles.commandDemo}
          >
            <div style={styles.glow} />
            
            <div style={styles.commandHeader}>
              <div style={styles.commandLabel}>
                <Terminal size={16} />
                LIVE COMMAND CENTER
              </div>
              <div style={styles.statusIndicator}>
                <div style={styles.statusDot} />
                <span style={{ fontSize: '12px', color: colors.mediumGray }}>
                  Ready
                </span>
              </div>
            </div>

            <div 
              style={styles.commandInput}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)'
                e.currentTarget.style.borderColor = `${colors.evergreen}30`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = colors.lightGray
              }}
            >
              <Zap size={20} color={colors.evergreen} />
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder={commandExamples[currentPlaceholder].text}
                style={styles.input}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
              />
              <button 
                style={styles.sendButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(29, 82, 56, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Execute
                <Send size={14} />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!isTyping && (
                <motion.div
                  key={currentPlaceholder}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={styles.responsePreview}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ ...styles.statusDot, backgroundColor: colors.evergreen }} />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: colors.evergreen }}>
                      AI Processing
                    </span>
                    <span style={{ fontSize: '12px', color: colors.mediumGray }}>
                      • Response time: {commandExamples[currentPlaceholder].time}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: colors.mediumGray, margin: 0 }}>
                    Analyzing data across 20 integrated modules...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={styles.metrics}>
              <div style={styles.metric}>
                <div style={styles.metricValue}>0.3s</div>
                <div style={styles.metricLabel}>Response</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>130+</div>
                <div style={styles.metricLabel}>Tools Replaced</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>100%</div>
                <div style={styles.metricLabel}>Natural</div>
              </div>
              <div style={styles.metric}>
                <div style={styles.metricValue}>48hr</div>
                <div style={styles.metricLabel}>Migration</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ textAlign: 'center' }}
          >
            <div style={styles.ctaContainer}>
              <button 
                style={styles.primaryCta}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 214, 0, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 214, 0, 0.3)'
                }}
              >
                Join Waitlist
                <ArrowRight size={18} />
              </button>
              <button 
                style={styles.secondaryCta}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.softGreen
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Watch Demo
              </button>
            </div>

            <p style={{ marginTop: '24px', fontSize: '14px', color: colors.mediumGray }}>
              <strong style={{ color: colors.evergreen }}>10,847</strong> companies waiting • 
              <strong style={{ color: colors.evergreen }}> $73M</strong> costs eliminated
            </p>
          </motion.div>
        </div>
      </section>
    </>
  )
}