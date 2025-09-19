'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

export interface Tab {
  id: string
  label: string
  icon?: LucideIcon | null
  badge?: number
}

interface CRMTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function CRMTabs({ tabs, activeTab, onTabChange }: CRMTabsProps) {
  return (
    <div style={{
      backgroundColor: theme.colors.white,
      borderBottom: `1px solid ${theme.colors.lightGray}`,
      paddingLeft: theme.spacing['2xl'],
      paddingRight: theme.spacing['2xl'],
    }}>
      <div style={{
        display: 'flex',
        gap: theme.spacing.xl,
        position: 'relative',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.md} 0`,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive 
                  ? `2px solid ${theme.colors.evergreen}` 
                  : '2px solid transparent',
                color: isActive ? theme.colors.evergreen : theme.colors.mediumGray,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: theme.transitions.fast,
                position: 'relative',
              }}
              whileHover={{
                color: theme.colors.evergreen,
              }}
            >
              {Icon && <Icon size={18} />}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span style={{
                  backgroundColor: isActive
                    ? theme.colors.evergreen
                    : theme.colors.lightGray,
                  color: isActive
                    ? theme.colors.white
                    : theme.colors.mediumGray,
                  fontSize: '12px',
                  fontWeight: theme.typography.fontWeight.medium,
                  padding: '2px 6px',
                  borderRadius: theme.borderRadius.sm,
                  minWidth: '20px',
                  textAlign: 'center',
                  marginLeft: '4px',
                }}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
              
              {/* Active Indicator Animation */}
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: theme.colors.evergreen,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}