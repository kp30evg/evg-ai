'use client'

import React, { useState } from 'react'
import { 
  X, 
  Lock, 
  Globe, 
  Users,
  Link2,
  Sparkles,
  Grid3x3,
  List,
  BarChart3,
  Calendar,
  Clock,
  FileText,
  Folder,
  ChevronRight,
  Check,
  DollarSign,
  Briefcase,
  Tag,
  Plus,
  Target,
  Trash2
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { motion, AnimatePresence } from 'framer-motion'
import { trpc } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'

interface NewProjectModalProps {
  onClose: () => void
  template?: any // For future template support
}

interface Milestone {
  name: string
  dueDate: string
  description: string
}

const PROJECT_CATEGORIES = [
  'Development',
  'Marketing', 
  'Sales',
  'Support',
  'Operations',
  'Research',
  'Design',
  'Finance',
  'HR',
  'Other'
]

const SUGGESTED_TAGS = [
  'urgent',
  'high-priority',
  'client-work',
  'internal',
  'mvp',
  'phase-1',
  'phase-2',
  'maintenance',
  'bug-fix',
  'feature'
]

export default function NewProjectModal({ onClose, template }: NewProjectModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [selectedTeam, setSelectedTeam] = useState('default')
  const [osLink, setOsLink] = useState('')
  const [useAI, setUseAI] = useState(false)
  const [selectedViews, setSelectedViews] = useState<string[]>(['list', 'board', 'dashboard'])
  const [isCreating, setIsCreating] = useState(false)
  
  // New enterprise fields
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [budget, setBudget] = useState('')
  const [client, setClient] = useState('')
  const [category, setCategory] = useState('Development')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [newMilestone, setNewMilestone] = useState<Milestone>({ name: '', dueDate: '', description: '' })
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  
  const createProjectMutation = trpc.evertask.createProject.useMutation({
    onSuccess: (project) => {
      console.log('Project created successfully:', project)
      onClose()
      router.push(`/dashboard/tasks/${project.id}`)
    },
    onError: (error) => {
      console.error('Failed to create project:', error)
      alert(`Failed to create project: ${error.message}`)
      setIsCreating(false)
    }
  })
  
  // Fetch team members (placeholder - replace with actual user data)
  const teamMembers = ['John D', 'Jane S', 'Mike R', 'Sarah L', 'Tom B']

  const availableViews = [
    { id: 'list', name: 'List', icon: List, description: 'Traditional task list view', default: true },
    { id: 'board', name: 'Board', icon: Grid3x3, description: 'Kanban-style task management', default: true },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Project analytics & insights', default: true },
    { id: 'gantt', name: 'Gantt', icon: BarChart3, description: 'Timeline view with dependencies', default: false },
    { id: 'calendar', name: 'Calendar', icon: Calendar, description: 'Calendar view of tasks', default: false }
  ]

  const toggleView = (viewId: string) => {
    if (selectedViews.includes(viewId)) {
      setSelectedViews(selectedViews.filter(v => v !== viewId))
    } else {
      setSelectedViews([...selectedViews, viewId])
    }
  }
  
  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput.toLowerCase()])
      setTagInput('')
    }
  }
  
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }
  
  const addMilestone = () => {
    if (newMilestone.name && newMilestone.dueDate) {
      setMilestones([...milestones, newMilestone])
      setNewMilestone({ name: '', dueDate: '', description: '' })
      setShowMilestoneForm(false)
    }
  }
  
  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (isCreating) return
    if (!projectName) {
      alert('Please enter a project name')
      return
    }
    
    setIsCreating(true)
    
    const projectData = {
      name: projectName,
      description: projectDescription,
      privacy,
      team: selectedTeam,
      osLink: osLink || undefined,
      useAI,
      views: selectedViews,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      budget: budget ? parseFloat(budget) : undefined,
      client: client || undefined,
      category: category || undefined,
      tags: tags.length > 0 ? tags : undefined,
      milestones: milestones.length > 0 ? milestones : undefined,
      members: selectedMembers.length > 0 ? selectedMembers : undefined
    }
    
    console.log('Creating project with data:', projectData)
    createProjectMutation.mutate(projectData)
  }

  return (
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: theme.spacing.xl,
          borderBottom: `1px solid ${theme.colors.lightGray}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: theme.colors.white,
          zIndex: 10
        }}>
          <div>
            <h2 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.charcoal,
              margin: 0,
              marginBottom: theme.spacing.xs
            }}>
              Create New Project
            </h2>
            <p style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.mediumGray,
              margin: 0
            }}>
              Set up your project with all the details
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing.sm,
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
            <X size={24} color={theme.colors.mediumGray} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: theme.spacing.xl }}>
          {/* Basic Information */}
          <div style={{ marginBottom: theme.spacing['2xl'] }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.lg
            }}>
              Basic Information
            </h3>
            
            {/* Project Name */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal,
                display: 'block',
                marginBottom: theme.spacing.sm
              }}>
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.base,
                  outline: 'none',
                  transition: theme.transitions.fast
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.evergreen
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.lightGray
                }}
              />
            </div>
            
            {/* Description */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal,
                display: 'block',
                marginBottom: theme.spacing.sm
              }}>
                Description
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe your project goals and objectives"
                rows={3}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.base,
                  outline: 'none',
                  transition: theme.transitions.fast,
                  resize: 'vertical'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.evergreen
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.lightGray
                }}
              />
            </div>
            
            {/* Category and Client */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: theme.spacing.lg,
              marginBottom: theme.spacing.lg
            }}>
              <div>
                <label style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.charcoal,
                  display: 'block',
                  marginBottom: theme.spacing.sm
                }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none',
                    backgroundColor: theme.colors.white,
                    cursor: 'pointer'
                  }}
                >
                  {PROJECT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.charcoal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  marginBottom: theme.spacing.sm
                }}>
                  <Briefcase size={14} />
                  Client
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Client name (optional)"
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Timeline & Budget */}
          <div style={{ marginBottom: theme.spacing['2xl'] }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.lg
            }}>
              Timeline & Budget
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: theme.spacing.lg
            }}>
              <div>
                <label style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.charcoal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  marginBottom: theme.spacing.sm
                }}>
                  <Calendar size={14} />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.charcoal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  marginBottom: theme.spacing.sm
                }}>
                  <Target size={14} />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none'
                  }}
                />
              </div>
              
              <div>
                <label style={{
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.charcoal,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  marginBottom: theme.spacing.sm
                }}>
                  <DollarSign size={14} />
                  Budget
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ marginBottom: theme.spacing['2xl'] }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs
            }}>
              <Tag size={18} />
              Tags
            </h3>
            
            <div style={{ marginBottom: theme.spacing.md }}>
              <div style={{
                display: 'flex',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.md
              }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag"
                  style={{
                    flex: 1,
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none'
                  }}
                />
                <button
                  onClick={addTag}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    backgroundColor: theme.colors.evergreen,
                    color: theme.colors.white,
                    border: 'none',
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer'
                  }}
                >
                  Add Tag
                </button>
              </div>
              
              {/* Suggested Tags */}
              <div style={{ marginBottom: theme.spacing.md }}>
                <div style={{
                  fontSize: theme.typography.fontSize.xs,
                  color: theme.colors.mediumGray,
                  marginBottom: theme.spacing.sm
                }}>
                  Suggested tags:
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: theme.spacing.xs
                }}>
                  {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setTags([...tags, tag])}
                      style={{
                        padding: `2px ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.sm,
                        border: `1px solid ${theme.colors.lightGray}`,
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.charcoal,
                        cursor: 'pointer',
                        transition: theme.transitions.fast
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.softGreen
                        e.currentTarget.style.borderColor = theme.colors.evergreen
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.softGray
                        e.currentTarget.style.borderColor = theme.colors.lightGray
                      }}
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Selected Tags */}
              {tags.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: theme.spacing.xs
                }}>
                  {tags.map(tag => (
                    <div
                      key={tag}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.xs,
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.softGreen,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.evergreen
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={14} color={theme.colors.evergreen} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div style={{ marginBottom: theme.spacing['2xl'] }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.lg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs
              }}>
                <Target size={18} />
                Milestones
              </div>
              <button
                onClick={() => setShowMilestoneForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.softGreen,
                  color: theme.colors.evergreen,
                  border: 'none',
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                Add Milestone
              </button>
            </h3>
            
            {/* Milestone Form */}
            {showMilestoneForm && (
              <div style={{
                padding: theme.spacing.lg,
                backgroundColor: theme.colors.softGray,
                borderRadius: theme.borderRadius.base,
                marginBottom: theme.spacing.lg
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: theme.spacing.md,
                  marginBottom: theme.spacing.md
                }}>
                  <input
                    type="text"
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone({...newMilestone, name: e.target.value})}
                    placeholder="Milestone name"
                    style={{
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                      backgroundColor: theme.colors.white
                    }}
                  />
                  <input
                    type="date"
                    value={newMilestone.dueDate}
                    onChange={(e) => setNewMilestone({...newMilestone, dueDate: e.target.value})}
                    style={{
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.base,
                      outline: 'none',
                      backgroundColor: theme.colors.white
                    }}
                  />
                </div>
                <input
                  type="text"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                  placeholder="Description (optional)"
                  style={{
                    width: '100%',
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.base,
                    outline: 'none',
                    backgroundColor: theme.colors.white,
                    marginBottom: theme.spacing.md
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.sm,
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => {
                      setShowMilestoneForm(false)
                      setNewMilestone({ name: '', dueDate: '', description: '' })
                    }}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      backgroundColor: theme.colors.white,
                      color: theme.colors.charcoal,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.sm,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addMilestone}
                    disabled={!newMilestone.name || !newMilestone.dueDate}
                    style={{
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      backgroundColor: theme.colors.evergreen,
                      color: theme.colors.white,
                      border: 'none',
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      cursor: !newMilestone.name || !newMilestone.dueDate ? 'not-allowed' : 'pointer',
                      opacity: !newMilestone.name || !newMilestone.dueDate ? 0.5 : 1
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            
            {/* Milestones List */}
            {milestones.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing.sm
              }}>
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      padding: theme.spacing.md,
                      backgroundColor: theme.colors.white,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: theme.borderRadius.full,
                      backgroundColor: theme.colors.evergreen,
                      color: theme.colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.bold
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.charcoal
                      }}>
                        {milestone.name}
                      </div>
                      {milestone.description && (
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.mediumGray
                        }}>
                          {milestone.description}
                        </div>
                      )}
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.mediumGray
                    }}>
                      {new Date(milestone.dueDate).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => removeMilestone(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: theme.spacing.xs,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Trash2 size={16} color={theme.colors.error} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team & Privacy */}
          <div style={{ marginBottom: theme.spacing['2xl'] }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.lg
            }}>
              Team & Privacy
            </h3>
            
            {/* Team Members */}
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal,
                display: 'block',
                marginBottom: theme.spacing.sm
              }}>
                Team Members
              </label>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: theme.spacing.sm
              }}>
                {teamMembers.map(member => (
                  <label
                    key={member}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      backgroundColor: selectedMembers.includes(member) ? theme.colors.softGreen : theme.colors.white,
                      border: `1px solid ${selectedMembers.includes(member) ? theme.colors.evergreen : theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      cursor: 'pointer',
                      transition: theme.transitions.fast
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(member)}
                      onChange={() => {
                        if (selectedMembers.includes(member)) {
                          setSelectedMembers(selectedMembers.filter(m => m !== member))
                        } else {
                          setSelectedMembers([...selectedMembers, member])
                        }
                      }}
                      style={{ display: 'none' }}
                    />
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
                      {member[0]}
                    </div>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.charcoal
                    }}>
                      {member}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Privacy */}
            <div>
              <label style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal,
                display: 'block',
                marginBottom: theme.spacing.sm
              }}>
                Privacy
              </label>
              <div style={{
                display: 'flex',
                gap: theme.spacing.md
              }}>
                <label style={{
                  flex: 1,
                  padding: theme.spacing.lg,
                  backgroundColor: privacy === 'public' ? theme.colors.softGreen : theme.colors.white,
                  border: `2px solid ${privacy === 'public' ? theme.colors.evergreen : theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base,
                  cursor: 'pointer',
                  transition: theme.transitions.fast
                }}>
                  <input
                    type="radio"
                    value="public"
                    checked={privacy === 'public'}
                    onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm
                  }}>
                    <Globe size={20} color={privacy === 'public' ? theme.colors.evergreen : theme.colors.mediumGray} />
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.charcoal
                      }}>
                        Public
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.mediumGray
                      }}>
                        Visible to all team members
                      </div>
                    </div>
                  </div>
                </label>
                
                <label style={{
                  flex: 1,
                  padding: theme.spacing.lg,
                  backgroundColor: privacy === 'private' ? theme.colors.softGreen : theme.colors.white,
                  border: `2px solid ${privacy === 'private' ? theme.colors.evergreen : theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base,
                  cursor: 'pointer',
                  transition: theme.transitions.fast
                }}>
                  <input
                    type="radio"
                    value="private"
                    checked={privacy === 'private'}
                    onChange={(e) => setPrivacy(e.target.value as 'public' | 'private')}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm
                  }}>
                    <Lock size={20} color={privacy === 'private' ? theme.colors.evergreen : theme.colors.mediumGray} />
                    <div>
                      <div style={{
                        fontSize: theme.typography.fontSize.base,
                        fontWeight: theme.typography.fontWeight.medium,
                        color: theme.colors.charcoal
                      }}>
                        Private
                      </div>
                      <div style={{
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.mediumGray
                      }}>
                        Only visible to selected members
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Views */}
          <div>
            <h3 style={{
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.lg
            }}>
              Available Views
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: theme.spacing.md
            }}>
              {availableViews.map(view => (
                <label
                  key={view.id}
                  style={{
                    padding: theme.spacing.md,
                    backgroundColor: selectedViews.includes(view.id) ? theme.colors.softGreen : theme.colors.white,
                    border: `2px solid ${selectedViews.includes(view.id) ? theme.colors.evergreen : theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                    textAlign: 'center'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedViews.includes(view.id)}
                    onChange={() => toggleView(view.id)}
                    style={{ display: 'none' }}
                  />
                  <view.icon size={24} color={selectedViews.includes(view.id) ? theme.colors.evergreen : theme.colors.mediumGray} />
                  <div style={{
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.charcoal,
                    marginTop: theme.spacing.xs
                  }}>
                    {view.name}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: theme.spacing.xl,
          borderTop: `1px solid ${theme.colors.lightGray}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: theme.spacing.md,
          backgroundColor: theme.colors.softGray
        }}>
          <button
            onClick={onClose}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: theme.colors.white,
              color: theme.colors.charcoal,
              border: `1px solid ${theme.colors.lightGray}`,
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: theme.transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.lightGray
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.white
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !projectName}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xl}`,
              backgroundColor: isCreating || !projectName ? theme.colors.mediumGray : theme.colors.evergreen,
              color: theme.colors.white,
              border: 'none',
              borderRadius: theme.borderRadius.base,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: isCreating || !projectName ? 'not-allowed' : 'pointer',
              transition: theme.transitions.fast
            }}
            onMouseEnter={(e) => {
              if (!isCreating && projectName) {
                e.currentTarget.style.backgroundColor = theme.colors.darkGreen
              }
            }}
            onMouseLeave={(e) => {
              if (!isCreating && projectName) {
                e.currentTarget.style.backgroundColor = theme.colors.evergreen
              }
            }}
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}