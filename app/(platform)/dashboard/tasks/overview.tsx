'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization, useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { theme } from '@/lib/evercore/theme'
import { trpc } from '@/lib/trpc/client'
import { 
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Users,
  Target,
  Plus,
  ChevronRight,
  DollarSign,
  Building2,
  User,
  ArrowUpRight,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react'
import NewTaskModal from '@/components/tasks/NewTaskModal'
import NewProjectModal from '@/components/tasks/NewProjectModal'

export default function TaskOverview() {
  const router = useRouter()
  const { organization } = useOrganization()
  const { user } = useUser()
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const userId = user?.id || ''
  const workspaceId = organization?.id || ''
  
  // Fetch overview data
  const { data: overviewData, isLoading, refetch } = trpc.evertask.getOverviewStats.useQuery(
    { userId },
    { enabled: !!organization && !!user }
  )
  
  // Fetch ALL tasks for CRM relationship filtering
  const { data: allTasks = [] } = trpc.evertask.getAllTasks.useQuery(
    undefined,
    { enabled: !!organization }
  )
  
  // Fetch CRM entities for linking
  const { data: deals = [] } = trpc.evercore.getDeals.useQuery(undefined, { enabled: !!organization })
  const { data: contacts = [] } = trpc.evercore.getContacts.useQuery(undefined, { enabled: !!organization })
  const { data: companies = [] } = trpc.evercore.getCompanies.useQuery(undefined, { enabled: !!organization })
  
  // Calculate metrics
  const overdueCount = overviewData?.overdueTasksCount || 0
  const dueTodayCount = overviewData?.tasksDueThisWeek?.filter(t => {
    if (!t.data?.dueDate) return false
    const dueDate = new Date(t.data.dueDate)
    const today = new Date()
    return dueDate.toDateString() === today.toDateString()
  }).length || 0
  const thisWeekCount = overviewData?.tasksDueThisWeek?.length || 0
  const myOpenCount = overviewData?.activeTasksCount || 0
  
  // Group tasks by CRM relationship - using ALL tasks, not just due this week
  const tasksWithDeals = allTasks.filter(t => 
    Array.isArray(t.relationships) && t.relationships.some(r => 
      r.type === 'linked_to' && deals.some(d => d.id === r.targetId))
  )
  
  const tasksWithContacts = allTasks.filter(t => 
    Array.isArray(t.relationships) && t.relationships.some(r => 
      r.type === 'linked_to' && contacts.some(c => c.id === r.targetId))
  )
  
  const tasksWithCompanies = allTasks.filter(t => 
    Array.isArray(t.relationships) && t.relationships.some(r => 
      r.type === 'linked_to' && companies.some(co => co.id === r.targetId))
  )
  
  const unlinkedTasks = allTasks.filter(t => 
    !Array.isArray(t.relationships) || !t.relationships.some(r => 
      r.type === 'linked_to' && 
      (deals.some(d => d.id === r.targetId) || 
       contacts.some(c => c.id === r.targetId) ||
       companies.some(co => co.id === r.targetId)))
  )
  
  const getDealInfo = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId)
    return deal ? {
      name: deal.data?.name || 'Untitled Deal',
      value: deal.data?.amount || 0,
      stage: deal.data?.stage || 'New'
    } : null
  }
  
  const getContactInfo = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    
    // Handle both array and object formats for relationships
    let companyId = null
    if (contact?.relationships) {
      if (Array.isArray(contact.relationships)) {
        // Array format (newer style, used by tasks)
        companyId = contact.relationships.find(r => r.type === 'works_at')?.targetId
      } else if (typeof contact.relationships === 'object') {
        // Object format (legacy style, used by contacts/deals)
        companyId = contact.relationships.company
      }
    }
    
    const companyData = companies.find(co => co.id === companyId)
    return contact ? {
      name: contact.data?.name || `${contact.data?.firstName || ''} ${contact.data?.lastName || ''}`.trim() || 'Unknown',
      company: companyData?.data?.name || ''
    } : null
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
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
  
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return theme.colors.red
      case 'high': return theme.colors.orange
      case 'medium': return theme.colors.yellow
      case 'low': return theme.colors.green
      default: return theme.colors.mediumGray
    }
  }

  return (
    <>
      <div style={{
        backgroundColor: theme.colors.softGray,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Actions */}
        <div style={{
          backgroundColor: theme.colors.white,
          borderBottom: `1px solid ${theme.colors.lightGray}`,
          padding: theme.spacing.xl
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md
            }}>
              <div style={{
                position: 'relative',
                width: '400px'
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
                  placeholder="Search tasks, projects, or people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: `${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px`,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    fontSize: theme.typography.fontSize.sm,
                    outline: 'none'
                  }}
                />
              </div>
              <button style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.white,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.charcoal,
                cursor: 'pointer'
              }}>
                <Filter size={16} />
                Filter
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              gap: theme.spacing.md
            }}>
              <button
                onClick={() => setShowNewTaskModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  backgroundColor: theme.colors.white,
                  color: theme.colors.evergreen,
                  border: `1px solid ${theme.colors.evergreen}`,
                  borderRadius: theme.borderRadius.base,
                  padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  cursor: 'pointer'
                }}
              >
                <Plus size={18} />
                New Task
              </button>
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
                  cursor: 'pointer'
                }}
              >
                <Plus size={18} />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div style={{
          padding: `${theme.spacing.xl} ${theme.spacing.xl} 0`,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: theme.spacing.lg
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              border: `1px solid ${theme.colors.lightGray}`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.base,
                backgroundColor: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={20} color={theme.colors.red} />
              </div>
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>Overdue Tasks</span>
            </div>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.red
            }}>
              {overdueCount}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              border: `1px solid ${theme.colors.lightGray}`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.base,
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={20} color={theme.colors.orange} />
              </div>
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>Due Today</span>
            </div>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.charcoal
            }}>
              {dueTodayCount}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              border: `1px solid ${theme.colors.lightGray}`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.base,
                backgroundColor: '#E0E7FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={20} color={theme.colors.blue} />
              </div>
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>This Week</span>
            </div>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.charcoal
            }}>
              {thisWeekCount}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.xl,
              border: `1px solid ${theme.colors.lightGray}`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: theme.borderRadius.base,
                backgroundColor: theme.colors.softGreen,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target size={20} color={theme.colors.evergreen} />
              </div>
              <span style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>My Open Tasks</span>
            </div>
            <div style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.charcoal
            }}>
              {myOpenCount}
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div style={{
          padding: theme.spacing.xl,
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          gap: theme.spacing.xl,
          flex: 1
        }}>
          {/* Left Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.xl
          }}>
            {/* My Focus Today */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                backgroundColor: theme.colors.white,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.lightGray}`
              }}
            >
              <div style={{
                padding: theme.spacing.xl,
                borderBottom: `1px solid ${theme.colors.lightGray}`
              }}>
                <h2 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.charcoal,
                  margin: 0
                }}>My Focus Today</h2>
              </div>
              
              <div style={{ padding: theme.spacing.lg }}>
                {(overviewData?.tasksDueThisWeek || []).slice(0, 5).map((task, index) => {
                  const linkedDeal = task.relationships?.find(r => 
                    r.type === 'linked_to' && deals.some(d => d.id === r.targetId)
                  )?.targetId
                  const dealInfo = linkedDeal ? getDealInfo(linkedDeal) : null
                  
                  return (
                    <div
                      key={task.id}
                      style={{
                        padding: theme.spacing.md,
                        borderBottom: index < 4 ? `1px solid ${theme.colors.lightGray}` : 'none',
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
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: theme.typography.fontSize.base,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.charcoal,
                            marginBottom: theme.spacing.xs
                          }}>
                            {task.data?.title || 'Untitled Task'}
                          </div>
                          {dealInfo && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.mediumGray
                            }}>
                              <DollarSign size={14} />
                              <span>{dealInfo.name}</span>
                              <span style={{ color: theme.colors.evergreen, fontWeight: theme.typography.fontWeight.semibold }}>
                                {formatCurrency(dealInfo.value)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.md
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: getPriorityColor(task.data?.priority)
                          }} />
                          <span style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: task.data?.dueDate && new Date(task.data.dueDate) < new Date() 
                              ? theme.colors.red 
                              : theme.colors.mediumGray
                          }}>
                            {task.data?.dueDate ? getTimeUntil(task.data.dueDate) : 'No due date'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* CRM-Related Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{
                backgroundColor: theme.colors.white,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.lightGray}`
              }}
            >
              <div style={{
                padding: theme.spacing.xl,
                borderBottom: `1px solid ${theme.colors.lightGray}`
              }}>
                <h2 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.charcoal,
                  margin: 0
                }}>CRM-Related Tasks</h2>
              </div>
              
              <div style={{ padding: theme.spacing.lg }}>
                {/* Tasks for Active Deals */}
                {tasksWithDeals.length > 0 && (
                  <div style={{ marginBottom: theme.spacing.xl }}>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      marginBottom: theme.spacing.md,
                      textTransform: 'uppercase'
                    }}>Tasks for Active Deals</h3>
                    {tasksWithDeals.slice(0, 3).map((task) => {
                      const dealId = task.relationships?.find(r => 
                        r.type === 'linked_to' && deals.some(d => d.id === r.targetId)
                      )?.targetId
                      const dealInfo = dealId ? getDealInfo(dealId) : null
                      
                      return (
                        <div key={task.id} style={{
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.softGray,
                          borderRadius: theme.borderRadius.base,
                          marginBottom: theme.spacing.sm,
                          cursor: 'pointer'
                        }}>
                          <div style={{
                            fontSize: theme.typography.fontSize.base,
                            color: theme.colors.charcoal,
                            marginBottom: theme.spacing.xs
                          }}>
                            {task.data?.title}
                          </div>
                          {dealInfo && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                              fontSize: theme.typography.fontSize.sm
                            }}>
                              <span style={{ color: theme.colors.mediumGray }}>{dealInfo.name}</span>
                              <span style={{ 
                                color: theme.colors.evergreen, 
                                fontWeight: theme.typography.fontWeight.semibold 
                              }}>
                                {formatCurrency(dealInfo.value)}
                              </span>
                              <span style={{
                                padding: `2px ${theme.spacing.sm}`,
                                backgroundColor: theme.colors.softGreen,
                                color: theme.colors.evergreen,
                                borderRadius: theme.borderRadius.sm,
                                fontSize: theme.typography.fontSize.xs
                              }}>
                                {dealInfo.stage}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Tasks for Contacts */}
                {tasksWithContacts.length > 0 && (
                  <div style={{ marginBottom: theme.spacing.xl }}>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      marginBottom: theme.spacing.md,
                      textTransform: 'uppercase'
                    }}>Tasks for Contacts</h3>
                    {tasksWithContacts.slice(0, 3).map((task) => {
                      const contactId = task.relationships?.find(r => 
                        r.type === 'linked_to' && contacts.some(c => c.id === r.targetId)
                      )?.targetId
                      const contactInfo = contactId ? getContactInfo(contactId) : null
                      
                      return (
                        <div key={task.id} style={{
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.softGray,
                          borderRadius: theme.borderRadius.base,
                          marginBottom: theme.spacing.sm,
                          cursor: 'pointer'
                        }}>
                          <div style={{
                            fontSize: theme.typography.fontSize.base,
                            color: theme.colors.charcoal,
                            marginBottom: theme.spacing.xs
                          }}>
                            {task.data?.title}
                          </div>
                          {contactInfo && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.mediumGray
                            }}>
                              <User size={14} />
                              <span>{contactInfo.name}</span>
                              {contactInfo.company && (
                                <>
                                  <Building2 size={14} />
                                  <span>{contactInfo.company}</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Tasks for Companies */}
                {tasksWithCompanies.length > 0 && (
                  <div style={{ marginBottom: theme.spacing.xl }}>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      marginBottom: theme.spacing.md,
                      textTransform: 'uppercase'
                    }}>Tasks for Companies</h3>
                    {tasksWithCompanies.slice(0, 3).map((task) => {
                      const companyId = task.relationships?.find(r => 
                        r.type === 'linked_to' && companies.some(co => co.id === r.targetId)
                      )?.targetId
                      const company = companies.find(co => co.id === companyId)
                      
                      return (
                        <div key={task.id} style={{
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.softGray,
                          borderRadius: theme.borderRadius.base,
                          marginBottom: theme.spacing.sm,
                          cursor: 'pointer'
                        }}>
                          <div style={{
                            fontSize: theme.typography.fontSize.base,
                            color: theme.colors.charcoal,
                            marginBottom: theme.spacing.xs
                          }}>
                            {task.data?.title}
                          </div>
                          {company && (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing.sm,
                              fontSize: theme.typography.fontSize.sm,
                              color: theme.colors.mediumGray
                            }}>
                              <Building2 size={14} />
                              <span>{company.data?.name}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Unlinked Tasks */}
                {unlinkedTasks.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                      color: theme.colors.mediumGray,
                      marginBottom: theme.spacing.md,
                      textTransform: 'uppercase'
                    }}>Standalone Tasks</h3>
                    {unlinkedTasks.slice(0, 3).map((task) => (
                      <div key={task.id} style={{
                        padding: theme.spacing.md,
                        backgroundColor: theme.colors.softGray,
                        borderRadius: theme.borderRadius.base,
                        marginBottom: theme.spacing.sm,
                        cursor: 'pointer'
                      }}>
                        <div style={{
                          fontSize: theme.typography.fontSize.base,
                          color: theme.colors.charcoal
                        }}>
                          {task.data?.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Project Cards Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: theme.spacing.lg
              }}>
                <h2 style={{
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.charcoal,
                  margin: 0
                }}>Active Projects</h2>
                <button
                  onClick={() => router.push('/dashboard/tasks')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.xs,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.colors.evergreen,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer'
                  }}
                >
                  View All
                  <ChevronRight size={16} />
                </button>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: theme.spacing.lg
              }}>
                {(overviewData?.projects || []).slice(0, 4).map((project) => {
                  const progress = project.data?.progress || 0
                  const isAtRisk = overviewData?.projectsAtRiskCount > 0
                  const daysLeft = project.data?.dueDate 
                    ? Math.ceil((new Date(project.data.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : null
                  
                  return (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/dashboard/tasks/${project.id}`)}
                      style={{
                        backgroundColor: theme.colors.white,
                        borderRadius: theme.borderRadius.lg,
                        padding: theme.spacing.xl,
                        border: `1px solid ${theme.colors.lightGray}`,
                        cursor: 'pointer',
                        transition: theme.transitions.base
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = theme.shadows.md
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: theme.spacing.lg
                      }}>
                        <div>
                          <h3 style={{
                            fontSize: theme.typography.fontSize.base,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: theme.colors.charcoal,
                            margin: 0,
                            marginBottom: theme.spacing.xs
                          }}>
                            {project.data?.name || 'Untitled Project'}
                          </h3>
                          <p style={{
                            fontSize: theme.typography.fontSize.sm,
                            color: theme.colors.mediumGray,
                            margin: 0
                          }}>
                            {project.data?.tasksCount || 0} tasks • {project.data?.completedTasks || 0} complete
                          </p>
                        </div>
                        {isAtRisk && (
                          <div style={{
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: '#FEE2E2',
                            borderRadius: theme.borderRadius.sm
                          }}>
                            <AlertTriangle size={14} color={theme.colors.red} />
                          </div>
                        )}
                      </div>
                      
                      <div style={{
                        marginBottom: theme.spacing.md
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: theme.spacing.xs
                        }}>
                          <span style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.mediumGray
                          }}>Progress</span>
                          <span style={{
                            fontSize: theme.typography.fontSize.xs,
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.charcoal
                          }}>{progress}%</span>
                        </div>
                        <div style={{
                          height: '8px',
                          backgroundColor: theme.colors.lightGray,
                          borderRadius: theme.borderRadius.full,
                          overflow: 'hidden'
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            style={{
                              height: '100%',
                              backgroundColor: progress > 75 ? theme.colors.green : 
                                             progress > 50 ? theme.colors.evergreen : 
                                             progress > 25 ? theme.colors.yellow : theme.colors.orange
                            }}
                          />
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          gap: '-4px'
                        }}>
                          {(project.data?.members || []).slice(0, 3).map((member: string, idx: number) => (
                            <div
                              key={idx}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: theme.colors.evergreen,
                                color: theme.colors.white,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: theme.typography.fontSize.xs,
                                fontWeight: theme.typography.fontWeight.semibold,
                                marginLeft: idx > 0 ? '-4px' : 0,
                                border: `2px solid ${theme.colors.white}`,
                                position: 'relative',
                                zIndex: 3 - idx
                              }}
                            >
                              {member[0]}
                            </div>
                          ))}
                        </div>
                        {daysLeft !== null && (
                          <span style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: daysLeft < 7 ? theme.colors.orange : theme.colors.mediumGray
                          }}>
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar - Team Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45 }}
            style={{
              backgroundColor: theme.colors.white,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.lightGray}`,
              height: 'fit-content'
            }}
          >
            <div style={{
              padding: theme.spacing.xl,
              borderBottom: `1px solid ${theme.colors.lightGray}`
            }}>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.charcoal,
                margin: 0
              }}>Team Activity</h2>
            </div>
            
            <div style={{ padding: theme.spacing.lg }}>
              {/* Activity items would go here */}
              <div style={{
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray,
                textAlign: 'center',
                padding: theme.spacing.xl
              }}>
                No recent activity
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      {showNewTaskModal && (
        <NewTaskModal 
          onClose={() => {
            setShowNewTaskModal(false)
            refetch()
          }}
          deals={deals}
          contacts={contacts}
          companies={companies}
          projects={overviewData?.projects || []}
        />
      )}
      
      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => {
            setShowNewProjectModal(false)
            refetch()
          }}
        />
      )}
    </>
  )
}