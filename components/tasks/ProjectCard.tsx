'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Users, Calendar, Link2, MoreVertical } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

interface ProjectCardProps {
  project: any // Entity type from database
  onUpdate?: () => void
}

export default function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const router = useRouter()
  
  // Extract data from entity structure
  const projectData = project.data || {}
  const {
    name = 'Untitled Project',
    description = '',
    progress = 0,
    tasksCount = 0,
    completedTasks = 0,
    members = [],
    dueDate,
    privacy = 'public',
    status = 'active'
  } = projectData
  
  const daysUntilDue = dueDate ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0
  
  // Get linked entities from relationships
  const linkedEntities = project.relationships || []
  const linkedDeal = linkedEntities.find((r: any) => r.type === 'linked_to')?.targetId

  return (
    <div
      onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
      style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.lightGray}`,
        padding: theme.spacing.xl,
        cursor: 'pointer',
        transition: theme.transitions.base,
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = theme.shadows.md
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Progress Bar at Top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        backgroundColor: theme.colors.lightGray
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: progress === 100 ? theme.colors.success : theme.colors.evergreen,
          transition: theme.transitions.base
        }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.md
      }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.charcoal,
          margin: 0
        }}>
          {name}
        </h3>
        <button
          onClick={(e) => {
            e.stopPropagation()
            // Handle menu actions
          }}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: theme.spacing.xs,
            borderRadius: theme.borderRadius.sm,
            transition: theme.transitions.fast
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.lightGray
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <MoreVertical size={18} color={theme.colors.mediumGray} />
        </button>
      </div>

      {/* Description */}
      <p style={{
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.mediumGray,
        margin: 0,
        marginBottom: theme.spacing.lg,
        lineHeight: 1.5
      }}>
        {description}
      </p>

      {/* OS Link Badge */}
      {linkedDeal && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          backgroundColor: theme.colors.softGreen,
          borderRadius: theme.borderRadius.sm,
          marginBottom: theme.spacing.lg
        }}>
          <Link2 size={14} color={theme.colors.evergreen} />
          <span style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.evergreen,
            fontWeight: theme.typography.fontWeight.medium
          }}>
            Deal: {linkedDeal}
          </span>
        </div>
      )}

      {/* Progress Info */}
      <div style={{
        marginBottom: theme.spacing.lg
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.sm
        }}>
          <span style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.charcoal
          }}>
            Progress
          </span>
          <span style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal
          }}>
            {completedTasks}/{tasksCount} tasks
          </span>
        </div>
        <div style={{
          height: '8px',
          backgroundColor: theme.colors.lightGray,
          borderRadius: theme.borderRadius.full,
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: progress === 100 ? theme.colors.success : theme.colors.evergreen,
            transition: theme.transitions.base
          }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Members */}
        <div style={{
          display: 'flex',
          gap: '-8px'
        }}>
          {members.slice(0, 3).map((member: string, index: number) => (
            <div
              key={index}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.evergreen,
                color: theme.colors.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.semibold,
                marginLeft: index > 0 ? '-8px' : 0,
                border: `2px solid ${theme.colors.white}`,
                position: 'relative',
                zIndex: members.length - index
              }}
            >
              {member}
            </div>
          ))}
          {members.length > 3 && (
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: theme.borderRadius.full,
                backgroundColor: theme.colors.lightGray,
                color: theme.colors.mediumGray,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.semibold,
                marginLeft: '-8px',
                border: `2px solid ${theme.colors.white}`,
                position: 'relative'
              }}
            >
              +{members.length - 3}
            </div>
          )}
        </div>

        {/* Due Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          backgroundColor: isOverdue 
            ? `${theme.colors.error}20` 
            : isDueSoon 
              ? `${theme.colors.warning}20`
              : theme.colors.lightGray,
          borderRadius: theme.borderRadius.sm
        }}>
          <Calendar size={14} color={
            isOverdue 
              ? theme.colors.error 
              : isDueSoon 
                ? theme.colors.warning
                : theme.colors.mediumGray
          } />
          <span style={{
            fontSize: theme.typography.fontSize.xs,
            color: isOverdue 
              ? theme.colors.error 
              : isDueSoon 
                ? theme.colors.warning
                : theme.colors.mediumGray,
            fontWeight: theme.typography.fontWeight.medium
          }}>
            {isOverdue 
              ? `${Math.abs(daysUntilDue)} days overdue`
              : isDueSoon
                ? `${daysUntilDue} days left`
                : dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'
            }
          </span>
        </div>
      </div>
    </div>
  )
}