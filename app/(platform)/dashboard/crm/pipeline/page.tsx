'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  Target,
  Plus,
  Filter,
  Calendar,
  DollarSign,
  Building2,
  User,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Edit2,
  Trash2,
  MoreVertical,
  Sparkles,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Search,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import CreateDealSheet from '@/components/evercore/CreateDealSheet'
import DealIntelligence from '@/components/evercore/DealIntelligence'

interface Deal {
  id: string
  name: string
  value: number
  stage: string
  companyId?: string
  companyName?: string
  primaryContactId?: string
  primaryContactName?: string
  closeDate?: Date
  probability?: number
  lastActivityAt?: Date
  createdAt: Date
  source?: 'manual' | 'email' | 'auto' | 'import'
  healthScore?: number
  tags?: string[]
  metadata?: {
    autoCreated?: boolean
    riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  }
  dealScore?: number
  scoreFactors?: {
    positive: string[]
    negative: string[]
    recommendations: string[]
  }
}

interface PipelineStage {
  id: string
  name: string
  color: string
  deals: Deal[]
  totalValue: number
  averageDealSize: number
  conversionRate?: number
}

export default function PipelinePage() {
  const { organization } = useOrganization()
  const router = useRouter()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [showCreateDeal, setShowCreateDeal] = useState(false)
  const [newDealStage, setNewDealStage] = useState<string>('prospecting')
  const [showIntelligence, setShowIntelligence] = useState(false)
  const [selectedDealForIntelligence, setSelectedDealForIntelligence] = useState<Deal | null>(null)
  
  // Fetch deals
  const { data: dealsData, isLoading, refetch } = trpc.unified.getDeals.useQuery(
    {},
    { enabled: !!organization }
  )
  
  // Update deal stage mutation
  const updateDealStageMutation = trpc.unified.updateDealStage.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600',
    blue: '#0EA5E9',
    purple: '#8B5CF6',
    orange: '#F97316',
    red: '#EF4444',
    green: '#10B981'
  }

  // Pipeline stages configuration
  const stageConfig = [
    { id: 'prospecting', name: 'Prospecting', color: colors.blue },
    { id: 'qualification', name: 'Qualification', color: colors.purple },
    { id: 'proposal', name: 'Proposal', color: colors.orange },
    { id: 'negotiation', name: 'Negotiation', color: colors.evergreen },
    { id: 'closing', name: 'Closing', color: colors.gold }
  ]

  // Transform API data to Deal interface
  const deals: Deal[] = dealsData?.map((entity: any) => ({
    id: entity.id,
    name: entity.data.name || 'Untitled Deal',
    value: entity.data.value || 0,
    stage: entity.data.stage || 'prospecting',
    companyName: entity.data.companyName,
    primaryContactName: entity.data.contactName,
    closeDate: entity.data.closeDate ? new Date(entity.data.closeDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    probability: entity.data.probability || (entity.data.stage === 'prospecting' ? 10 : entity.data.stage === 'qualification' ? 20 : entity.data.stage === 'proposal' ? 40 : entity.data.stage === 'negotiation' ? 60 : entity.data.stage === 'closing' ? 80 : entity.data.stage === 'closed_won' ? 100 : 0),
    createdAt: new Date(entity.createdAt),
    source: entity.data.source || 'manual',
    healthScore: entity.data.healthScore || 50,
    metadata: entity.metadata,
    dealScore: entity.data.dealScore,
    scoreFactors: entity.data.scoreFactors
  })) || [];
  // Add closed stages to config if we have closed deals
  const hasClosedWon = deals.some(d => d.stage === 'closed_won')
  const hasClosedLost = deals.some(d => d.stage === 'closed_lost')
  
  const extendedStageConfig = [
    ...stageConfig,
    ...(hasClosedWon ? [{ id: 'closed_won', name: 'Closed Won', color: colors.green }] : []),
    ...(hasClosedLost ? [{ id: 'closed_lost', name: 'Closed Lost', color: colors.red }] : [])
  ]

  // Organize deals by stage
  const pipelineStages: PipelineStage[] = useMemo(() => {
    return extendedStageConfig.map(config => {
      const stageDeals = deals.filter(deal => deal.stage === config.id)
      const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)
      
      return {
        ...config,
        deals: stageDeals,
        totalValue,
        averageDealSize: stageDeals.length ? totalValue / stageDeals.length : 0
      }
    })
  }, [deals, extendedStageConfig])

  // Calculate pipeline metrics
  const pipelineMetrics = useMemo(() => {
    const activeDdeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
    const totalValue = activeDdeals.reduce((sum, deal) => sum + deal.value, 0)
    const weightedValue = activeDdeals.reduce((sum, deal) => sum + (deal.value * (deal.probability || 0) / 100), 0)
    const avgDealSize = activeDdeals.length ? totalValue / activeDdeals.length : 0
    const avgCloseTime = 45 // TODO: Calculate from actual data
    const closedWonValue = deals.filter(d => d.stage === 'closed_won').reduce((sum, deal) => sum + deal.value, 0)
    
    return {
      totalValue,
      weightedValue,
      avgDealSize,
      avgCloseTime,
      totalDeals: deals.length,
      dealsAtRisk: deals.filter(d => d.metadata?.riskLevel === 'high').length || 0,
      closedWonValue
    }
  }, [deals])

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount}`
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays <= 7) return `${diffDays} days left`
    return date.toLocaleDateString()
  }

  const getDealRiskColor = (deal: Deal) => {
    const riskLevel = deal.metadata?.riskLevel
    if (riskLevel === 'critical') return colors.red
    if (riskLevel === 'high') return colors.orange
    if (riskLevel === 'medium') return colors.gold
    return colors.green
  }
  
  const getDealScoreColor = (score?: number) => {
    if (!score) return colors.mediumGray
    if (score >= 80) return colors.green
    if (score >= 60) return colors.blue
    if (score >= 40) return colors.orange
    return colors.red
  }

  const getHealthScoreColor = (score?: number) => {
    if (!score) return colors.mediumGray
    if (score >= 80) return colors.green
    if (score >= 50) return colors.orange
    return colors.red
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'email': return <Mail size={12} />
      case 'auto': return <Sparkles size={12} />
      case 'import': return <Download size={12} />
      default: return <User size={12} />
    }
  }

  // Drag and drop handlers
  const handleDragStart = (dealId: string) => {
    setDraggedDeal(dealId)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDragOverStage(stageId)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault()
    if (draggedDeal) {
      const deal = deals.find(d => d.id === draggedDeal)
      if (deal && deal.stage !== newStage) {
        // Update deal stage via API
        try {
          await updateDealStageMutation.mutateAsync({
            dealId: draggedDeal,
            stage: newStage
          })
        } catch (error) {
          console.error('Failed to update deal stage:', error)
        }
      }
    }
    setDraggedDeal(null)
    setDragOverStage(null)
  }

  const handleCreateDeal = (stage?: string) => {
    setNewDealStage(stage || 'prospecting')
    setShowCreateDeal(true)
  }

  const handleDealClick = (dealId: string) => {
    setSelectedDeal(dealId)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFBFC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        padding: '24px 32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '4px'
            }}>
              Sales Pipeline
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.mediumGray
            }}>
              {pipelineMetrics.totalDeals} deals • {formatCurrency(pipelineMetrics.totalValue)} total value • {formatCurrency(pipelineMetrics.weightedValue)} weighted
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => refetch()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: colors.white,
                color: colors.charcoal,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={18} />
              Refresh
            </button>
            
            <button
              onClick={() => handleCreateDeal()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              New Deal
            </button>
          </div>
        </div>

        {/* Pipeline Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.blue + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.blue}`
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: colors.blue }}>
              {pipelineMetrics.totalDeals}
            </div>
            <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '500' }}>
              Total Deals
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.evergreen + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.evergreen}`
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: colors.evergreen }}>
              {formatCurrency(pipelineMetrics.totalValue)}
            </div>
            <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '500' }}>
              Total Value
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.green + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.green}`
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: colors.green }}>
              {formatCurrency(pipelineMetrics.weightedValue)}
            </div>
            <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '500' }}>
              Weighted Value
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.purple + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.purple}`
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: colors.purple }}>
              {formatCurrency(pipelineMetrics.avgDealSize)}
            </div>
            <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '500' }}>
              Avg Deal Size
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.orange + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.orange}`
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: colors.orange }}>
              {pipelineMetrics.avgCloseTime}d
            </div>
            <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '500' }}>
              Avg Close Time
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.red + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.red}`
          }}>
            <div style={{ fontSize: '18px', fontWeight: '600', color: colors.red }}>
              {pipelineMetrics.dealsAtRisk}
            </div>
            <div style={{ fontSize: '12px', color: colors.mediumGray, fontWeight: '500' }}>
              At Risk
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            backgroundColor: colors.lightGray + '30',
            borderRadius: '8px',
            padding: '2px'
          }}>
            {(['week', 'month', 'quarter'] as const).map(timeframe => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: selectedTimeframe === timeframe ? colors.white : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: selectedTimeframe === timeframe ? '500' : '400',
                  color: selectedTimeframe === timeframe ? colors.charcoal : colors.mediumGray,
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {timeframe}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: colors.white,
              color: colors.charcoal,
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div style={{
        padding: '24px 32px',
        overflowX: 'auto'
      }}>
        <div style={{
          display: 'flex',
          gap: '24px',
          minWidth: '1400px'
        }}>
          {pipelineStages.map((stage, stageIndex) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stageIndex * 0.1 }}
              style={{
                flex: 1,
                minWidth: '280px',
                backgroundColor: colors.white,
                borderRadius: '12px',
                border: `1px solid ${colors.lightGray}40`,
                overflow: 'hidden'
              }}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div style={{
                padding: '16px 20px',
                backgroundColor: dragOverStage === stage.id ? stage.color + '20' : stage.color + '08',
                borderBottom: `1px solid ${colors.lightGray}20`,
                borderTop: `3px solid ${stage.color}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.charcoal,
                    margin: 0
                  }}>
                    {stage.name}
                  </h3>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: stage.color + '20',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: stage.color
                  }}>
                    {stage.deals.length}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  color: colors.mediumGray
                }}>
                  <span>{formatCurrency(stage.totalValue)}</span>
                  <span>Avg: {formatCurrency(stage.averageDealSize)}</span>
                </div>
              </div>

              {/* Stage Deals */}
              <div style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                minHeight: '400px'
              }}>
                <AnimatePresence>
                  {stage.deals.map((deal, dealIndex) => (
                    <motion.div
                      key={deal.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: dealIndex * 0.02 }}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      onClick={() => {
                        setSelectedDealForIntelligence(deal)
                        setShowIntelligence(true)
                      }}
                      style={{
                        padding: '16px',
                        backgroundColor: draggedDeal === deal.id ? colors.softGreen : colors.lightGray + '20',
                        borderRadius: '8px',
                        border: `1px solid ${colors.lightGray}40`,
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        position: 'relative'
                      }}
                      whileHover={{
                        backgroundColor: colors.softGreen + '60',
                        scale: 1.02
                      }}
                    >
                      {/* Deal Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: colors.charcoal,
                          flex: 1,
                          lineHeight: 1.3
                        }}>
                          {deal.name}
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Show deal menu
                          }}
                          style={{
                            padding: '2px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: colors.mediumGray
                          }}
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>

                      {/* Deal Value */}
                      <div style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: colors.evergreen,
                        marginBottom: '8px'
                      }}>
                        {formatCurrency(deal.value)}
                      </div>

                      {/* Deal Info */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        marginBottom: '12px'
                      }}>
                        {deal.companyName && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: colors.mediumGray
                          }}>
                            <Building2 size={12} />
                            {deal.companyName}
                          </div>
                        )}
                        
                        {deal.primaryContactName && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: colors.mediumGray
                          }}>
                            <User size={12} />
                            {deal.primaryContactName}
                          </div>
                        )}
                        
                        {deal.closeDate && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: colors.mediumGray
                          }}>
                            <Calendar size={12} />
                            {formatDate(deal.closeDate)}
                          </div>
                        )}
                      </div>

                      {/* Deal Footer */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {/* Source Badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 4px',
                            backgroundColor: colors.blue + '15',
                            borderRadius: '4px',
                            color: colors.blue
                          }}>
                            {getSourceIcon(deal.source)}
                          </div>
                          
                          {/* Auto-created Badge */}
                          {deal.metadata?.autoCreated && (
                            <div style={{
                              padding: '2px 4px',
                              backgroundColor: colors.gold + '20',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <Sparkles size={10} color={colors.gold} />
                            </div>
                          )}
                          
                          {/* Risk Indicator */}
                          {deal.metadata?.riskLevel && deal.metadata.riskLevel !== 'low' && (
                            <div style={{
                              padding: '2px',
                              backgroundColor: getDealRiskColor(deal) + '15',
                              borderRadius: '4px'
                            }}>
                              <AlertTriangle size={10} color={getDealRiskColor(deal)} />
                            </div>
                          )}
                        </div>

                        {/* Deal Score Badge */}
                        {deal.dealScore !== undefined && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '2px 6px',
                            backgroundColor: getDealScoreColor(deal.dealScore) + '15',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: getDealScoreColor(deal.dealScore)
                          }}>
                            <Zap size={10} />
                            {deal.dealScore}%
                          </div>
                        )}

                        {/* Probability & Health */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          {deal.probability && (
                            <div style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: colors.mediumGray
                            }}>
                              {deal.probability}%
                            </div>
                          )}
                          
                          {deal.healthScore && (
                            <div style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: getHealthScoreColor(deal.healthScore)
                            }} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add Deal Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCreateDeal(stage.id)}
                  style={{
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: `2px dashed ${colors.lightGray}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: colors.mediumGray,
                    transition: 'all 200ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = stage.color
                    e.currentTarget.style.backgroundColor = stage.color + '10'
                    e.currentTarget.style.color = stage.color
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.lightGray
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.mediumGray
                  }}
                >
                  <Plus size={14} />
                  Add Deal
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Deal Detail Modal */}
      <AnimatePresence>
        {selectedDeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={() => setSelectedDeal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.white,
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  Deal Details
                </h2>
                <button
                  onClick={() => setSelectedDeal(null)}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.mediumGray
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{
                fontSize: '14px',
                color: colors.mediumGray,
                textAlign: 'center',
                padding: '40px 20px'
              }}>
                Deal detail modal content goes here...
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Create Deal Sheet */}
      <CreateDealSheet
        isOpen={showCreateDeal}
        onClose={() => setShowCreateDeal(false)}
        onSuccess={() => {
          refetch()
          setShowCreateDeal(false)
        }}
        initialStage={newDealStage}
      />
      
      {/* Deal Intelligence Panel */}
      <DealIntelligence
        isOpen={showIntelligence}
        onClose={() => {
          setShowIntelligence(false)
          setSelectedDealForIntelligence(null)
        }}
        deal={selectedDealForIntelligence}
        onRefresh={() => refetch()}
      />
    </div>
  )
}