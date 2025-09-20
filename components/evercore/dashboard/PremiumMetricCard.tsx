'use client'

import React from 'react'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface PremiumMetricCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: string
  trendDirection?: 'up' | 'down'
  onClick?: () => void
}

export default function PremiumMetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendDirection,
  onClick,
}: PremiumMetricCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
          <Icon className="h-5 w-5 text-emerald-600" />
        </div>
        {trendDirection && (
          <div className="flex items-center gap-1">
            {trendDirection === 'up' ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {trend && (
          <div className={`text-xs font-medium ${
            trendDirection === 'up' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}