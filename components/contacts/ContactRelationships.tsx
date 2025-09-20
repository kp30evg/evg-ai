'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Target,
  ChevronRight
} from 'lucide-react'

// evergreenOS Design System
const colors = {
  evergreen: '#1D5238',
  white: '#FFFFFF',
  charcoal: '#222B2E',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  blue: '#0EA5E9',
  green: '#10B981',
  orange: '#F97316',
  red: '#EF4444',
  purple: '#8B5CF6'
}

interface ContactRelationshipsProps {
  deals: any[]
  contactId: string
  onRefresh?: () => void
}

export default function ContactRelationships({ 
  deals = [], 
  contactId,
  onRefresh 
}: ContactRelationshipsProps) {
  const router = useRouter()
  
  const getStageColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      'prospecting': colors.blue,
      'qualification': colors.purple,
      'proposal': colors.orange,
      'negotiation': colors.orange,
      'closed-won': colors.green,
      'closed-lost': colors.red,
      'demo': colors.purple,
      'meeting': colors.blue
    }
    return stageColors[stage?.toLowerCase()] || colors.mediumGray
  }
  
  const formatValue = (value: number) => {
    if (!value) return '$0'
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`
    }
    return `$${value.toFixed(0)}`
  }
  
  const calculateTotalValue = () => {
    return deals.reduce((sum, deal) => sum + (deal.data?.value || 0), 0)
  }
  
  const handleCreateDeal = () => {
    router.push(`/dashboard/crm/deals/new?contactId=${contactId}`)
  }
  
  const handleDealClick = (dealId: string) => {
    router.push(`/dashboard/crm/deals/${dealId}`)
  }
  
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.lightGray}40`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Target size={18} color={colors.evergreen} />
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: colors.charcoal,
            margin: 0
          }}>
            Related Deals
          </h3>
          {deals.length > 0 && (
            <span style={{
              padding: '2px 6px',
              backgroundColor: colors.evergreen + '10',
              color: colors.evergreen,
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {deals.length}
            </span>
          )}
        </div>
        
        <button
          onClick={handleCreateDeal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            backgroundColor: colors.evergreen,
            color: colors.white,
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9'
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <Plus size={14} />
          New
        </button>
      </div>
      
      {/* Total Value Summary */}
      {deals.length > 0 && (
        <div style={{
          padding: '12px',
          backgroundColor: colors.softGreen + '60',
          borderRadius: '8px',
          marginBottom: '16px',
          borderLeft: `3px solid ${colors.evergreen}`
        }}>
          <div style={{
            fontSize: '12px',
            color: colors.mediumGray,
            marginBottom: '4px'
          }}>
            Total Pipeline Value
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: colors.evergreen
          }}>
            {formatValue(calculateTotalValue())}
          </div>
        </div>
      )}
      
      {/* Deals List */}
      {deals.length > 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {deals.slice(0, 5).map((deal) => (
            <div
              key={deal.id}
              onClick={() => handleDealClick(deal.id)}
              style={{
                padding: '12px',
                backgroundColor: colors.lightGray + '10',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                borderLeft: `3px solid ${getStageColor(deal.data?.stage)}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.softGreen + '40'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.lightGray + '10'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {deal.data?.name || 'Untitled Deal'}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: colors.mediumGray
                  }}>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: getStageColor(deal.data?.stage) + '15',
                      color: getStageColor(deal.data?.stage),
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}>
                      {deal.data?.stage || 'Unknown'}
                    </span>
                    
                    {deal.data?.probability && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <TrendingUp size={12} />
                        {deal.data.probability}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div style={{
                  textAlign: 'right',
                  flexShrink: 0,
                  marginLeft: '8px'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.evergreen
                  }}>
                    {formatValue(deal.data?.value || 0)}
                  </div>
                  
                  {deal.data?.closeDate && (
                    <div style={{
                      fontSize: '11px',
                      color: colors.mediumGray,
                      marginTop: '2px'
                    }}>
                      Close: {new Date(deal.data.closeDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Deal Health Indicator */}
              {deal.data?.health && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: `1px solid ${colors.lightGray}40`
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: deal.data.health === 'good' ? colors.green :
                                   deal.data.health === 'at-risk' ? colors.orange :
                                   colors.red
                  }} />
                  <span style={{
                    fontSize: '11px',
                    color: colors.mediumGray,
                    textTransform: 'capitalize'
                  }}>
                    {deal.data.health}
                  </span>
                </div>
              )}
            </div>
          ))}
          
          {deals.length > 5 && (
            <button
              onClick={() => router.push(`/dashboard/crm/contacts/${contactId}/deals`)}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                color: colors.evergreen,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 200ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.lightGray + '20'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              View All {deals.length} Deals
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '24px 12px',
          color: colors.mediumGray
        }}>
          <Target size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '13px', marginBottom: '12px' }}>
            No deals yet
          </p>
          <button
            onClick={handleCreateDeal}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.lightGray + '20',
              border: `1px solid ${colors.lightGray}40`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              color: colors.evergreen,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Plus size={14} />
            Create First Deal
          </button>
        </div>
      )}
    </div>
  )
}