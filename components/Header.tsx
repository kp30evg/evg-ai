'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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

  const navItems = [
    { label: 'Product', href: '#product' },
    { label: 'Why Us', href: '#why-us' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Blog', href: '#blog' },
    { label: 'Login', href: '#login' }
  ]

  const styles = {
    header: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: colors.white,
      borderBottom: `1px solid ${scrolled ? colors.lightGray : 'transparent'}`,
      boxShadow: scrolled ? '0 1px 3px rgba(0, 0, 0, 0.05)' : 'none',
      transition: 'all 120ms ease-out'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '20px',
      fontWeight: '600',
      color: colors.evergreen,
      textDecoration: 'none',
      letterSpacing: '-0.02em'
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px'
    },
    navLinks: {
      display: 'flex',
      gap: '32px',
      alignItems: 'center'
    },
    navLink: {
      color: colors.charcoal,
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'color 120ms ease-out',
      cursor: 'pointer'
    },
    ctaButton: {
      padding: '12px 24px',
      background: `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}dd 100%)`,
      color: colors.white,
      border: 'none',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      transition: 'all 120ms ease-out',
      boxShadow: '0 2px 8px rgba(29, 82, 56, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    },
    mobileMenuButton: {
      display: 'none',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      color: colors.charcoal
    },
    mobileMenu: {
      position: 'fixed' as const,
      top: '68px',
      left: 0,
      right: 0,
      backgroundColor: colors.white,
      borderBottom: `1px solid ${colors.lightGray}`,
      padding: '24px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '24px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
    },
    mobileNavLink: {
      color: colors.charcoal,
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '500'
    }
  }

  const responsiveStyles = `
    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .mobile-menu-btn { display: block !important; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
      <header style={styles.header}>
        <div style={styles.container}>
          <a href="/" style={styles.logo}>
            {/* Pine tree logo SVG */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '8px' }}>
              <path d="M7 18L12 8L17 18H14V22H10V18H7Z" fill={colors.evergreen} />
              <path d="M6 18L11 8L8 13H6Z" fill={colors.evergreen} opacity="0.7" />
              <path d="M18 18L13 8L16 13H18Z" fill={colors.evergreen} opacity="0.7" />
            </svg>
            <span style={{ color: colors.evergreen }}>Evergreen</span>
            <span style={{ color: colors.charcoal, fontWeight: '400', marginLeft: '4px' }}>A.I.</span>
          </a>

          <nav style={styles.nav} className="desktop-nav">
            <div style={styles.navLinks}>
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={styles.navLink}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.evergreen
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.textShadow = `0 0 8px rgba(255, 214, 0, 0.3)`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.charcoal
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.textShadow = 'none'
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <button 
              style={styles.ctaButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                e.currentTarget.style.boxShadow = `0 8px 20px rgba(29, 82, 56, 0.25), 0 0 20px rgba(255, 214, 0, 0.15)`
                e.currentTarget.style.background = `linear-gradient(135deg, ${colors.evergreen} 0%, rgba(255, 214, 0, 0.8) 100%)`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(29, 82, 56, 0.15)'
                e.currentTarget.style.background = `linear-gradient(135deg, ${colors.evergreen} 0%, ${colors.evergreen}dd 100%)`
              }}
            >
              Get Started
            </button>
          </nav>

          <button 
            className="mobile-menu-btn"
            style={styles.mobileMenuButton}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={styles.mobileMenu}
          >
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={styles.mobileNavLink}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <button 
              style={{ ...styles.ctaButton, width: '100%' }}
            >
              Get Started
            </button>
          </motion.div>
        )}
      </header>
    </>
  )
}