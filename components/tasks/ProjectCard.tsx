'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Calendar, 
  Link2, 
  MoreVertical,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Briefcase,
  Tag,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Edit2,
  Copy,
  Archive,
  Trash2
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'

interface ProjectCardProps {
  project: any // Entity type from database
  onUpdate?: () => void
}

export default function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  
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
    startDate,
    privacy = 'public',
    status = 'active',
    budget = null,
    actualCost = 0,
    category = null,
    client = null,
    tags = [],
    health = 'good',
    estimatedHours = 0,
    actualHours = 0
  } = projectData
  
  const daysUntilDue = dueDate ? Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0
  
  // Get linked entities from relationships
  const linkedEntities = project.relationships || []
  const linkedDeal = linkedEntities.find((r: any) => r.type === 'linked_to')?.targetId
  
  // Calculate budget utilization
  const budgetUtilization = budget ? Math.round((actualCost / budget) * 100) : 0
  const isBudgetOverrun = budgetUtilization > 100
  
  // Calculate time utilization
  const timeUtilization = estimatedHours ? Math.round((actualHours / estimatedHours) * 100) : 0
  const isTimeOverrun = timeUtilization > 100
  
  const getHealthColor = (health: string) => {
    switch(health) {
      case 'good': return theme.colors.success
      case 'at-risk': return theme.colors.warning
      case 'critical': return theme.colors.error
      default: return theme.colors.mediumGray
    }
  }
  
  const getHealthIcon = (health: string) => {
    switch(health) {
      case 'good': return <CheckCircle size={16} color={getHealthColor(health)} />
      case 'at-risk': return <AlertTriangle size={16} color={getHealthColor(health)} />
      case 'critical': return <AlertTriangle size={16} color={getHealthColor(health)} />
      default: return <Activity size={16} color={getHealthColor(health)} />
    }
  }

  return (
    <div
      style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        border: `1px solid ${theme.colors.lightGray}`,
        padding: theme.spacing.xl,
        cursor: 'pointer',
        transition: theme.transitions.base,
        position: 'relative',
        overflow: 'visible'
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
      <div 
        onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.md
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.xs
          }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              margin: 0
            }}>
              {name}
            </h3>
            {/* Health Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: `2px ${theme.spacing.sm}`,
              backgroundColor: `${getHealthColor(health)}15`,
              borderRadius: theme.borderRadius.sm
            }}>
              {getHealthIcon(health)}
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: getHealthColor(health),
                fontWeight: theme.typography.fontWeight.medium,
                textTransform: 'capitalize'
              }}>
                {health}
              </span>
            </div>
          </div>
          
          {/* Client & Category */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.xs,
            flexWrap: 'wrap'
          }}>
            {client && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.mediumGray
              }}>
                <Briefcase size={12} />
                {client}
              </div>
            )}
            {category && (
              <div style={{
                padding: `2px ${theme.spacing.xs}`,
                backgroundColor: theme.colors.softGreen,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.evergreen,
                fontWeight: theme.typography.fontWeight.medium
              }}>
                {category}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
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
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: theme.spacing.xs,
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.base,
              boxShadow: theme.shadows.lg,
              border: `1px solid ${theme.colors.lightGray}`,
              minWidth: '160px',
              zIndex: 1000
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/dashboard/tasks/${project.id}?tab=settings`)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  width: '100%',
                  padding: theme.spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.charcoal,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.softGray
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Edit2 size={14} />
                Edit Project
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  width: '100%',
                  padding: theme.spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.charcoal,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.softGray
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Copy size={14} />
                Duplicate
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  width: '100%',
                  padding: theme.spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.charcoal,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.softGray
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Archive size={14} />
                Archive
              </button>
              <div style={{
                borderTop: `1px solid ${theme.colors.lightGray}`,
                margin: `${theme.spacing.xs} 0`
              }} />
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  width: '100%',
                  padding: theme.spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.error,
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${theme.colors.error}10`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p 
        onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.mediumGray,
          margin: 0,
          marginBottom: theme.spacing.md,
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {description || 'No description'}
      </p>
      
      {/* Tags */}
      {tags.length > 0 && (
        <div style={{
          display: 'flex',
          gap: theme.spacing.xs,
          marginBottom: theme.spacing.md,
          flexWrap: 'wrap'
        }}>
          {tags.slice(0, 3).map((tag: string) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `2px ${theme.spacing.sm}`,
                backgroundColor: theme.colors.softGray,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.charcoal
              }}
            >
              <Tag size={10} />
              {tag}
            </div>
          ))}
          {tags.length > 3 && (
            <div style={{
              padding: `2px ${theme.spacing.sm}`,
              backgroundColor: theme.colors.softGray,
              borderRadius: theme.borderRadius.sm,
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.mediumGray
            }}>
              +{tags.length - 3} more
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div 
        onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.lg
        }}
      >
        {/* Budget Card */}
        {budget && (
          <div style={{
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.softGray,
            borderRadius: theme.borderRadius.sm
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              marginBottom: theme.spacing.xs
            }}>
              <DollarSign size={14} color={isBudgetOverrun ? theme.colors.error : theme.colors.evergreen} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.mediumGray
              }}>
                Budget
              </span>
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: isBudgetOverrun ? theme.colors.error : theme.colors.charcoal,
              marginBottom: theme.spacing.xs
            }}>
              ${actualCost.toLocaleString()} / ${budget.toLocaleString()}
            </div>
            <div style={{
              height: '4px',
              backgroundColor: theme.colors.lightGray,
              borderRadius: theme.borderRadius.full,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(budgetUtilization, 100)}%`,
                backgroundColor: isBudgetOverrun ? theme.colors.error : theme.colors.evergreen,
                transition: theme.transitions.base
              }} />
            </div>
          </div>
        )}
        
        {/* Time Tracking Card */}
        {(estimatedHours > 0 || actualHours > 0) && (
          <div style={{
            padding: theme.spacing.sm,
            backgroundColor: theme.colors.softGray,
            borderRadius: theme.borderRadius.sm
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              marginBottom: theme.spacing.xs
            }}>
              <Clock size={14} color={isTimeOverrun ? theme.colors.warning : theme.colors.blue} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.mediumGray
              }}>
                Time
              </span>
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
              color: isTimeOverrun ? theme.colors.warning : theme.colors.charcoal,
              marginBottom: theme.spacing.xs
            }}>
              {actualHours}h / {estimatedHours}h
            </div>
            <div style={{
              height: '4px',
              backgroundColor: theme.colors.lightGray,
              borderRadius: theme.borderRadius.full,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(timeUtilization, 100)}%`,
                backgroundColor: isTimeOverrun ? theme.colors.warning : theme.colors.blue,
                transition: theme.transitions.base
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Progress Info */}
      <div 
        onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
        style={{
          marginBottom: theme.spacing.lg
        }}
      >
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
            Tasks
          </span>
          <span style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal
          }}>
            {completedTasks}/{tasksCount} ({progress}%)
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
      <div 
        onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {/* Members */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm
        }}>
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
                {member[0]?.toUpperCase() || '?'}
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
          <span style={{
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.mediumGray
          }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Dates */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2
        }}>
          {startDate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.mediumGray
            }}>
              <Calendar size={12} />
              {new Date(startDate).toLocaleDateString()}
            </div>
          )}
          {dueDate && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: `2px ${theme.spacing.sm}`,
              backgroundColor: isOverdue 
                ? `${theme.colors.error}20` 
                : isDueSoon 
                  ? `${theme.colors.warning}20`
                  : theme.colors.softGray,
              borderRadius: theme.borderRadius.sm,
              fontSize: theme.typography.fontSize.xs,
              color: isOverdue 
                ? theme.colors.error 
                : isDueSoon 
                  ? theme.colors.warning
                  : theme.colors.mediumGray,
              fontWeight: theme.typography.fontWeight.medium
            }}>
              {isOverdue ? (
                <AlertTriangle size={12} />
              ) : (
                <Target size={12} />
              )}
              {isOverdue 
                ? `${Math.abs(daysUntilDue)} days overdue`
                : isDueSoon
                  ? `${daysUntilDue} days left`
                  : `Due ${new Date(dueDate).toLocaleDateString()}`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}