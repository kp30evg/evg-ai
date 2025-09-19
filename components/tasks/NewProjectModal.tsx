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
  Check
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { motion, AnimatePresence } from 'framer-motion'
import { trpc } from '@/lib/trpc/client'
import { useRouter } from 'next/navigation'

interface NewProjectModalProps {
  onClose: () => void
}

export default function NewProjectModal({ onClose }: NewProjectModalProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'private'>('public')
  const [selectedTeam, setSelectedTeam] = useState('evergreen')
  const [osLink, setOsLink] = useState('')
  const [useAI, setUseAI] = useState(true)
  const [selectedViews, setSelectedViews] = useState<string[]>(['list', 'board', 'dashboard'])
  const [isCreating, setIsCreating] = useState(false)
  
  const createProjectMutation = trpc.evertask.createProject.useMutation({
    onSuccess: (project) => {
      console.log('Project created successfully:', project)
      onClose()
      router.push(`/dashboard/tasks/${project.id}`)
    },
    onError: (error) => {
      console.error('Failed to create project:', error)
      console.error('Error details:', {
        message: error.message,
        data: error.data,
        shape: error.shape
      })
      alert(`Failed to create project: ${error.message}`)
      setIsCreating(false)
    }
  })
  
  // Fetch OS entities for linking
  // const { data: osEntities } = api.unified.searchEntities.useQuery(
  //   { query: osLink, types: ['deal', 'contact', 'company'] },
  //   { enabled: osLink.length > 2 }
  // )

  const availableViews = [
    { id: 'list', name: 'List', icon: List, description: 'Traditional task list view', default: true },
    { id: 'board', name: 'Board', icon: Grid3x3, description: 'Kanban-style task management', default: true },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3, description: 'Project analytics & insights', default: true }
  ]

  const toggleView = (viewId: string) => {
    if (selectedViews.includes(viewId)) {
      setSelectedViews(selectedViews.filter(v => v !== viewId))
    } else {
      setSelectedViews([...selectedViews, viewId])
    }
  }

  const handleCreate = async () => {
    if (isCreating) return
    setIsCreating(true)
    
    const projectData = {
      name: projectName,
      description: projectDescription,
      privacy,
      team: selectedTeam,
      osLink: osLink || undefined,
      useAI,
      views: selectedViews
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          backgroundColor: theme.colors.white,
          borderRadius: theme.borderRadius.xl,
          width: '90%',
          maxWidth: '1200px',
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          overflow: 'hidden',
          boxShadow: theme.shadows.xl,
          margin: '5vh auto'
        }}
      >
        {/* Left Panel */}
        <div style={{
          width: '40%',
          padding: theme.spacing['3xl'],
          borderRight: `1px solid ${theme.colors.lightGray}`,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          height: '100%'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing['3xl']
          }}>
            <h2 style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.charcoal,
              margin: 0
            }}>
              New project
            </h2>
            <button
              onClick={onClose}
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
              <X size={24} color={theme.colors.mediumGray} />
            </button>
          </div>

          {/* Step Indicator */}
          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            marginBottom: theme.spacing['2xl']
          }}>
            <div style={{
              flex: 1,
              height: '4px',
              backgroundColor: theme.colors.evergreen,
              borderRadius: theme.borderRadius.full
            }} />
            <div style={{
              flex: 1,
              height: '4px',
              backgroundColor: step === 2 ? theme.colors.evergreen : theme.colors.lightGray,
              borderRadius: theme.borderRadius.full
            }} />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.xl,
                  flex: 1
                }}
              >
                {/* Project Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.charcoal,
                    marginBottom: theme.spacing.sm
                  }}>
                    Project name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Q1 Product Launch"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    autoFocus
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
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.softGreen}`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.lightGray
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  {projectName.length === 0 && (
                    <p style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.error,
                      marginTop: theme.spacing.xs
                    }}>
                      Project name is required
                    </p>
                  )}
                </div>

                {/* Project Description */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.charcoal,
                    marginBottom: theme.spacing.sm
                  }}>
                    Description (optional)
                  </label>
                  <textarea
                    placeholder="Describe your project goals and objectives"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
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
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.softGreen}`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.lightGray
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                {/* Team Selection */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.charcoal,
                    marginBottom: theme.spacing.sm
                  }}>
                    Select a team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.base,
                      backgroundColor: theme.colors.white,
                      cursor: 'pointer',
                      outline: 'none',
                      transition: theme.transitions.fast
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.evergreen
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.lightGray
                    }}
                  >
                    <option value="evergreen">Evergreen Team</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                    <option value="engineering">Engineering</option>
                  </select>
                </div>

                {/* Privacy */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.charcoal,
                    marginBottom: theme.spacing.sm
                  }}>
                    Privacy
                  </label>
                  <div style={{
                    display: 'flex',
                    gap: theme.spacing.md
                  }}>
                    <button
                      onClick={() => setPrivacy('public')}
                      style={{
                        flex: 1,
                        padding: theme.spacing.md,
                        border: `2px solid ${privacy === 'public' ? theme.colors.evergreen : theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        backgroundColor: privacy === 'public' ? theme.colors.softGreen : theme.colors.white,
                        cursor: 'pointer',
                        transition: theme.transitions.fast,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm
                      }}
                    >
                      <Globe size={18} color={privacy === 'public' ? theme.colors.evergreen : theme.colors.mediumGray} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.charcoal
                        }}>Public</div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.mediumGray
                        }}>Visible to team</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setPrivacy('private')}
                      style={{
                        flex: 1,
                        padding: theme.spacing.md,
                        border: `2px solid ${privacy === 'private' ? theme.colors.evergreen : theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.base,
                        backgroundColor: privacy === 'private' ? theme.colors.softGreen : theme.colors.white,
                        cursor: 'pointer',
                        transition: theme.transitions.fast,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm
                      }}
                    >
                      <Lock size={18} color={privacy === 'private' ? theme.colors.evergreen : theme.colors.mediumGray} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          fontWeight: theme.typography.fontWeight.medium,
                          color: theme.colors.charcoal
                        }}>Private</div>
                        <div style={{
                          fontSize: theme.typography.fontSize.xs,
                          color: theme.colors.mediumGray
                        }}>Invite-only</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* OS Link */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.charcoal,
                    marginBottom: theme.spacing.sm
                  }}>
                    <Link2 size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: theme.spacing.xs }} />
                    Link to OS (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Link to a Deal, Contact, or Company"
                    value={osLink}
                    onChange={(e) => setOsLink(e.target.value)}
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
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.softGreen}`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = theme.colors.lightGray
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.mediumGray,
                    marginTop: theme.spacing.xs
                  }}>
                    Connect this project to EverCore for unified tracking
                  </p>
                </div>

                {/* AI Setup */}
                <div style={{
                  padding: theme.spacing.lg,
                  backgroundColor: theme.colors.softGreen,
                  borderRadius: theme.borderRadius.base,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  cursor: 'pointer'
                }}
                onClick={() => setUseAI(!useAI)}
                >
                  <input
                    type="checkbox"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: theme.colors.evergreen,
                      cursor: 'pointer'
                    }}
                  />
                  <Sparkles size={20} color={theme.colors.evergreen} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.charcoal
                    }}>
                      Set up with Evergreen AI
                    </div>
                    <div style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.mediumGray
                    }}>
                      AI will suggest structure, tasks, and columns based on your project
                    </div>
                  </div>
                </div>

                {/* Continue Button */}
                <div style={{ marginTop: theme.spacing.xl }}>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!projectName}
                    style={{
                      width: '100%',
                      padding: theme.spacing.md,
                      backgroundColor: projectName ? theme.colors.evergreen : theme.colors.lightGray,
                      color: theme.colors.white,
                      border: 'none',
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.medium,
                      cursor: projectName ? 'pointer' : 'not-allowed',
                      transition: theme.transitions.fast,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: theme.spacing.sm
                    }}
                    onMouseEnter={(e) => {
                      if (projectName) {
                        e.currentTarget.style.backgroundColor = theme.colors.darkGreen
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (projectName) {
                        e.currentTarget.style.backgroundColor = theme.colors.evergreen
                      }
                    }}
                  >
                    Continue
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.xl,
                  flex: 1
                }}
              >
                <div>
                  <h3 style={{
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.charcoal,
                    marginBottom: theme.spacing.sm
                  }}>
                    Choose your views
                  </h3>
                  <p style={{
                    fontSize: theme.typography.fontSize.sm,
                    color: theme.colors.mediumGray
                  }}>
                    Select how you want to visualize your project
                  </p>
                </div>

                {/* View Selection */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: theme.spacing.md,
                  flex: 1,
                  overflowY: 'auto'
                }}>
                  {availableViews.map(view => {
                    const isSelected = selectedViews.includes(view.id)
                    const Icon = view.icon
                    
                    return (
                      <div
                        key={view.id}
                        onClick={() => toggleView(view.id)}
                        style={{
                          padding: theme.spacing.lg,
                          border: `2px solid ${isSelected ? theme.colors.evergreen : theme.colors.lightGray}`,
                          borderRadius: theme.borderRadius.base,
                          backgroundColor: isSelected ? theme.colors.softGreen : theme.colors.white,
                          cursor: 'pointer',
                          transition: theme.transitions.fast,
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.md
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = theme.colors.softGray
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.backgroundColor = theme.colors.white
                          }
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: theme.borderRadius.sm,
                          border: `2px solid ${isSelected ? theme.colors.evergreen : theme.colors.mediumGray}`,
                          backgroundColor: isSelected ? theme.colors.evergreen : theme.colors.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {isSelected && <Check size={14} color={theme.colors.white} strokeWidth={3} />}
                        </div>
                        <Icon size={20} color={isSelected ? theme.colors.evergreen : theme.colors.mediumGray} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.charcoal
                          }}>
                            {view.name}
                            {view.default && (
                              <span style={{
                                marginLeft: theme.spacing.sm,
                                padding: `2px ${theme.spacing.xs}`,
                                backgroundColor: theme.colors.evergreen,
                                color: theme.colors.white,
                                borderRadius: theme.borderRadius.sm,
                                fontSize: '10px',
                                fontWeight: theme.typography.fontWeight.semibold,
                                verticalAlign: 'middle'
                              }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.mediumGray
                          }}>
                            {view.description}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.md,
                  marginTop: theme.spacing.xl
                }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      flex: 1,
                      padding: theme.spacing.md,
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
                      e.currentTarget.style.backgroundColor = theme.colors.softGray
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.white
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={selectedViews.length === 0 || isCreating}
                    style={{
                      flex: 2,
                      padding: theme.spacing.md,
                      backgroundColor: selectedViews.length > 0 && !isCreating ? theme.colors.evergreen : theme.colors.lightGray,
                      color: theme.colors.white,
                      border: 'none',
                      borderRadius: theme.borderRadius.base,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.medium,
                      cursor: selectedViews.length > 0 && !isCreating ? 'pointer' : 'not-allowed',
                      transition: theme.transitions.fast
                    }}
                    onMouseEnter={(e) => {
                      if (selectedViews.length > 0 && !isCreating) {
                        e.currentTarget.style.backgroundColor = theme.colors.darkGreen
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedViews.length > 0 && !isCreating) {
                        e.currentTarget.style.backgroundColor = theme.colors.evergreen
                      }
                    }}
                  >
                    {isCreating ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel - Live Preview */}
        <div style={{
          flex: 1,
          backgroundColor: theme.colors.softGray,
          padding: theme.spacing['3xl'],
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          height: '100%'
        }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.mediumGray,
            marginBottom: theme.spacing.lg
          }}>
            LIVE PREVIEW
          </div>
          
          {/* Project Preview */}
          <div style={{
            flex: 1,
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.lg,
            overflow: 'hidden',
            boxShadow: theme.shadows.sm
          }}>
            {/* Preview Header */}
            <div style={{
              padding: theme.spacing.xl,
              borderBottom: `1px solid ${theme.colors.lightGray}`
            }}>
              <h3 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.charcoal,
                margin: 0,
                marginBottom: theme.spacing.xs
              }}>
                {projectName || 'Your Project Name'}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}>
                  {privacy === 'public' ? <Globe size={14} /> : <Lock size={14} />}
                  <span style={{
                    fontSize: theme.typography.fontSize.xs,
                    color: theme.colors.mediumGray
                  }}>
                    {privacy === 'public' ? 'Public to team' : 'Private project'}
                  </span>
                </div>
                {osLink && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    backgroundColor: theme.colors.softGreen,
                    borderRadius: theme.borderRadius.sm
                  }}>
                    <Link2 size={14} color={theme.colors.evergreen} />
                    <span style={{
                      fontSize: theme.typography.fontSize.xs,
                      color: theme.colors.evergreen
                    }}>
                      Linked to OS
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Tabs */}
            {step === 2 && (
              <div style={{
                display: 'flex',
                gap: theme.spacing.xs,
                padding: theme.spacing.md,
                borderBottom: `1px solid ${theme.colors.lightGray}`
              }}>
                {selectedViews.map(viewId => {
                  const view = availableViews.find(v => v.id === viewId)
                  if (!view) return null
                  const Icon = view.icon
                  
                  return (
                    <div
                      key={viewId}
                      style={{
                        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                        backgroundColor: viewId === selectedViews[0] ? theme.colors.softGreen : 'transparent',
                        borderRadius: theme.borderRadius.base,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        cursor: 'pointer'
                      }}
                    >
                      <Icon size={16} color={viewId === selectedViews[0] ? theme.colors.evergreen : theme.colors.mediumGray} />
                      <span style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: viewId === selectedViews[0] ? theme.colors.evergreen : theme.colors.charcoal
                      }}>
                        {view.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Preview Content */}
            <div style={{
              padding: theme.spacing['2xl'],
              flex: 1
            }}>
              {step === 1 ? (
                // Step 1 Preview - Basic structure
                <div style={{
                  display: 'flex',
                  gap: theme.spacing.xl,
                  height: '100%'
                }}>
                  {['To Do', 'In Progress', 'Done'].map(column => (
                    <div
                      key={column}
                      style={{
                        flex: 1,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.base,
                        padding: theme.spacing.lg
                      }}
                    >
                      <div style={{
                        fontSize: theme.typography.fontSize.sm,
                        fontWeight: theme.typography.fontWeight.semibold,
                        color: theme.colors.charcoal,
                        marginBottom: theme.spacing.md
                      }}>
                        {column}
                      </div>
                      {useAI && (
                        <>
                          <div style={{
                            backgroundColor: theme.colors.white,
                            borderRadius: theme.borderRadius.sm,
                            padding: theme.spacing.md,
                            marginBottom: theme.spacing.sm,
                            borderLeft: `3px solid ${theme.colors.evergreen}`
                          }}>
                            <div style={{
                              fontSize: theme.typography.fontSize.xs,
                              color: theme.colors.mediumGray,
                              marginBottom: theme.spacing.xs
                            }}>
                              <Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              AI Generated
                            </div>
                            <div style={{
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.charcoal
                            }}>
                              Sample task
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Step 2 Preview - Selected view preview
                <div>
                  {selectedViews[0] === 'board' && (
                    <div style={{
                      display: 'flex',
                      gap: theme.spacing.xl,
                      height: '100%'
                    }}>
                      {['To Do', 'In Progress', 'Review', 'Done'].map(column => (
                        <div
                          key={column}
                          style={{
                            flex: 1,
                            backgroundColor: theme.colors.softGray,
                            borderRadius: theme.borderRadius.base,
                            padding: theme.spacing.lg
                          }}
                        >
                          <div style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.charcoal,
                            marginBottom: theme.spacing.md
                          }}>
                            {column}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedViews[0] === 'list' && (
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            textAlign: 'left',
                            padding: theme.spacing.md,
                            borderBottom: `1px solid ${theme.colors.lightGray}`,
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.mediumGray
                          }}>Task</th>
                          <th style={{
                            textAlign: 'left',
                            padding: theme.spacing.md,
                            borderBottom: `1px solid ${theme.colors.lightGray}`,
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.mediumGray
                          }}>Assignee</th>
                          <th style={{
                            textAlign: 'left',
                            padding: theme.spacing.md,
                            borderBottom: `1px solid ${theme.colors.lightGray}`,
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.mediumGray
                          }}>Due Date</th>
                          <th style={{
                            textAlign: 'left',
                            padding: theme.spacing.md,
                            borderBottom: `1px solid ${theme.colors.lightGray}`,
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.mediumGray
                          }}>Status</th>
                        </tr>
                      </thead>
                    </table>
                  )}
                  {selectedViews[0] === 'dashboard' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: theme.spacing.xl
                    }}>
                      <div style={{
                        padding: theme.spacing.lg,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.base
                      }}>
                        <div style={{
                          fontSize: theme.typography.fontSize['2xl'],
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.evergreen
                        }}>0</div>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.mediumGray
                        }}>Tasks</div>
                      </div>
                      <div style={{
                        padding: theme.spacing.lg,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.base
                      }}>
                        <div style={{
                          fontSize: theme.typography.fontSize['2xl'],
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.evergreen
                        }}>0%</div>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.mediumGray
                        }}>Complete</div>
                      </div>
                      <div style={{
                        padding: theme.spacing.lg,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.base
                      }}>
                        <div style={{
                          fontSize: theme.typography.fontSize['2xl'],
                          fontWeight: theme.typography.fontWeight.bold,
                          color: theme.colors.evergreen
                        }}>0</div>
                        <div style={{
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.mediumGray
                        }}>Team Members</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}