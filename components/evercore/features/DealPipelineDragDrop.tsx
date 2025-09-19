'use client'

import React, { useState, DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { theme } from '@/lib/evercore/theme'
import { useCRM } from '@/lib/contexts/crm-context'
import { Deal } from '@/lib/contexts/crm-context'
import { 
  DollarSign, 
  Calendar, 
  User, 
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Plus,
  MoreVertical
} from 'lucide-react'

interface DealCard {
  id: string
  title: string
  value: string
  company: string
  probability: number
  owner: string
  daysInStage: number
  priority: 'high' | 'medium' | 'low'
  closeDate?: Date
}

interface Stage {
  id: string
  name: string
  deals: DealCard[]
  totalValue: number
  color?: string
}

interface DealPipelineDragDropProps {
  onDealClick?: (dealId: string) => void
  onCreateDeal?: (stageId: string) => void
  showMetrics?: boolean
}

export default function DealPipelineDragDrop({ 
  onDealClick, 
  onCreateDeal,
  showMetrics = true 
}: DealPipelineDragDropProps) {
  const { deals, moveDealToStage, getMetrics } = useCRM()
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set())
  
  // Define stage colors
  const stageColors: Record<string, string> = {
    'Prospecting': theme.colors.stages.prospecting,
    'Qualification': theme.colors.stages.qualification,
    'Proposal': theme.colors.stages.proposal,
    'Negotiation': theme.colors.stages.negotiation,
    'Closed Won': theme.colors.stages.closedWon,
    'Closed Lost': theme.colors.stages.closedLost
  }

  // Convert deals to pipeline stages
  const stages: Stage[] = [
    'Prospecting',
    'Qualification',
    'Proposal',
    'Negotiation',
    'Closed Won',
    'Closed Lost'
  ].map(stageName => {
    const stageDeals = deals.filter(d => d.stage === stageName)
    return {
      id: stageName.toLowerCase().replace(' ', '-'),
      name: stageName,
      deals: stageDeals.map(d => ({
        id: d.id,
        title: d.name,
        value: `$${(d.value / 1000).toFixed(0)}K`,
        company: d.company,
        probability: d.probability,
        owner: d.owner,
        daysInStage: Math.floor((Date.now() - d.lastActivity.getTime()) / (1000 * 60 * 60 * 24)),
        priority: d.probability > 60 ? 'high' : d.probability > 30 ? 'medium' : 'low',
        closeDate: d.closeDate
      })),
      totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0),
      color: stageColors[stageName]
    }
  }).filter(stage => !stage.name.includes('Closed') || stage.deals.length > 0) // Hide empty closed stages

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

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetStageId: string) => {
    e.preventDefault()
    
    if (!draggedDeal) return
    
    // Map stage ID back to stage name
    const stageNameMap: Record<string, Deal['stage']> = {
      'prospecting': 'Prospecting',
      'qualification': 'Qualification',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closed-won': 'Closed Won',
      'closed-lost': 'Closed Lost'
    }
    
    const newStage = stageNameMap[targetStageId]
    if (newStage) {
      await moveDealToStage(draggedDeal, newStage)
    }
    
    setDraggedDeal(null)
    setDragOverStage(null)
  }

  const handleDragEnd = () => {
    setDraggedDeal(null)
    setDragOverStage(null)
  }

  const toggleStageCollapse = (stageId: string) => {
    const newCollapsed = new Set(collapsedStages)
    if (newCollapsed.has(stageId)) {
      newCollapsed.delete(stageId)
    } else {
      newCollapsed.add(stageId)
    }
    setCollapsedStages(newCollapsed)
  }

  const metrics = getMetrics()

  return (
    <div style={{ width: '100%' }}>
      {/* Pipeline Metrics */}
      {showMetrics && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.xl,
          padding: theme.spacing.lg,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.lightGray}`
        }}>
          <div>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
              Total Pipeline
            </div>
            <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text }}>
              ${(metrics.pipelineValue / 1000).toFixed(0)}K
            </div>
          </div>
          <div>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
              Active Deals
            </div>
            <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text }}>
              {metrics.activeDeals}
            </div>
          </div>
          <div>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
              Win Rate
            </div>
            <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.success }}>
              {metrics.winRate.toFixed(0)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
              Avg Deal Size
            </div>
            <div style={{ fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.semibold, color: theme.colors.text }}>
              ${(metrics.avgDealSize / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Stages */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.lg,
        overflowX: 'auto',
        paddingBottom: theme.spacing.md,
        width: '100%'
      }}>
        {stages.map(stage => (
          <motion.div
            key={stage.id}
            style={{
              minWidth: '280px',
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `2px ${dragOverStage === stage.id ? 'dashed' : 'solid'} ${
                dragOverStage === stage.id ? stage.color : theme.colors.lightGray
              }`,
              transition: theme.transitions.base
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            {/* Stage Header */}
            <div style={{
              padding: theme.spacing.md,
              borderBottom: `1px solid ${theme.colors.lightGray}`,
              backgroundColor: stage.color ? `${stage.color}10` : 'transparent'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.sm
              }}>
                <button
                  onClick={() => toggleStageCollapse(stage.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <ChevronRight
                    size={16}
                    style={{
                      transform: collapsedStages.has(stage.id) ? 'rotate(0deg)' : 'rotate(90deg)',
                      transition: theme.transitions.base,
                      color: theme.colors.textSecondary
                    }}
                  />
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text
                  }}>
                    {stage.name}
                  </span>
                  <span style={{
                    backgroundColor: stage.color ? `${stage.color}20` : theme.colors.softGreen,
                    color: stage.color || theme.colors.evergreen,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.medium
                  }}>
                    {stage.deals.length}
                  </span>
                </button>
                {onCreateDeal && (
                  <button
                    onClick={() => onCreateDeal(stage.id)}
                    style={{
                      padding: theme.spacing.xs,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.colors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: theme.borderRadius.base,
                      transition: theme.transitions.base
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.lightGray
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary
              }}>
                ${(stage.totalValue / 1000).toFixed(0)}K total
              </div>
            </div>

            {/* Stage Deals */}
            <AnimatePresence>
              {!collapsedStages.has(stage.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{
                    padding: theme.spacing.md,
                    minHeight: '200px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                  }}
                >
                  {stage.deals.length === 0 ? (
                    <div style={{
                      padding: theme.spacing.xl,
                      textAlign: 'center',
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.fontSize.sm
                    }}>
                      No deals in this stage
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                      {stage.deals.map(deal => (
                        <motion.div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e as any, deal.id)}
                          onDragEnd={handleDragEnd}
                          whileHover={{ scale: 1.02 }}
                          whileDrag={{ scale: 1.05, opacity: 0.8 }}
                          style={{
                            padding: theme.spacing.md,
                            backgroundColor: draggedDeal === deal.id ? theme.colors.softGreen : theme.colors.background,
                            border: `1px solid ${theme.colors.lightGray}`,
                            borderRadius: theme.borderRadius.base,
                            cursor: 'grab',
                            transition: theme.transitions.base
                          }}
                          onClick={() => onDealClick?.(deal.id)}
                        >
                          {/* Deal Priority Indicator */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: theme.spacing.sm
                          }}>
                            <div style={{
                              width: '4px',
                              height: '40px',
                              backgroundColor: 
                                deal.priority === 'high' ? theme.colors.error :
                                deal.priority === 'medium' ? theme.colors.warning :
                                theme.colors.mediumGray,
                              borderRadius: theme.borderRadius.full,
                              marginRight: theme.spacing.sm
                            }} />
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: theme.typography.fontSize.sm,
                                fontWeight: theme.typography.fontWeight.medium,
                                color: theme.colors.text,
                                marginBottom: theme.spacing.xs
                              }}>
                                {deal.title}
                              </div>
                              <div style={{
                                fontSize: theme.typography.fontSize.xs,
                                color: theme.colors.textSecondary
                              }}>
                                {deal.company}
                              </div>
                            </div>
                            <MoreVertical size={16} color={theme.colors.textSecondary} />
                          </div>

                          {/* Deal Details */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.textSecondary
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                              <DollarSign size={12} />
                              <span style={{
                                fontWeight: theme.typography.fontWeight.semibold,
                                color: theme.colors.text
                              }}>
                                {deal.value}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                              <TrendingUp size={12} />
                              <span>{deal.probability}%</span>
                            </div>
                          </div>

                          {/* Deal Footer */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: theme.spacing.sm,
                            paddingTop: theme.spacing.sm,
                            borderTop: `1px solid ${theme.colors.lightGray}`,
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.textSecondary
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                              <User size={12} />
                              <span>{deal.owner}</span>
                            </div>
                            {deal.daysInStage > 7 && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: theme.spacing.xs,
                                color: deal.daysInStage > 14 ? theme.colors.warning : theme.colors.textSecondary
                              }}>
                                <AlertCircle size={12} />
                                <span>{deal.daysInStage}d</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}