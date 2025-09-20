'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  Target,
  MessageSquare,
  Clock,
  ChevronRight,
  User,
  DollarSign,
  Activity
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
  purple: '#8B5CF6',
  orange: '#F97316',
  green: '#10B981',
  gold: '#FFD600',
  red: '#EF4444'
}

interface ContactActivityTimelineProps {
  activities: any[]
  onRefresh?: () => void
}

export default function ContactActivityTimeline({ 
  activities = [], 
  onRefresh 
}: ContactActivityTimelineProps) {
  
  const getActivityIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      email: <Mail size={16} />,
      email_sent: <Mail size={16} />,
      email_received: <Mail size={16} />,
      call: <Phone size={16} />,
      meeting: <Calendar size={16} />,
      note: <FileText size={16} />,
      task: <CheckCircle size={16} />,
      deal: <Target size={16} />,
      message: <MessageSquare size={16} />,
      contact: <User size={16} />,
      invoice: <DollarSign size={16} />
    }
    // Check if type starts with any known prefix
    if (type.startsWith('email')) return <Mail size={16} />
    if (type.startsWith('call')) return <Phone size={16} />
    if (type.startsWith('meeting')) return <Calendar size={16} />
    if (type.startsWith('task')) return <CheckCircle size={16} />
    if (type.startsWith('deal')) return <Target size={16} />
    if (type.startsWith('note')) return <FileText size={16} />
    
    return icons[type] || <Activity size={16} />
  }
  
  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      email: colors.blue,
      email_sent: colors.blue,
      email_received: colors.blue,
      call: colors.green,
      meeting: colors.purple,
      note: colors.orange,
      task: colors.gold,
      deal: colors.evergreen,
      message: colors.blue,
      contact: colors.charcoal,
      invoice: colors.green
    }
    // Check if type starts with any known prefix
    if (type.startsWith('email')) return colors.blue
    if (type.startsWith('call')) return colors.green
    if (type.startsWith('meeting')) return colors.purple
    if (type.startsWith('task')) return colors.gold
    if (type.startsWith('deal')) return colors.evergreen
    if (type.startsWith('note')) return colors.orange
    
    return colorMap[type] || colors.mediumGray
  }
  
  const formatTimestamp = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - dateObj.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return dateObj.toLocaleDateString()
  }
  
  const getActivityTitle = (activity: any) => {
    if (activity.title) return activity.title
    
    // Generate title based on type
    switch (activity.type) {
      case 'email':
      case 'email_sent':
      case 'email_received':
        // For email activities, show the subject from content
        const subject = activity.content?.subject || activity.data?.subject
        if (subject) return subject
        return activity.type === 'email_sent' ? 'Email sent' : 'Email received'
      case 'call':
        return `Call logged (${activity.data?.duration || 'unknown duration'})`
      case 'meeting':
        return activity.data?.title || 'Meeting scheduled'
      case 'note':
        return 'Note added'
      case 'task':
        return activity.data?.title || 'Task created'
      case 'deal':
        return `Deal: ${activity.data?.name || 'New deal'}`
      default:
        // Check if type starts with known prefixes
        if (activity.type?.startsWith('email')) {
          const subject = activity.content?.subject || activity.data?.subject
          if (subject) return subject
          return activity.type.includes('sent') ? 'Email sent' : 'Email received'
        }
        return `${activity.type} activity`
    }
  }
  
  const getActivityDescription = (activity: any) => {
    if (activity.description) return activity.description
    
    // Generate description based on type and data
    switch (activity.type) {
      case 'email':
      case 'email_sent':
      case 'email_received':
        // For email activities, show snippet or preview
        const snippet = activity.content?.snippet || activity.data?.snippet || activity.data?.preview || activity.data?.body?.substring(0, 100)
        const from = activity.content?.from || activity.data?.from
        const to = activity.content?.to || activity.data?.to
        
        if (activity.type === 'email_sent' || activity.type?.includes('sent')) {
          return snippet ? `To: ${to} • ${snippet}` : `Sent to: ${to}`
        } else {
          return snippet ? `From: ${from} • ${snippet}` : `Received from: ${from}`
        }
      case 'call':
        return activity.data?.notes || ''
      case 'note':
        return activity.data?.content || activity.content || ''
      case 'task':
        return activity.data?.description || `Due: ${activity.data?.dueDate || 'No due date'}`
      case 'deal':
        return `Value: $${activity.data?.value || 0} • Stage: ${activity.data?.stage || 'Unknown'}`
      default:
        // Check if type starts with email
        if (activity.type?.startsWith('email')) {
          const snippet = activity.content?.snippet || activity.data?.snippet
          const from = activity.content?.from || activity.data?.from
          const to = activity.content?.to || activity.data?.to
          
          if (activity.type.includes('sent')) {
            return snippet ? `To: ${to} • ${snippet}` : `Sent to: ${to}`
          } else {
            return snippet ? `From: ${from} • ${snippet}` : `Received from: ${from}`
          }
        }
        return ''
    }
  }
  
  if (activities.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '48px 24px',
        color: colors.mediumGray
      }}>
        <Activity size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p style={{ fontSize: '14px', marginBottom: '8px' }}>No activities yet</p>
        <p style={{ fontSize: '13px', opacity: 0.8 }}>
          Activities will appear here as you interact with this contact
        </p>
      </div>
    )
  }
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id || index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          style={{
            display: 'flex',
            gap: '12px',
            padding: '14px',
            backgroundColor: colors.lightGray + '10',
            borderRadius: '10px',
            borderLeft: `3px solid ${getActivityColor(activity.type)}`,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            position: 'relative'
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
          {/* Icon */}
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: getActivityColor(activity.type) + '15',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getActivityColor(activity.type),
            flexShrink: 0
          }}>
            {getActivityIcon(activity.type)}
          </div>
          
          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal,
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {getActivityTitle(activity)}
              </span>
              {activity.data?.isAutomated && (
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  backgroundColor: colors.gold + '20',
                  color: colors.charcoal,
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  AUTO
                </span>
              )}
            </div>
            
            {getActivityDescription(activity) && (
              <div style={{
                fontSize: '13px',
                color: colors.mediumGray,
                marginBottom: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: '1.4'
              }}>
                {getActivityDescription(activity)}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '12px',
              color: colors.mediumGray + '80'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Clock size={12} />
                {formatTimestamp(activity.timestamp || activity.createdAt)}
              </div>
              
              {activity.userId && activity.userName && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <User size={12} />
                  {activity.userName}
                </div>
              )}
              
              {activity.sourceModule && (
                <div style={{
                  padding: '2px 6px',
                  backgroundColor: colors.evergreen + '10',
                  color: colors.evergreen,
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  {activity.sourceModule}
                </div>
              )}
            </div>
          </div>
          
          {/* Chevron */}
          <ChevronRight 
            size={16} 
            color={colors.mediumGray} 
            style={{ 
              flexShrink: 0,
              alignSelf: 'center'
            }} 
          />
        </motion.div>
      ))}
      
      {/* Load More Button */}
      {activities.length >= 20 && (
        <button
          onClick={onRefresh}
          style={{
            marginTop: '12px',
            padding: '10px',
            width: '100%',
            backgroundColor: colors.lightGray + '20',
            border: `1px solid ${colors.lightGray}40`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: colors.mediumGray,
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.lightGray + '40'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.lightGray + '20'
          }}
        >
          Load More Activity
        </button>
      )}
    </div>
  )
}