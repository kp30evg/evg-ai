'use client'

import React, { useState } from 'react'
import { useUser, useOrganization } from '@clerk/nextjs'
import { theme } from '@/lib/evercore/theme'
import { trpc } from '@/lib/trpc/client'
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User,
  Calendar,
  Flag,
  ArrowRight,
  Filter,
  DollarSign,
  Building2
} from 'lucide-react'

export default function MyTasksView() {
  const { user } = useUser()
  const { organization } = useOrganization()
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'upcoming'>('all')
  
  // Fetch tasks assigned to current user
  const { data: myTasks = [], isLoading } = trpc.evertask.getUserTasks.useQuery(
    undefined,
    { enabled: !!user && !!organization }
  )
  
  // Fetch CRM data for context
  const { data: deals = [] } = trpc.evercore.getDeals.useQuery(undefined, { enabled: !!organization })
  const { data: contacts = [] } = trpc.evercore.getContacts.useQuery(undefined, { enabled: !!organization })
  const { data: companies = [] } = trpc.evercore.getCompanies.useQuery(undefined, { enabled: !!organization })
  
  // Filter tasks based on selected filter
  const filteredTasks = myTasks.filter(task => {
    const now = new Date()
    const dueDate = task.data?.dueDate ? new Date(task.data.dueDate) : null
    
    switch(filter) {
      case 'today':
        return dueDate && dueDate.toDateString() === now.toDateString()
      case 'overdue':
        return dueDate && dueDate < now && task.data?.status !== 'done'
      case 'upcoming':
        return dueDate && dueDate > now
      case 'all':
      default:
        return true
    }
  })
  
  // Group tasks by status
  const todoTasks = filteredTasks.filter(t => t.data?.status === 'todo' || !t.data?.status)
  const inProgressTasks = filteredTasks.filter(t => t.data?.status === 'in_progress')
  const reviewTasks = filteredTasks.filter(t => t.data?.status === 'review')
  const doneTasks = filteredTasks.filter(t => t.data?.status === 'done')
  
  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return theme.colors.red
      case 'high': return theme.colors.orange
      case 'medium': return theme.colors.yellow
      case 'low': return theme.colors.green
      default: return theme.colors.mediumGray
    }
  }
  
  const getTimeUntil = (date: string) => {
    const now = new Date()
    const dueDate = new Date(date)
    const diff = dueDate.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (diff < 0) return 'Overdue'
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }
  
  const TaskCard = ({ task }: { task: any }) => {
    const linkedDeal = task.relationships?.find((r: any) => 
      r.type === 'linked_to' && deals.some(d => d.id === r.targetId)
    )?.targetId
    const deal = linkedDeal ? deals.find(d => d.id === linkedDeal) : null
    
    const linkedContact = task.relationships?.find((r: any) => 
      r.type === 'linked_to' && contacts.some(c => c.id === r.targetId)
    )?.targetId
    const contact = linkedContact ? contacts.find(c => c.id === linkedContact) : null
    
    return (
      <div style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.base,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        border: `1px solid ${theme.colors.lightGray}`,
        cursor: 'pointer',
        transition: theme.transitions.fast
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)'
        e.currentTarget.style.borderColor = theme.colors.evergreen
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)'
        e.currentTarget.style.borderColor = theme.colors.lightGray
      }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: theme.spacing.xs
        }}>
          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.charcoal,
              margin: 0,
              marginBottom: theme.spacing.xs
            }}>
              {task.data?.title || 'Untitled Task'}
            </h4>
            {task.data?.description && (
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray,
                margin: 0,
                marginBottom: theme.spacing.sm
              }}>
                {task.data.description}
              </p>
            )}
          </div>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getPriorityColor(task.data?.priority),
            flexShrink: 0
          }} />
        </div>
        
        {/* CRM Context */}
        {(deal || contact) && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: theme.spacing.xs,
            marginBottom: theme.spacing.sm
          }}>
            {deal && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `2px ${theme.spacing.sm}`,
                backgroundColor: theme.colors.softGreen,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.xs
              }}>
                <DollarSign size={12} />
                <span>{deal.data?.name}</span>
                <span style={{ fontWeight: theme.typography.fontWeight.semibold }}>
                  ${deal.data?.amount || 0}
                </span>
              </div>
            )}
            {contact && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `2px ${theme.spacing.sm}`,
                backgroundColor: theme.colors.softBlue,
                borderRadius: theme.borderRadius.sm,
                fontSize: theme.typography.fontSize.xs
              }}>
                <User size={12} />
                <span>{contact.data?.name}</span>
              </div>
            )}
          </div>
        )}
        
        {/* Due Date */}
        {task.data?.dueDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.xs,
            fontSize: theme.typography.fontSize.sm,
            color: new Date(task.data.dueDate) < new Date() && task.data?.status !== 'done'
              ? theme.colors.red 
              : theme.colors.mediumGray
          }}>
            <Calendar size={14} />
            <span>{new Date(task.data.dueDate).toLocaleDateString()}</span>
            <span>• {getTimeUntil(task.data.dueDate)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{
      padding: theme.spacing['2xl'],
      backgroundColor: theme.colors.softGray,
      minHeight: '100vh'
    }}>
      {/* Header with Filters */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.lg
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            margin: 0
          }}>
            My Tasks
          </h2>
          
          {/* Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.xs,
            backgroundColor: theme.colors.softGray,
            padding: '2px',
            borderRadius: theme.borderRadius.base
          }}>
            {[
              { id: 'all', label: 'All', count: myTasks.length },
              { id: 'today', label: 'Today', count: myTasks.filter(t => {
                const dueDate = t.data?.dueDate ? new Date(t.data.dueDate) : null
                return dueDate && dueDate.toDateString() === new Date().toDateString()
              }).length },
              { id: 'overdue', label: 'Overdue', count: myTasks.filter(t => {
                const dueDate = t.data?.dueDate ? new Date(t.data.dueDate) : null
                return dueDate && dueDate < new Date() && t.data?.status !== 'done'
              }).length },
              { id: 'upcoming', label: 'Upcoming', count: myTasks.filter(t => {
                const dueDate = t.data?.dueDate ? new Date(t.data.dueDate) : null
                return dueDate && dueDate > new Date()
              }).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: filter === tab.id ? theme.colors.white : 'transparent',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: filter === tab.id ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                  color: filter === tab.id ? theme.colors.charcoal : theme.colors.mediumGray,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    backgroundColor: filter === tab.id ? theme.colors.evergreen : theme.colors.mediumGray,
                    color: theme.colors.white,
                    padding: `0 ${theme.spacing.xs}`,
                    borderRadius: theme.borderRadius.full,
                    fontSize: theme.typography.fontSize.xs,
                    minWidth: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: theme.spacing.md
        }}>
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.softGray,
            borderRadius: theme.borderRadius.base,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.blue
            }}>
              {todoTasks.length}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.mediumGray,
              textTransform: 'uppercase'
            }}>
              To Do
            </div>
          </div>
          
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.softGray,
            borderRadius: theme.borderRadius.base,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.orange
            }}>
              {inProgressTasks.length}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.mediumGray,
              textTransform: 'uppercase'
            }}>
              In Progress
            </div>
          </div>
          
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.softGray,
            borderRadius: theme.borderRadius.base,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.purple
            }}>
              {reviewTasks.length}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.mediumGray,
              textTransform: 'uppercase'
            }}>
              Review
            </div>
          </div>
          
          <div style={{
            padding: theme.spacing.md,
            backgroundColor: theme.colors.softGray,
            borderRadius: theme.borderRadius.base,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.green
            }}>
              {doneTasks.length}
            </div>
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.mediumGray,
              textTransform: 'uppercase'
            }}>
              Completed
            </div>
          </div>
        </div>
      </div>

      {/* Task Lists by Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: theme.spacing.lg
      }}>
        {/* To Do */}
        <div>
          <h3 style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            marginBottom: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: theme.colors.blue
            }} />
            To Do
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mediumGray,
              fontWeight: theme.typography.fontWeight.normal
            }}>
              ({todoTasks.length})
            </span>
          </h3>
          {todoTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* In Progress */}
        <div>
          <h3 style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            marginBottom: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: theme.colors.orange
            }} />
            In Progress
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mediumGray,
              fontWeight: theme.typography.fontWeight.normal
            }}>
              ({inProgressTasks.length})
            </span>
          </h3>
          {inProgressTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Review */}
        <div>
          <h3 style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            marginBottom: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: theme.colors.purple
            }} />
            Review
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mediumGray,
              fontWeight: theme.typography.fontWeight.normal
            }}>
              ({reviewTasks.length})
            </span>
          </h3>
          {reviewTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Completed */}
        <div>
          <h3 style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            marginBottom: theme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: theme.colors.green
            }} />
            Completed
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mediumGray,
              fontWeight: theme.typography.fontWeight.normal
            }}>
              ({doneTasks.length})
            </span>
          </h3>
          {doneTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
      
      {/* Empty State */}
      {isLoading && (
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['3xl'],
          color: theme.colors.mediumGray
        }}>
          Loading your tasks...
        </div>
      )}
      
      {!isLoading && filteredTasks.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['3xl'],
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.lg,
          marginTop: theme.spacing.xl
        }}>
          <CheckCircle2 size={48} color={theme.colors.mediumGray} style={{ marginBottom: theme.spacing.md }} />
          <h3 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            marginBottom: theme.spacing.sm
          }}>
            {filter === 'all' ? 'No tasks assigned to you' : `No ${filter} tasks`}
          </h3>
          <p style={{
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.mediumGray
          }}>
            Tasks assigned to you will appear here
          </p>
        </div>
      )}
    </div>
  )
}