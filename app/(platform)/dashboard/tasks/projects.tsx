'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid, List, Search, Filter, ChevronDown, Users } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import ProjectCard from '@/components/tasks/ProjectCard'
import NewProjectModal from '@/components/tasks/NewProjectModal'

interface ProjectsViewProps {
  projects: any[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  isLoading: boolean
  refetch: () => void
}

export default function ProjectsView({
  projects,
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  isLoading,
  refetch
}: ProjectsViewProps) {
  const router = useRouter()
  const [showNewProjectModal, setShowNewProjectModal] = React.useState(false)

  return (
    <>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Filters and View Controls */}
        <div style={{
          backgroundColor: theme.colors.white,
          borderBottom: `1px solid ${theme.colors.lightGray}`,
          padding: theme.spacing.xl,
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

          <div style={{
            display: 'flex',
            gap: theme.spacing.md,
            alignItems: 'center'
          }}>
            {/* New Project Button */}
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
              New Project
            </button>

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
          backgroundColor: theme.colors.softGray,
          overflow: 'auto'
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
              {projects.map(project => (
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
                    }}>CRM Link</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(project => {
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
                              {member[0]?.toUpperCase() || '?'}
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
          refetch()
        }} />
      )}
    </>
  )
}