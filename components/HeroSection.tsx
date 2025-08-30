'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check, Users, Zap } from 'lucide-react'
import CommandInterface from './HeroSection-CommandInterface'

export default function HeroSection() {
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
      position: 'relative' as const,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      backgroundColor: colors.white,
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
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '80px 24px 80px',
      position: 'relative' as const,
      zIndex: 1
    },
    innerContainer: {
      maxWidth: '1400px',
      margin: '0 auto',
      width: '100%'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '40% 55%',
      gap: '5%',
      alignItems: 'center'
    }
  }

  return (
    <section style={styles.section}>
      <div style={styles.backgroundPattern} />
      {/* Main Content Container */}
      <div style={styles.container}>
        <div style={styles.innerContainer}>
          <div style={styles.grid}>
            
            {/* Left Column - Text Content */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div style={{
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
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '24px'
                }}>
                  <Zap size={14} />
                  UNIFIED OPERATING SYSTEM
                </div>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                  fontWeight: '600',
                  color: colors.charcoal,
                  letterSpacing: '-0.02em',
                  marginBottom: '16px',
                  lineHeight: 1.1
                }}
              >
                Run Your Entire Business<br />
                <span style={{ color: colors.evergreen }}>By Typing</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                style={{
                  fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
                  color: colors.mediumGray,
                  fontWeight: '400',
                  lineHeight: 1.5,
                  marginBottom: '32px'
                }}
              >
                Replace 130+ business tools with ONE platform controlled entirely through natural language commands. Watch your business transform.
              </motion.p>

              {/* CTA Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* CTA Button */}
                <div>
                  <a href="#waitlist" style={{ display: 'inline-block' }}>
                    <button 
                      style={{ 
                        backgroundColor: colors.evergreen,
                        color: colors.white,
                        padding: '16px 32px',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 120ms ease-out',
                        boxShadow: '0 10px 30px rgba(29, 82, 56, 0.15)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(29, 82, 56, 0.25)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(29, 82, 56, 0.15)'
                      }}
                    >
                      <span>Reserve Your Position</span>
                      <ArrowRight size={20} />
                    </button>
                  </a>
                  
                  {/* Spots remaining and waitlist */}
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '14px'
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>Only 47 spots remaining</span>
                    <span style={{ color: colors.mediumGray }}>•</span>
                    <span style={{ color: colors.charcoal, fontWeight: '500' }}>10,847 companies on waitlist</span>
                  </div>
                </div>

                {/* Features */}
                <div style={{
                  marginTop: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {[
                    '48-hour migration from any system',
                    'No credit card required',
                    'Founder pricing locked forever'
                  ].map((feature, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: colors.softGreen,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Check size={12} color={colors.evergreen} strokeWidth={3} />
                      </div>
                      <span style={{
                        fontSize: '14px',
                        color: colors.charcoal
                      }}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Trust indicators */}
                <div style={{
                  marginTop: '40px',
                  padding: '20px',
                  backgroundColor: '#FAFBFC',
                  borderRadius: '12px',
                  border: `1px solid ${colors.lightGray}`
                }}>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.mediumGray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                  }}>REPLACING 130+ TOOLS INCLUDING</p>
                  <p style={{
                    fontSize: '14px',
                    color: colors.charcoal
                  }}>
                    Salesforce • HubSpot • NetSuite • Monday • Slack • 125+ others
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Command Interface */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div style={{
                backgroundColor: colors.white,
                borderRadius: '24px',
                padding: '8px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.08)',
                border: `1px solid ${colors.lightGray}50`
              }}>
                <CommandInterface />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          backgroundColor: '#FAFBFC',
          borderTop: `1px solid ${colors.lightGray}`,
          padding: '24px'
        }}
      >
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '32px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.evergreen,
              marginBottom: '4px'
            }}>$73M+</div>
            <div style={{
              fontSize: '11px',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>Software Costs Eliminated</div>
          </div>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.evergreen,
              marginBottom: '4px'
            }}>437</div>
            <div style={{
              fontSize: '11px',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>Migrations This Week</div>
          </div>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.evergreen,
              marginBottom: '4px'
            }}>48 hrs</div>
            <div style={{
              fontSize: '11px',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>Average Implementation</div>
          </div>
          <div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: colors.evergreen,
              marginBottom: '4px'
            }}>Sept 19</div>
            <div style={{
              fontSize: '11px',
              color: colors.mediumGray,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>Launch Date 2025</div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}