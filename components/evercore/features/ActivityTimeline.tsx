'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { theme } from '@/lib/evercore/theme'
import { useCRM, Activity } from '@/lib/contexts/crm-context'
import { formatRelativeTime, formatDate } from '@/lib/utils/validation'
import {
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle,
  Clock,
  User,
  Plus,
  Filter,
  ChevronDown
} from 'lucide-react'

interface ActivityTimelineProps {
  entityType: 'contact' | 'lead' | 'deal' | 'company'
  entityId: string
  showAddActivity?: boolean
  maxHeight?: string
}

export default function ActivityTimeline({
  entityType,
  entityId,
  showAddActivity = true,
  maxHeight = '500px'
}: ActivityTimelineProps) {
  const { getActivitiesForEntity, logActivity, completeActivity } = useCRM()
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set())
  
  // New activity form state
  const [newActivity, setNewActivity] = useState({
    type: 'note' as Activity['type'],
    title: '',
    description: '',
    dueDate: ''
  })

  // Get activities for this entity
  const activities = getActivitiesForEntity(entityType, entityId)
  
  // Filter activities
  const filteredActivities = filterType === 'all' 
    ? activities 
    : activities.filter(a => a.type === filterType)

  // Activity type icons and colors
  const activityConfig = {
    call: { icon: Phone, color: theme.colors.info, label: 'Call' },
    email: { icon: Mail, color: theme.colors.success, label: 'Email' },
    meeting: { icon: Calendar, color: theme.colors.warning, label: 'Meeting' },
    note: { icon: FileText, color: theme.colors.mediumGray, label: 'Note' },
    task: { icon: CheckCircle, color: theme.colors.evergreen, label: 'Task' }
  }

  const handleAddActivity = async () => {
    if (!newActivity.title.trim()) return
    
    await logActivity({
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      entityType,
      entityId,
      dueDate: newActivity.dueDate ? new Date(newActivity.dueDate) : undefined,
      completed: false
    })
    
    // Reset form
    setNewActivity({
      type: 'note',
      title: '',
      description: '',
      dueDate: ''
    })
    setShowAddForm(false)
  }

  const toggleActivityExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities)
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId)
    } else {
      newExpanded.add(activityId)
    }
    setExpandedActivities(newExpanded)
  }

  return (
    <div style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      border: `1px solid ${theme.colors.lightGray}`,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: theme.spacing.lg,
        borderBottom: `1px solid ${theme.colors.lightGray}`,
        backgroundColor: theme.colors.background
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text,
            margin: 0
          }}>
            Activity Timeline
          </h3>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            {/* Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.surface,
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                <Filter size={14} />
                {filterType === 'all' ? 'All Activities' : activityConfig[filterType as keyof typeof activityConfig]?.label}
                <ChevronDown size={14} />
              </button>
            </div>
            
            {/* Add Activity Button */}
            {showAddActivity && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.evergreen,
                  color: theme.colors.white,
                  border: 'none',
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                <Plus size={14} />
                Add Activity
              </button>
            )}
          </div>
        </div>

        {/* Activity Stats */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.xl,
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.textSecondary
        }}>
          <span>{activities.length} total activities</span>
          <span>{activities.filter(a => a.completed).length} completed</span>
          <span>{activities.filter(a => !a.completed && a.dueDate && new Date(a.dueDate) < new Date()).length} overdue</span>
        </div>
      </div>

      {/* Add Activity Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{
              borderBottom: `1px solid ${theme.colors.lightGray}`,
              backgroundColor: theme.colors.softGreen + '20'
            }}
          >
            <div style={{ padding: theme.spacing.lg }}>
              <div style={{ display: 'grid', gap: theme.spacing.md }}>
                {/* Activity Type Selection */}
                <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                  {Object.entries(activityConfig).map(([type, config]) => {
                    const Icon = config.icon
                    return (
                      <button
                        key={type}
                        onClick={() => setNewActivity(prev => ({ ...prev, type: type as Activity['type'] }))}
                        style={{
                          padding: theme.spacing.sm,
                          backgroundColor: newActivity.type === type ? config.color + '20' : 'transparent',
                          border: `1px solid ${newActivity.type === type ? config.color : theme.colors.lightGray}`,
                          borderRadius: theme.borderRadius.base,
                          color: newActivity.type === type ? config.color : theme.colors.textSecondary,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.xs,
                          fontSize: theme.typography.fontSize.sm
                        }}
                      >
                        <Icon size={14} />
                        {config.label}
                      </button>
                    )
                  })}
                </div>

                {/* Title Input */}
                <input
                  type="text"
                  placeholder="Activity title..."
                  value={newActivity.title}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                  style={{
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
                    backgroundColor: theme.colors.surface
                  }}
                />

                {/* Description */}
                <textarea
                  placeholder="Add notes or description..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
                    backgroundColor: theme.colors.surface,
                    resize: 'vertical'
                  }}
                />

                {/* Due Date (for tasks) */}
                {newActivity.type === 'task' && (
                  <input
                    type="datetime-local"
                    value={newActivity.dueDate}
                    onChange={(e) => setNewActivity(prev => ({ ...prev, dueDate: e.target.value }))}
                    style={{
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.sm,
                      backgroundColor: theme.colors.surface
                    }}
                  />
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: theme.spacing.sm, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewActivity({ type: 'note', title: '', description: '', dueDate: '' })
                    }}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                      backgroundColor: 'transparent',
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddActivity}
                    disabled={!newActivity.title.trim()}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                      backgroundColor: theme.colors.evergreen,
                      color: theme.colors.white,
                      border: 'none',
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      cursor: newActivity.title.trim() ? 'pointer' : 'not-allowed',
                      opacity: newActivity.title.trim() ? 1 : 0.5
                    }}
                  >
                    Add Activity
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      <div style={{
        maxHeight,
        overflowY: 'auto',
        padding: theme.spacing.lg
      }}>
        {filteredActivities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing.xl,
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm
          }}>
            No activities yet. Add your first activity to start tracking.
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Timeline Line */}
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '20px',
              bottom: '20px',
              width: '2px',
              backgroundColor: theme.colors.lightGray
            }} />

            {/* Activities */}
            {filteredActivities.map((activity, index) => {
              const config = activityConfig[activity.type]
              const Icon = config.icon
              const isExpanded = expandedActivities.has(activity.id)
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  style={{
                    display: 'flex',
                    gap: theme.spacing.lg,
                    marginBottom: theme.spacing.xl,
                    position: 'relative'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: theme.borderRadius.full,
                    backgroundColor: config.color + '20',
                    border: `2px solid ${theme.colors.surface}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 1
                  }}>
                    <Icon size={20} color={config.color} />
                  </div>

                  {/* Content */}
                  <div style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    padding: theme.spacing.md,
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleActivityExpanded(activity.id)}
                  >
                    {/* Header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: theme.spacing.sm
                    }}>
                      <div>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.text,
                          marginBottom: theme.spacing.xs
                        }}>
                          {activity.title}
                        </div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm
                        }}>
                          <span>{formatRelativeTime(activity.createdAt)}</span>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                            <User size={12} />
                            {activity.createdBy}
                          </span>
                        </div>
                      </div>

                      {/* Status/Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                        {activity.type === 'task' && !activity.completed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              completeActivity(activity.id)
                            }}
                            style={{
                              padding: theme.spacing.xs,
                              backgroundColor: theme.colors.success + '20',
                              border: `1px solid ${theme.colors.success}`,
                              borderRadius: theme.borderRadius.base,
                              color: theme.colors.success,
                              fontSize: theme.typography.fontSize.xs,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.xs
                            }}
                          >
                            <CheckCircle size={12} />
                            Complete
                          </button>
                        )}
                        {activity.completed && (
                          <span style={{
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: theme.colors.success + '20',
                            color: theme.colors.success,
                            borderRadius: theme.borderRadius.full,
                            fontSize: theme.typography.fontSize.xs,
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.xs
                          }}>
                            <CheckCircle size={12} />
                            Completed
                          </span>
                        )}
                        {activity.dueDate && !activity.completed && (
                          <span style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: new Date(activity.dueDate) < new Date() ? theme.colors.error : theme.colors.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.xs
                          }}>
                            <Clock size={12} />
                            {formatDate(activity.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <AnimatePresence>
                      {(isExpanded || !activity.description) && activity.description && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.textSecondary,
                            lineHeight: theme.typography.lineHeight.relaxed,
                            marginTop: theme.spacing.sm,
                            paddingTop: theme.spacing.sm,
                            borderTop: `1px solid ${theme.colors.lightGray}`
                          }}
                        >
                          {activity.description}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Show More Indicator */}
                    {activity.description && !isExpanded && (
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.evergreen,
                        marginTop: theme.spacing.xs
                      }}>
                        Click to expand...
                      </div>
                    )}

                    {/* Additional Metadata */}
                    {activity.duration && (
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.textSecondary,
                        marginTop: theme.spacing.sm
                      }}>
                        Duration: {activity.duration} minutes
                      </div>
                    )}
                    {activity.outcome && (
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.textSecondary,
                        marginTop: theme.spacing.xs
                      }}>
                        Outcome: {activity.outcome}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}