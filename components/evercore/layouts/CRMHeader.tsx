'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Settings,
  Users,
  Building2,
  Target,
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

interface CRMHeaderProps {
  title?: string
  subtitle?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onCreateContact?: () => void
  onCreateCompany?: () => void
  onCreateDeal?: () => void
  actions?: React.ReactNode
}

export default function CRMHeader({
  title = 'EverCore',
  subtitle = 'Complete customer relationship management with AI insights',
  searchValue = '',
  onSearchChange,
  onCreateContact,
  onCreateCompany,
  onCreateDeal,
  actions,
}: CRMHeaderProps) {
  return (
    <div style={{
      backgroundColor: theme.colors.white,
      borderBottom: `1px solid ${theme.colors.lightGray}`,
      padding: `${theme.spacing.xl} ${theme.spacing['2xl']}`,
    }}>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
      }}>
        {/* Title Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.xs,
          }}>
            <h1 style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              margin: 0,
            }}>
              {title}
            </h1>
            <span style={{
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.evergreen,
              backgroundColor: theme.colors.softGreen,
              padding: `2px ${theme.spacing.sm}`,
              borderRadius: theme.borderRadius.full,
            }}>
              Autonomous CRM
            </span>
          </div>
          <p style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.mediumGray,
            margin: 0,
          }}>
            {subtitle}
          </p>
        </div>

        {/* Actions Section */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.md,
          alignItems: 'center',
        }}>
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            width: '320px',
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.mediumGray,
            }} />
            <input
              type="text"
              placeholder="Search contacts, deals, companies..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.md} ${theme.spacing.lg} ${theme.spacing.md} 40px`,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                backgroundColor: theme.colors.white,
                color: theme.colors.charcoal,
                outline: 'none',
                transition: theme.transitions.fast,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.evergreen
                e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.evergreen}15`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.lightGray
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.sm,
          }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateContact}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.evergreen,
                color: theme.colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              <Plus size={18} />
              New Contact
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateDeal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.white,
                color: theme.colors.evergreen,
                border: `2px solid ${theme.colors.evergreen}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              <Target size={18} />
              New Deal
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateCompany}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.white,
                color: theme.colors.evergreen,
                border: `2px solid ${theme.colors.evergreen}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: theme.transitions.fast,
              }}
            >
              <Building2 size={18} />
              New Company
            </motion.button>
          </div>

          {/* Additional Actions */}
          {actions}
        </div>
      </div>
    </div>
  )
}