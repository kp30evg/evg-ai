'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useOrganization } from '@clerk/nextjs'
import { 
  AlertTriangle,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  ChevronRight,
  RefreshCw,
  Zap,
  Calendar,
  User,
  Building2,
  Target,
  ArrowDown,
  ArrowUp,
  Info
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface RiskDeal {
  deal: {
    id: string
    data: {
      name: string
      value: number
      stage: string
      closeDate?: string
      companyName?: string
      contactName?: string
      dealScore?: number
    }
    metadata?: {
      riskLevel?: 'low' | 'medium' | 'high' | 'critical'
    }
  }
  score: {
    overallScore: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    factors: {
      positive: string[]
      negative: string[]
      recommendations: string[]
    }
  }
  alerts: string[]
}

export default function RiskDashboard() {
  const { organization } = useOrganization()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Fetch at-risk deals
  const { data: riskyDeals, isLoading, refetch } = trpc.unified.detectDealsAtRisk.useQuery(
    undefined,
    { 
      enabled: !!organization,
      refetchInterval: 60000 // Auto-refresh every minute
    }
  )
  
  // Fetch revenue predictions
  const { data: revenue } = trpc.unified.predictRevenue.useQuery(
    { periodDays: selectedTimeframe === 'week' ? 7 : selectedTimeframe === 'month' ? 30 : 90 },
    { enabled: !!organization }
  )
  
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
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 500)
  }
  
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
    return `$${amount}`
  }
  
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return colors.red
      case 'high': return colors.orange
      case 'medium': return colors.gold
      default: return colors.green
    }
  }
  
  const getRiskBadgeStyle = (level: string) => {
    const color = getRiskColor(level)
    return {
      padding: '4px 8px',
      backgroundColor: color + '15',
      color: color,
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600' as const,
      textTransform: 'capitalize' as const
    }
  }
  
  // Calculate risk metrics
  const riskMetrics = {
    critical: (riskyDeals as RiskDeal[])?.filter(d => d.score.riskLevel === 'critical').length || 0,
    high: (riskyDeals as RiskDeal[])?.filter(d => d.score.riskLevel === 'high').length || 0,
    totalAtRisk: (riskyDeals as RiskDeal[])?.reduce((sum, d) => sum + (d.deal.data.value || 0), 0) || 0,
    avgScore: (riskyDeals as RiskDeal[])?.reduce((sum, d) => sum + d.score.overallScore, 0) / ((riskyDeals as RiskDeal[])?.length || 1) || 0
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFBFC',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header Section */}
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
              margin: 0,
              marginBottom: '4px'
            }}>
              Risk Intelligence Center
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.mediumGray,
              margin: 0
            }}>
              AI-powered deal risk detection and revenue forecasting
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
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
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.borderColor = colors.evergreen
                e.currentTarget.style.color = colors.evergreen
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.lightGray
              e.currentTarget.style.color = colors.charcoal
            }}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh Analysis
          </button>
        </div>
        
        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px'
        }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.red + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.red}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <AlertTriangle size={16} color={colors.red} />
              <span style={{ fontSize: '12px', fontWeight: '500', color: colors.mediumGray }}>
                CRITICAL DEALS
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.red }}>
              {riskMetrics.critical}
            </div>
          </div>
          
          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.orange + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.orange}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <TrendingDown size={16} color={colors.orange} />
              <span style={{ fontSize: '12px', fontWeight: '500', color: colors.mediumGray }}>
                HIGH RISK
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.orange }}>
              {riskMetrics.high}
            </div>
          </div>
          
          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.evergreen + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.evergreen}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <DollarSign size={16} color={colors.evergreen} />
              <span style={{ fontSize: '12px', fontWeight: '500', color: colors.mediumGray }}>
                VALUE AT RISK
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.evergreen }}>
              {formatCurrency(riskMetrics.totalAtRisk)}
            </div>
          </div>
          
          <div style={{
            padding: '12px 16px',
            backgroundColor: colors.purple + '08',
            borderRadius: '8px',
            borderLeft: `3px solid ${colors.purple}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Activity size={16} color={colors.purple} />
              <span style={{ fontSize: '12px', fontWeight: '500', color: colors.mediumGray }}>
                AVG HEALTH
              </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.purple }}>
              {Math.round(riskMetrics.avgScore)}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{
        padding: '24px 32px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        {/* At-Risk Deals List */}
        <div style={{
          backgroundColor: colors.white,
          borderRadius: '12px',
          border: `1px solid ${colors.lightGray}40`,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.lightGray}20`
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.charcoal,
              margin: 0
            }}>
              Deals Requiring Attention
            </h2>
          </div>
          
          <div style={{
            padding: '16px',
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {isLoading ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: colors.mediumGray
              }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p>Analyzing deal health...</p>
              </div>
            ) : (riskyDeals as RiskDeal[])?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(riskyDeals as RiskDeal[]).map((riskDeal, idx) => (
                  <motion.div
                    key={riskDeal.deal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      padding: '16px',
                      backgroundColor: colors.lightGray + '10',
                      borderRadius: '8px',
                      border: `1px solid ${getRiskColor(riskDeal.score.riskLevel)}30`,
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.softGreen
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.lightGray + '10'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: colors.charcoal,
                          margin: 0,
                          marginBottom: '4px'
                        }}>
                          {riskDeal.deal.data.name}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '13px',
                          color: colors.mediumGray
                        }}>
                          {riskDeal.deal.data.companyName && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building2 size={12} />
                              {riskDeal.deal.data.companyName}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={12} />
                            {formatCurrency(riskDeal.deal.data.value)}
                          </div>
                          {riskDeal.deal.data.closeDate && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              {new Date(riskDeal.deal.data.closeDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          backgroundColor: getRiskColor(riskDeal.score.overallScore) + '15',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: getRiskColor(riskDeal.score.overallScore)
                        }}>
                          <Zap size={12} />
                          {riskDeal.score.overallScore}%
                        </div>
                        <div style={getRiskBadgeStyle(riskDeal.score.riskLevel)}>
                          {riskDeal.score.riskLevel}
                        </div>
                      </div>
                    </div>
                    
                    {/* Alerts */}
                    {riskDeal.alerts.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        padding: '8px 12px',
                        backgroundColor: colors.red + '08',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: colors.charcoal
                      }}>
                        {riskDeal.alerts[0]}
                      </div>
                    )}
                    
                    {/* Key Issues */}
                    {riskDeal.score.factors.negative.length > 0 && (
                      <div style={{
                        marginTop: '8px',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {riskDeal.score.factors.negative.slice(0, 2).map((issue, i) => (
                          <span key={i} style={{
                            padding: '2px 8px',
                            backgroundColor: colors.lightGray,
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: colors.charcoal
                          }}>
                            {issue}
                          </span>
                        ))}
                        {riskDeal.score.factors.negative.length > 2 && (
                          <span style={{
                            padding: '2px 8px',
                            backgroundColor: colors.lightGray,
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: colors.mediumGray
                          }}>
                            +{riskDeal.score.factors.negative.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Recommended Action */}
                    {riskDeal.score.factors.recommendations.length > 0 && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: colors.blue + '08',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Info size={14} color={colors.blue} />
                        <span style={{ fontSize: '12px', color: colors.charcoal }}>
                          {riskDeal.score.factors.recommendations[0]}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: colors.mediumGray
              }}>
                <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                  No deals at risk
                </p>
                <p style={{ fontSize: '14px' }}>
                  All deals are healthy and on track
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Revenue Forecast */}
        <div style={{
          backgroundColor: colors.white,
          borderRadius: '12px',
          border: `1px solid ${colors.lightGray}40`,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.lightGray}20`
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.charcoal,
              margin: 0,
              marginBottom: '8px'
            }}>
              Revenue Forecast
            </h2>
            
            {/* Timeframe Selector */}
            <div style={{
              display: 'flex',
              backgroundColor: colors.lightGray + '30',
              borderRadius: '6px',
              padding: '2px',
              width: 'fit-content'
            }}>
              {(['week', 'month', 'quarter'] as const).map(timeframe => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedTimeframe === timeframe ? colors.white : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: selectedTimeframe === timeframe ? '500' : '400',
                    color: selectedTimeframe === timeframe ? colors.charcoal : colors.mediumGray,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 200ms ease'
                  }}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ padding: '24px' }}>
            {revenue && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Conservative */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.mediumGray
                    }}>
                      Conservative
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: colors.charcoal
                    }}>
                      {formatCurrency(revenue.conservative)}
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: colors.lightGray,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(revenue.conservative / revenue.optimistic) * 100}%`,
                      height: '100%',
                      backgroundColor: colors.green,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
                
                {/* Likely */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.mediumGray
                    }}>
                      Likely
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: colors.evergreen
                    }}>
                      {formatCurrency(revenue.likely)}
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: colors.lightGray,
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(revenue.likely / revenue.optimistic) * 100}%`,
                      height: '100%',
                      backgroundColor: colors.evergreen,
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
                
                {/* Optimistic */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: colors.mediumGray
                    }}>
                      Optimistic
                    </span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: colors.blue
                    }}>
                      {formatCurrency(revenue.optimistic)}
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: colors.blue,
                    borderRadius: '4px'
                  }} />
                </div>
                
                {/* By Stage Breakdown */}
                {revenue.byStage && Object.keys(revenue.byStage).length > 0 && (
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: `1px solid ${colors.lightGray}40`
                  }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      marginBottom: '12px'
                    }}>
                      By Pipeline Stage
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(revenue.byStage)
                        .sort((a, b) => b[1] - a[1])
                        .map(([stage, value]) => (
                          <div key={stage} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: colors.lightGray + '20',
                            borderRadius: '6px'
                          }}>
                            <span style={{
                              fontSize: '12px',
                              color: colors.charcoal,
                              textTransform: 'capitalize'
                            }}>
                              {stage.replace('_', ' ')}
                            </span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: colors.evergreen
                            }}>
                              {formatCurrency(value)}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}