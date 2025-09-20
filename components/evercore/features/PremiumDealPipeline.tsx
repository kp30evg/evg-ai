'use client'

import React, { useState, DragEvent } from 'react'
import { useCRM } from '@/lib/contexts/crm-context'
import { Deal } from '@/lib/contexts/crm-context'
import { 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Users,
  Clock
} from 'lucide-react'

interface PremiumDealPipelineProps {
  onDealClick?: (dealId: string) => void
  onCreateDeal?: (stageId: string) => void
  showMetrics?: boolean
}

export default function PremiumDealPipeline({ 
  onDealClick, 
  onCreateDeal,
  showMetrics = true 
}: PremiumDealPipelineProps) {
  const { deals, moveDealToStage, getMetrics } = useCRM()
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set())
  
  const metrics = getMetrics()
  
  // Convert deals to pipeline stages
  const stages = [
    { id: 'prospecting', name: 'Prospecting', color: 'blue' },
    { id: 'qualification', name: 'Qualification', color: 'purple' },
    { id: 'proposal', name: 'Proposal', color: 'amber' },
    { id: 'negotiation', name: 'Negotiation', color: 'orange' },
    { id: 'closed-won', name: 'Closed Won', color: 'emerald' },
  ].map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage.name)
    return {
      ...stage,
      deals: stageDeals,
      totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
      count: stageDeals.length
    }
  })

  // Drag handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, dealId: string) => {
    setDraggedDeal(dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (stageId: string) => {
    if (draggedDeal) {
      setDragOverStage(stageId)
    }
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStageId: string) => {
    e.preventDefault()
    
    if (!draggedDeal) return
    
    const stageNameMap: Record<string, Deal['stage']> = {
      'prospecting': 'Prospecting',
      'qualification': 'Qualification',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed-won': 'Closed Won',
    }
    
    const newStage = stageNameMap[targetStageId]
    if (newStage) {
      await moveDealToStage(draggedDeal, newStage)
    }
    
    setDraggedDeal(null)
    setDragOverStage(null)
  }

  const getStageColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'border-blue-200 bg-blue-50/50',
      purple: 'border-purple-200 bg-purple-50/50',
      amber: 'border-amber-200 bg-amber-50/50',
      orange: 'border-orange-200 bg-orange-50/50',
      emerald: 'border-emerald-200 bg-emerald-50/50',
    }
    return colors[color] || colors.blue
  }

  const getBadgeColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-700',
      purple: 'bg-purple-100 text-purple-700',
      amber: 'bg-amber-100 text-amber-700',
      orange: 'bg-orange-100 text-orange-700',
      emerald: 'bg-emerald-100 text-emerald-700',
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      {showMetrics && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Pipeline</div>
              <div className="text-xl font-bold text-gray-900">${(metrics.pipelineValue / 1000).toFixed(0)}K</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Deals</div>
              <div className="text-xl font-bold text-gray-900">{metrics.activeDeals}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Win Rate</div>
              <div className="text-xl font-bold text-gray-900">{metrics.winRate.toFixed(0)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg Deal Size</div>
              <div className="text-xl font-bold text-gray-900">${(metrics.avgDealSize / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="grid grid-cols-5 gap-4">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="relative"
              onDragOver={handleDragOver}
              onDragEnter={() => handleDragEnter(stage.id)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Column */}
              <div className={`
                p-4 rounded-lg border-2 border-dashed transition-all
                ${getStageColor(stage.color)}
                ${dragOverStage === stage.id ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''}
              `}>
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{stage.name}</span>
                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${getBadgeColor(stage.color)}`}>
                      {stage.count}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newCollapsed = new Set(collapsedStages)
                      if (newCollapsed.has(stage.id)) {
                        newCollapsed.delete(stage.id)
                      } else {
                        newCollapsed.add(stage.id)
                      }
                      setCollapsedStages(newCollapsed)
                    }}
                    className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronDown 
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        collapsedStages.has(stage.id) ? '-rotate-90' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* Stage Value */}
                <div className="text-lg font-bold text-gray-900 mb-3">
                  ${(stage.totalValue / 1000).toFixed(0)}k
                </div>

                {/* Deals List */}
                {!collapsedStages.has(stage.id) && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stage.deals.map((deal) => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onDragEnd={() => {
                          setDraggedDeal(null)
                          setDragOverStage(null)
                        }}
                        onClick={() => onDealClick?.(deal.id)}
                        className={`
                          p-3 bg-white rounded-lg border border-gray-100 cursor-move hover:shadow-sm transition-all
                          ${draggedDeal === deal.id ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="text-sm font-medium text-gray-900 truncate flex-1">
                            {deal.name}
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              // Handle more options
                            }}
                            className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreHorizontal className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 truncate mb-2">
                          {deal.company}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">${(deal.value / 1000).toFixed(0)}K</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <TrendingUp className="h-3 w-3" />
                            <span>{deal.probability}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{deal.owner}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{Math.floor((Date.now() - deal.lastActivity.getTime()) / (1000 * 60 * 60 * 24))}d</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Deal Button */}
                    {stage.deals.length === 0 && (
                      <button
                        onClick={() => onCreateDeal?.(stage.id)}
                        className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add deal
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Arrow between stages */}
              {idx < stages.length - 1 && (
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}