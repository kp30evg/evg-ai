'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Brain,
  Activity,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  FileText,
  Zap,
  Target,
  ChevronRight,
  RefreshCw,
  Sparkles,
  BarChart3,
  Eye,
  AlertCircle
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface DealIntelligenceProps {
  isOpen: boolean
  onClose: () => void
  deal: any
  onRefresh?: () => void
}

export default function DealIntelligence({ isOpen, onClose, deal, onRefresh }: DealIntelligenceProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [dealScore, setDealScore] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'signals' | 'timeline' | 'recommendations'>('overview')
  
  const calculateScoreMutation = trpc.unified.calculateDealScore.useMutation({
    onSuccess: (data) => {
      setDealScore(data)
      setIsCalculating(false)
      onRefresh?.()
    },
    onError: () => {
      setIsCalculating(false)
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
  
  useEffect(() => {
    if (isOpen && deal) {
      // If deal already has a score, use it
      if (deal.dealScore && deal.scoreFactors) {
        setDealScore({
          overallScore: deal.dealScore,
          riskLevel: deal.metadata?.riskLevel || 'medium',
          factors: deal.scoreFactors,
          probability: deal.probability
        })
      } else {
        // Calculate new score
        handleCalculateScore()
      }
    }
  }, [isOpen, deal])
  
  const handleCalculateScore = () => {
    if (!deal) return
    setIsCalculating(true)
    calculateScoreMutation.mutate({ dealId: deal.id })
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return colors.green
    if (score >= 60) return colors.blue
    if (score >= 40) return colors.orange
    return colors.red
  }
  
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return colors.red
      case 'high': return colors.orange
      case 'medium': return colors.gold
      default: return colors.green
    }
  }
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount}`
  }
  
  if (!deal) return null
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 40,
            }}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: '600px',
              backgroundColor: colors.white,
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px',
              borderBottom: `1px solid ${colors.lightGray}`,
              backgroundColor: colors.white
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <Brain size={20} color={colors.evergreen} />
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      margin: 0
                    }}>
                      Deal Intelligence
                    </h2>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: colors.mediumGray,
                    margin: 0
                  }}>
                    AI-powered insights for {deal.name}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleCalculateScore}
                    disabled={isCalculating}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      cursor: isCalculating ? 'not-allowed' : 'pointer',
                      color: colors.charcoal,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <RefreshCw size={18} className={isCalculating ? 'animate-spin' : ''} />
                  </button>
                  
                  <button
                    onClick={onClose}
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: colors.mediumGray,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Score Overview */}
              {dealScore && !isCalculating && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px'
                }}>
                  {/* Overall Score */}
                  <div style={{
                    padding: '12px',
                    backgroundColor: getScoreColor(dealScore.overallScore || 50) + '10',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${getScoreColor(dealScore.overallScore || 50)}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      <Zap size={14} color={getScoreColor(dealScore.overallScore || 50)} />
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: colors.mediumGray,
                        textTransform: 'uppercase'
                      }}>
                        Health Score
                      </span>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: getScoreColor(dealScore.overallScore || 50)
                    }}>
                      {dealScore.overallScore || 50}%
                    </div>
                  </div>
                  
                  {/* Risk Level */}
                  <div style={{
                    padding: '12px',
                    backgroundColor: getRiskColor(dealScore.riskLevel || 'medium') + '10',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${getRiskColor(dealScore.riskLevel || 'medium')}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      <AlertTriangle size={14} color={getRiskColor(dealScore.riskLevel || 'medium')} />
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: colors.mediumGray,
                        textTransform: 'uppercase'
                      }}>
                        Risk Level
                      </span>
                    </div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: getRiskColor(dealScore.riskLevel || 'medium'),
                      textTransform: 'capitalize'
                    }}>
                      {dealScore.riskLevel || 'Medium'}
                    </div>
                  </div>
                  
                  {/* Win Probability */}
                  <div style={{
                    padding: '12px',
                    backgroundColor: colors.purple + '10',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${colors.purple}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      <Target size={14} color={colors.purple} />
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        color: colors.mediumGray,
                        textTransform: 'uppercase'
                      }}>
                        Win Probability
                      </span>
                    </div>
                    <div style={{
                      fontSize: '24px',
                      fontWeight: '700',
                      color: colors.purple
                    }}>
                      {dealScore.probability || deal.probability || 50}%
                    </div>
                  </div>
                </div>
              )}
              
              {isCalculating && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    backgroundColor: colors.softGreen,
                    borderRadius: '8px',
                    color: colors.evergreen
                  }}>
                    <Sparkles size={20} className="animate-pulse" />
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      Analyzing deal signals...
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: `1px solid ${colors.lightGray}`,
              backgroundColor: colors.white
            }}>
              {(['overview', 'signals', 'timeline', 'recommendations'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab ? `2px solid ${colors.evergreen}` : '2px solid transparent',
                    color: activeTab === tab ? colors.evergreen : colors.mediumGray,
                    fontSize: '14px',
                    fontWeight: activeTab === tab ? '600' : '400',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 200ms ease'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Content */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              backgroundColor: '#FAFBFC'
            }}>
              {activeTab === 'overview' && dealScore && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Deal Info */}
                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.white,
                    borderRadius: '8px',
                    border: `1px solid ${colors.lightGray}40`
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      marginBottom: '12px'
                    }}>
                      Deal Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: colors.mediumGray }}>Value</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.charcoal }}>
                          {formatCurrency(deal.value)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: colors.mediumGray }}>Stage</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.charcoal }}>
                          {deal.stage}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: colors.mediumGray }}>Expected Close</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.charcoal }}>
                          {deal.closeDate ? new Date(deal.closeDate).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Positive Factors */}
                  {dealScore.factors?.positive?.length > 0 && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: colors.green + '08',
                      borderRadius: '8px',
                      border: `1px solid ${colors.green}30`
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <CheckCircle size={16} color={colors.green} />
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: colors.green,
                          margin: 0
                        }}>
                          Positive Signals
                        </h3>
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {dealScore.factors.positive.map((factor: string, idx: number) => (
                          <li key={idx} style={{
                            fontSize: '13px',
                            color: colors.charcoal
                          }}>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Negative Factors */}
                  {dealScore.factors?.negative?.length > 0 && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: colors.red + '08',
                      borderRadius: '8px',
                      border: `1px solid ${colors.red}30`
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        <AlertCircle size={16} color={colors.red} />
                        <h3 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: colors.red,
                          margin: 0
                        }}>
                          Risk Factors
                        </h3>
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {dealScore.factors.negative.map((factor: string, idx: number) => (
                          <li key={idx} style={{
                            fontSize: '13px',
                            color: colors.charcoal
                          }}>
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'signals' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{
                    padding: '20px',
                    backgroundColor: colors.white,
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: colors.mediumGray
                  }}>
                    <Activity size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px' }}>
                      Engagement signals analysis coming soon...
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'timeline' && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{
                    padding: '20px',
                    backgroundColor: colors.white,
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: colors.mediumGray
                  }}>
                    <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '14px' }}>
                      Activity timeline coming soon...
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'recommendations' && dealScore && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {dealScore.factors?.recommendations?.length > 0 ? (
                    dealScore.factors.recommendations.map((rec: string, idx: number) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{
                          padding: '16px',
                          backgroundColor: colors.white,
                          borderRadius: '8px',
                          border: `1px solid ${colors.lightGray}40`,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: colors.evergreen + '10',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <TrendingUp size={16} color={colors.evergreen} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            fontSize: '14px',
                            color: colors.charcoal,
                            margin: 0
                          }}>
                            {rec}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div style={{
                      padding: '20px',
                      backgroundColor: colors.white,
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: colors.mediumGray
                    }}>
                      <CheckCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p style={{ fontSize: '14px' }}>
                        Deal is on track! No immediate actions needed.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}