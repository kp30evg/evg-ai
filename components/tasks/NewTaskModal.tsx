'use client'

import React, { useState } from 'react'
import { X, Calendar, User, Flag, Link2, Building2, DollarSign, Users, Search } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { trpc } from '@/lib/trpc/client'
import { useOrganization, useUser } from '@clerk/nextjs'

interface NewTaskModalProps {
  onClose: () => void
  deals?: any[]
  contacts?: any[]
  companies?: any[]
  projects?: any[]
}

export default function NewTaskModal({ 
  onClose, 
  deals = [], 
  contacts = [], 
  companies = [], 
  projects = [] 
}: NewTaskModalProps) {
  const { organization } = useOrganization()
  const { user } = useUser()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedDeal, setSelectedDeal] = useState('')
  const [selectedContact, setSelectedContact] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [showDealSearch, setShowDealSearch] = useState(false)
  const [showContactSearch, setShowContactSearch] = useState(false)
  const [showCompanySearch, setShowCompanySearch] = useState(false)
  const [dealSearchQuery, setDealSearchQuery] = useState('')
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [companySearchQuery, setCompanySearchQuery] = useState('')
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false)
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('')
  
  // Fetch organization members
  const { data: members = [] } = trpc.organization.getMembers.useQuery()
  
  const createTask = trpc.evertask.createTask.useMutation()
  
  const handleSubmit = async () => {
    if (!title.trim()) return
    
    const linkedEntities = []
    if (selectedDeal) linkedEntities.push(selectedDeal)
    if (selectedContact) linkedEntities.push(selectedContact)
    if (selectedCompany) linkedEntities.push(selectedCompany)
    
    try {
      await createTask.mutateAsync({
        title,
        description,
        projectId: selectedProject || undefined,
        priority,
        assigneeId: selectedAssignee || undefined,
        dueDate: dueDate ? new Date(`${dueDate} ${dueTime || '00:00'}`) : undefined,
        linkedEntities: linkedEntities.length > 0 ? linkedEntities : undefined
      })
      onClose()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }
  
  const filteredDeals = deals.filter(deal => 
    deal.data?.name?.toLowerCase().includes(dealSearchQuery.toLowerCase())
  )
  
  const filteredContacts = contacts.filter(contact => 
    contact.data?.name?.toLowerCase().includes(contactSearchQuery.toLowerCase())
  )
  
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
          }}>Create New Task</h2>
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

        {/* Form */}
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

          {/* CRM Linking Section */}
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
                      {getSelectedContact()?.data?.name}
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
                    {filteredContacts.map(contact => (
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
                        {contact.data?.name} - {contact.data?.email}
                      </div>
                    ))}
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

          {/* Project, Priority, Due Date Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.lg,
            marginBottom: theme.spacing.xl
          }}>
            {/* Project */}
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
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  width: '100%',
                  padding: theme.spacing.md,
                  border: `1px solid ${theme.colors.lightGray}`,
                  borderRadius: theme.borderRadius.base,
                  fontSize: theme.typography.fontSize.sm,
                  backgroundColor: theme.colors.white,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">No project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.data?.name || 'Untitled'}
                  </option>
                ))}
              </select>
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
                    Select team member...
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
                {showAssigneeSearch && !selectedAssignee && (
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
                        {member.role && (
                          <span style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: theme.colors.mediumGray
                          }}>
                            {member.role}
                          </span>
                        )}
                      </div>
                    ))}
                    {user && (
                      <div
                        onClick={() => {
                          setSelectedAssignee(user.id)
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
                          borderTop: `1px solid ${theme.colors.lightGray}`,
                          backgroundColor: theme.colors.softGray,
                          transition: theme.transitions.fast
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.lightGray
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.softGray
                        }}
                      >
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.blue,
                          color: theme.colors.white,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: theme.typography.fontSize.xs,
                          fontWeight: theme.typography.fontWeight.semibold
                        }}>
                          Me
                        </div>
                        <span>Assign to myself</span>
                      </div>
                    )}
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
            <div>
              <label style={{
                display: 'block',
                marginBottom: theme.spacing.sm,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.charcoal
              }}>
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
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
              disabled={!title.trim() || createTask.isLoading}
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                backgroundColor: title.trim() ? theme.colors.evergreen : theme.colors.lightGray,
                color: theme.colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.base,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                opacity: createTask.isLoading ? 0.7 : 1,
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
              {createTask.isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}