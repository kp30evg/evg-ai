'use client'

import React from 'react'
import { 
  Building2,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  TrendingUp,
  Activity,
  TrendingDown
} from 'lucide-react'

// evergreenOS Design System
const colors = {
  evergreen: '#1D5238',
  white: '#FFFFFF',
  charcoal: '#222B2E',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  gold: '#FFD600',
  blue: '#0EA5E9',
  orange: '#F97316',
  red: '#EF4444',
  green: '#10B981'
}

interface ContactIdentityCardProps {
  contact: any
}

export default function ContactIdentityCard({ contact }: ContactIdentityCardProps) {
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return colors.green
    if (score >= 50) return colors.orange
    return colors.red
  }
  
  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp size={14} />
    if (score >= 50) return <Activity size={14} />
    return <TrendingDown size={14} />
  }
  
  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${colors.lightGray}40`,
      position: 'relative'
    }}>
      {/* Avatar and Basic Info */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        {/* Avatar */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: colors.evergreen + '15',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '28px',
          fontWeight: '600',
          color: colors.evergreen,
          marginBottom: '16px',
          border: `3px solid ${colors.white}`,
          boxShadow: `0 0 0 1px ${colors.lightGray}40`
        }}>
          {contact.data.firstName?.[0]?.toUpperCase()}
          {contact.data.lastName?.[0]?.toUpperCase()}
        </div>
        
        {/* Name and Title */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: colors.charcoal,
          marginBottom: '4px'
        }}>
          {contact.data.firstName} {contact.data.lastName}
        </h2>
        
        {contact.data.jobTitle && (
          <div style={{
            fontSize: '14px',
            color: colors.mediumGray,
            marginBottom: '8px'
          }}>
            {contact.data.jobTitle}
          </div>
        )}
        
        {/* Company */}
        {contact.data.companyName && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: colors.lightGray + '20',
            borderRadius: '20px',
            marginBottom: '12px'
          }}>
            <Building2 size={14} color={colors.mediumGray} />
            <span style={{
              fontSize: '13px',
              fontWeight: '500',
              color: colors.charcoal
            }}>
              {contact.data.companyName}
            </span>
          </div>
        )}
        
        {/* Badges */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {/* Auto-created badge */}
          {contact.metadata?.autoCreated && (
            <div style={{
              padding: '4px 8px',
              backgroundColor: colors.gold + '20',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={12} color={colors.gold} />
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.charcoal
              }}>
                Auto-created
              </span>
            </div>
          )}
          
          {/* Health Score */}
          {contact.data.healthScore && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              backgroundColor: getHealthScoreColor(contact.data.healthScore) + '10',
              borderRadius: '6px'
            }}>
              {React.cloneElement(
                getHealthScoreIcon(contact.data.healthScore),
                { color: getHealthScoreColor(contact.data.healthScore) }
              )}
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: getHealthScoreColor(contact.data.healthScore)
              }}>
                {contact.data.healthScore}%
              </span>
            </div>
          )}
          
          {/* Lead Status */}
          {contact.data.leadStatus && (
            <div style={{
              padding: '4px 8px',
              backgroundColor: colors.blue + '10',
              borderRadius: '6px'
            }}>
              <span style={{
                fontSize: '11px',
                fontWeight: '500',
                color: colors.blue
              }}>
                {contact.data.leadStatus}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Info */}
      <div style={{
        borderTop: `1px solid ${colors.lightGray}40`,
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {contact.data.email && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Mail size={14} color={colors.mediumGray} />
            <a
              href={`mailto:${contact.data.email}`}
              style={{
                fontSize: '13px',
                color: colors.charcoal,
                textDecoration: 'none',
                wordBreak: 'break-all'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.blue
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.charcoal
              }}
            >
              {contact.data.email}
            </a>
          </div>
        )}
        
        {contact.data.phone && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Phone size={14} color={colors.mediumGray} />
            <a
              href={`tel:${contact.data.phone}`}
              style={{
                fontSize: '13px',
                color: colors.charcoal,
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.blue
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.charcoal
              }}
            >
              {contact.data.phone}
            </a>
          </div>
        )}
        
        {contact.data.location && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <MapPin size={14} color={colors.mediumGray} />
            <span style={{
              fontSize: '13px',
              color: colors.charcoal
            }}>
              {contact.data.location}
            </span>
          </div>
        )}
      </div>
      
      {/* Last Contact */}
      {contact.metadata?.lastContactDate && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.lightGray}40`,
          fontSize: '12px',
          color: colors.mediumGray,
          textAlign: 'center'
        }}>
          Last contact: {new Date(contact.metadata.lastContactDate).toLocaleDateString()}
        </div>
      )}
    </div>
  )
}