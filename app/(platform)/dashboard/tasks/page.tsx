'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid, List, Calendar, Users, Search, Filter, ChevronDown } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import NewProjectModal from '@/components/tasks/NewProjectModal'
import ProjectCard from '@/components/tasks/ProjectCard'
import { trpc } from '@/lib/trpc/client'

export default function TasksPage() {
  const router = useRouter()
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch projects from database
  const { data: projects = [], isLoading, refetch } = trpc.evertask.getProjects.useQuery()
  
  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      project.data?.name?.toLowerCase().includes(searchLower) ||
      project.data?.description?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <>
      <div style={{
        backgroundColor: theme.colors.white,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: theme.colors.white,
          borderBottom: `1px solid ${theme.colors.lightGray}`,
          padding: theme.spacing['2xl'],
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.lg
          }}>
            <div>
              <h1 style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.charcoal,
                margin: 0,
                marginBottom: theme.spacing.xs
              }}>
                EverTask
              </h1>
              <p style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray,
                margin: 0
              }}>
                Intelligent project management integrated with your OS
              </p>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                backgroundColor: theme.colors.evergreen,
                color: theme.colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.base,
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
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
              <Plus size={20} />
              New Project
            </button>
          </div>

          {/* Filters and View Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.spacing.lg
          }}>
            <div style={{
              display: 'flex',
              gap: theme.spacing.md,
              flex: 1
            }}>
              {/* Search */}
              <div style={{
                position: 'relative',
                flex: 1,
                maxWidth: '400px'
              }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: theme.spacing.md,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme.colors.mediumGray
                }} />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px`,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
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

              {/* Filter Dropdown */}
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
                All Projects
                <ChevronDown size={16} />
              </button>
            </div>

            {/* View Toggle */}
            <div style={{
              display: 'flex',
              backgroundColor: theme.colors.softGray,
              borderRadius: theme.borderRadius.base,
              padding: '2px'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  backgroundColor: viewMode === 'grid' ? theme.colors.white : 'transparent',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                <Grid size={16} color={viewMode === 'grid' ? theme.colors.evergreen : theme.colors.mediumGray} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  backgroundColor: viewMode === 'list' ? theme.colors.white : 'transparent',
                  border: 'none',
                  borderRadius: theme.borderRadius.sm,
                  cursor: 'pointer',
                  transition: theme.transitions.fast,
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.xs
                }}
              >
                <List size={16} color={viewMode === 'list' ? theme.colors.evergreen : theme.colors.mediumGray} />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid/List */}
        <div style={{
          flex: 1,
          padding: theme.spacing['2xl'],
          backgroundColor: theme.colors.softGray
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.mediumGray
            }}>
              Loading projects...
            </div>
          ) : viewMode === 'grid' ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: theme.spacing.xl
            }}>
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} onUpdate={refetch} />
              ))}
              
              {/* New Project Card */}
              <div
                onClick={() => setShowNewProjectModal(true)}
                style={{
                  backgroundColor: theme.colors.white,
                  border: `2px dashed ${theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.lg,
                  padding: theme.spacing['2xl'],
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '250px',
                  cursor: 'pointer',
                  transition: theme.transitions.base
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.evergreen
                  e.currentTarget.style.backgroundColor = theme.colors.softGreen
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.lightGray
                  e.currentTarget.style.backgroundColor = theme.colors.white
                }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: theme.borderRadius.full,
                  backgroundColor: theme.colors.softGreen,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.spacing.lg
                }}>
                  <Plus size={28} color={theme.colors.evergreen} />
                </div>
                <h3 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.charcoal,
                  margin: 0,
                  marginBottom: theme.spacing.xs
                }}>
                  Create New Project
                </h3>
                <p style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.mediumGray,
                  margin: 0
                }}>
                  Start from scratch or use AI templates
                </p>
              </div>
            </div>
          ) : (
            // List View
            <div style={{
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.lg,
              overflow: 'hidden'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: theme.colors.softGray,
                    borderBottom: `1px solid ${theme.colors.lightGray}`
                  }}>
                    <th style={{
                      padding: theme.spacing.md,
                      textAlign: 'left',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      textTransform: 'uppercase'
                    }}>Project</th>
                    <th style={{
                      padding: theme.spacing.md,
                      textAlign: 'left',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      textTransform: 'uppercase'
                    }}>Progress</th>
                    <th style={{
                      padding: theme.spacing.md,
                      textAlign: 'left',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      textTransform: 'uppercase'
                    }}>Members</th>
                    <th style={{
                      padding: theme.spacing.md,
                      textAlign: 'left',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      textTransform: 'uppercase'
                    }}>Due Date</th>
                    <th style={{
                      padding: theme.spacing.md,
                      textAlign: 'left',
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      textTransform: 'uppercase'
                    }}>OS Link</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => {
                    const projectData = project.data || {}
                    const dueDate = projectData.dueDate
                    return (
                    <tr 
                      key={project.id}
                      onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
                      style={{
                        borderBottom: `1px solid ${theme.colors.lightGray}`,
                        cursor: 'pointer',
                        transition: theme.transitions.fast
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme.colors.softGray
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <td style={{
                        padding: theme.spacing.lg
                      }}>
                        <div>
                          <div style={{
                            fontSize: theme.typography.fontSize.base,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.charcoal,
                            marginBottom: theme.spacing.xs
                          }}>{projectData.name || 'Untitled'}</div>
                          <div style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.mediumGray
                          }}>{projectData.description || ''}</div>
                        </div>
                      </td>
                      <td style={{
                        padding: theme.spacing.lg
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.md
                        }}>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: theme.colors.lightGray,
                            borderRadius: theme.borderRadius.full,
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${projectData.progress || 0}%`,
                              backgroundColor: theme.colors.evergreen,
                              transition: theme.transitions.base
                            }} />
                          </div>
                          <span style={{
                            fontSize: theme.typography.fontSize.sm,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.charcoal
                          }}>{projectData.progress || 0}%</span>
                        </div>
                      </td>
                      <td style={{
                        padding: theme.spacing.lg
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '-8px'
                        }}>
                          {(projectData.members || []).slice(0, 3).map((member: string, index: number) => (
                            <div
                              key={index}
                              style={{
                                width: '32px',
                                height: '32px',
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
                                zIndex: (projectData.members || []).length - index
                              }}
                            >
                              {member}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{
                        padding: theme.spacing.lg,
                        fontSize: theme.typography.fontSize.sm,
                        color: theme.colors.charcoal
                      }}>
                        {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                      </td>
                      <td style={{
                        padding: theme.spacing.lg
                      }}>
                        {project.relationships?.find((r: any) => r.type === 'linked_to') && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: theme.spacing.xs,
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: theme.colors.softGreen,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.evergreen
                          }}>
                            <Users size={14} />
                            Linked Entity
                          </div>
                        )}
                        {false && (
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: theme.spacing.xs,
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: theme.colors.softBlue,
                            borderRadius: theme.borderRadius.sm,
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.blue
                          }}>
                            <Users size={14} />
                            Linked
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal onClose={() => {
          setShowNewProjectModal(false)
          refetch() // Refresh the projects list
        }} />
      )}
    </>
  )
}