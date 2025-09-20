'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { 
  ArrowLeft,
  Search,
  Filter,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  Tag,
  DollarSign,
  Clock,
  Link2,
  FileText,
  BarChart3,
  Hash,
  Mail,
  Phone,
  MapPin,
  Globe,
  Zap,
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Circle,
  X,
  GripVertical,
  ChevronRight,
  Users,
  Settings,
  Download,
  Upload,
  Copy,
  Trash2,
  Star,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  EyeOff,
  Layers,
  Home,
  Target,
  Activity,
  Cpu,
  Database,
  GitBranch,
  Share2
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { trpc } from '@/lib/trpc/client'

// Column types configuration
const COLUMN_CATEGORIES = {
  essentials: {
    label: 'Essentials',
    icon: Star,
    columns: [
      { id: 'status', label: 'Status', icon: Circle, type: 'status' },
      { id: 'assignee', label: 'Assignee', icon: User, type: 'user' },
      { id: 'dueDate', label: 'Due Date', icon: Calendar, type: 'date' },
      { id: 'priority', label: 'Priority', icon: Flag, type: 'priority' },
      { id: 'tags', label: 'Tags', icon: Tag, type: 'tags' }
    ]
  },
  relational: {
    label: 'Relational OS',
    icon: Share2,
    columns: [
      { id: 'linkedDeals', label: 'Linked Deals', icon: DollarSign, type: 'relation' },
      { id: 'linkedContacts', label: 'Contacts', icon: Users, type: 'relation' },
      { id: 'linkedCompanies', label: 'Companies', icon: Home, type: 'relation' },
      { id: 'dependencies', label: 'Dependencies', icon: GitBranch, type: 'relation' },
      { id: 'blockedBy', label: 'Blocked By', icon: AlertCircle, type: 'relation' }
    ]
  },
  intelligence: {
    label: 'AI & Intelligence',
    icon: Brain,
    columns: [
      { id: 'aiSummary', label: 'AI Summary', icon: Sparkles, type: 'ai' },
      { id: 'riskScore', label: 'Risk Score', icon: TrendingUp, type: 'ai' },
      { id: 'sentiment', label: 'Sentiment', icon: Activity, type: 'ai' },
      { id: 'nextBestAction', label: 'Suggested Action', icon: Zap, type: 'ai' },
      { id: 'completion', label: 'AI Completion %', icon: Cpu, type: 'ai' }
    ]
  },
  data: {
    label: 'Data Fields',
    icon: Database,
    columns: [
      { id: 'number', label: 'Number', icon: Hash, type: 'number' },
      { id: 'text', label: 'Text', icon: FileText, type: 'text' },
      { id: 'longText', label: 'Long Text', icon: FileText, type: 'longtext' },
      { id: 'email', label: 'Email', icon: Mail, type: 'email' },
      { id: 'phone', label: 'Phone', icon: Phone, type: 'phone' },
      { id: 'url', label: 'URL', icon: Globe, type: 'url' },
      { id: 'location', label: 'Location', icon: MapPin, type: 'location' },
      { id: 'progress', label: 'Progress', icon: BarChart3, type: 'progress' },
      { id: 'rating', label: 'Rating', icon: Star, type: 'rating' },
      { id: 'checkbox', label: 'Checkbox', icon: CheckCircle2, type: 'checkbox' },
      { id: 'files', label: 'Files', icon: Paperclip, type: 'files' },
      { id: 'timeline', label: 'Timeline', icon: Clock, type: 'timeline' }
    ]
  }
}

// Status configuration
const STATUS_OPTIONS = [
  { id: 'not_started', label: 'Not Started', color: '#E8E8E8', textColor: '#666666' },
  { id: 'in_progress', label: 'In Progress', color: '#FFE4B5', textColor: '#FF8C00' },
  { id: 'review', label: 'Review', color: '#E6E6FA', textColor: '#7B68EE' },
  { id: 'done', label: 'Done', color: '#90EE90', textColor: '#228B22' },
  { id: 'blocked', label: 'Blocked', color: '#FFB6C1', textColor: '#DC143C' },
  { id: 'cancelled', label: 'Cancelled', color: '#F5F5F5', textColor: '#999999' }
]

// Priority configuration
const PRIORITY_OPTIONS = [
  { id: 'critical', label: 'Critical', color: '#FF4444', textColor: '#FFFFFF' },
  { id: 'high', label: 'High', color: '#FFA500', textColor: '#FFFFFF' },
  { id: 'medium', label: 'Medium', color: '#FFD700', textColor: '#333333' },
  { id: 'low', label: 'Low', color: '#87CEEB', textColor: '#333333' }
]

interface Task {
  id: string
  title: string
  sectionId: string
  [key: string]: any
}

interface Section {
  id: string
  title: string
  color: string
  collapsed: boolean
  tasks: Task[]
}

interface Column {
  id: string
  label: string
  type: string
  width: number
  visible: boolean
}

export default function WorkOSProjectView() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { organization } = useOrganization()
  
  // State management
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'todo',
      title: 'To Do',
      color: '#E8E8E8',
      collapsed: false,
      tasks: []
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      color: '#FFE4B5',
      collapsed: false,
      tasks: []
    },
    {
      id: 'done',
      title: 'Completed',
      color: '#90EE90',
      collapsed: false,
      tasks: []
    }
  ])
  
  const [columns, setColumns] = useState<Column[]>([
    { id: 'title', label: 'Task Name', type: 'text', width: 300, visible: true },
    { id: 'status', label: 'Status', type: 'status', width: 140, visible: true },
    { id: 'assignee', label: 'Assignee', type: 'user', width: 140, visible: true },
    { id: 'dueDate', label: 'Due Date', type: 'date', width: 140, visible: true },
    { id: 'priority', label: 'Priority', type: 'priority', width: 120, visible: true }
  ])
  
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [editingCell, setEditingCell] = useState<{taskId: string, columnId: string} | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<any[]>([])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)
  
  const addColumnRef = useRef<HTMLDivElement>(null)
  
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
            initials: `${membership.publicUserData?.firstName?.[0] || ''}${membership.publicUserData?.lastName?.[0] || ''}`.toUpperCase() || '??'
          })) || []
          setWorkspaceMembers(members)
        } catch (error) {
          console.error('Failed to fetch members:', error)
        }
      }
    }
    fetchMembers()
  }, [organization])
  
  // Add state for modals and forms
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [addTaskSection, setAddTaskSection] = useState<string>('todo')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showGroupByMenu, setShowGroupByMenu] = useState(false)
  const [filterBy, setFilterBy] = useState<any>({})
  const [groupBy, setGroupBy] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState<{taskId: string, show: boolean} | null>(null)
  const [taskActionMenu, setTaskActionMenu] = useState<{taskId: string, show: boolean} | null>(null)
  
  // Fetch project and tasks
  const { data: project } = trpc.evertask.getProject.useQuery({ projectId })
  const { data: tasks = [], refetch: refetchTasks } = trpc.evertask.getProjectTasks.useQuery({ projectId })
  
  // Mutations
  const updateTaskMutation = trpc.evertask.updateTask.useMutation({
    onSuccess: () => refetchTasks()
  })
  
  const createTaskMutation = trpc.evertask.createTask.useMutation({
    onSuccess: () => {
      refetchTasks()
      setNewTaskTitle('')
      setShowAddTaskModal(false)
    },
    onError: (error) => {
      console.error('Failed to create task:', error)
    }
  })
  
  const deleteTaskMutation = trpc.evertask.deleteTask.useMutation({
    onSuccess: () => {
      refetchTasks()
      setTaskActionMenu(null)
    }
  })
  
  // Organize tasks into sections
  useEffect(() => {
    if (tasks.length > 0) {
      const organizedSections = sections.map(section => ({
        ...section,
        tasks: tasks
          .filter((task: any) => task.data?.status === section.id || (section.id === 'todo' && !task.data?.status))
          .map((task: any) => ({
            id: task.id,
            title: task.data?.title || 'Untitled',
            sectionId: section.id,
            status: task.data?.status || 'not_started',
            assignee: task.data?.assigneeId,
            dueDate: task.data?.dueDate,
            priority: task.data?.priority || 'medium',
            tags: task.data?.tags || [],
            ...task.data
          }))
      }))
      setSections(organizedSections)
    }
  }, [tasks])

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Check if click is outside all dropdown areas
      if (!target.closest('[data-dropdown="true"]')) {
        setEditingCell(null)
        setShowFilterMenu(false)
        setShowGroupByMenu(false)
        setShowAddColumn(false)
        setOpenTaskActions(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  // Add new column
  const handleAddColumn = (columnConfig: any) => {
    const newColumn: Column = {
      id: `${columnConfig.id}_${Date.now()}`,
      label: columnConfig.label,
      type: columnConfig.type,
      width: 140,
      visible: true
    }
    setColumns([...columns, newColumn])
    setShowAddColumn(false)
  }
  
  // Add new task
  const handleAddTask = (sectionId?: string) => {
    if (sectionId) {
      setAddTaskSection(sectionId)
    }
    setShowAddTaskModal(true)
    setNewTaskTitle('')
  }
  
  // Create task
  const handleCreateTask = () => {
    if (newTaskTitle.trim()) {
      createTaskMutation.mutate({
        title: newTaskTitle,
        projectId,
        status: addTaskSection,
        column: sections.find(s => s.id === addTaskSection)?.title || 'To Do'
      })
    }
  }
  
  // Delete task
  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate({ taskId })
  }
  
  // Apply filters
  const getFilteredTasks = (tasks: any[]) => {
    if (!filterBy || Object.keys(filterBy).length === 0) return tasks
    
    return tasks.filter(task => {
      if (filterBy.status && task.status !== filterBy.status) return false
      if (filterBy.priority && task.priority !== filterBy.priority) return false
      if (filterBy.assignee && task.assignee !== filterBy.assignee) return false
      return true
    })
  }
  
  // Toggle section collapse
  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
    ))
  }
  
  // Handle cell edit
  const handleCellEdit = (taskId: string, columnId: string, value: any) => {
    // Map column IDs to actual data field names
    const fieldMap: { [key: string]: string } = {
      'assignee': 'assigneeId',
      'status': 'status',
      'priority': 'priority',
      'dueDate': 'dueDate',
      'title': 'title',
      'tags': 'tags'
    }
    
    const fieldName = fieldMap[columnId] || columnId
    
    updateTaskMutation.mutate({
      taskId,
      updates: { [fieldName]: value }
    })
    setEditingCell(null)
  }
  
  // Render cell based on type
  const renderCell = (task: Task, column: Column) => {
    const isEditing = editingCell?.taskId === task.id && editingCell?.columnId === column.id
    
    switch (column.type) {
      case 'text':
        if (column.id === 'title') {
          return (
            <div style={{
              padding: '8px 12px',
              cursor: 'text',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '36px'
            }}
            onClick={() => setEditingCell({ taskId: task.id, columnId: column.id })}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={task[column.id] || ''}
                  onChange={(e) => {
                    const newTasks = sections.flatMap(s => 
                      s.tasks.map(t => 
                        t.id === task.id ? { ...t, [column.id]: e.target.value } : t
                      )
                    )
                    // Update local state immediately
                  }}
                  onBlur={(e) => handleCellEdit(task.id, column.id, e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCellEdit(task.id, column.id, (e.target as HTMLInputElement).value)
                    }
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '4px 8px',
                    border: `2px solid ${theme.colors.evergreen}`,
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: theme.colors.white
                  }}
                />
              ) : (
                <>
                  <GripVertical size={14} color={theme.colors.mediumGray} style={{ cursor: 'grab', opacity: 0.5 }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: theme.colors.charcoal }}>
                    {task[column.id] || 'Untitled'}
                  </span>
                </>
              )}
            </div>
          )
        }
        return <div style={{ padding: '8px 12px' }}>{task[column.id] || ''}</div>
        
      case 'status':
        const status = STATUS_OPTIONS.find(s => s.id === task.status) || STATUS_OPTIONS[0]
        return (
          <div style={{ padding: '4px 8px' }}>
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: status.color,
                color: status.textColor,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setEditingCell({ taskId: task.id, columnId: column.id })}
            >
              {status.label}
            </div>
            {isEditing && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 1000,
                backgroundColor: theme.colors.white,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '8px',
                minWidth: '180px'
              }}>
                {STATUS_OPTIONS.map(option => (
                  <div
                    key={option.id}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.lightGray
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    onClick={() => handleCellEdit(task.id, 'status', option.id)}
                  >
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      backgroundColor: option.color
                    }} />
                    <span style={{ fontSize: '13px' }}>{option.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
        
      case 'user':
        const assignee = workspaceMembers.find(m => m.id === task.assignee)
        return (
          <div style={{ padding: '4px 8px', position: 'relative' }}>
            <div
              data-dropdown="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onClick={() => setEditingCell({ taskId: task.id, columnId: column.id })}
            >
              {assignee ? (
                <>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: theme.colors.evergreen,
                    color: theme.colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {assignee.initials}
                  </div>
                  <span style={{ fontSize: '13px', color: theme.colors.charcoal }}>
                    {assignee.name}
                  </span>
                </>
              ) : (
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: theme.colors.lightGray,
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: theme.colors.mediumGray
                }}>
                  + Assign
                </div>
              )}
            </div>
            {isEditing && (
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 10000,
                  backgroundColor: theme.colors.white,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  padding: '8px',
                  minWidth: '220px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  pointerEvents: 'auto'
                }}>
                <div
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: theme.colors.mediumGray,
                    borderBottom: `1px solid ${theme.colors.lightGray}`,
                    marginBottom: '4px'
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCellEdit(task.id, 'assignee', null)
                    setEditingCell(null) // Explicitly close dropdown after selection
                  }}
                >
                  Unassigned
                </div>
                {workspaceMembers.map(member => (
                  <div
                    key={member.id}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.lightGray
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleCellEdit(task.id, 'assignee', member.id)
                      setEditingCell(null) // Explicitly close dropdown after selection
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.evergreen,
                      color: theme.colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      {member.initials}
                    </div>
                    <span style={{ fontSize: '13px' }}>{member.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
        
      case 'date':
        return (
          <div style={{ padding: '4px 8px' }}>
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: task.dueDate && new Date(task.dueDate) < new Date() 
                  ? '#FFE4E4' 
                  : theme.colors.lightGray,
                color: task.dueDate && new Date(task.dueDate) < new Date() 
                  ? theme.colors.error 
                  : theme.colors.charcoal,
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
              onClick={() => setEditingCell({ taskId: task.id, columnId: column.id })}
            >
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '+ Set date'}
            </div>
          </div>
        )
        
      case 'priority':
        const priority = PRIORITY_OPTIONS.find(p => p.id === task.priority) || PRIORITY_OPTIONS[2]
        return (
          <div style={{ padding: '4px 8px' }}>
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: priority.color,
                color: priority.textColor,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setEditingCell({ taskId: task.id, columnId: column.id })}
            >
              {priority.label}
            </div>
          </div>
        )
        
      case 'tags':
        return (
          <div style={{ padding: '4px 8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {task.tags?.map((tag: string) => (
              <span
                key={tag}
                style={{
                  padding: '2px 8px',
                  backgroundColor: theme.colors.lightGray,
                  borderRadius: '10px',
                  fontSize: '11px',
                  color: theme.colors.charcoal
                }}
              >
                {tag}
              </span>
            ))}
            <button
              style={{
                padding: '2px 8px',
                backgroundColor: 'transparent',
                border: `1px dashed ${theme.colors.mediumGray}`,
                borderRadius: '10px',
                fontSize: '11px',
                color: theme.colors.mediumGray,
                cursor: 'pointer'
              }}
            >
              + Tag
            </button>
          </div>
        )
        
      default:
        return <div style={{ padding: '8px 12px' }}>-</div>
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
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/dashboard/tasks')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s'
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
            
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 600,
                color: theme.colors.charcoal,
                margin: 0
              }}>
                {project?.data?.name || 'Loading...'}
              </h1>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '-8px',
              alignItems: 'center',
              marginLeft: '16px'
            }}>
              {workspaceMembers.slice(0, 5).map((member, index) => (
                <div
                  key={member.id}
                  title={member.name}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: member.imageUrl ? 'transparent' : theme.colors.evergreen,
                    backgroundImage: member.imageUrl ? `url(${member.imageUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: theme.colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: `2px solid ${theme.colors.white}`,
                    marginLeft: index > 0 ? '-8px' : 0,
                    position: 'relative',
                    zIndex: 10 - index
                  }}
                >
                  {!member.imageUrl && member.initials}
                </div>
              ))}
              {workspaceMembers.length > 5 && (
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: theme.colors.lightGray,
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: theme.colors.charcoal,
                  marginLeft: '8px'
                }}>
                  +{workspaceMembers.length - 5}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleAddTask('todo')}
              style={{
                padding: '8px 16px',
                backgroundColor: theme.colors.evergreen,
                color: theme.colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 82, 56, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Plus size={16} />
              Add Task
            </button>
            
            <button
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <MoreHorizontal size={18} color={theme.colors.mediumGray} />
            </button>
          </div>
        </div>
        
        {/* Toolbar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{
            position: 'relative',
            flex: '0 0 300px'
          }}>
            <Search size={16} color={theme.colors.mediumGray} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)'
            }} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.evergreen
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.lightGray
              }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              style={{
                padding: '8px 16px',
                backgroundColor: Object.keys(filterBy).length > 0 ? theme.colors.lightGreen : 'transparent',
                border: `1px solid ${Object.keys(filterBy).length > 0 ? theme.colors.evergreen : theme.colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.colors.evergreen
                e.currentTarget.style.backgroundColor = theme.colors.lightGreen
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = Object.keys(filterBy).length > 0 ? theme.colors.evergreen : theme.colors.lightGray
                e.currentTarget.style.backgroundColor = Object.keys(filterBy).length > 0 ? theme.colors.lightGreen : 'transparent'
              }}
            >
              <Filter size={16} />
              Filter {Object.keys(filterBy).length > 0 && `(${Object.keys(filterBy).length})`}
            </button>
            
            {showFilterMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                backgroundColor: theme.colors.white,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '12px',
                minWidth: '200px',
                zIndex: 1000
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{
                    fontSize: '12px',
                    color: theme.colors.mediumGray,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: '6px'
                  }}>
                    STATUS
                  </label>
                  {STATUS_OPTIONS.map(status => (
                    <div
                      key={status.id}
                      onClick={() => {
                        setFilterBy(prev => 
                          prev.status === status.id 
                            ? { ...prev, status: undefined }
                            : { ...prev, status: status.id }
                        )
                      }}
                      style={{
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: filterBy.status === status.id ? theme.colors.lightGray : 'transparent',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (filterBy.status !== status.id) {
                          e.currentTarget.style.backgroundColor = theme.colors.softGray
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = filterBy.status === status.id ? theme.colors.lightGray : 'transparent'
                      }}
                    >
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        backgroundColor: status.color
                      }} />
                      <span style={{ fontSize: '13px' }}>{status.label}</span>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => {
                    setFilterBy({})
                    setShowFilterMenu(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: theme.colors.mediumGray,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
          
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowGroupByMenu(!showGroupByMenu)}
              style={{
                padding: '8px 16px',
                backgroundColor: groupBy ? theme.colors.lightGreen : 'transparent',
                border: `1px solid ${groupBy ? theme.colors.evergreen : theme.colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Layers size={16} />
              Group by {groupBy && `(${groupBy})`}
            </button>
            
            {showGroupByMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                backgroundColor: theme.colors.white,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '12px',
                minWidth: '180px',
                zIndex: 1000
              }}>
                {['status', 'priority', 'assignee', 'dueDate'].map(option => (
                  <div
                    key={option}
                    onClick={() => {
                      setGroupBy(groupBy === option ? null : option)
                      setShowGroupByMenu(false)
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      backgroundColor: groupBy === option ? theme.colors.lightGray : 'transparent',
                      transition: 'background-color 0.2s',
                      fontSize: '13px',
                      textTransform: 'capitalize'
                    }}
                    onMouseEnter={(e) => {
                      if (groupBy !== option) {
                        e.currentTarget.style.backgroundColor = theme.colors.softGray
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = groupBy === option ? theme.colors.lightGray : 'transparent'
                    }}
                  >
                    {option.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            <button
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <Download size={16} color={theme.colors.mediumGray} />
            </button>
            <button
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <Settings size={16} color={theme.colors.mediumGray} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Table Container */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowX: 'auto'
      }}>
        <div style={{
          backgroundColor: theme.colors.white,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'flex',
            backgroundColor: theme.colors.softGray,
            borderBottom: `2px solid ${theme.colors.lightGray}`,
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <div style={{
              width: '40px',
              padding: '12px',
              borderRight: `1px solid ${theme.colors.lightGray}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <input
                type="checkbox"
                style={{ cursor: 'pointer' }}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedTasks(sections.flatMap(s => s.tasks.map(t => t.id)))
                  } else {
                    setSelectedTasks([])
                  }
                }}
              />
            </div>
            
            {columns.filter(c => c.visible).map((column, index) => (
              <div
                key={column.id}
                style={{
                  width: `${column.width}px`,
                  padding: '12px',
                  borderRight: `1px solid ${theme.colors.lightGray}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme.colors.mediumGray,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.lightGray
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <span>{column.label}</span>
                <ChevronDown size={14} />
              </div>
            ))}
            
            {/* Add Column Button */}
            <div
              ref={addColumnRef}
              data-dropdown="true"
              style={{
                width: '120px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setShowAddColumn(!showAddColumn)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: `1px dashed ${theme.colors.mediumGray}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: theme.colors.mediumGray,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.evergreen
                  e.currentTarget.style.color = theme.colors.evergreen
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.mediumGray
                  e.currentTarget.style.color = theme.colors.mediumGray
                }}
              >
                <Plus size={14} />
                Add Column
              </button>
              
              {/* Add Column Popover */}
              {showAddColumn && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: theme.colors.white,
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    width: '320px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    zIndex: 10000,
                    pointerEvents: 'auto'
                  }}>
                  <div style={{
                    padding: '16px',
                    borderBottom: `1px solid ${theme.colors.lightGray}`
                  }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: theme.colors.charcoal,
                      margin: 0
                    }}>Add Column</h3>
                    <p style={{
                      fontSize: '12px',
                      color: theme.colors.mediumGray,
                      marginTop: '4px',
                      margin: 0
                    }}>Choose a column type to add to your board</p>
                  </div>
                  
                  {Object.entries(COLUMN_CATEGORIES).map(([key, category]) => (
                    <div key={key}>
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: theme.colors.softGray,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <category.icon size={16} color={theme.colors.evergreen} />
                        <span style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: theme.colors.charcoal
                        }}>{category.label}</span>
                      </div>
                      <div style={{ padding: '8px' }}>
                        {category.columns.map(col => (
                          <button
                            key={col.id}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleAddColumn(col)
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme.colors.lightGray
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <col.icon size={18} color={theme.colors.mediumGray} />
                            <div>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: theme.colors.charcoal
                              }}>{col.label}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Table Body - Sections */}
          {sections.map((section, sectionIndex) => (
            <div key={section.id}>
              {/* Section Header */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: section.color + '20',
                  borderBottom: `1px solid ${theme.colors.lightGray}`,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => toggleSection(section.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = section.color + '30'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = section.color + '20'
                }}
              >
                <div style={{
                  width: '40px',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ChevronRight
                    size={16}
                    color={theme.colors.charcoal}
                    style={{
                      transform: section.collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                </div>
                <div style={{
                  flex: 1,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '4px',
                    height: '20px',
                    backgroundColor: section.color,
                    borderRadius: '2px'
                  }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: theme.colors.charcoal
                  }}>
                    {section.title}
                  </span>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: theme.colors.white,
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: theme.colors.mediumGray,
                    fontWeight: 500
                  }}>
                    {section.tasks.length}
                  </span>
                </div>
              </div>
              
              {/* Section Tasks */}
              {!section.collapsed && (
                <div>
                  {section.tasks.map((task, taskIndex) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        borderBottom: `1px solid ${theme.colors.lightGray}`,
                        backgroundColor: selectedTasks.includes(task.id) 
                          ? theme.colors.lightGreen 
                          : theme.colors.white,
                        transition: 'background-color 0.2s',
                        position: 'relative'
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
                      <div style={{
                        width: '40px',
                        padding: '12px',
                        borderRight: `1px solid ${theme.colors.lightGray}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTasks([...selectedTasks, task.id])
                            } else {
                              setSelectedTasks(selectedTasks.filter(id => id !== task.id))
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      
                      {columns.filter(c => c.visible).map((column) => (
                        <div
                          key={column.id}
                          style={{
                            width: `${column.width}px`,
                            borderRight: `1px solid ${theme.colors.lightGray}`,
                            position: 'relative',
                            minHeight: '44px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {renderCell(task, column)}
                        </div>
                      ))}
                      
                      <div style={{
                        width: '120px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <button
                          onClick={() => setTaskActionMenu(
                            taskActionMenu?.taskId === task.id 
                              ? null 
                              : { taskId: task.id, show: true }
                          )}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.lightGray
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <MoreHorizontal size={16} color={theme.colors.mediumGray} />
                        </button>
                        
                        {taskActionMenu?.taskId === task.id && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            backgroundColor: theme.colors.white,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            padding: '8px',
                            minWidth: '160px',
                            zIndex: 1000
                          }}>
                            <button
                              onClick={() => {
                                // Duplicate task
                                createTaskMutation.mutate({
                                  title: `${task.title} (Copy)`,
                                  projectId,
                                  status: task.sectionId,
                                  priority: task.priority,
                                  assigneeId: task.assignee
                                })
                                setTaskActionMenu(null)
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
                                color: theme.colors.charcoal,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textAlign: 'left',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.lightGray
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Copy size={14} />
                              Duplicate
                            </button>
                            
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
                                color: theme.colors.error,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                textAlign: 'left',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFE4E4'
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
                  ))}
                  
                  {/* Add Task Button */}
                  <div
                    onClick={() => handleAddTask(section.id)}
                    style={{
                      display: 'flex',
                      padding: '8px',
                      backgroundColor: theme.colors.white,
                      borderBottom: `1px solid ${theme.colors.lightGray}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.softGray
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.white
                    }}
                  >
                    <div style={{
                      width: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Plus size={16} color={theme.colors.mediumGray} />
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '4px 12px',
                      fontSize: '13px',
                      color: theme.colors.mediumGray
                    }}>
                      Add task
                    </div>
                  </div>
                </div>
              )}
              
              {/* Section Summary */}
              {!section.collapsed && section.tasks.length > 0 && (
                <div style={{
                  display: 'flex',
                  backgroundColor: theme.colors.softGray,
                  borderBottom: `2px solid ${theme.colors.lightGray}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme.colors.mediumGray
                }}>
                  <div style={{ width: '40px', padding: '8px' }}></div>
                  <div style={{ width: `${columns[0].width}px`, padding: '8px 12px' }}>
                    {section.tasks.length} tasks
                  </div>
                  {columns.slice(1).filter(c => c.visible).map((column) => (
                    <div key={column.id} style={{ width: `${column.width}px`, padding: '8px 12px' }}>
                      {column.type === 'status' && (
                        <span>{section.tasks.filter(t => t.status === 'done').length} done</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: theme.colors.white,
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                color: theme.colors.charcoal,
                margin: 0
              }}>
                Add New Task
              </h2>
              <button
                onClick={() => setShowAddTaskModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} color={theme.colors.mediumGray} />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                color: theme.colors.charcoal,
                marginBottom: '8px',
                fontWeight: 500
              }}>
                Task Title
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateTask()
                }}
                placeholder="Enter task title..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.evergreen
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.lightGray
                }}
              />
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAddTaskModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: theme.colors.charcoal,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                style={{
                  padding: '10px 20px',
                  backgroundColor: theme.colors.evergreen,
                  color: theme.colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#165a3b'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.colors.evergreen
                }}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside handler for popovers */}
      {(showAddColumn || editingCell || showFilterMenu || showGroupByMenu) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => {
            setShowAddColumn(false)
            setEditingCell(null)
            setShowFilterMenu(false)
            setShowGroupByMenu(false)
          }}
        />
      )}
    </div>
  )
}