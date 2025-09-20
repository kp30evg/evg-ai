'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganization, useUser } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  Edit2,
  FileText,
  CheckCircle,
  Plus,
  Target,
  Brain,
  ChevronRight,
  AlertCircle,
  Clock,
  DollarSign,
  Link2,
  Globe,
  Linkedin,
  Twitter,
  MapPin,
  MoreVertical,
  TrendingUp,
  Activity,
  TrendingDown,
  Filter,
  X
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import ContactIdentityCard from '@/components/contacts/ContactIdentityCard'
import ContactActionBar from '@/components/contacts/ContactActionBar'
import ContactActivityTimeline from '@/components/contacts/ContactActivityTimeline'
import ContactRelationships from '@/components/contacts/ContactRelationships'
import ComposeModal from '@/components/mail/ComposeModal'
import NewTaskModal from '@/components/tasks/NewTaskModal'

// evergreenOS Design System
const colors = {
  evergreen: '#1D5238',
  white: '#FFFFFF',
  charcoal: '#222B2E',
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  gold: '#FFD600',
  blue: '#0EA5E9',
  purple: '#8B5CF6',
  orange: '#F97316',
  red: '#EF4444',
  green: '#10B981'
}

export default function ContactDetailPageV2() {
  const { organization } = useOrganization()
  const { user } = useUser()
  const router = useRouter()
  const params = useParams()
  const contactId = params.id as string
  
  // UI State
  const [activeTab, setActiveTab] = useState<'activity' | 'overview'>('activity')
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [showCallLog, setShowCallLog] = useState(false)
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false)
  const [activityFilters, setActivityFilters] = useState<string[]>([])
  const [noteContent, setNoteContent] = useState('')
  const [callDuration, setCallDuration] = useState('')
  const [callNotes, setCallNotes] = useState('')
  
  // Data fetching
  const { data: contact, isLoading, refetch: refetchContact } = trpc.unified.getEntity.useQuery(
    { id: contactId },
    { enabled: !!organization && !!contactId }
  )
  
  const { data: relatedEntities, refetch: refetchRelated } = trpc.unified.getRelatedEntities.useQuery(
    { entityId: contactId },
    { enabled: !!organization && !!contactId }
  )
  
  const { data: activities, refetch: refetchActivities } = trpc.unified.getEntityActivities.useQuery(
    { entityId: contactId, limit: 50 },
    { enabled: !!organization && !!contactId }
  )
  
  const { data: upcomingActivities } = trpc.unified.getUpcomingActivities.useQuery(
    { entityId: contactId },
    { enabled: !!organization && !!contactId }
  )
  
  // Mutations
  const createNote = trpc.unified.createNote.useMutation({
    onSuccess: () => {
      refetchActivities()
      setShowNoteEditor(false)
      setNoteContent('')
    }
  })
  
  const logCall = trpc.unified.logCall.useMutation({
    onSuccess: () => {
      refetchActivities()
      setShowCallLog(false)
    }
  })
  
  // Filter activities based on selected filters
  const filteredActivities = activities?.filter(activity => {
    if (activityFilters.length === 0) return true
    
    // Handle email filter for both email_sent and email_received
    if (activityFilters.includes('email')) {
      if (activity.type === 'email' || activity.type === 'email_sent' || activity.type === 'email_received') {
        return true
      }
    }
    
    // Check other filters
    return activityFilters.includes(activity.type)
  }) || []
  
  // Get related data categorized
  const relatedDeals = relatedEntities?.filter(e => e.type === 'deal') || []
  const relatedCompanies = relatedEntities?.filter(e => e.type === 'company') || []
  const relatedContacts = relatedEntities?.filter(e => e.type === 'contact' && e.id !== contactId) || []
  
  // Handlers
  const handleEmailClick = () => {
    setShowComposeModal(true)
  }
  
  const handleTaskClick = () => {
    setShowTaskModal(true)
  }
  
  const handleNoteClick = () => {
    setShowNoteEditor(true)
  }
  
  const handleCallClick = () => {
    setShowCallLog(true)
  }
  
  const handleMeetingClick = () => {
    // For now, redirect to calendar - later this will be inline
    router.push(`/dashboard/calendar?action=new&contactId=${contactId}`)
  }
  
  const handleSaveNote = async () => {
    if (!noteContent.trim()) return
    
    await createNote.mutateAsync({
      entityId: contactId,
      content: noteContent,
      type: 'note'
    })
  }
  
  const handleLogCall = async (duration: string, notes: string) => {
    await logCall.mutateAsync({
      entityId: contactId,
      duration,
      notes,
      type: 'call'
    })
  }
  
  const toggleFilter = (filter: string) => {
    setActivityFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }
  
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FAFBFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: colors.mediumGray }}>Loading contact...</div>
      </div>
    )
  }
  
  if (!contact) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FAFBFC',
        padding: '32px'
      }}>
        <div style={{
          backgroundColor: colors.white,
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          border: `1px solid ${colors.lightGray}40`
        }}>
          <AlertCircle size={48} color={colors.red} style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.charcoal, marginBottom: '8px' }}>
            Contact not found
          </h2>
          <button
            onClick={() => router.push('/dashboard/crm/contacts')}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.evergreen,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Back to Contacts
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFBFC',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header with breadcrumb */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        padding: '16px 24px'
      }}>
        <button
          onClick={() => router.push('/dashboard/crm/contacts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'transparent',
            border: 'none',
            color: colors.mediumGray,
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            borderRadius: '6px',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.lightGray + '30'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <ArrowLeft size={16} />
          Back to Contacts
        </button>
      </div>
      
      {/* Three-Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr 380px',
        gap: '24px',
        padding: '24px',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        {/* LEFT COLUMN - Identity & Actions */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Contact Identity Card */}
          <ContactIdentityCard contact={contact} />
          
          {/* Action Bar */}
          <ContactActionBar
            onEmailClick={handleEmailClick}
            onTaskClick={handleTaskClick}
            onNoteClick={handleNoteClick}
            onCallClick={handleCallClick}
            onMeetingClick={handleMeetingClick}
          />
          
          {/* About Section */}
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              About this contact
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {contact.data.email && (
                <div>
                  <label style={{ fontSize: '12px', color: colors.mediumGray }}>Email</label>
                  <div style={{ fontSize: '14px', color: colors.charcoal }}>{contact.data.email}</div>
                </div>
              )}
              
              {contact.data.phone && (
                <div>
                  <label style={{ fontSize: '12px', color: colors.mediumGray }}>Phone</label>
                  <div style={{ fontSize: '14px', color: colors.charcoal }}>{contact.data.phone}</div>
                </div>
              )}
              
              {contact.data.location && (
                <div>
                  <label style={{ fontSize: '12px', color: colors.mediumGray }}>Location</label>
                  <div style={{ fontSize: '14px', color: colors.charcoal }}>{contact.data.location}</div>
                </div>
              )}
              
              {contact.data.linkedIn && (
                <div>
                  <label style={{ fontSize: '12px', color: colors.mediumGray }}>LinkedIn</label>
                  <a 
                    href={contact.data.linkedIn} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      fontSize: '14px', 
                      color: colors.blue,
                      textDecoration: 'none'
                    }}
                  >
                    View Profile
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* CENTER COLUMN - Activity Hub */}
        <div style={{
          backgroundColor: colors.white,
          borderRadius: '12px',
          border: `1px solid ${colors.lightGray}40`,
          overflow: 'hidden'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: `1px solid ${colors.lightGray}40`,
            backgroundColor: colors.white
          }}>
            <button
              onClick={() => setActiveTab('activity')}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: activeTab === 'activity' ? colors.white : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'activity' ? `2px solid ${colors.evergreen}` : '2px solid transparent',
                fontSize: '14px',
                fontWeight: activeTab === 'activity' ? '600' : '500',
                color: activeTab === 'activity' ? colors.evergreen : colors.mediumGray,
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                flex: 1,
                padding: '16px',
                backgroundColor: activeTab === 'overview' ? colors.white : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'overview' ? `2px solid ${colors.evergreen}` : '2px solid transparent',
                fontSize: '14px',
                fontWeight: activeTab === 'overview' ? '600' : '500',
                color: activeTab === 'overview' ? colors.evergreen : colors.mediumGray,
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
            >
              Overview
            </button>
          </div>
          
          {/* Tab Content */}
          <div style={{ padding: '24px' }}>
            {activeTab === 'activity' && (
              <>
                {/* Activity Filters */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '20px',
                  flexWrap: 'wrap'
                }}>
                  {['note', 'email', 'call', 'task', 'meeting', 'deal'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => toggleFilter(filter)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: activityFilters.includes(filter) ? colors.evergreen : colors.white,
                        color: activityFilters.includes(filter) ? colors.white : colors.charcoal,
                        border: `1px solid ${activityFilters.includes(filter) ? colors.evergreen : colors.lightGray}`,
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 200ms ease',
                        textTransform: 'capitalize'
                      }}
                    >
                      {filter}s
                    </button>
                  ))}
                </div>
                
                {/* Activity Timeline */}
                <ContactActivityTimeline 
                  activities={filteredActivities}
                  onRefresh={refetchActivities}
                />
              </>
            )}
            
            {activeTab === 'overview' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                {/* Upcoming Activities */}
                {upcomingActivities && upcomingActivities.length > 0 && (
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      marginBottom: '16px'
                    }}>
                      Upcoming Activities
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {upcomingActivities.map(activity => (
                        <div 
                          key={activity.id}
                          style={{
                            padding: '12px',
                            backgroundColor: colors.lightGray + '20',
                            borderRadius: '8px',
                            borderLeft: `3px solid ${colors.evergreen}`
                          }}
                        >
                          <div style={{ fontSize: '14px', fontWeight: '500', color: colors.charcoal }}>
                            {activity.title}
                          </div>
                          <div style={{ fontSize: '12px', color: colors.mediumGray, marginTop: '4px' }}>
                            {new Date(activity.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Associated Records */}
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.charcoal,
                    marginBottom: '16px'
                  }}>
                    Associated Records
                  </h3>
                  
                  {/* Companies */}
                  {relatedCompanies.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: colors.mediumGray,
                        marginBottom: '12px'
                      }}>
                        Companies ({relatedCompanies.length})
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {relatedCompanies.map(company => (
                          <div
                            key={company.id}
                            style={{
                              padding: '10px',
                              backgroundColor: colors.lightGray + '10',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 200ms ease'
                            }}
                            onClick={() => router.push(`/dashboard/crm/companies/${company.id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen + '40'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.lightGray + '10'
                            }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: '500', color: colors.charcoal }}>
                              {company.data.name}
                            </div>
                            {company.data.industry && (
                              <div style={{ fontSize: '12px', color: colors.mediumGray }}>
                                {company.data.industry}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Other Contacts */}
                  {relatedContacts.length > 0 && (
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: colors.mediumGray,
                        marginBottom: '12px'
                      }}>
                        Related Contacts ({relatedContacts.length})
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {relatedContacts.map(relatedContact => (
                          <div
                            key={relatedContact.id}
                            style={{
                              padding: '10px',
                              backgroundColor: colors.lightGray + '10',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 200ms ease'
                            }}
                            onClick={() => router.push(`/dashboard/crm/contacts/${relatedContact.id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen + '40'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.lightGray + '10'
                            }}
                          >
                            <div style={{ fontSize: '14px', fontWeight: '500', color: colors.charcoal }}>
                              {relatedContact.data.firstName} {relatedContact.data.lastName}
                            </div>
                            {relatedContact.data.jobTitle && (
                              <div style={{ fontSize: '12px', color: colors.mediumGray }}>
                                {relatedContact.data.jobTitle}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* RIGHT COLUMN - Relational Context */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* AI Summary (Optional) */}
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <Brain size={20} color={colors.evergreen} />
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colors.charcoal,
                margin: 0
              }}>
                Insights
              </h3>
            </div>
            
            <div style={{
              padding: '12px',
              backgroundColor: colors.blue + '08',
              borderRadius: '8px',
              borderLeft: `3px solid ${colors.blue}`
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: colors.charcoal,
                marginBottom: '6px'
              }}>
                High engagement detected
              </div>
              <div style={{
                fontSize: '12px',
                color: colors.mediumGray
              }}>
                {activities?.length || 0} activities in the last 30 days. Consider moving to proposal stage.
              </div>
            </div>
          </div>
          
          {/* Related Deals */}
          <ContactRelationships
            deals={relatedDeals}
            contactId={contactId}
            onRefresh={refetchRelated}
          />
          
          {/* Quick Actions */}
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '16px'
            }}>
              Quick Actions
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button
                onClick={handleNoteClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: colors.charcoal,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.softGreen + '40'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <FileText size={14} />
                Add Note
              </button>
              
              <button
                onClick={handleTaskClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: colors.charcoal,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.softGreen + '40'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <CheckCircle size={14} />
                Create Task
              </button>
              
              <button
                onClick={handleCallClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: colors.charcoal,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.softGreen + '40'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <Phone size={14} />
                Log Call
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* MODALS & POPOVERS */}
      
      {/* EverMail Compose Modal */}
      {showComposeModal && (
        <ComposeModal
          isOpen={showComposeModal}
          onClose={() => setShowComposeModal(false)}
          defaultTo={contact.data.email}
          defaultSubject={`Follow up with ${contact.data.firstName} ${contact.data.lastName}`}
        />
      )}
      
      {/* EverTask Creation Modal */}
      {showTaskModal && (
        <NewTaskModal
          onClose={() => setShowTaskModal(false)}
          contacts={[contact]}
          deals={relatedDeals}
          companies={relatedCompanies}
          defaultContactId={contact.id}
          defaultTitle={`Follow up with ${contact.data.firstName} ${contact.data.lastName}`}
        />
      )}
      
      {/* Note Editor Popover */}
      <AnimatePresence>
        {showNoteEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
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
            }}
            onClick={() => setShowNoteEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                padding: '24px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  Add Note
                </h3>
                <button
                  onClick={() => setShowNoteEditor(false)}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.mediumGray
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Type your note here..."
                style={{
                  width: '100%',
                  minHeight: '150px',
                  padding: '12px',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '16px'
                }}
                autoFocus
              />
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowNoteEditor(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: colors.charcoal,
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={!noteContent.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: noteContent.trim() ? colors.evergreen : colors.lightGray,
                    color: noteContent.trim() ? colors.white : colors.mediumGray,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: noteContent.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Call Log Popover */}
      <AnimatePresence>
        {showCallLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
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
            }}
            onClick={() => setShowCallLog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                padding: '24px',
                width: '500px',
                maxWidth: '90%',
                boxShadow: '0 25px 70px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: colors.charcoal
                }}>
                  Log Call
                </h3>
                <button
                  onClick={() => setShowCallLog(false)}
                  style={{
                    padding: '4px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: colors.mediumGray
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Call Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g., 15 minutes"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Notes
                </label>
                <textarea
                  placeholder="What was discussed?"
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '10px',
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowCallLog(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    color: colors.charcoal,
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!callDuration.trim() || !callNotes.trim()) return
                    
                    await handleLogCall(callDuration, callNotes)
                    setCallDuration('')
                    setCallNotes('')
                    setShowCallLog(false)
                    refetchActivities()
                  }}
                  disabled={!callDuration.trim() || !callNotes.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: (!callDuration.trim() || !callNotes.trim()) ? colors.lightGray : colors.evergreen,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (!callDuration.trim() || !callNotes.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (!callDuration.trim() || !callNotes.trim()) ? 0.6 : 1
                  }}
                >
                  Log Call
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}