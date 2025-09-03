'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock,
  Mail,
  MessageSquare,
  Calendar,
  Phone,
  FileText,
  CheckSquare,
  Square,
  Target,
  Sparkles,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  User,
  Building2,
  DollarSign,
  AlertCircle,
  Zap
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface TimelineEvent {
  id: string
  type: 'email' | 'message' | 'meeting' | 'call' | 'task' | 'deal_change' | 'note' | 'document'
  timestamp: Date
  title: string
  description?: string
  participants?: string[]
  icon?: string
  color?: string
  metadata?: {
    dealId?: string
    contactId?: string
    companyId?: string
    value?: number
    stage?: string
    sentiment?: number
    important?: boolean
  }
}

interface ActivityTimelineProps {
  entityType: 'contact' | 'company' | 'deal'
  entityId: string
  entityName?: string
  height?: string
  showFilters?: boolean
  showInsights?: boolean
}

export default function ActivityTimeline({ 
  entityType, 
  entityId, 
  entityName,
  height = '600px',
  showFilters = true,
  showInsights = true
}: ActivityTimelineProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  
  // Fetch timeline data
  const timelineQuery = trpc.unified.getTimeline.useQuery(
    {
      entityType,
      entityId,
      filters: {
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        searchQuery: searchQuery || undefined,
        dateRange: getDateRange(timeRange)
      }
    },
    { enabled: !!entityId }
  )
  
  // Fetch engagement insights
  const insightsQuery = trpc.unified.getEngagementInsights.useQuery(
    { entityId },
    { enabled: !!entityId && showInsights }
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
  
  useEffect(() => {
    if (timelineQuery.data) {
      setEvents(timelineQuery.data)
      setIsLoading(false)
    }
  }, [timelineQuery.data])
  
  const getDateRange = (range: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (range) {
      case 'week':
        start.setDate(start.getDate() - 7)
        break
      case 'month':
        start.setMonth(start.getMonth() - 1)
        break
      case 'quarter':
        start.setMonth(start.getMonth() - 3)
        break
      case 'year':
        start.setFullYear(start.getFullYear() - 1)
        break
    }
    
    return { start, end }
  }
  
  const getEventIcon = (event: TimelineEvent) => {
    switch (event.type) {
      case 'email': return <Mail size={16} />
      case 'message': return <MessageSquare size={16} />
      case 'meeting': return <Calendar size={16} />
      case 'call': return <Phone size={16} />
      case 'task': return event.metadata?.important ? <CheckSquare size={16} /> : <Square size={16} />
      case 'deal_change': return <Target size={16} />
      case 'note': return <FileText size={16} />
      default: return <Activity size={16} />
    }
  }
  
  const getEventColor = (event: TimelineEvent) => {
    if (event.color) return event.color
    
    switch (event.type) {
      case 'email': return colors.blue
      case 'message': return colors.purple
      case 'meeting': return colors.orange
      case 'call': return colors.green
      case 'task': return colors.mediumGray
      case 'deal_change': return colors.evergreen
      case 'note': return colors.mediumGray
      default: return colors.charcoal
    }
  }
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - new Date(date).getTime()
    const diffInMins = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMs / 3600000)
    const diffInDays = Math.floor(diffInMs / 86400000)
    
    if (diffInMins < 60) return `${diffInMins}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return new Date(date).toLocaleDateString()
  }
  
  const eventTypes = [
    { id: 'email', label: 'Emails', icon: <Mail size={14} />, color: colors.blue },
    { id: 'meeting', label: 'Meetings', icon: <Calendar size={14} />, color: colors.orange },
    { id: 'call', label: 'Calls', icon: <Phone size={14} />, color: colors.green },
    { id: 'message', label: 'Messages', icon: <MessageSquare size={14} />, color: colors.purple },
    { id: 'task', label: 'Tasks', icon: <CheckSquare size={14} />, color: colors.mediumGray },
    { id: 'deal_change', label: 'Deals', icon: <Target size={14} />, color: colors.evergreen }
  ]
  
  const toggleEventType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }
  
  const getEngagementColor = (level?: string) => {
    switch (level) {
      case 'hot': return colors.red
      case 'warm': return colors.orange
      case 'cold': return colors.blue
      default: return colors.mediumGray
    }
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height,
      backgroundColor: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}40`,
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${colors.lightGray}20`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: showInsights ? '16px' : '0'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: colors.charcoal,
            margin: 0
          }}>
            Activity Timeline
          </h3>
          
          {/* Time Range Selector */}
          <div style={{
            display: 'flex',
            backgroundColor: colors.lightGray + '30',
            borderRadius: '6px',
            padding: '2px'
          }}>
            {(['week', 'month', 'quarter', 'year'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: timeRange === range ? colors.white : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: timeRange === range ? '500' : '400',
                  color: timeRange === range ? colors.charcoal : colors.mediumGray,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 200ms ease'
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        {/* Engagement Insights */}
        {showInsights && insightsQuery.data && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            padding: '12px',
            backgroundColor: colors.lightGray + '20',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Engagement
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Zap size={14} color={getEngagementColor(insightsQuery.data.engagementLevel)} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: getEngagementColor(insightsQuery.data.engagementLevel),
                  textTransform: 'capitalize'
                }}>
                  {insightsQuery.data.engagementLevel}
                </span>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Last Contact
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.charcoal
              }}>
                {insightsQuery.data.daysSinceLastContact}d ago
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Best Time
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.charcoal
              }}>
                {insightsQuery.data.bestTimeToContact}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Response Rate
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.charcoal
              }}>
                {Math.round(insightsQuery.data.responseRate)}%
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${colors.lightGray}20`,
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: '300px'
          }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.mediumGray
            }} />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '6px',
                fontSize: '13px',
                color: colors.charcoal,
                outline: 'none',
                transition: 'all 200ms ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.evergreen
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.lightGray
              }}
            />
          </div>
          
          {/* Type Filters */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flex: 1,
            overflowX: 'auto'
          }}>
            {eventTypes.map(type => (
              <button
                key={type.id}
                onClick={() => toggleEventType(type.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  backgroundColor: selectedTypes.includes(type.id) 
                    ? type.color + '15' 
                    : colors.white,
                  border: `1px solid ${selectedTypes.includes(type.id) 
                    ? type.color 
                    : colors.lightGray}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: selectedTypes.includes(type.id) 
                    ? type.color 
                    : colors.mediumGray,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Timeline */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: '#FAFBFC'
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: colors.mediumGray
          }}>
            <Clock size={24} className="animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: colors.mediumGray
          }}>
            <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              No activities found
            </p>
            <p style={{ fontSize: '14px' }}>
              Adjust filters or expand time range
            </p>
          </div>
        ) : (
          <div style={{
            position: 'relative',
            paddingLeft: '32px'
          }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '11px',
              top: '0',
              bottom: '0',
              width: '2px',
              backgroundColor: colors.lightGray
            }} />
            
            {/* Events */}
            {events.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                style={{
                  position: 'relative',
                  marginBottom: '20px'
                }}
              >
                {/* Event Dot */}
                <div style={{
                  position: 'absolute',
                  left: '-27px',
                  top: '8px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: event.metadata?.important 
                    ? getEventColor(event) 
                    : colors.white,
                  border: `2px solid ${getEventColor(event)}`,
                  zIndex: 1
                }} />
                
                {/* Event Card */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: colors.white,
                  borderRadius: '8px',
                  border: `1px solid ${colors.lightGray}40`,
                  borderLeft: `3px solid ${getEventColor(event)}`,
                  transition: 'all 200ms ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateX(4px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: event.description ? '8px' : '0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: getEventColor(event) + '15',
                        color: getEventColor(event)
                      }}>
                        {getEventIcon(event)}
                      </div>
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: colors.charcoal
                        }}>
                          {event.title}
                        </div>
                        {event.participants && event.participants.length > 0 && (
                          <div style={{
                            fontSize: '12px',
                            color: colors.mediumGray,
                            marginTop: '2px'
                          }}>
                            {event.participants.slice(0, 2).join(', ')}
                            {event.participants.length > 2 && ` +${event.participants.length - 2}`}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <span style={{
                      fontSize: '12px',
                      color: colors.mediumGray
                    }}>
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>
                  
                  {event.description && (
                    <div style={{
                      fontSize: '13px',
                      color: colors.mediumGray,
                      lineHeight: 1.5
                    }}>
                      {event.description}
                    </div>
                  )}
                  
                  {event.metadata?.value && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px'
                    }}>
                      <DollarSign size={14} color={colors.evergreen} />
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.evergreen
                      }}>
                        ${event.metadata.value.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}