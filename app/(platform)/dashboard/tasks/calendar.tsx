'use client'

import React from 'react'
import { theme } from '@/lib/evercore/theme'

export default function CalendarView() {
  return (
    <div style={{
      padding: theme.spacing['2xl'],
      backgroundColor: theme.colors.softGray,
      minHeight: '100vh'
    }}>
      <div style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing['2xl'],
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.charcoal,
          marginBottom: theme.spacing.md
        }}>Calendar View</h2>
        <p style={{
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.mediumGray
        }}>Timeline view coming soon...</p>
      </div>
    </div>
  )
}