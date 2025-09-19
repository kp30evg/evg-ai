'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganization, useOrganizationList } from '@clerk/nextjs'
import { 
  ArrowLeft, 
  MoreVertical, 
  Plus,
  Filter,
  Search,
  Grid3x3,
  List,
  BarChart3,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronDown,
  Clock,
  Flag,
  Link2,
  Paperclip,
  MessageSquare,
  Star,
  User,
  Hash,
  X,
  Edit2,
  Trash2,
  Copy,
  Archive
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { motion, AnimatePresence } from 'framer-motion'
import { trpc } from '@/lib/trpc/client'

interface Task {
  id: string
  title: string
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: string
  dueDate?: string
  tags?: string[]
  progress?: number
  attachments?: number
  comments?: number
  linkedEntities?: string[]
  description?: string
}

// Status colors
const statusColors = {
  'todo': { bg: '#E8E8E8', text: '#666666' },
  'in_progress': { bg: '#FFE4B5', text: '#FF8C00' },
  'review': { bg: '#E6E6FA', text: '#7B68EE' },
  'done': { bg: '#90EE90', text: '#228B22' },
  'blocked': { bg: '#FFB6C1', text: '#DC143C' }
}

// Priority colors
const priorityColors = {
  'low': { bg: '#E0F2FE', text: '#0EA5E9' },
  'medium': { bg: '#FEF3C7', text: '#F59E0B' },
  'high': { bg: '#FED7AA', text: '#EA580C' },
  'urgent': { bg: '#FEE2E2', text: '#DC2626' }
}

export default function ProjectWorkspace() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  
  const [activeView, setActiveView] = useState<'list' | 'board' | 'dashboard'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([])
  
  // Get organization members
  const { organization } = useOrganization()
  
  // Fetch workspace members
  useEffect(() => {
    async function fetchMembers() {
      if (organization) {
        try {
          const membersResponse = await organization.getMemberships()
          const members = membersResponse.data?.map(membership => ({
            id: membership.publicUserData?.userId || '',
            name: `${membership.publicUserData?.firstName || ''} ${membership.publicUserData?.lastName || ''}`.trim() || 
                  membership.publicUserData?.identifier || 'Unknown',
            email: membership.publicUserData?.identifier || '',
            imageUrl: membership.publicUserData?.imageUrl || '',
            role: membership.role
          })) || []
          setWorkspaceMembers(members)
        } catch (error) {
          console.error('Error fetching workspace members:', error)
        }
      }
    }
    fetchMembers()
  }, [organization])
  
  // Fetch project data
  const { data: project, isLoading: projectLoading } = trpc.evertask.getProject.useQuery({ projectId })
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = trpc.evertask.getProjectTasks.useQuery({ projectId })
  
  // Create task mutation
  const createTaskMutation = trpc.evertask.createTask.useMutation({
    onSuccess: () => {
      setNewTaskTitle('')
      setNewTaskAssignee('')
      setShowAddTask(null)
      refetchTasks()
    }
  })
  
  // Update task status mutation
  const updateTaskStatusMutation = trpc.evertask.updateTaskStatus.useMutation({
    onSuccess: () => {
      refetchTasks()
    }
  })
  
  // Mock tasks for now (will be replaced with real data)
  const mockTasks: Task[] = [
    { 
      id: '1', 
      title: 'Design new landing page', 
      status: 'in_progress', 
      priority: 'high',
      assignee: 'KP',
      dueDate: '2024-03-25',
      tags: ['design', 'frontend'],
      progress: 65,
      attachments: 3,
      comments: 12,
      linkedEntities: ['deal_123']
    },
    { 
      id: '2', 
      title: 'Implement authentication flow', 
      status: 'todo', 
      priority: 'urgent',
      assignee: 'JS',
      dueDate: '2024-03-22',
      tags: ['backend', 'security'],
      attachments: 1,
      comments: 5
    },
    { 
      id: '3', 
      title: 'Write API documentation', 
      status: 'review', 
      priority: 'medium',
      assignee: 'MD',
      dueDate: '2024-03-28',
      tags: ['documentation'],
      comments: 3
    },
    { 
      id: '4', 
      title: 'Set up CI/CD pipeline', 
      status: 'done', 
      priority: 'low',
      assignee: 'KP',
      dueDate: '2024-03-20',
      tags: ['devops'],
      attachments: 2,
      comments: 8
    }
  ]
  
  const columns = ['To Do', 'In Progress', 'Review', 'Done']
  
  const handleAddTask = (status: string) => {
    if (newTaskTitle.trim()) {
      createTaskMutation.mutate({
        title: newTaskTitle,
        projectId,
        status: status.toLowerCase().replace(' ', '_'),
        column: status,
        assigneeId: newTaskAssignee || undefined
      })
      setNewTaskAssignee('') // Reset assignee after creation
    }
  }
  
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }
  
  const selectAllTasks = () => {
    if (selectedTasks.length === mockTasks.length) {
      setSelectedTasks([])
    } else {
      setSelectedTasks(mockTasks.map(t => t.id))
    }
  }
  
  return (
    <div style={{
      backgroundColor: theme.colors.softGray,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderBottom: `1px solid ${theme.colors.lightGray}`,
        padding: `${theme.spacing.lg} ${theme.spacing['2xl']}`,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing.lg
        }}>
          <button
            onClick={() => router.push('/dashboard/tasks')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing.sm,
              borderRadius: theme.borderRadius.sm,
              display: 'flex',
              alignItems: 'center',
              transition: theme.transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.lightGray
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ArrowLeft size={20} color={theme.colors.charcoal} />
          </button>
          
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.charcoal,
              margin: 0,
              marginBottom: theme.spacing.xs
            }}>
              {project?.data?.name || 'Loading...'}
            </h1>
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mediumGray,
              margin: 0
            }}>
              {project?.data?.description || ''}
            </p>
            
            {/* Workspace Members */}
            <div style={{
              marginTop: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md
            }}>
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Users size={14} />
                Workspace:
              </span>
              <div style={{
                display: 'flex',
                gap: theme.spacing.xs,
                alignItems: 'center'
              }}>
                {workspaceMembers.length > 0 ? (
                  <>
                    {workspaceMembers.slice(0, 5).map((member, index) => (
                      <div
                        key={member.id}
                        title={`${member.name} (${member.email})\nRole: ${member.role}`}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: theme.borderRadius.full,
                          backgroundColor: member.imageUrl ? 'transparent' : theme.colors.evergreen,
                          backgroundImage: member.imageUrl ? `url(${member.imageUrl})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          color: theme.colors.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.semibold,
                          border: `2px solid ${theme.colors.white}`,
                          marginLeft: index > 0 ? '-8px' : 0,
                          position: 'relative',
                          zIndex: 10 - index,
                          cursor: 'pointer'
                        }}
                      >
                        {!member.imageUrl && (member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?')}
                      </div>
                    ))}
                    {workspaceMembers.length > 5 && (
                      <div style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.full,
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.charcoal,
                        marginLeft: theme.spacing.xs
                      }}>
                        +{workspaceMembers.length - 5} more
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.mediumGray
                  }}>
                    Loading members...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing.sm,
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
            <MoreVertical size={20} color={theme.colors.mediumGray} />
          </button>
        </div>
        
        {/* View Tabs and Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: theme.spacing.xs
          }}>
            {[
              { id: 'list', icon: List, name: 'List' },
              { id: 'board', icon: Grid3x3, name: 'Board' },
              { id: 'dashboard', icon: BarChart3, name: 'Dashboard' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                style={{
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  backgroundColor: activeView === view.id ? theme.colors.evergreen : 'transparent',
                  color: activeView === view.id ? theme.colors.white : theme.colors.charcoal,
                  border: 'none',
                  borderRadius: theme.borderRadius.base,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium
                }}
                onMouseEnter={(e) => {
                  if (activeView !== view.id) {
                    e.currentTarget.style.backgroundColor = theme.colors.lightGray
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== view.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <view.icon size={16} />
                {view.name}
              </button>
            ))}
          </div>
          
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            alignItems: 'center'
          }}>
            {/* Search */}
            <div style={{
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
                  padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 36px`,
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.sm,
                  outline: 'none',
                  transition: theme.transitions.fast,
                  width: '200px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.evergreen
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.lightGray
                }}
              />
            </div>
            
            {/* Filter */}
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.white,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.charcoal,
                cursor: 'pointer',
                transition: theme.transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.softGray
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.white
              }}
            >
              <Filter size={16} />
              Filter
            </button>
            
            {/* Add Task */}
            <button
              onClick={() => {
                if (activeView === 'list') {
                  setShowAddTask('new')
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                backgroundColor: theme.colors.evergreen,
                color: theme.colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: 'pointer',
                transition: theme.transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.darkGreen
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.evergreen
              }}
            >
              <Plus size={16} />
              Add Task
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: theme.spacing.xl
      }}>
        <AnimatePresence mode="wait">
          {activeView === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                backgroundColor: theme.colors.white,
                borderRadius: theme.borderRadius.lg,
                overflow: 'hidden'
              }}
            >
              {/* List View Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 120px 120px 100px 120px 100px 80px',
                gap: theme.spacing.md,
                padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                borderBottom: `1px solid ${theme.colors.lightGray}`,
                backgroundColor: theme.colors.softGray
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <input
                    type="checkbox"
                    checked={selectedTasks.length === mockTasks.length && mockTasks.length > 0}
                    onChange={selectAllTasks}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.mediumGray,
                  textTransform: 'uppercase'
                }}>Task Name</div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.mediumGray,
                  textTransform: 'uppercase'
                }}>Status</div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.mediumGray,
                  textTransform: 'uppercase'
                }}>Priority</div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.mediumGray,
                  textTransform: 'uppercase'
                }}>Assignee</div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.mediumGray,
                  textTransform: 'uppercase'
                }}>Due Date</div>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.mediumGray,
                  textTransform: 'uppercase'
                }}>Tags</div>
                <div></div>
              </div>
              
              {/* Task Rows */}
              {mockTasks.map((task, index) => (
                <div
                  key={task.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px 120px 100px 120px 100px 80px',
                    gap: theme.spacing.md,
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    borderBottom: `1px solid ${theme.colors.lightGray}`,
                    backgroundColor: selectedTasks.includes(task.id) ? theme.colors.softGreen : theme.colors.white,
                    cursor: 'pointer',
                    transition: theme.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedTasks.includes(task.id)) {
                      e.currentTarget.style.backgroundColor = theme.colors.softGray
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedTasks.includes(task.id)) {
                      e.currentTarget.style.backgroundColor = theme.colors.white
                    }
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleTaskSelection(task.id)
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                  
                  {/* Task Title */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm
                  }}>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.charcoal,
                      fontWeight: theme.typography.fontWeight.medium
                    }}>{task.title}</span>
                    <div style={{
                      display: 'flex',
                      gap: theme.spacing.xs
                    }}>
                      {task.attachments && task.attachments > 0 && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.mediumGray
                        }}>
                          <Paperclip size={12} />
                          {task.attachments}
                        </span>
                      )}
                      {task.comments && task.comments > 0 && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.mediumGray
                        }}>
                          <MessageSquare size={12} />
                          {task.comments}
                        </span>
                      )}
                      {task.linkedEntities && task.linkedEntities.length > 0 && (
                        <Link2 size={12} color={theme.colors.evergreen} />
                      )}
                    </div>
                  </div>
                  
                  {/* Status */}
                  <div>
                    <select
                      value={task.status}
                      onChange={(e) => {
                        // Update task status
                      }}
                      style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: statusColors[task.status as keyof typeof statusColors]?.bg || theme.colors.lightGray,
                        color: statusColors[task.status as keyof typeof statusColors]?.text || theme.colors.charcoal,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        fontWeight: theme.typography.fontWeight.medium,
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  
                  {/* Priority */}
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: priorityColors[task.priority]?.bg,
                      color: priorityColors[task.priority]?.text,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      textTransform: 'capitalize'
                    }}>
                      {task.priority}
                    </span>
                  </div>
                  
                  {/* Assignee */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: theme.borderRadius.full,
                      backgroundColor: theme.colors.evergreen,
                      color: theme.colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.semibold
                    }}>
                      {task.assignee}
                    </div>
                  </div>
                  
                  {/* Due Date */}
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: task.dueDate && new Date(task.dueDate) < new Date() 
                      ? theme.colors.error 
                      : theme.colors.charcoal
                  }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                  </div>
                  
                  {/* Tags */}
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.xs,
                    flexWrap: 'wrap'
                  }}>
                    {task.tags?.map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: `2px ${theme.spacing.xs}`,
                          backgroundColor: theme.colors.lightGray,
                          borderRadius: theme.borderRadius.sm,
                          fontSize: '10px',
                          color: theme.colors.charcoal
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
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
                      <MoreVertical size={16} color={theme.colors.mediumGray} />
                    </button>
                  </div>
                </div>
              ))}
              
              {/* Add Task Row */}
              {showAddTask === 'new' && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 120px 120px 100px 120px 100px 80px',
                  gap: theme.spacing.md,
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  borderBottom: `1px solid ${theme.colors.lightGray}`,
                  backgroundColor: theme.colors.softGreen
                }}>
                  <div></div>
                  <input
                    type="text"
                    placeholder="Enter task name..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTask('todo')
                      }
                    }}
                    autoFocus
                    style={{
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.evergreen}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.sm,
                      outline: 'none'
                    }}
                  />
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    style={{
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.sm,
                      fontSize: theme.typography.fontSize.sm,
                      backgroundColor: theme.colors.white,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {workspaceMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </select>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.xs
                  }}>
                    <button
                      onClick={() => handleAddTask('todo')}
                      style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.evergreen,
                        color: theme.colors.white,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        cursor: 'pointer'
                      }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddTask(null)
                        setNewTaskTitle('')
                      }}
                      style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.lightGray,
                        color: theme.colors.charcoal,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.xs,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Add New Task Button */}
              <div style={{
                padding: theme.spacing.lg,
                borderTop: `1px solid ${theme.colors.lightGray}`
              }}>
                <button
                  onClick={() => setShowAddTask('new')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    backgroundColor: 'transparent',
                    color: theme.colors.mediumGray,
                    border: 'none',
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
                    cursor: 'pointer',
                    transition: theme.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = theme.colors.evergreen
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = theme.colors.mediumGray
                  }}
                >
                  <Plus size={16} />
                  Add task
                </button>
              </div>
            </motion.div>
          )}
          
          {activeView === 'board' && (
            <motion.div
              key="board"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: theme.spacing.xl,
                height: '100%'
              }}
            >
              {columns.map(column => (
                <div
                  key={column}
                  style={{
                    backgroundColor: theme.colors.white,
                    borderRadius: theme.borderRadius.lg,
                    padding: theme.spacing.lg,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing.lg
                  }}>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.charcoal,
                      margin: 0
                    }}>
                      {column}
                    </h3>
                    <span style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: theme.colors.lightGray,
                      borderRadius: theme.borderRadius.full,
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.charcoal
                    }}>
                      {mockTasks.filter(t => {
                        const status = column.toLowerCase().replace(' ', '_')
                        return t.status === status || (column === 'To Do' && t.status === 'todo')
                      }).length}
                    </span>
                  </div>
                  
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: theme.spacing.md
                  }}>
                    {mockTasks
                      .filter(t => {
                        const status = column.toLowerCase().replace(' ', '_')
                        return t.status === status || (column === 'To Do' && t.status === 'todo')
                      })
                      .map(task => (
                      <div
                        key={task.id}
                        style={{
                          backgroundColor: theme.colors.white,
                          border: `1px solid ${theme.colors.lightGray}`,
                          borderRadius: theme.borderRadius.base,
                          padding: theme.spacing.md,
                          cursor: 'grab',
                          transition: theme.transitions.fast
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = theme.shadows.sm
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.charcoal,
                          marginBottom: theme.spacing.sm
                        }}>
                          {task.title}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: theme.spacing.xs
                          }}>
                            <span style={{
                              padding: `2px ${theme.spacing.xs}`,
                              backgroundColor: priorityColors[task.priority]?.bg,
                              color: priorityColors[task.priority]?.text,
                              borderRadius: theme.borderRadius.sm,
                              fontSize: '10px',
                              fontWeight: theme.typography.fontWeight.medium
                            }}>
                              {task.priority}
                            </span>
                          </div>
                          
                          {task.assignee && (
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: theme.borderRadius.full,
                              backgroundColor: theme.colors.evergreen,
                              color: theme.colors.white,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: theme.typography.fontWeight.semibold
                            }}>
                              {task.assignee}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Task Button */}
                    <button
                      onClick={() => setShowAddTask(column)}
                      style={{
                        padding: theme.spacing.sm,
                        backgroundColor: 'transparent',
                        border: `1px dashed ${theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        color: theme.colors.mediumGray,
                        fontSize: theme.typography.fontSize.sm,
                        cursor: 'pointer',
                        transition: theme.transitions.fast
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.evergreen
                        e.currentTarget.style.color = theme.colors.evergreen
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = theme.colors.lightGray
                        e.currentTarget.style.color = theme.colors.mediumGray
                      }}
                    >
                      <Plus size={16} style={{ display: 'inline', marginRight: theme.spacing.xs }} />
                      Add Task
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Dashboard content - simplified for now */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: theme.spacing.xl,
                marginBottom: theme.spacing.xl
              }}>
                {[
                  { label: 'Total Tasks', value: mockTasks.length, color: theme.colors.evergreen },
                  { label: 'Completed', value: mockTasks.filter(t => t.status === 'done').length, color: theme.colors.success },
                  { label: 'In Progress', value: mockTasks.filter(t => t.status === 'in_progress').length, color: theme.colors.warning },
                  { label: 'Overdue', value: mockTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length, color: theme.colors.error }
                ].map(metric => (
                  <div
                    key={metric.label}
                    style={{
                      backgroundColor: theme.colors.white,
                      borderRadius: theme.borderRadius.lg,
                      padding: theme.spacing.xl,
                      borderLeft: `4px solid ${metric.color}`
                    }}
                  >
                    <div style={{
                      fontSize: theme.typography.fontSize['3xl'],
                      fontWeight: theme.typography.fontWeight.bold,
                      color: metric.color,
                      marginBottom: theme.spacing.sm
                    }}>
                      {metric.value}
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.mediumGray
                    }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}