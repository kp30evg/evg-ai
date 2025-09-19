'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  DollarSign, 
  Calendar,
  Building2,
  User,
  MoreVertical,
  ChevronRight,
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

interface Deal {
  id: string
  title: string
  company: string
  value: number
  contact: string
  daysInStage: number
  probability: number
}

interface Stage {
  id: string
  name: string
  color: string
  deals: Deal[]
  totalValue: number
}

interface PipelineKanbanProps {
  stages?: Stage[]
  onDealMove?: (dealId: string, fromStage: string, toStage: string) => void
  onDealClick?: (deal: Deal) => void
  onAddDeal?: (stageId: string) => void
}

const defaultStages: Stage[] = [
  {
    id: 'prospecting',
    name: 'Prospecting',
    color: theme.colors.stages.prospecting,
    deals: [],
    totalValue: 0,
  },
  {
    id: 'qualification',
    name: 'Qualification', 
    color: theme.colors.stages.qualification,
    deals: [],
    totalValue: 0,
  },
  {
    id: 'proposal',
    name: 'Proposal',
    color: theme.colors.stages.proposal,
    deals: [],
    totalValue: 0,
  },
  {
    id: 'negotiation',
    name: 'Negotiation',
    color: theme.colors.stages.negotiation,
    deals: [],
    totalValue: 0,
  },
  {
    id: 'closed-won',
    name: 'Closed Won',
    color: theme.colors.stages.closedWon,
    deals: [],
    totalValue: 0,
  },
]

export default function PipelineKanban({
  stages = defaultStages,
  onDealMove,
  onDealClick,
  onAddDeal,
}: PipelineKanbanProps) {
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [draggedFromStage, setDraggedFromStage] = useState<string | null>(null)
  const [dropTargetStage, setDropTargetStage] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleDragStart = (deal: Deal, stageId: string) => {
    setDraggedDeal(deal)
    setDraggedFromStage(stageId)
  }

  const handleDragEnd = () => {
    if (draggedDeal && draggedFromStage && dropTargetStage && draggedFromStage !== dropTargetStage) {
      onDealMove?.(draggedDeal.id, draggedFromStage, dropTargetStage)
    }
    setDraggedDeal(null)
    setDraggedFromStage(null)
    setDropTargetStage(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDropTargetStage(stageId)
  }

  return (
    <div style={{
      backgroundColor: theme.colors.white,
      borderRadius: theme.borderRadius.md,
      border: `1px solid ${theme.colors.lightGray}`,
      padding: theme.spacing.xl,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: theme.spacing.xl,
      }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.charcoal,
          margin: 0,
        }}>
          Deal Pipeline
        </h3>
      </div>

      {/* Pipeline Stages */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.lg,
        overflowX: 'auto',
        paddingBottom: theme.spacing.md,
      }}>
        {stages.map((stage) => (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
            style={{
              minWidth: '280px',
              flex: '0 0 280px',
            }}
          >
            {/* Stage Header */}
            <div style={{
              backgroundColor: theme.colors.lightGray + '50',
              borderRadius: `${theme.borderRadius.base} ${theme.borderRadius.base} 0 0`,
              padding: theme.spacing.md,
              borderLeft: `3px solid ${stage.color}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.xs,
              }}>
                <span style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.charcoal,
                }}>
                  {stage.name}
                </span>
                <span style={{
                  backgroundColor: stage.color + '20',
                  color: stage.color,
                  padding: '2px 8px',
                  borderRadius: theme.borderRadius.full,
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                }}>
                  {stage.deals.length}
                </span>
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray,
              }}>
                {formatCurrency(stage.totalValue)}
              </div>
            </div>

            {/* Drop Zone */}
            <div
              style={{
                backgroundColor: dropTargetStage === stage.id 
                  ? theme.colors.softGreen 
                  : theme.colors.lightGray + '20',
                minHeight: '400px',
                padding: theme.spacing.md,
                borderLeft: dropTargetStage === stage.id 
                  ? `3px dashed ${theme.colors.evergreen}`
                  : `3px solid transparent`,
                borderRight: dropTargetStage === stage.id 
                  ? `3px dashed ${theme.colors.evergreen}`
                  : `3px solid transparent`,
                borderBottom: dropTargetStage === stage.id 
                  ? `3px dashed ${theme.colors.evergreen}`
                  : `3px solid transparent`,
                transition: theme.transitions.fast,
              }}
            >
              {/* Deal Cards */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm,
              }}>
                {stage.deals.map((deal) => (
                  <motion.div
                    key={deal.id}
                    draggable
                    onDragStart={() => handleDragStart(deal, stage.id)}
                    onDragEnd={handleDragEnd}
                    whileHover={{ scale: 1.02 }}
                    whileDrag={{ scale: 1.05, opacity: 0.9 }}
                    onClick={() => onDealClick?.(deal)}
                    style={{
                      backgroundColor: theme.colors.white,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      padding: theme.spacing.md,
                      cursor: 'grab',
                      boxShadow: theme.shadows.sm,
                    }}
                  >
                    {/* Deal Title */}
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.charcoal,
                      marginBottom: theme.spacing.xs,
                    }}>
                      {deal.title}
                    </div>

                    {/* Company */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.mediumGray,
                      marginBottom: theme.spacing.xs,
                    }}>
                      <Building2 size={12} />
                      {deal.company}
                    </div>

                    {/* Value */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: theme.spacing.sm,
                      paddingTop: theme.spacing.sm,
                      borderTop: `1px solid ${theme.colors.lightGray}`,
                    }}>
                      <span style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: stage.color,
                      }}>
                        {formatCurrency(deal.value)}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: theme.colors.mediumGray,
                      }}>
                        {deal.daysInStage}d
                      </span>
                    </div>
                  </motion.div>
                ))}

                {/* Add Deal Button */}
                <motion.button
                  whileHover={{ backgroundColor: theme.colors.softGreen }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAddDeal?.(stage.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.md,
                    backgroundColor: 'transparent',
                    border: `2px dashed ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    color: theme.colors.mediumGray,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                  }}
                >
                  <Plus size={16} />
                  Add Deal
                </motion.button>
              </div>
            </div>
          </div>
        ))}

        {/* Scroll Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '48px',
          color: theme.colors.mediumGray,
        }}>
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  )
}