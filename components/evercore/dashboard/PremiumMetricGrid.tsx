'use client'

import React from 'react'

interface PremiumMetricGridProps {
  children: React.ReactNode
}

export default function PremiumMetricGrid({ children }: PremiumMetricGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  )
}