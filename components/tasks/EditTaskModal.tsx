'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Flag, Link2, Building2, DollarSign, Users, Search, Trash2 } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { trpc } from '@/lib/trpc/client'
import { useOrganization, useUser } from '@clerk/nextjs'

interface EditTaskModalProps {
  task: any // The task entity to edit
  onClose: () => void
  onDelete?: () => void // Optional callback after deletion
  onUpdate?: () => void // Optional callback after update
}

export default function EditTaskModal({ 
  task,
  onClose,
  onDelete,
  onUpdate
}: EditTaskModalProps) {
  const { organization } = useOrganization()
  const { user } = useUser()
  
  // Extract existing task data
  const existingRelationships = Array.isArray(task.relationships) ? task.relationships : []
  const projectRelationship = existingRelationships.find(r => r.type === 'belongs_to')
  const linkedRelationships = existingRelationships.filter(r => r.type === 'linked_to')
  
  // Initialize state with existing task data
  const [title, setTitle] = useState(task.data?.title || '')
  const [description, setDescription] = useState(task.data?.description || '')
  const [priority, setPriority] = useState(task.data?.priority || 'medium')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [selectedProject, setSelectedProject] = useState(projectRelationship?.targetId || '')
  const [selectedDeal, setSelectedDeal] = useState('')
  const [selectedContact, setSelectedContact] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [showDealSearch, setShowDealSearch] = useState(false)
  const [showContactSearch, setShowContactSearch] = useState(false)
  const [showCompanySearch, setShowCompanySearch] = useState(false)
  const [dealSearchQuery, setDealSearchQuery] = useState('')
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState(task.data?.assigneeId || '')
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false)
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Fetch data
  const { data: members = [] } = trpc.organization.getMembers.useQuery()
  const { data: projects = [] } = trpc.evertask.getProjects.useQuery()
  const { data: deals = [] } = trpc.evercore.getDeals.useQuery(undefined, { enabled: !!organization })
  const { data: contacts = [] } = trpc.evercore.getContacts.useQuery(undefined, { enabled: !!organization })
  const { data: companies = [] } = trpc.evercore.getCompanies.useQuery(undefined, { enabled: !!organization })
  
  // Mutations
  const updateTask = trpc.evertask.updateTask.useMutation({
    onSuccess: () => {
      onUpdate?.()
      onClose()
    }
  })
  
  const deleteTask = trpc.evertask.deleteTask.useMutation({
    onSuccess: () => {
      onDelete?.()
      onClose()
    }
  })
  
  // Set up linked entities from existing relationships
  useEffect(() => {
    if (linkedRelationships.length > 0 && deals.length > 0 && contacts.length > 0 && companies.length > 0) {
      linkedRelationships.forEach(rel => {
        const targetId = rel.targetId
        if (deals.some(d => d.id === targetId)) {
          setSelectedDeal(targetId)
        } else if (contacts.some(c => c.id === targetId)) {
          setSelectedContact(targetId)
        } else if (companies.some(c => c.id === targetId)) {
          setSelectedCompany(targetId)
        }
      })
    }
  }, [linkedRelationships, deals, contacts, companies])
  
  // Parse due date and time from existing task
  useEffect(() => {
    if (task.data?.dueDate) {
      const date = new Date(task.data.dueDate)
      setDueDate(date.toISOString().split('T')[0])
      setDueTime(date.toTimeString().slice(0, 5))
    }
  }, [task.data?.dueDate])
  
  const handleSubmit = async () => {
    if (!title.trim()) return
    
    const linkedEntities = []
    if (selectedDeal) linkedEntities.push(selectedDeal)
    if (selectedContact) linkedEntities.push(selectedContact)
    if (selectedCompany) linkedEntities.push(selectedCompany)
    
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        updates: {
          title,
          description,
          priority,
          assigneeId: selectedAssignee || undefined,
          dueDate: dueDate ? `${dueDate} ${dueTime || '00:00'}` : undefined,
          linkedEntities
        }
      })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }
  
  const handleDelete = async () => {
    try {
      await deleteTask.mutateAsync({ taskId: task.id })
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }
  
  const filteredDeals = deals.filter(deal => 
    deal.data?.name?.toLowerCase().includes(dealSearchQuery.toLowerCase())
  )
  
  const filteredContacts = contacts.filter(contact => {
    const name = contact.data?.name || `${contact.data?.firstName || ''} ${contact.data?.lastName || ''}`.trim()
    return name.toLowerCase().includes(contactSearchQuery.toLowerCase())
  })
  
  const filteredCompanies = companies.filter(company => 
    company.data?.name?.toLowerCase().includes(companySearchQuery.toLowerCase())
  )
  
  const getSelectedDeal = () => deals.find(d => d.id === selectedDeal)
  const getSelectedContact = () => contacts.find(c => c.id === selectedContact)
  const getSelectedCompany = () => companies.find(c => c.id === selectedCompany)
  const getSelectedAssignee = () => members.find(m => m.id === selectedAssignee)
  
  const filteredMembers = members.filter(member => {
    const name = member.name || member.email || ''
    return name.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
  })
  
  const priorityColors = {
    critical: theme.colors.red,
    high: theme.colors.orange,
    medium: theme.colors.yellow,
    low: theme.colors.green
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
        borderRadius: theme.borderRadius.lg,
        width: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: theme.shadows.xl
      }}>
        {/* Header */}
        <div style={{
          padding: theme.spacing.xl,
          borderBottom: `1px solid ${theme.colors.lightGray}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.charcoal,
            margin: 0
          }}>Edit Task</h2>
          <div style={{
            display: 'flex',
            gap: theme.spacing.sm
          }}>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: theme.spacing.sm,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.borderRadius.base,
                transition: theme.transitions.fast,
                color: theme.colors.red
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.red + '10'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              title="Delete Task"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
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
              <X size={20} color={theme.colors.mediumGray} />
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.red + '10',
            borderBottom: `1px solid ${theme.colors.red}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              fontSize: theme.typography.fontSize.sm,
              color: theme.colors.red
            }}>
              Are you sure you want to delete this task?
            </span>
            <div style={{
              display: 'flex',
              gap: theme.spacing.sm
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
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
                onClick={handleDelete}
                disabled={deleteTask.isLoading}
                style={{
                  padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                  backgroundColor: theme.colors.red,
                  color: theme.colors.white,
                  border: 'none',
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.sm,
                  cursor: 'pointer',
                  opacity: deleteTask.isLoading ? 0.7 : 1
                }}
              >
                {deleteTask.isLoading ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        )}

        {/* Form - Same as NewTaskModal but with pre-filled values */}
        <div style={{ padding: theme.spacing.xl }}>
          {/* Task Title */}
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label style={{
              display: 'block',
              marginBottom: theme.spacing.sm,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.charcoal
            }}>
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
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
          <div style={{ marginBottom: theme.spacing.xl }}>
            <label style={{
              display: 'block',
              marginBottom: theme.spacing.sm,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.charcoal
            }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task details..."
              rows={4}
              style={{
                width: '100%',
                padding: theme.spacing.md,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.base,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
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

          {/* CRM Linking Section - Interactive */}
          <div style={{
            backgroundColor: theme.colors.softGray,
            borderRadius: theme.borderRadius.base,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.xl
          }}>
            <h3 style={{
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.charcoal,
              marginBottom: theme.spacing.md,
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.sm
            }}>
              <Link2 size={18} />
              CRM Connections
            </h3>

            {/* Link to Deal */}
            <div style={{ marginBottom: theme.spacing.md }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.xs,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>
                <DollarSign size={14} />
                Link to Deal
              </label>
              <div style={{ position: 'relative' }}>
                {!selectedDeal ? (
                  <div
                    onClick={() => setShowDealSearch(!showDealSearch)}
                    style={{
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      backgroundColor: theme.colors.white,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.mediumGray
                    }}
                  >
                    Select a deal...
                  </div>
                ) : (
                  <div style={{
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.evergreen}`,
                    borderRadius: theme.borderRadius.base,
                    backgroundColor: theme.colors.softGreen,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.charcoal
                    }}>
                      {getSelectedDeal()?.data?.name} - ${getSelectedDeal()?.data?.amount || 0}
                    </span>
                    <button
                      onClick={() => setSelectedDeal('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: theme.spacing.xs
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {showDealSearch && !selectedDeal && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: theme.spacing.xs,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    maxHeight: '200px',
                    overflow: 'auto',
                    zIndex: 10,
                    boxShadow: theme.shadows.md
                  }}>
                    <input
                      type="text"
                      value={dealSearchQuery}
                      onChange={(e) => setDealSearchQuery(e.target.value)}
                      placeholder="Search deals..."
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: 'none',
                        borderBottom: `1px solid ${theme.colors.lightGray}`,
                        outline: 'none',
                        fontSize: theme.typography.fontSize.sm
                      }}
                    />
                    {filteredDeals.map(deal => (
                      <div
                        key={deal.id}
                        onClick={() => {
                          setSelectedDeal(deal.id)
                          setShowDealSearch(false)
                          setDealSearchQuery('')
                        }}
                        style={{
                          padding: theme.spacing.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.fontSize.sm,
                          transition: theme.transitions.fast
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.softGray
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {deal.data?.name} - ${deal.data?.amount || 0}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Link to Contact */}
            <div style={{ marginBottom: theme.spacing.md }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.xs,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>
                <User size={14} />
                Link to Contact
              </label>
              <div style={{ position: 'relative' }}>
                {!selectedContact ? (
                  <div
                    onClick={() => setShowContactSearch(!showContactSearch)}
                    style={{
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      backgroundColor: theme.colors.white,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.mediumGray
                    }}
                  >
                    Select a contact...
                  </div>
                ) : (
                  <div style={{
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.evergreen}`,
                    borderRadius: theme.borderRadius.base,
                    backgroundColor: theme.colors.softGreen,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.charcoal
                    }}>
                      {getSelectedContact()?.data?.name || `${getSelectedContact()?.data?.firstName} ${getSelectedContact()?.data?.lastName}`}
                    </span>
                    <button
                      onClick={() => setSelectedContact('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: theme.spacing.xs
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {showContactSearch && !selectedContact && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: theme.spacing.xs,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    maxHeight: '200px',
                    overflow: 'auto',
                    zIndex: 10,
                    boxShadow: theme.shadows.md
                  }}>
                    <input
                      type="text"
                      value={contactSearchQuery}
                      onChange={(e) => setContactSearchQuery(e.target.value)}
                      placeholder="Search contacts..."
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: 'none',
                        borderBottom: `1px solid ${theme.colors.lightGray}`,
                        outline: 'none',
                        fontSize: theme.typography.fontSize.sm
                      }}
                    />
                    {filteredContacts.map(contact => {
                      const name = contact.data?.name || `${contact.data?.firstName || ''} ${contact.data?.lastName || ''}`.trim()
                      return (
                        <div
                          key={contact.id}
                          onClick={() => {
                            setSelectedContact(contact.id)
                            setShowContactSearch(false)
                            setContactSearchQuery('')
                          }}
                          style={{
                            padding: theme.spacing.sm,
                            cursor: 'pointer',
                            fontSize: theme.typography.fontSize.sm,
                            transition: theme.transitions.fast
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.softGray
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {name} - {contact.data?.email}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Link to Company */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.xs,
                fontSize: theme.typography.fontSize.sm,
                color: theme.colors.mediumGray
              }}>
                <Building2 size={14} />
                Link to Company
              </label>
              <div style={{ position: 'relative' }}>
                {!selectedCompany ? (
                  <div
                    onClick={() => setShowCompanySearch(!showCompanySearch)}
                    style={{
                      padding: theme.spacing.sm,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      backgroundColor: theme.colors.white,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.mediumGray
                    }}
                  >
                    Select a company...
                  </div>
                ) : (
                  <div style={{
                    padding: theme.spacing.sm,
                    border: `1px solid ${theme.colors.evergreen}`,
                    borderRadius: theme.borderRadius.base,
                    backgroundColor: theme.colors.softGreen,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.charcoal
                    }}>
                      {getSelectedCompany()?.data?.name}
                    </span>
                    <button
                      onClick={() => setSelectedCompany('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: theme.spacing.xs
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {showCompanySearch && !selectedCompany && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: theme.spacing.xs,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    maxHeight: '200px',
                    overflow: 'auto',
                    zIndex: 10,
                    boxShadow: theme.shadows.md
                  }}>
                    <input
                      type="text"
                      value={companySearchQuery}
                      onChange={(e) => setCompanySearchQuery(e.target.value)}
                      placeholder="Search companies..."
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: 'none',
                        borderBottom: `1px solid ${theme.colors.lightGray}`,
                        outline: 'none',
                        fontSize: theme.typography.fontSize.sm
                      }}
                    />
                    {filteredCompanies.map(company => (
                      <div
                        key={company.id}
                        onClick={() => {
                          setSelectedCompany(company.id)
                          setShowCompanySearch(false)
                          setCompanySearchQuery('')
                        }}
                        style={{
                          padding: theme.spacing.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.fontSize.sm,
                          transition: theme.transitions.fast
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.softGray
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {company.data?.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Project, Priority Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.lg,
            marginBottom: theme.spacing.xl
          }}>
            {/* Project (Read-only) */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal
              }}>
                Project
              </label>
              <div style={{
                padding: theme.spacing.md,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                backgroundColor: theme.colors.softGray,
                color: theme.colors.mediumGray
              }}>
                {projects.find(p => p.id === selectedProject)?.data?.name || 'No project'}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal
              }}>
                Priority
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: theme.spacing.xs
              }}>
                {['low', 'medium', 'high', 'critical'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      padding: theme.spacing.sm,
                      border: priority === p ? `2px solid ${priorityColors[p]}` : `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      backgroundColor: priority === p ? `${priorityColors[p]}20` : theme.colors.white,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: priority === p ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
                      color: priority === p ? priorityColors[p] : theme.colors.mediumGray,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: theme.transitions.fast
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignee and Due Date */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.lg,
            marginBottom: theme.spacing.xl
          }}>
            {/* Assignee */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal
              }}>
                <Users size={16} />
                Assign To
              </label>
              <div style={{ position: 'relative' }}>
                {!selectedAssignee ? (
                  <div
                    onClick={() => setShowAssigneeSearch(!showAssigneeSearch)}
                    style={{
                      padding: theme.spacing.md,
                      border: `1px solid ${theme.colors.lightGray}`,
                      borderRadius: theme.borderRadius.base,
                      backgroundColor: theme.colors.white,
                      cursor: 'pointer',
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.mediumGray,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm
                    }}
                  >
                    <User size={16} />
                    Unassigned
                  </div>
                ) : (
                  <div style={{
                    padding: theme.spacing.md,
                    border: `1px solid ${theme.colors.evergreen}`,
                    borderRadius: theme.borderRadius.base,
                    backgroundColor: theme.colors.softGreen,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.charcoal,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm
                    }}>
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
                        {getSelectedAssignee()?.name?.[0] || getSelectedAssignee()?.email?.[0] || '?'}
                      </div>
                      {getSelectedAssignee()?.name || getSelectedAssignee()?.email}
                    </span>
                    <button
                      onClick={() => setSelectedAssignee('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: theme.spacing.xs
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {showAssigneeSearch && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: theme.spacing.xs,
                    backgroundColor: theme.colors.white,
                    border: `1px solid ${theme.colors.lightGray}`,
                    borderRadius: theme.borderRadius.base,
                    maxHeight: '200px',
                    overflow: 'auto',
                    zIndex: 10,
                    boxShadow: theme.shadows.md
                  }}>
                    <input
                      type="text"
                      value={assigneeSearchQuery}
                      onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                      placeholder="Search team members..."
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: 'none',
                        borderBottom: `1px solid ${theme.colors.lightGray}`,
                        outline: 'none',
                        fontSize: theme.typography.fontSize.sm
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {filteredMembers.map(member => (
                      <div
                        key={member.id}
                        onClick={() => {
                          setSelectedAssignee(member.id)
                          setShowAssigneeSearch(false)
                          setAssigneeSearchQuery('')
                        }}
                        style={{
                          padding: theme.spacing.sm,
                          cursor: 'pointer',
                          fontSize: theme.typography.fontSize.sm,
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing.sm,
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
                          {member.name?.[0] || member.email?.[0] || '?'}
                        </div>
                        <span>{member.name || member.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Due Date */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal
              }}>
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
                  fontSize: theme.typography.fontSize.sm,
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: theme.spacing.md
          }}>
            <button
              onClick={onClose}
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                backgroundColor: theme.colors.white,
                color: theme.colors.charcoal,
                border: `1px solid ${theme.colors.lightGray}`,
                borderRadius: theme.borderRadius.base,
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
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || updateTask.isLoading}
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                backgroundColor: title.trim() ? theme.colors.evergreen : theme.colors.lightGray,
                color: theme.colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                opacity: updateTask.isLoading ? 0.7 : 1,
                transition: theme.transitions.fast
              }}
              onMouseEnter={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.darkGreen
                }
              }}
              onMouseLeave={(e) => {
                if (title.trim()) {
                  e.currentTarget.style.backgroundColor = theme.colors.evergreen
                }
              }}
            >
              {updateTask.isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}