'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

interface MetricCardProps {
  icon: LucideIcon
  iconColor?: string
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  onClick?: () => void
}

export default function MetricCard({
  icon: Icon,
  iconColor = theme.colors.evergreen,
  label,
  value,
  change,
  changeLabel = 'vs last period',
  onClick,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!change) return null
    if (change > 0) return TrendingUp
    if (change < 0) return TrendingDown
    return Minus
  }

  const getTrendColor = () => {
    if (!change) return theme.colors.mediumGray
    if (change > 0) return theme.colors.success
    if (change < 0) return theme.colors.error
    return theme.colors.mediumGray
  }

  const TrendIcon = getTrendIcon()

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.white,
        border: `1px solid ${theme.colors.lightGray}`,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.xl,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: theme.shadows.base,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = theme.shadows.lg
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.base
      }}
    >
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: '100px',
        height: '100px',
        borderRadius: theme.borderRadius.full,
        background: `linear-gradient(135deg, ${iconColor}10, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative' }}>
        {/* Icon */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: theme.borderRadius.base,
          backgroundColor: `${iconColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing.lg,
        }}>
          <Icon size={24} style={{ color: iconColor }} />
        </div>

        {/* Label */}
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.mediumGray,
          fontWeight: theme.typography.fontWeight.medium,
          marginBottom: theme.spacing.sm,
        }}>
          {label}
        </div>

        {/* Value */}
        <div style={{
          fontSize: '32px',
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.charcoal,
          lineHeight: 1.2,
          marginBottom: change !== undefined ? theme.spacing.sm : 0,
        }}>
          {value}
        </div>

        {/* Change Indicator */}
        {change !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
          }}>
            {TrendIcon && (
              <TrendIcon size={16} style={{ color: getTrendColor() }} />
            )}
            <span style={{
              color: getTrendColor(),
              fontWeight: theme.typography.fontWeight.medium,
            }}>
              {change > 0 && '+'}
              {change}%
            </span>
            <span style={{
              color: theme.colors.mediumGray,
              fontSize: theme.typography.fontSize.xs,
            }}>
              {changeLabel}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}