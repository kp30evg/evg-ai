'use client'

import React from 'react'
import { theme } from '@/lib/evercore/theme'

interface MetricGridProps {
  children: React.ReactNode
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
    wide?: number
  }
}

export default function MetricGrid({ 
  children,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 4,
    wide: 6,
  }
}: MetricGridProps) {
  return (
    <div style={{
      display: 'grid',
      gap: theme.spacing.xl,
      gridTemplateColumns: `repeat(${columns.desktop}, 1fr)`,
    }}>
      {children}
      
      <style jsx>{`
        @media (max-width: ${theme.breakpoints.tablet}) {
          div {
            grid-template-columns: repeat(${columns.tablet}, 1fr) !important;
          }
        }
        
        @media (max-width: 640px) {
          div {
            grid-template-columns: repeat(${columns.mobile}, 1fr) !important;
          }
        }
        
        @media (min-width: ${theme.breakpoints.wide}) {
          div {
            grid-template-columns: repeat(${columns.wide}, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}