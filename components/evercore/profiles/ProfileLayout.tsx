'use client'

import React from 'react'
import { theme } from '@/lib/evercore/theme'

interface ProfileLayoutProps {
  leftColumn: React.ReactNode
  middleColumn: React.ReactNode
  rightColumn: React.ReactNode
}

export default function ProfileLayout({
  leftColumn,
  middleColumn,
  rightColumn,
}: ProfileLayoutProps) {
  return (
    <div style={{
      display: 'flex',
      gap: theme.spacing.xl,
      height: '100%',
      backgroundColor: theme.colors.lightGray + '20',
      padding: theme.spacing.xl,
    }}>
      {/* Left Column - Fixed Width */}
      <div style={{
        width: '300px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg,
      }}>
        {leftColumn}
      </div>

      {/* Middle Column - Flexible */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg,
        minWidth: 0, // Allow content to shrink
      }}>
        {middleColumn}
      </div>

      {/* Right Column - Fixed Width */}
      <div style={{
        width: '350px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.lg,
      }}>
        {rightColumn}
      </div>
    </div>
  )
}