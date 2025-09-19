'use client'

import React, { useState, useMemo } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { theme } from '@/lib/evercore/theme'
import { trpc } from '@/lib/trpc/client'
import { 
  ListTodo,
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User,
  Calendar,
  Flag,
  Filter,
  Search,
  DollarSign,
  Building2,
  Users,
  ChevronDown,
  CircleDot,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react'

export default function TasksListView() {
  const { organization } = useOrganization()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'assignee' | 'created'>('dueDate')
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  
  // Fetch all tasks in workspace
  const { data: allTasks = [], isLoading } = trpc.evertask.getAllTasks.useQuery(
    undefined,
    { enabled: !!organization }
  )
  
  // Fetch team members for assignee info
  const { data: members = [] } = trpc.organization.getMembers.useQuery(
    undefined,
    { enabled: !!organization }
  )
  
  // Fetch CRM data for context
  const { data: deals = [] } = trpc.evercore.getDeals.useQuery(undefined, { enabled: !!organization })
  const { data: contacts = [] } = trpc.evercore.getContacts.useQuery(undefined, { enabled: !!organization })
  const { data: companies = [] } = trpc.evercore.getCompanies.useQuery(undefined, { enabled: !!organization })
  const { data: projects = [] } = trpc.evertask.getProjects.useQuery(undefined, { enabled: !!organization })
  
  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let tasks = [...allTasks]
    
    // Search filter
    if (searchQuery) {
      tasks = tasks.filter(task => 
        task.data?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.data?.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    // Assignee filter
    if (selectedAssignee !== 'all') {
      if (selectedAssignee === 'unassigned') {
        tasks = tasks.filter(task => !task.data?.assigneeId)
      } else {
        tasks = tasks.filter(task => task.data?.assigneeId === selectedAssignee)
      }
    }
    
    // Priority filter
    if (selectedPriority !== 'all') {
      tasks = tasks.filter(task => task.data?.priority === selectedPriority)
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      tasks = tasks.filter(task => task.data?.status === selectedStatus)
    }
    
    // Sort
    tasks.sort((a, b) => {
      switch(sortBy) {
        case 'dueDate':
          const dateA = a.data?.dueDate ? new Date(a.data.dueDate).getTime() : Infinity
          const dateB = b.data?.dueDate ? new Date(b.data.dueDate).getTime() : Infinity
          return dateA - dateB
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
          const priorityA = priorityOrder[a.data?.priority as keyof typeof priorityOrder] ?? 4
          const priorityB = priorityOrder[b.data?.priority as keyof typeof priorityOrder] ?? 4
          return priorityA - priorityB
        case 'assignee':
          const assigneeA = members.find(m => m.id === a.data?.assigneeId)?.name || 'Unassigned'
          const assigneeB = members.find(m => m.id === b.data?.assigneeId)?.name || 'Unassigned'
          return assigneeA.localeCompare(assigneeB)
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    return tasks
  }, [allTasks, searchQuery, selectedAssignee, selectedPriority, selectedStatus, sortBy, members])
  
  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    
    filteredTasks.forEach(task => {
      const projectId = task.relationships?.find(r => r.type === 'belongs_to')?.targetId || 'no-project'
      if (!grouped[projectId]) {
        grouped[projectId] = []
      }
      grouped[projectId].push(task)
    })
    
    return grouped
  }, [filteredTasks])
  
  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return theme.colors.red
      case 'high': return theme.colors.orange
      case 'medium': return theme.colors.yellow
      case 'low': return theme.colors.green
      default: return theme.colors.mediumGray
    }
  }
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'todo': return theme.colors.blue
      case 'in_progress': return theme.colors.orange
      case 'review': return theme.colors.purple
      case 'done': return theme.colors.green
      case 'blocked': return theme.colors.red
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
    if (days < 7) return `${days}d`
    return `${Math.floor(days / 7)}w`
  }
  
  const TaskRow = ({ task }: { task: any }) => {
    const assignee = members.find(m => m.id === task.data?.assigneeId)
    const project = projects.find(p => task.relationships?.some(r => r.targetId === p.id))
    
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
        display: 'grid',
        gridTemplateColumns: '24px 1fr 200px 150px 120px 100px 40px',
        alignItems: 'center',
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        backgroundColor: theme.colors.white,
        borderBottom: `1px solid ${theme.colors.lightGray}`,
        cursor: 'pointer',
        transition: theme.transitions.fast
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.softGray
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = theme.colors.white
      }}>
        {/* Status */}
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `2px solid ${getStatusColor(task.data?.status || 'todo')}`,
          backgroundColor: task.data?.status === 'done' ? getStatusColor('done') : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {task.data?.status === 'done' && (
            <CheckCircle2 size={10} color={theme.colors.white} />
          )}
        </div>
        
        {/* Task Info */}
        <div>
          <div style={{
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.charcoal,
            marginBottom: theme.spacing.xs
          }}>
            {task.data?.title || 'Untitled Task'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.mediumGray
          }}>
            {project && (
              <span style={{
                padding: `2px ${theme.spacing.xs}`,
                backgroundColor: theme.colors.softBlue,
                borderRadius: theme.borderRadius.xs,
                fontSize: theme.typography.fontSize.xs
              }}>
                {project.data?.name}
              </span>
            )}
            {deal && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <DollarSign size={12} />
                {deal.data?.name}
              </span>
            )}
            {contact && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <User size={12} />
                {contact.data?.name}
              </span>
            )}
          </div>
        </div>
        
        {/* Assignee */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm
        }}>
          {assignee ? (
            <>
              {assignee.imageUrl ? (
                <img 
                  src={assignee.imageUrl}
                  alt={assignee.name}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.evergreen,
                  color: theme.colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.semibold
                }}>
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.charcoal
              }}>
                {assignee.name}
              </span>
            </>
          ) : (
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mediumGray,
              fontStyle: 'italic'
            }}>
              Unassigned
            </span>
          )}
        </div>
        
        {/* Priority */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getPriorityColor(task.data?.priority)
          }} />
          <span style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.charcoal,
            textTransform: 'capitalize'
          }}>
            {task.data?.priority || 'Medium'}
          </span>
        </div>
        
        {/* Due Date */}
        <div style={{
          fontSize: theme.typography.fontSize.sm,
          color: task.data?.dueDate && new Date(task.data.dueDate) < new Date() && task.data?.status !== 'done'
            ? theme.colors.red 
            : theme.colors.mediumGray
        }}>
          {task.data?.dueDate ? (
            <>
              <div>{new Date(task.data.dueDate).toLocaleDateString()}</div>
              <div style={{ fontSize: theme.typography.fontSize.xs }}>
                {getTimeUntil(task.data.dueDate)}
              </div>
            </>
          ) : (
            <span style={{ color: theme.colors.lightGray }}>No due date</span>
          )}
        </div>
        
        {/* Status Badge */}
        <div style={{
          padding: `4px ${theme.spacing.sm}`,
          backgroundColor: getStatusColor(task.data?.status || 'todo') + '20',
          color: getStatusColor(task.data?.status || 'todo'),
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          textTransform: 'capitalize'
        }}>
          {task.data?.status?.replace('_', ' ') || 'To Do'}
        </div>
        
        {/* Actions */}
        <div>
          <button
            style={{
              background: 'none',
              border: 'none',
              padding: theme.spacing.xs,
              cursor: 'pointer',
              color: theme.colors.mediumGray
            }}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
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
          marginBottom: theme.spacing.xl
        }}>
          <div>
            <h2 style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.charcoal,
              margin: 0
            }}>
              All Tasks
            </h2>
            <p style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.mediumGray,
              marginTop: theme.spacing.xs
            }}>
              View and manage all tasks across your team
            </p>
          </div>
          
          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.lg
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.charcoal
              }}>
                {allTasks.length}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Total Tasks
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.orange
              }}>
                {allTasks.filter(t => t.data?.status === 'in_progress').length}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                In Progress
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.red
              }}>
                {allTasks.filter(t => t.data?.dueDate && new Date(t.data.dueDate) < new Date() && t.data?.status !== 'done').length}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.mediumGray,
                textTransform: 'uppercase'
              }}>
                Overdue
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Row */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.md,
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <Search size={16} style={{
              position: 'absolute',
              left: theme.spacing.md,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.mediumGray
            }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px`,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                backgroundColor: theme.colors.white,
                outline: 'none'
              }}
            />
          </div>
          
          {/* Assignee Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.white,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                cursor: 'pointer'
              }}
            >
              <Users size={16} />
              {selectedAssignee === 'all' ? 'All Assignees' : 
               selectedAssignee === 'unassigned' ? 'Unassigned' :
               members.find(m => m.id === selectedAssignee)?.name || 'Unknown'}
              <ChevronDown size={16} />
            </button>
            
            {showAssigneeDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: theme.colors.white,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                boxShadow: theme.shadows.md,
                zIndex: 10,
                minWidth: '200px'
              }}>
                <div
                  onClick={() => {
                    setSelectedAssignee('all')
                    setShowAssigneeDropdown(false)
                  }}
                  style={{
                    padding: theme.spacing.sm,
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.sm,
                    backgroundColor: selectedAssignee === 'all' ? theme.colors.softGray : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.softGray}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedAssignee === 'all' ? theme.colors.softGray : 'transparent'}
                >
                  All Assignees
                </div>
                <div
                  onClick={() => {
                    setSelectedAssignee('unassigned')
                    setShowAssigneeDropdown(false)
                  }}
                  style={{
                    padding: theme.spacing.sm,
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.sm,
                    backgroundColor: selectedAssignee === 'unassigned' ? theme.colors.softGray : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.softGray}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedAssignee === 'unassigned' ? theme.colors.softGray : 'transparent'}
                >
                  Unassigned
                </div>
                {members.map(member => (
                  <div
                    key={member.id}
                    onClick={() => {
                      setSelectedAssignee(member.id)
                      setShowAssigneeDropdown(false)
                    }}
                    style={{
                      padding: theme.spacing.sm,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.sm,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      backgroundColor: selectedAssignee === member.id ? theme.colors.softGray : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.colors.softGray}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedAssignee === member.id ? theme.colors.softGray : 'transparent'}
                  >
                    {member.imageUrl ? (
                      <img 
                        src={member.imageUrl}
                        alt={member.name}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: theme.colors.evergreen,
                        color: theme.colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: theme.typography.fontWeight.semibold
                      }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {member.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: theme.colors.white,
              border: `1px solid ${theme.colors.lightGray}`,
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: theme.colors.white,
              border: `1px solid ${theme.colors.lightGray}`,
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
            <option value="blocked">Blocked</option>
          </select>
          
          {/* Sort */}
          <button
            onClick={() => {
              const sortOptions = ['dueDate', 'priority', 'assignee', 'created'] as const
              const currentIndex = sortOptions.indexOf(sortBy)
              setSortBy(sortOptions[(currentIndex + 1) % sortOptions.length])
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: theme.colors.white,
              border: `1px solid ${theme.colors.lightGray}`,
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer'
            }}
          >
            <ArrowUpDown size={16} />
            Sort: {sortBy === 'dueDate' ? 'Due Date' : 
                   sortBy === 'priority' ? 'Priority' : 
                   sortBy === 'assignee' ? 'Assignee' : 'Created'}
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 200px 150px 120px 100px 40px',
          alignItems: 'center',
          padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
          backgroundColor: theme.colors.softGray,
          borderBottom: `2px solid ${theme.colors.lightGray}`,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.mediumGray,
          textTransform: 'uppercase'
        }}>
          <div></div>
          <div>Task</div>
          <div>Assignee</div>
          <div>Priority</div>
          <div>Due Date</div>
          <div>Status</div>
          <div></div>
        </div>
        
        {/* Tasks */}
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl'],
            color: theme.colors.mediumGray
          }}>
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['3xl']
          }}>
            <ListTodo size={48} color={theme.colors.mediumGray} style={{ marginBottom: theme.spacing.md }} />
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.sm
            }}>
              No tasks found
            </h3>
            <p style={{
              fontSize: theme.typography.fontSize.base,
              color: theme.colors.mediumGray
            }}>
              {searchQuery || selectedAssignee !== 'all' || selectedPriority !== 'all' || selectedStatus !== 'all' 
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <TaskRow key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  )
}