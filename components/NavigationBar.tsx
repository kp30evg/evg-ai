'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function NavigationBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600'
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const styles = {
    nav: {
      position: 'fixed' as const,
      top: 0,
      width: '100%',
      zIndex: 50,
      backgroundColor: isScrolled ? colors.white : `${colors.white}F2`,
      backdropFilter: 'blur(12px)',
      borderBottom: isScrolled ? `1px solid ${colors.lightGray}50` : 'none',
      transition: 'all 200ms ease-out',
      boxShadow: isScrolled ? '0 4px 20px rgba(0, 0, 0, 0.04)' : 'none'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px'
    },
    wrapper: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px'
    }
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.wrapper}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <motion.a 
              href="/" 
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                position: 'relative'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span style={{
                fontSize: '22px',
                fontWeight: '700',
                background: `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}DD 50%, ${colors.evergreen} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
                position: 'relative',
                textShadow: '0 2px 8px rgba(29, 82, 56, 0.1)',
                transition: 'all 300ms ease-out'
              }}>
                evergreen
                <span style={{
                  background: `linear-gradient(135deg, ${colors.charcoal}EE 0%, ${colors.charcoal}CC 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: '300',
                  fontSize: '22px',
                  letterSpacing: '0.02em'
                }}>OS</span>
              </span>
            </motion.a>
          </div>

          {/* Desktop Navigation */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '40px'
          }} className="md:flex">
            {['Product', 'Architecture', 'Demo', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                style={{
                  color: colors.charcoal,
                  fontSize: '15px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  transition: 'color 120ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.evergreen
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.charcoal
                }}
              >
                {item}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <motion.a
              href="/sign-in"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 20px',
                color: colors.evergreen,
                fontSize: '14px',
                fontWeight: '500',
                background: colors.white,
                border: `2px solid ${colors.evergreen}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 120ms ease-out',
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.softGreen
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white
              }}
            >
              Sign In
            </motion.a>
            <motion.a
              href="/sign-up"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '10px 24px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 82, 56, 0.15)',
                transition: 'all 120ms ease-out',
                textDecoration: 'none',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(29, 82, 56, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 82, 56, 0.15)'
              }}
            >
              Sign Up
            </motion.a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                color: colors.charcoal,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px'
              }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            backgroundColor: colors.white,
            borderTop: `1px solid ${colors.lightGray}`,
            padding: '20px 24px'
          }}
          className="md:hidden"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['Product', 'Architecture', 'Demo', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: colors.charcoal,
                  fontSize: '15px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 120ms ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.softGreen
                  e.currentTarget.style.color = colors.evergreen
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = colors.charcoal
                }}
              >
                {item}
              </a>
            ))}
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${colors.lightGray}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <a href="/sign-in" style={{
                width: '100%',
                padding: '12px 20px',
                color: colors.charcoal,
                fontSize: '14px',
                fontWeight: '500',
                background: 'none',
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '10px',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center'
              }}>
                Sign In
              </a>
              <a href="/sign-up" style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'block',
                textAlign: 'center'
              }}>
                Get Started
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  )
}