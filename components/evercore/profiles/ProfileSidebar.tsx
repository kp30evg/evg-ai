'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Tag,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  Linkedin,
  Twitter,
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

interface ProfileField {
  label: string
  value: string | number | React.ReactNode
  icon?: React.ElementType
}

interface ProfileSidebarProps {
  type: 'contact' | 'company' | 'deal'
  name: string
  avatar?: string
  fields: ProfileField[]
  tags?: string[]
  customProperties?: Record<string, any>
  onEdit?: () => void
  onDelete?: () => void
  actions?: React.ReactNode
}

export default function ProfileSidebar({
  type,
  name,
  avatar,
  fields,
  tags = [],
  customProperties = {},
  onEdit,
  onDelete,
  actions,
}: ProfileSidebarProps) {
  const getDefaultAvatar = () => {
    const initial = name.charAt(0).toUpperCase()
    const colors = [
      theme.colors.evergreen,
      theme.colors.stages.prospecting,
      theme.colors.stages.qualification,
      theme.colors.stages.proposal,
    ]
    const colorIndex = name.charCodeAt(0) % colors.length
    const backgroundColor = colors[colorIndex]
    
    return (
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: theme.borderRadius.full,
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.white,
        fontSize: '32px',
        fontWeight: theme.typography.fontWeight.bold,
      }}>
        {initial}
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: theme.colors.white,
      borderRadius: theme.borderRadius.md,
      border: `1px solid ${theme.colors.lightGray}`,
      padding: theme.spacing.xl,
    }}>
      {/* Profile Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        paddingBottom: theme.spacing.xl,
        borderBottom: `1px solid ${theme.colors.lightGray}`,
      }}>
        {/* Avatar */}
        <div style={{ marginBottom: theme.spacing.lg }}>
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: theme.borderRadius.full,
                objectFit: 'cover',
              }}
            />
          ) : (
            getDefaultAvatar()
          )}
        </div>

        {/* Name */}
        <h2 style={{
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.charcoal,
          margin: 0,
          marginBottom: theme.spacing.sm,
        }}>
          {name}
        </h2>

        {/* Type Badge */}
        <span style={{
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.evergreen,
          backgroundColor: theme.colors.softGreen,
          padding: `2px ${theme.spacing.sm}`,
          borderRadius: theme.borderRadius.full,
          textTransform: 'capitalize',
        }}>
          {type}
        </span>
      </div>

      {/* Information Fields */}
      <div style={{
        marginBottom: theme.spacing.xl,
      }}>
        {fields.map((field, index) => {
          const Icon = field.icon
          
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: theme.spacing.md,
                marginBottom: theme.spacing.lg,
              }}
            >
              {Icon && (
                <Icon size={16} style={{
                  color: theme.colors.mediumGray,
                  marginTop: '2px',
                  flexShrink: 0,
                }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mediumGray,
                  marginBottom: '2px',
                }}>
                  {field.label}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.charcoal,
                  wordBreak: 'break-word',
                }}>
                  {field.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div style={{
          marginBottom: theme.spacing.xl,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.mediumGray,
            marginBottom: theme.spacing.sm,
            fontWeight: theme.typography.fontWeight.medium,
          }}>
            TAGS
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
          }}>
            {tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: theme.colors.lightGray,
                  color: theme.colors.charcoal,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  borderRadius: theme.borderRadius.full,
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                }}
              >
                <Tag size={10} style={{
                  display: 'inline-block',
                  marginRight: '4px',
                  verticalAlign: 'middle',
                }} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom Properties */}
      {Object.keys(customProperties).length > 0 && (
        <div style={{
          marginBottom: theme.spacing.xl,
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.mediumGray,
            marginBottom: theme.spacing.sm,
            fontWeight: theme.typography.fontWeight.medium,
          }}>
            CUSTOM PROPERTIES
          </div>
          {Object.entries(customProperties).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: theme.spacing.sm,
              }}
            >
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray,
              }}>
                {key}
              </span>
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.charcoal,
                fontWeight: theme.typography.fontWeight.medium,
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        gap: theme.spacing.sm,
      }}>
        {onEdit && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEdit}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.md} ${theme.spacing.lg}`,
              backgroundColor: theme.colors.evergreen,
              color: theme.colors.white,
              border: 'none',
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
          >
            <Edit size={16} />
            Edit
          </motion.button>
        )}
        
        {onDelete && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${theme.spacing.md}`,
              backgroundColor: theme.colors.white,
              color: theme.colors.error,
              border: `1px solid ${theme.colors.error}30`,
              borderRadius: theme.borderRadius.base,
              cursor: 'pointer',
              transition: theme.transitions.fast,
            }}
          >
            <Trash2 size={16} />
          </motion.button>
        )}
      </div>

      {/* Additional Actions */}
      {actions && (
        <div style={{
          marginTop: theme.spacing.md,
        }}>
          {actions}
        </div>
      )}
    </div>
  )
}