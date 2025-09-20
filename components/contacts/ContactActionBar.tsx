'use client'

import React from 'react'
import { 
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle
} from 'lucide-react'

// evergreenOS Design System
const colors = {
  evergreen: '#1D5238',
  white: '#FFFFFF',
  charcoal: '#222B2E',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC'
}

interface ContactActionBarProps {
  onEmailClick: () => void
  onTaskClick: () => void
  onNoteClick: () => void
  onCallClick: () => void
  onMeetingClick: () => void
}

export default function ContactActionBar({
  onEmailClick,
  onTaskClick,
  onNoteClick,
  onCallClick,
  onMeetingClick
}: ContactActionBarProps) {
  const actions = [
    {
      icon: <FileText size={18} />,
      label: 'Note',
      onClick: onNoteClick,
      tooltip: 'Add a note'
    },
    {
      icon: <Mail size={18} />,
      label: 'Email',
      onClick: onEmailClick,
      tooltip: 'Send an email'
    },
    {
      icon: <Phone size={18} />,
      label: 'Call',
      onClick: onCallClick,
      tooltip: 'Log a call'
    },
    {
      icon: <CheckCircle size={18} />,
      label: 'Task',
      onClick: onTaskClick,
      tooltip: 'Create a task'
    },
    {
      icon: <Calendar size={18} />,
      label: 'Meeting',
      onClick: onMeetingClick,
      tooltip: 'Schedule a meeting'
    }
  ]
  
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${colors.lightGray}40`
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px'
      }}>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            title={action.tooltip}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 8px',
              backgroundColor: colors.white,
              border: `1px solid ${colors.lightGray}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget
              btn.style.backgroundColor = colors.softGreen
              btn.style.borderColor = colors.evergreen + '40'
              btn.style.transform = 'translateY(-2px)'
              btn.style.boxShadow = '0 4px 12px rgba(29, 82, 56, 0.15)'
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget
              btn.style.backgroundColor = colors.white
              btn.style.borderColor = colors.lightGray
              btn.style.transform = 'translateY(0)'
              btn.style.boxShadow = 'none'
            }}
          >
            <div style={{
              color: colors.evergreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {action.icon}
            </div>
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              color: colors.charcoal
            }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}