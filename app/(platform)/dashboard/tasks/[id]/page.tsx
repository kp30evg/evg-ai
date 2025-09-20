'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Plus, 
  MoreVertical, 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Grid,
  List,
  Edit2,
  Trash2,
  Settings,
  Activity,
  Paperclip,
  DollarSign,
  Target,
  Briefcase,
  Tag,
  ChevronRight,
  BarChart3,
  FileText,
  MessageSquare
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { trpc } from '@/lib/trpc/client'
import NewTaskModal from '@/components/tasks/NewTaskModal'
import EditTaskModal from '@/components/tasks/EditTaskModal'
import KanbanBoard from '@/components/tasks/KanbanBoard'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)
  const [showProjectSettings, setShowProjectSettings] = useState(false)
  
  // Fetch project data
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = trpc.evertask.getProject.useQuery({
    projectId
  })
  
  // Fetch project tasks
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = trpc.evertask.getProjectTasks.useQuery({
    projectId
  })
  
  // Fetch project milestones
  const { data: milestones = [], refetch: refetchMilestones } = trpc.evertask.getProjectMilestones.useQuery({
    projectId
  })
  
  // Fetch CRM data for context
  const { data: deals = [] } = trpc.evercore.getDeals.useQuery()
  const { data: contacts = [] } = trpc.evercore.getContacts.useQuery()
  const { data: companies = [] } = trpc.evercore.getCompanies.useQuery()
  
  // Mutations
  const utils = trpc.useContext()
  const updateTaskStatus = trpc.evertask.updateTaskStatus.useMutation({
    onSuccess: () => {
      refetchTasks()
      refetchProject()
    }
  })
  
  const deleteTask = trpc.evertask.deleteTask.useMutation({
    onSuccess: () => {
      refetchTasks()
      refetchProject()
    }
  })
  
  const updateProject = trpc.evertask.updateProject.useMutation({
    onSuccess: () => {
      refetchProject()
      setShowProjectSettings(false)
    }
  })
  
  if (projectLoading || !project) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: theme.colors.softGray
      }}>
        <div style={{
          fontSize: theme.typography.fontSize.lg,
          color: theme.colors.mediumGray
        }}>
          Loading project...
        </div>
      </div>
    )
  }
  
  const projectData = project.data || {}
  const {
    name = 'Untitled Project',
    description = '',
    progress = 0,
    tasksCount = 0,
    completedTasks = 0,
    dueDate,
    startDate,
    status = 'active',
    budget = null,
    actualCost = 0,
    category = 'general',
    client = null,
    tags = [],
    health = 'good',
    members = []
  } = projectData
  
  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter(t => !t.data?.status || t.data?.status === 'todo'),
    in_progress: tasks.filter(t => t.data?.status === 'in_progress'),
    review: tasks.filter(t => t.data?.status === 'review'),
    done: tasks.filter(t => t.data?.status === 'done')
  }
  
  const overdueTasks = tasks.filter(t => {
    if (!t.data?.dueDate || t.data?.status === 'done') return false
    return new Date(t.data.dueDate) < new Date()
  })
  
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.data?.estimatedHours || 0), 0)
  const totalActualHours = tasks.reduce((sum, task) => sum + (task.data?.actualHours || 0), 0)
  
  const getHealthColor = (health: string) => {
    switch(health) {
      case 'good': return theme.colors.success
      case 'at-risk': return theme.colors.warning
      case 'critical': return theme.colors.error
      default: return theme.colors.mediumGray
    }
  }
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'milestones', label: 'Milestones', icon: Target },
    { id: 'files', label: 'Files', icon: Paperclip },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const renderOverviewTab = () => (
    <div style={{ padding: theme.spacing.xl }}>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: theme.spacing.lg,
        marginBottom: theme.spacing['2xl']
      }}>
        {/* Progress Card */}
        <div style={{
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          border: `1px solid ${theme.colors.lightGray}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing.md
          }}>
            <div>
              <div style={{
                fontSize: theme.typography.fontSize['3xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.charcoal
              }}>
                {progress}%
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>
                Overall Progress
              </div>
            </div>
            <CheckCircle2 size={24} color={theme.colors.evergreen} />
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
          <div style={{
            marginTop: theme.spacing.sm,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.mediumGray
          }}>
            {completedTasks} of {tasksCount} tasks completed
          </div>
        </div>

        {/* Health Status Card */}
        <div style={{
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          border: `1px solid ${theme.colors.lightGray}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing.md
          }}>
            <div>
              <div style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: getHealthColor(health),
                textTransform: 'capitalize'
              }}>
                {health}
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>
                Project Health
              </div>
            </div>
            <Activity size={24} color={getHealthColor(health)} />
          </div>
          {overdueTasks.length > 0 && (
            <div style={{
              padding: theme.spacing.sm,
              backgroundColor: `${theme.colors.error}10`,
              borderRadius: theme.borderRadius.sm,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.error
            }}>
              {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Budget Card */}
        {budget && (
          <div style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl,
            border: `1px solid ${theme.colors.lightGray}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: theme.spacing.md
            }}>
              <div>
                <div style={{
                  fontSize: theme.typography.fontSize['2xl'],
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.charcoal
                }}>
                  ${actualCost.toLocaleString()}
                </div>
                <div style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mediumGray
                }}>
                  of ${budget.toLocaleString()} budget
                </div>
              </div>
              <DollarSign size={24} color={theme.colors.evergreen} />
            </div>
            <div style={{
              height: '8px',
              backgroundColor: theme.colors.lightGray,
              borderRadius: theme.borderRadius.full,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min((actualCost / budget) * 100, 100)}%`,
                backgroundColor: actualCost > budget ? theme.colors.error : theme.colors.evergreen,
                transition: theme.transitions.base
              }} />
            </div>
          </div>
        )}

        {/* Time Tracking Card */}
        <div style={{
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          border: `1px solid ${theme.colors.lightGray}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: theme.spacing.md
          }}>
            <div>
              <div style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.charcoal
              }}>
                {totalActualHours}h
              </div>
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>
                of {totalEstimatedHours}h estimated
              </div>
            </div>
            <Clock size={24} color={theme.colors.evergreen} />
          </div>
          {totalActualHours > totalEstimatedHours && (
            <div style={{
              padding: theme.spacing.sm,
              backgroundColor: `${theme.colors.warning}10`,
              borderRadius: theme.borderRadius.sm,
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.warning
            }}>
              {totalActualHours - totalEstimatedHours}h over estimate
            </div>
          )}
        </div>
      </div>

      {/* Milestones Timeline */}
      {milestones.length > 0 && (
        <div style={{
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.xl,
          marginBottom: theme.spacing['2xl']
        }}>
          <h3 style={{
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            marginBottom: theme.spacing.lg
          }}>
            Upcoming Milestones
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.md
          }}>
            {milestones.slice(0, 3).map((milestone, index) => (
              <div
                key={milestone.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  backgroundColor: theme.colors.softGray,
                  borderRadius: theme.borderRadius.base
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: milestone.data?.status === 'completed' ? theme.colors.success : theme.colors.evergreen,
                  color: theme.colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.semibold
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.charcoal
                  }}>
                    {milestone.data?.name}
                  </div>
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.mediumGray
                  }}>
                    Due: {new Date(milestone.data?.dueDate).toLocaleDateString()}
                  </div>
                </div>
                {milestone.data?.status === 'completed' ? (
                  <CheckCircle2 size={20} color={theme.colors.success} />
                ) : (
                  <Target size={20} color={theme.colors.mediumGray} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl
      }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.charcoal,
          marginBottom: theme.spacing.lg
        }}>
          Recent Activity
        </h3>
        <div style={{
          textAlign: 'center',
          padding: theme.spacing['2xl'],
          color: theme.colors.mediumGray
        }}>
          Activity feed coming soon...
        </div>
      </div>
    </div>
  )

  const renderTasksTab = () => (
    <div>
      {/* View Toggle */}
      <div style={{
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderBottom: `1px solid ${theme.colors.lightGray}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setShowNewTaskModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.sm,
            backgroundColor: theme.colors.evergreen,
            color: theme.colors.white,
            border: 'none',
            borderRadius: theme.borderRadius.base,
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
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
          <Plus size={18} />
          Add Task
        </button>
        
        <div style={{
          display: 'flex',
          gap: theme.spacing.xs,
          backgroundColor: theme.colors.softGray,
          padding: theme.spacing.xs,
          borderRadius: theme.borderRadius.base
        }}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: viewMode === 'kanban' ? theme.colors.white : 'transparent',
              color: viewMode === 'kanban' ? theme.colors.evergreen : theme.colors.charcoal,
              border: 'none',
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              transition: theme.transitions.fast
            }}
          >
            <Grid size={16} />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: viewMode === 'list' ? theme.colors.white : 'transparent',
              color: viewMode === 'list' ? theme.colors.evergreen : theme.colors.charcoal,
              border: 'none',
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              transition: theme.transitions.fast
            }}
          >
            <List size={16} />
            List
          </button>
        </div>
      </div>
      
      {/* Tasks View */}
      <div style={{ padding: theme.spacing.lg }}>
        {viewMode === 'kanban' ? (
          <KanbanBoard
            tasks={tasks}
            onTaskClick={(task) => setEditingTask(task)}
            onStatusChange={(taskId, newStatus) => {
              updateTaskStatus.mutate({ taskId, status: newStatus })
            }}
          />
        ) : (
          <div style={{
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            padding: theme.spacing.xl
          }}>
            {tasks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: theme.spacing['2xl']
              }}>
                <h3 style={{
                  fontSize: theme.typography.fontSize.lg,
                  color: theme.colors.charcoal,
                  marginBottom: theme.spacing.sm
                }}>
                  No tasks yet
                </h3>
                <p style={{
                  fontSize: theme.typography.fontSize.base,
                  color: theme.colors.mediumGray
                }}>
                  Click "Add Task" to create your first task for this project
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm
              }}>
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setEditingTask(task)}
                    style={{
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      cursor: 'pointer',
                      transition: theme.transitions.fast,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.evergreen
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.lightGray
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${task.data?.status === 'done' ? theme.colors.green : theme.colors.lightGray}`,
                      backgroundColor: task.data?.status === 'done' ? theme.colors.green : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {task.data?.status === 'done' && (
                        <CheckCircle2 size={12} color={theme.colors.white} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.charcoal,
                        marginBottom: theme.spacing.xs
                      }}>
                        {task.data?.title || 'Untitled'}
                        {task.data?.isSubtask && (
                          <span style={{
                            marginLeft: theme.spacing.sm,
                            padding: `2px ${theme.spacing.xs}`,
                            backgroundColor: theme.colors.softGray,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.mediumGray
                          }}>
                            Subtask
                          </span>
                        )}
                      </div>
                      {task.data?.description && (
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.mediumGray
                        }}>
                          {task.data.description}
                        </div>
                      )}
                    </div>
                    {task.data?.estimatedHours && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.mediumGray
                      }}>
                        <Clock size={14} />
                        {task.data.estimatedHours}h
                      </div>
                    )}
                    {task.data?.dueDate && (
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: new Date(task.data.dueDate) < new Date() && task.data?.status !== 'done'
                          ? theme.colors.red
                          : theme.colors.mediumGray
                      }}>
                        {new Date(task.data.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderMilestonesTab = () => (
    <div style={{ padding: theme.spacing.xl }}>
      <div style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl
      }}>
        <h3 style={{
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.charcoal,
          marginBottom: theme.spacing.lg
        }}>
          Project Milestones
        </h3>
        {milestones.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: theme.spacing['2xl'],
            color: theme.colors.mediumGray
          }}>
            No milestones defined for this project
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.lg
          }}>
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                style={{
                  display: 'flex',
                  gap: theme.spacing.lg,
                  padding: theme.spacing.lg,
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: milestone.data?.status === 'completed' 
                    ? theme.colors.success 
                    : new Date(milestone.data?.dueDate) < new Date() 
                      ? theme.colors.error
                      : theme.colors.evergreen,
                  color: theme.colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.bold
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.charcoal,
                    marginBottom: theme.spacing.sm
                  }}>
                    {milestone.data?.name}
                  </div>
                  {milestone.data?.description && (
                    <div style={{
                      fontSize: theme.typography.fontSize.base,
                      color: theme.colors.mediumGray,
                      marginBottom: theme.spacing.md
                    }}>
                      {milestone.data.description}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.lg,
                    fontSize: theme.typography.fontSize.sm
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      color: theme.colors.mediumGray
                    }}>
                      <Calendar size={16} />
                      Due: {new Date(milestone.data?.dueDate).toLocaleDateString()}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      color: milestone.data?.status === 'completed' 
                        ? theme.colors.success 
                        : theme.colors.mediumGray
                    }}>
                      {milestone.data?.status === 'completed' ? (
                        <>
                          <CheckCircle2 size={16} />
                          Completed
                        </>
                      ) : (
                        <>
                          <Clock size={16} />
                          Pending
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'tasks':
        return renderTasksTab()
      case 'milestones':
        return renderMilestonesTab()
      case 'files':
        return (
          <div style={{
            padding: theme.spacing['2xl'],
            textAlign: 'center',
            color: theme.colors.mediumGray
          }}>
            File attachments coming soon...
          </div>
        )
      case 'activity':
        return (
          <div style={{
            padding: theme.spacing['2xl'],
            textAlign: 'center',
            color: theme.colors.mediumGray
          }}>
            Activity feed coming soon...
          </div>
        )
      case 'settings':
        return (
          <div style={{
            padding: theme.spacing['2xl'],
            textAlign: 'center',
            color: theme.colors.mediumGray
          }}>
            Project settings coming soon...
          </div>
        )
      default:
        return renderOverviewTab()
    }
  }

  return (
    <div style={{
      backgroundColor: theme.colors.softGray,
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderBottom: `1px solid ${theme.colors.lightGray}`
      }}>
        <div style={{
          padding: theme.spacing.xl,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.md
        }}>
          <button
            onClick={() => router.push('/dashboard/tasks')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing.sm,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: theme.borderRadius.base,
              transition: theme.transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.softGray
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <ArrowLeft size={20} color={theme.colors.mediumGray} />
          </button>
          
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.xs
            }}>
              <h1 style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.charcoal,
                margin: 0
              }}>
                {name}
              </h1>
              {client && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  backgroundColor: theme.colors.softGray,
                  borderRadius: theme.borderRadius.sm
                }}>
                  <Briefcase size={14} color={theme.colors.mediumGray} />
                  <span style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.mediumGray
                  }}>
                    {client}
                  </span>
                </div>
              )}
              {category && (
                <div style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  backgroundColor: theme.colors.softGreen,
                  borderRadius: theme.borderRadius.sm,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.evergreen,
                  textTransform: 'capitalize'
                }}>
                  {category}
                </div>
              )}
            </div>
            {description && (
              <p style={{
                fontSize: theme.typography.fontSize.base,
                color: theme.colors.mediumGray,
                margin: 0
              }}>
                {description}
              </p>
            )}
            <div style={{
              display: 'flex',
              gap: theme.spacing.md,
              marginTop: theme.spacing.md
            }}>
              {startDate && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mediumGray
                }}>
                  <Calendar size={14} />
                  Started: {new Date(startDate).toLocaleDateString()}
                </div>
              )}
              {dueDate && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  fontSize: theme.typography.fontSize.sm,
                  color: new Date(dueDate) < new Date() ? theme.colors.error : theme.colors.mediumGray
                }}>
                  <Calendar size={14} />
                  Due: {new Date(dueDate).toLocaleDateString()}
                </div>
              )}
              {tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.xs
                }}>
                  {tags.map(tag => (
                    <div
                      key={tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        padding: `2px ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.charcoal
                      }}
                    >
                      <Tag size={12} />
                      {tag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowProjectSettings(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm,
              backgroundColor: theme.colors.white,
              color: theme.colors.charcoal,
              border: `1px solid ${theme.colors.lightGray}`,
              borderRadius: theme.borderRadius.base,
              padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
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
            <Settings size={18} />
            Settings
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: theme.spacing.xs,
          paddingLeft: theme.spacing.xl,
          paddingRight: theme.spacing.xl
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                  backgroundColor: 'transparent',
                  color: activeTab === tab.id ? theme.colors.evergreen : theme.colors.mediumGray,
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab.id ? theme.colors.evergreen : 'transparent'}`,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: activeTab === tab.id ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                  cursor: 'pointer',
                  transition: theme.transitions.fast
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = theme.colors.charcoal
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.color = theme.colors.mediumGray
                  }
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
      
      {/* New Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          onClose={() => {
            setShowNewTaskModal(false)
            refetchTasks()
            refetchProject()
          }}
          projects={[project]}
          defaultProjectId={projectId}
          deals={deals}
          contacts={contacts}
          companies={companies}
        />
      )}
      
      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => {
            setEditingTask(null)
            refetchTasks()
            refetchProject()
          }}
          onUpdate={() => {
            refetchTasks()
            refetchProject()
          }}
          onDelete={() => {
            refetchTasks()
            refetchProject()
          }}
        />
      )}
    </div>
  )
}