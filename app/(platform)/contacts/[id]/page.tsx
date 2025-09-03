'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { trpc } from '@/lib/trpc/client'
import { 
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FileSignature,
  Receipt,
  HeadphonesIcon,
  Megaphone,
  User,
  Building2,
  Activity,
  Brain,
  Link,
  Filter,
  MessageSquare,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Sparkles,
  Network,
  BarChart3,
  Tag,
  Users,
  Target,
  CreditCard,
  HardDrive,
  Search,
  MoreVertical,
  Plus,
  Hash,
  Video,
  Briefcase,
  Edit2,
  Star,
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  PenTool,
  FileIcon,
  Reply,
  Forward,
  Archive,
  CalendarDays,
  TrendingDown,
  AlertTriangle,
  ChevronUp
} from 'lucide-react'

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contactId = params.id as string
  const [activeTab, setActiveTab] = useState<'timeline' | 'emails' | 'meetings' | 'notes' | 'tasks' | 'files'>('timeline')
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const [showActionsDropdown, setShowActionsDropdown] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  
  // Fetch contact data
  const contactQuery = trpc.unified.getEntity.useQuery(
    { id: contactId },
    { 
      enabled: !!contactId,
      refetchInterval: 30000 // Real-time updates
    }
  )
  
  // Fetch related entities
  const relatedQuery = trpc.unified.getRelatedEntities.useQuery(
    { entityId: contactId },
    { enabled: !!contactId }
  )
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    successGreen: '#10B981',
    errorRed: '#EF4444'
  }
  
  const contact = contactQuery.data
  const relatedEntities = relatedQuery.data || []
  
  // Calculate quick stats
  const quickStats = {
    dealValue: relatedEntities.filter(e => e.type === 'deal').reduce((sum, deal) => sum + (deal.data.value || 0), 0),
    lastActivity: relatedEntities.length > 0 ? relatedEntities[0].createdAt : null,
    responseRate: 89, // Mock data
    healthScore: contact?.data.healthScore || 75
  }
  
  // Filter and group activities
  const getFilteredActivities = () => {
    let filtered = relatedEntities
    
    // Apply type filter
    if (activityFilter !== 'all') {
      filtered = filtered.filter(e => {
        switch (activityFilter) {
          case 'email': return e.type === 'email'
          case 'call': return e.type === 'call'
          case 'meeting': return e.type === 'meeting' || e.type === 'calendar_event'
          case 'note': return e.type === 'note'
          case 'task': return e.type === 'task'
          default: return true
        }
      })
    }
    
    // Apply time filter
    const now = Date.now()
    if (timeFilter !== 'all') {
      filtered = filtered.filter(e => {
        const created = new Date(e.createdAt).getTime()
        const daysSince = (now - created) / (1000 * 60 * 60 * 24)
        switch (timeFilter) {
          case 'today': return daysSince < 1
          case 'week': return daysSince < 7
          case 'month': return daysSince < 30
          default: return true
        }
      })
    }
    
    // Group by date
    const grouped: Record<string, typeof filtered> = {}
    filtered.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(item)
    })
    
    return grouped
  }
  
  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }
  
  const toggleItemExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }
  
  const getHealthScoreInfo = (score?: number) => {
    if (!score) return { color: colors.mediumGray, label: 'Unknown', icon: AlertCircle }
    if (score >= 80) return { color: colors.successGreen, label: 'Healthy', icon: TrendingUp }
    if (score >= 50) return { color: colors.mediumGray, label: 'At Risk', icon: AlertTriangle }
    return { color: colors.errorRed, label: 'Critical', icon: TrendingDown }
  }
  
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const formatTimeAgo = (date: string | Date) => {
    const now = Date.now()
    const then = new Date(date).getTime()
    const diff = now - then
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }
  
  if (contactQuery.isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: colors.white
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Activity size={32} color={colors.evergreen} />
        </motion.div>
      </div>
    )
  }
  
  if (!contact || contact.type !== 'contact') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '20px'
      }}>
        <AlertCircle size={48} color={colors.red} />
        <h2 style={{ fontSize: '20px', color: colors.charcoal }}>Contact not found</h2>
        <button
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.evergreen,
            color: colors.white,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    )
  }
  
  const healthInfo = getHealthScoreInfo(quickStats.healthScore)
  const groupedActivities = getFilteredActivities()
  
  // Count activities by type
  const activityCounts = {
    timeline: relatedEntities.length,
    emails: relatedEntities.filter(e => e.type === 'email').length,
    meetings: relatedEntities.filter(e => e.type === 'meeting' || e.type === 'calendar_event').length,
    notes: relatedEntities.filter(e => e.type === 'note').length,
    tasks: relatedEntities.filter(e => e.type === 'task').length,
    files: relatedEntities.filter(e => e.type === 'document' || e.type === 'file').length
  }
  
  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#F8F9FA',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Navigation Bar */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.mediumGray,
              cursor: 'pointer',
              borderRadius: '6px',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.lightGray + '30'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ArrowLeft size={18} />
            Back
          </button>
          
          <div style={{
            height: '24px',
            width: '1px',
            backgroundColor: colors.lightGray
          }} />
          
          <span style={{
            fontSize: '13px',
            color: colors.mediumGray
          }}>
            Contacts / {contact.data.firstName} {contact.data.lastName}
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: colors.white,
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '6px',
              color: colors.charcoal,
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Star size={16} />
            Follow
          </button>
          
          <button
            style={{
              padding: '8px',
              backgroundColor: colors.white,
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '6px',
              color: colors.mediumGray,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>
      
      {/* Three Column Layout */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '340px 1fr 380px',
        height: 'calc(100vh - 57px)',
        overflow: 'hidden'
      }}>
        {/* Left Sidebar - Enhanced Action Hub */}
        <div style={{
          backgroundColor: colors.white,
          borderRight: `1px solid ${colors.lightGray}40`,
          padding: '28px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}>
          {/* Enhanced Contact Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            paddingBottom: '24px',
            borderBottom: `1px solid ${colors.lightGray}40`
          }}>
            <div style={{
              position: 'relative'
            }}>
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                backgroundColor: colors.lightGray + '30',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: '600',
                color: colors.charcoal,
                border: `2px solid ${colors.white}`,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
              }}>
                {contact.data.firstName?.[0]}{contact.data.lastName?.[0]}
              </div>
              
              {/* Status Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: quickStats.healthScore >= 70 ? colors.successGreen : colors.mediumGray,
                border: `2px solid ${colors.white}`,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }} />
            </div>
            
            <div style={{
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: colors.charcoal,
                margin: '0 0 4px 0'
              }}>
                {contact.data.firstName} {contact.data.lastName}
              </h2>
              {contact.data.jobTitle && (
                <p style={{
                  fontSize: '14px',
                  color: colors.mediumGray,
                  margin: '0 0 8px 0'
                }}>
                  {contact.data.jobTitle}
                </p>
              )}
              {contact.data.company && (
                <a
                  href="#"
                  style={{
                    fontSize: '14px',
                    color: colors.evergreen,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'center'
                  }}
                >
                  <Building2 size={14} />
                  {contact.data.company}
                </a>
              )}
            </div>
            
            {/* Quick Stats Bar */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              width: '100%',
              padding: '12px',
              backgroundColor: colors.lightGray + '20',
              borderRadius: '8px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: colors.charcoal }}>
                  ${(quickStats.dealValue / 1000).toFixed(0)}K
                </div>
                <div style={{ fontSize: '11px', color: colors.mediumGray, fontWeight: '500' }}>Deal Value</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: colors.charcoal }}>
                  {quickStats.lastActivity ? formatTimeAgo(quickStats.lastActivity).split(' ')[0] : '—'}
                </div>
                <div style={{ fontSize: '11px', color: colors.mediumGray, fontWeight: '500' }}>Last Activity</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: colors.evergreen }}>
                  {quickStats.healthScore}%
                </div>
                <div style={{ fontSize: '11px', color: colors.mediumGray, fontWeight: '500' }}>Health</div>
              </div>
            </div>
          </div>
          
          {/* Smart Quick Actions Grid */}
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {/* Primary Actions Row */}
              <button
                onClick={() => window.location.href = `tel:${contact.data.phone}`}
                style={{
                  padding: '12px',
                  backgroundColor: colors.lightGray + '20',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '50'
                  e.currentTarget.style.borderColor = colors.mediumGray
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '20'
                  e.currentTarget.style.borderColor = colors.lightGray + '40'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Phone size={18} color={colors.charcoal} />
                <span style={{ fontSize: '11px', color: colors.mediumGray }}>Call</span>
              </button>
              
              <button
                onClick={() => router.push(`/mail/compose?to=${contact.data.email}`)}
                style={{
                  padding: '12px',
                  backgroundColor: colors.lightGray + '20',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '50'
                  e.currentTarget.style.borderColor = colors.mediumGray
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '20'
                  e.currentTarget.style.borderColor = colors.lightGray + '40'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Mail size={18} color={colors.charcoal} />
                <span style={{ fontSize: '11px', color: colors.mediumGray }}>Email</span>
              </button>
              
              <button
                onClick={() => router.push(`/dashboard/calendar?attendee=${contact.data.email}`)}
                style={{
                  padding: '12px',
                  backgroundColor: colors.lightGray + '20',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '50'
                  e.currentTarget.style.borderColor = colors.mediumGray
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '20'
                  e.currentTarget.style.borderColor = colors.lightGray + '40'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Calendar size={18} color={colors.charcoal} />
                <span style={{ fontSize: '11px', color: colors.mediumGray }}>Meeting</span>
              </button>
              
              {/* Secondary Actions Row */}
              <button
                style={{
                  padding: '12px',
                  backgroundColor: colors.lightGray + '20',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '50'
                  e.currentTarget.style.borderColor = colors.mediumGray
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '20'
                  e.currentTarget.style.borderColor = colors.lightGray + '40'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <CheckSquare size={18} color={colors.charcoal} />
                <span style={{ fontSize: '11px', color: colors.mediumGray }}>Task</span>
              </button>
              
              <button
                style={{
                  padding: '12px',
                  backgroundColor: colors.lightGray + '20',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '50'
                  e.currentTarget.style.borderColor = colors.mediumGray
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '20'
                  e.currentTarget.style.borderColor = colors.lightGray + '40'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <PenTool size={18} color={colors.charcoal} />
                <span style={{ fontSize: '11px', color: colors.mediumGray }}>Note</span>
              </button>
              
              <button
                style={{
                  padding: '12px',
                  backgroundColor: colors.lightGray + '20',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '50'
                  e.currentTarget.style.borderColor = colors.mediumGray
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray + '20'
                  e.currentTarget.style.borderColor = colors.lightGray + '40'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <Activity size={18} color={colors.charcoal} />
                <span style={{ fontSize: '11px', color: colors.mediumGray }}>Log</span>
              </button>
            </div>
            
            {/* More Actions Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowActionsDropdown(!showActionsDropdown)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: colors.evergreen,
                  color: colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} />
                More Actions
                <ChevronDown size={16} />
              </button>
              
              <AnimatePresence>
                {showActionsDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute',
                      top: '44px',
                      left: 0,
                      right: 0,
                      backgroundColor: colors.white,
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: `1px solid ${colors.lightGray}40`,
                      zIndex: 10,
                      overflow: 'hidden'
                    }}
                  >
                    {[
                      { icon: Receipt, label: 'Generate Invoice', module: 'EverBooks' },
                      { icon: HeadphonesIcon, label: 'Create Support Ticket', module: 'EverHelp' },
                      { icon: FileSignature, label: 'Send Contract', module: 'EverSign' },
                      { icon: Megaphone, label: 'Add to Campaign', module: 'EverReach' },
                      { icon: Target, label: 'Create Deal', module: 'EverCore' }
                    ].map((action, idx) => (
                      <button
                        key={idx}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderBottom: idx < 4 ? `1px solid ${colors.lightGray}20` : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background-color 200ms ease',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.softGreen + '50'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <action.icon size={16} color={colors.evergreen} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: colors.charcoal
                          }}>
                            {action.label}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: colors.mediumGray
                          }}>
                            {action.module}
                          </div>
                        </div>
                        <ChevronRight size={14} color={colors.mediumGray} />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Collapsible Key Properties */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {/* Basic Info Section */}
            <div style={{
              backgroundColor: expandedSections.has('basic') ? colors.lightGray + '10' : 'transparent',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => toggleSection('basic')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Basic Info
                </span>
                {expandedSections.has('basic') ? (
                  <ChevronUp size={16} color={colors.mediumGray} />
                ) : (
                  <ChevronDown size={16} color={colors.mediumGray} />
                )}
              </button>
              
              <AnimatePresence>
                {expandedSections.has('basic') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '0 12px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {[
                      { label: 'Email', value: contact.data.email, icon: Mail },
                      { label: 'Phone', value: contact.data.phone, icon: Phone },
                      { label: 'Location', value: contact.data.city, icon: MapPin },
                      { label: 'Owner', value: 'Victor Novak', icon: User }
                    ].map((prop, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <prop.icon size={14} color={colors.mediumGray} style={{ marginTop: '2px' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '11px',
                            fontWeight: '500',
                            color: colors.mediumGray,
                            marginBottom: '2px',
                            textTransform: 'uppercase'
                          }}>
                            {prop.label}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: '500',
                            color: colors.charcoal
                          }}>
                            {prop.value || 'Not set'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Company Info Section */}
            <div style={{
              backgroundColor: expandedSections.has('company') ? colors.lightGray + '10' : 'transparent',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => toggleSection('company')}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Company Info
                </span>
                {expandedSections.has('company') ? (
                  <ChevronUp size={16} color={colors.mediumGray} />
                ) : (
                  <ChevronDown size={16} color={colors.mediumGray} />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Center Pane - Enhanced Chronicle */}
        <div style={{
          backgroundColor: colors.white,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Sticky Tab Bar with Counts */}
          <div style={{
            borderBottom: `1px solid ${colors.lightGray}40`,
            backgroundColor: colors.white,
            position: 'sticky',
            top: 0,
            zIndex: 5
          }}>
            <div style={{
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex' }}>
                {[
                  { id: 'timeline', label: 'Timeline', icon: Clock, count: activityCounts.timeline },
                  { id: 'emails', label: 'Emails', icon: Mail, count: activityCounts.emails },
                  { id: 'meetings', label: 'Meetings', icon: Calendar, count: activityCounts.meetings },
                  { id: 'notes', label: 'Notes', icon: FileText, count: activityCounts.notes },
                  { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: activityCounts.tasks },
                  { id: 'files', label: 'Files', icon: FileIcon, count: activityCounts.files }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '16px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab.id ? `2px solid ${colors.evergreen}` : '2px solid transparent',
                      color: activeTab === tab.id ? colors.evergreen : colors.mediumGray,
                      fontSize: '13px',
                      fontWeight: activeTab === tab.id ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 200ms ease',
                      marginBottom: '-1px'
                    }}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                    {tab.count > 0 && (
                      <span style={{
                        padding: '2px 6px',
                        backgroundColor: activeTab === tab.id ? colors.evergreen + '20' : colors.lightGray + '50',
                        color: activeTab === tab.id ? colors.evergreen : colors.mediumGray,
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Smart Filter Bar */}
            {activeTab === 'timeline' && (
              <div style={{
                padding: '12px 24px',
                backgroundColor: colors.lightGray + '10',
                borderTop: `1px solid ${colors.lightGray}20`,
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setActivityFilter('all')}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: activityFilter === 'all' ? colors.evergreen : colors.white,
                      color: activityFilter === 'all' ? colors.white : colors.charcoal,
                      border: `1px solid ${activityFilter === 'all' ? colors.evergreen : colors.lightGray}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </button>
                  {[
                    { id: 'email', icon: Mail },
                    { id: 'call', icon: Phone },
                    { id: 'meeting', icon: Calendar },
                    { id: 'note', icon: FileText }
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setActivityFilter(filter.id)}
                      style={{
                        padding: '6px 10px',
                        backgroundColor: activityFilter === filter.id ? colors.softGreen : colors.white,
                        border: `1px solid ${activityFilter === filter.id ? colors.evergreen : colors.lightGray}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: activityFilter === filter.id ? colors.evergreen : colors.mediumGray,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <filter.icon size={12} />
                    </button>
                  ))}
                </div>
                
                <div style={{
                  height: '20px',
                  width: '1px',
                  backgroundColor: colors.lightGray
                }} />
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'Past Week' },
                    { id: 'month', label: 'Past Month' }
                  ].map(time => (
                    <button
                      key={time.id}
                      onClick={() => setTimeFilter(time.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: timeFilter === time.id ? colors.white : 'transparent',
                        border: timeFilter === time.id ? `1px solid ${colors.lightGray}` : '1px solid transparent',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: timeFilter === time.id ? colors.charcoal : colors.mediumGray,
                        cursor: 'pointer'
                      }}
                    >
                      {time.label}
                    </button>
                  ))}
                </div>
                
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{
                    position: 'relative'
                  }}>
                    <Search size={14} style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: colors.mediumGray
                    }} />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      style={{
                        padding: '6px 12px 6px 32px',
                        backgroundColor: colors.white,
                        border: `1px solid ${colors.lightGray}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        outline: 'none',
                        width: '200px'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = colors.evergreen
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = colors.lightGray
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Tab Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px'
          }}>
            <AnimatePresence mode="wait">
              {activeTab === 'timeline' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Grouped Timeline by Date */}
                  {Object.keys(groupedActivities).length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      color: colors.mediumGray
                    }}>
                      <Clock size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                      <p style={{ fontSize: '16px', fontWeight: '500' }}>No activities found</p>
                      <p style={{ fontSize: '14px', marginTop: '8px' }}>Activities will appear here as they occur</p>
                    </div>
                  ) : (
                    Object.entries(groupedActivities).map(([date, items]) => (
                      <div key={date} style={{ marginBottom: '32px' }}>
                        {/* Date Separator */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: colors.mediumGray,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap'
                          }}>
                            {date}
                          </div>
                          <div style={{
                            flex: 1,
                            height: '1px',
                            backgroundColor: colors.lightGray + '40'
                          }} />
                        </div>
                        
                        {/* Activities for this date */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          {items.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              style={{
                                backgroundColor: colors.white,
                                border: `1px solid ${colors.lightGray}40`,
                                borderRadius: '8px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                                position: 'relative'
                              }}
                              onClick={() => toggleItemExpanded(item.id)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                                e.currentTarget.style.transform = 'translateY(-1px)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'none'
                                e.currentTarget.style.transform = 'translateY(0)'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px'
                              }}>
                                {/* Activity Icon */}
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: colors.softGreen,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  {item.type === 'email' && <Mail size={16} color={colors.evergreen} />}
                                  {item.type === 'call' && <Phone size={16} color={colors.evergreen} />}
                                  {item.type === 'meeting' && <Calendar size={16} color={colors.evergreen} />}
                                  {item.type === 'note' && <FileText size={16} color={colors.evergreen} />}
                                  {item.type === 'task' && <CheckSquare size={16} color={colors.evergreen} />}
                                  {item.type === 'deal' && <Target size={16} color={colors.evergreen} />}
                                </div>
                                
                                {/* Content */}
                                <div style={{ flex: 1 }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    marginBottom: '4px'
                                  }}>
                                    <div>
                                      <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: colors.charcoal,
                                        marginBottom: '2px'
                                      }}>
                                        {item.data.subject || item.data.title || item.data.name || `${item.type} Activity`}
                                      </div>
                                      <div style={{
                                        fontSize: '12px',
                                        color: colors.mediumGray
                                      }}>
                                        {formatTimeAgo(item.createdAt)}
                                        {item.data.priority && (
                                          <span style={{
                                            marginLeft: '8px',
                                            padding: '2px 6px',
                                            backgroundColor: item.data.priority === 'high' ? colors.errorRed + '20' : colors.mediumGray + '20',
                                            color: item.data.priority === 'high' ? colors.errorRed : colors.mediumGray,
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontWeight: '500'
                                          }}>
                                            {item.data.priority} priority
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <ChevronRight
                                      size={16}
                                      color={colors.mediumGray}
                                      style={{
                                        transform: expandedItems.has(item.id) ? 'rotate(90deg)' : 'rotate(0)',
                                        transition: 'transform 200ms ease'
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Preview Text */}
                                  {!expandedItems.has(item.id) && (item.data.body || item.data.description) && (
                                    <div style={{
                                      fontSize: '13px',
                                      color: colors.mediumGray,
                                      lineHeight: '1.5',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical'
                                    }}>
                                      {item.data.body || item.data.description}
                                    </div>
                                  )}
                                  
                                  {/* Expanded Content */}
                                  {expandedItems.has(item.id) && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      style={{
                                        marginTop: '12px',
                                        paddingTop: '12px',
                                        borderTop: `1px solid ${colors.lightGray}20`
                                      }}
                                    >
                                      <div style={{
                                        fontSize: '13px',
                                        color: colors.charcoal,
                                        lineHeight: '1.6',
                                        marginBottom: '12px'
                                      }}>
                                        {item.data.body || item.data.description || item.data.content || 'No content available'}
                                      </div>
                                      
                                      {/* Inline Actions */}
                                      <div style={{
                                        display: 'flex',
                                        gap: '8px'
                                      }}>
                                        {item.type === 'email' && (
                                          <>
                                            <button
                                              style={{
                                                padding: '6px 12px',
                                                backgroundColor: colors.evergreen,
                                                color: colors.white,
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Reply size={12} />
                                              Reply
                                            </button>
                                            <button
                                              style={{
                                                padding: '6px 12px',
                                                backgroundColor: colors.white,
                                                color: colors.charcoal,
                                                border: `1px solid ${colors.lightGray}`,
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <Forward size={12} />
                                              Forward
                                            </button>
                                          </>
                                        )}
                                        {item.type === 'task' && (
                                          <button
                                            style={{
                                              padding: '6px 12px',
                                              backgroundColor: colors.evergreen,
                                              color: colors.white,
                                              border: 'none',
                                              borderRadius: '6px',
                                              fontSize: '12px',
                                              fontWeight: '500',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px'
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <CheckCircle size={12} />
                                            Complete
                                          </button>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
              
              {/* Other tabs content */}
              {activeTab !== 'timeline' && (
                <div style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: colors.mediumGray
                }}>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} View
                  </p>
                  <p style={{ fontSize: '14px', marginTop: '8px' }}>
                    Content for {activeTab} will be displayed here
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Right Sidebar - Enhanced AI Command Center */}
        <div style={{
          backgroundColor: colors.white,
          borderLeft: `1px solid ${colors.lightGray}40`,
          padding: '28px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px'
        }}>
          {/* AI Command Center */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <Sparkles size={18} color={colors.evergreen} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colors.charcoal,
                margin: 0
              }}>
                AI Command Center
              </h3>
            </div>
            
            <textarea
              placeholder="Ask anything about this contact..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                backgroundColor: colors.lightGray + '20',
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = colors.evergreen
              }}
              onBlur={(e) => {
                e.target.style.borderColor = colors.lightGray + '40'
              }}
            />
            
            {/* Contextual Prompts */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '8px'
            }}>
              {[
                'Summarize recent interactions',
                'Find all deals',
                'Show engagement trend',
                'Next best action'
              ].map((prompt) => (
                <button
                  key={prompt}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: colors.lightGray + '20',
                    border: `1px solid ${colors.lightGray}40`,
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: colors.mediumGray,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.softGreen
                    e.currentTarget.style.borderColor = colors.evergreen
                    e.currentTarget.style.color = colors.evergreen
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.lightGray + '20'
                    e.currentTarget.style.borderColor = colors.lightGray + '40'
                    e.currentTarget.style.color = colors.mediumGray
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
            
            <button
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '12px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} />
              Ask AI
            </button>
          </div>
          
          {/* Dynamic Insights */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '16px'
            }}>
              Dynamic Insights
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {/* Next Best Action */}
              <div style={{
                padding: '12px',
                backgroundColor: colors.softGreen,
                borderLeft: `3px solid ${colors.evergreen}`,
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.evergreen,
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Target size={12} />
                  Next Best Action
                </div>
                <div style={{
                  fontSize: '13px',
                  color: colors.charcoal,
                  marginBottom: '8px'
                }}>
                  Schedule a follow-up call to discuss Q4 expansion
                </div>
                <button
                  style={{
                    padding: '4px 8px',
                    backgroundColor: colors.evergreen,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Take Action
                </button>
              </div>
              
              {/* Engagement Score */}
              <div style={{
                padding: '12px',
                backgroundColor: colors.lightGray + '30',
                borderLeft: `3px solid ${colors.mediumGray}`,
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.mediumGray,
                  marginBottom: '4px'
                }}>
                  Engagement Score
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: colors.charcoal
                  }}>
                    87%
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: colors.successGreen,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <TrendingUp size={12} />
                    +12% this month
                  </span>
                </div>
              </div>
              
              {/* Risk Indicator */}
              <div style={{
                padding: '12px',
                backgroundColor: colors.lightGray + '30',
                borderLeft: `3px solid ${colors.errorRed}`,
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.errorRed,
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <AlertTriangle size={12} />
                  Risk Alert
                </div>
                <div style={{
                  fontSize: '13px',
                  color: colors.charcoal
                }}>
                  No response to last 2 emails
                </div>
              </div>
            </div>
          </div>
          
          {/* Cross-Module Activity Stream */}
          <div>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '16px'
            }}>
              Module Activity
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {[
                { module: 'EverMail', count: 23, icon: Mail, color: colors.blue, recent: '2 hours ago' },
                { module: 'EverCal', count: 5, icon: Calendar, color: colors.purple, recent: 'Yesterday' },
                { module: 'EverChat', count: 47, icon: MessageSquare, color: colors.green, recent: '1 hour ago' },
                { module: 'EverBooks', count: 2, icon: Receipt, color: colors.orange, recent: 'Last week' },
                { module: 'EverHelp', count: 1, icon: HeadphonesIcon, color: colors.red, recent: '2 weeks ago' }
              ].map((module) => (
                <div
                  key={module.module}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    backgroundColor: colors.lightGray + '10',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 200ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.lightGray + '30'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.lightGray + '10'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <module.icon size={16} color={module.color} />
                    <div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: colors.charcoal
                      }}>
                        {module.module}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: colors.mediumGray
                      }}>
                        {module.recent}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: module.color,
                    backgroundColor: module.color + '20',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}>
                    {module.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}