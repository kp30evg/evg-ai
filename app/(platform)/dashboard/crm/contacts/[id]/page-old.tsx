'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useOrganization } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  MessageSquare,
  Activity,
  Edit2,
  Trash2,
  Star,
  Clock,
  CheckCircle,
  Send,
  FileText,
  Link2,
  Globe,
  Linkedin,
  Twitter,
  TrendingUp,
  TrendingDown,
  Sparkles,
  MoreVertical,
  Plus,
  Target,
  Brain,
  ChevronRight,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface ContactActivity {
  id: string
  type: 'email' | 'meeting' | 'call' | 'note' | 'deal' | 'task'
  title: string
  description: string
  timestamp: Date
  metadata?: any
}

export default function ContactDetailPage() {
  const { organization } = useOrganization()
  const router = useRouter()
  const params = useParams()
  const contactId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'activity' | 'details' | 'insights'>('activity')
  const [isEditing, setIsEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
  // Fetch contact data
  const { data: contact, isLoading } = trpc.unified.getEntity.useQuery(
    { id: contactId },
    { enabled: !!organization && !!contactId }
  )
  
  // Fetch related entities (company, deals, etc.)
  const { data: relatedEntities } = trpc.unified.getRelatedEntities.useQuery(
    { entityId: contactId },
    { enabled: !!organization && !!contactId }
  )
  
  // Fetch contact insights
  const { data: insights } = trpc.unified.getContactInsights.useQuery(
    { contactId },
    { enabled: !!organization && !!contactId }
  )

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

  // Mock activity data - will be replaced with real data
  const activities: ContactActivity[] = [
    {
      id: '1',
      type: 'email',
      title: 'Sent: Follow-up on our discussion',
      description: 'Discussed Q4 pricing and implementation timeline',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: '2',
      type: 'meeting',
      title: 'Product demo call',
      description: '45 min demo of enterprise features',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      id: '3',
      type: 'deal',
      title: 'Deal created: Enterprise Plan',
      description: '$120K annual contract, closing Q4',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
    },
    {
      id: '4',
      type: 'note',
      title: 'Decision maker confirmed',
      description: 'VP of Engineering has final approval authority',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail size={16} />
      case 'meeting': return <Calendar size={16} />
      case 'call': return <Phone size={16} />
      case 'note': return <FileText size={16} />
      case 'deal': return <Target size={16} />
      case 'task': return <CheckCircle size={16} />
      default: return <Activity size={16} />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return colors.blue
      case 'meeting': return colors.purple
      case 'call': return colors.green
      case 'note': return colors.orange
      case 'deal': return colors.evergreen
      case 'task': return colors.gold
      default: return colors.mediumGray
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this contact?')) {
      // Delete logic here
      router.push('/dashboard/crm/contacts')
    }
  }

  const handleCreateDeal = () => {
    router.push(`/dashboard/crm/deals/new?contactId=${contactId}`)
  }

  const handleSendEmail = () => {
    router.push(`/mail/compose?to=${contact?.data.email}`)
  }

  const handleScheduleMeeting = () => {
    router.push(`/dashboard/calendar?action=new&contactId=${contactId}`)
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
          <p style={{ fontSize: '14px', color: colors.mediumGray, marginBottom: '24px' }}>
            This contact may have been deleted or you don't have permission to view it.
          </p>
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}40`,
        padding: '24px 32px'
      }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
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
            Contacts
          </button>
        </div>

        {/* Contact Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Avatar */}
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: colors.evergreen + '15',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '600',
              color: colors.evergreen
            }}>
              {contact.data.firstName?.[0]?.toUpperCase()}
              {contact.data.lastName?.[0]?.toUpperCase()}
            </div>

            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  margin: 0
                }}>
                  {contact.data.firstName} {contact.data.lastName}
                </h1>
                
                {/* Auto-created badge */}
                {contact.metadata?.autoCreated && (
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: colors.gold + '20',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Sparkles size={14} color={colors.gold} />
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '500',
                      color: colors.charcoal
                    }}>
                      Auto-created
                    </span>
                  </div>
                )}
                
                {/* Health Score */}
                {contact.data.healthScore && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: contact.data.healthScore >= 80 ? colors.green + '10' :
                                    contact.data.healthScore >= 50 ? colors.orange + '10' :
                                    colors.red + '10',
                    borderRadius: '6px'
                  }}>
                    {contact.data.healthScore >= 80 ? <TrendingUp size={14} color={colors.green} /> :
                     contact.data.healthScore >= 50 ? <Activity size={14} color={colors.orange} /> :
                     <TrendingDown size={14} color={colors.red} />}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: contact.data.healthScore >= 80 ? colors.green :
                             contact.data.healthScore >= 50 ? colors.orange :
                             colors.red
                    }}>
                      {contact.data.healthScore}%
                    </span>
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '14px',
                color: colors.mediumGray
              }}>
                {contact.data.jobTitle && (
                  <span>{contact.data.jobTitle}</span>
                )}
                
                {contact.data.companyName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={14} />
                    {contact.data.companyName}
                  </div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={14} />
                  {contact.data.email}
                </div>
                
                {contact.data.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={14} />
                    {contact.data.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '8px',
            position: 'relative'
          }}>
            <button
              onClick={handleSendEmail}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: colors.charcoal,
                cursor: 'pointer'
              }}
            >
              <Mail size={16} />
              Email
            </button>
            
            <button
              onClick={handleScheduleMeeting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: colors.charcoal,
                cursor: 'pointer'
              }}
            >
              <Calendar size={16} />
              Schedule
            </button>
            
            <button
              onClick={handleCreateDeal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              Create Deal
            </button>
            
            <button
              onClick={() => setShowActions(!showActions)}
              style={{
                padding: '8px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: colors.mediumGray
              }}
            >
              <MoreVertical size={16} />
            </button>
            
            {/* Dropdown Menu */}
            {showActions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                padding: '8px',
                minWidth: '160px',
                zIndex: 10
              }}>
                <button
                  onClick={handleEdit}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: colors.charcoal,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.lightGray + '30'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Edit2 size={14} />
                  Edit Contact
                </button>
                
                <button
                  onClick={handleDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: colors.red,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.red + '10'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <Trash2 size={14} />
                  Delete Contact
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '24px',
          marginTop: '24px',
          borderTop: `1px solid ${colors.lightGray}20`,
          paddingTop: '12px'
        }}>
          {(['activity', 'details', 'insights'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 0',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${colors.evergreen}` : '2px solid transparent',
                fontSize: '14px',
                fontWeight: activeTab === tab ? '600' : '500',
                color: activeTab === tab ? colors.evergreen : colors.mediumGray,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 200ms ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '32px',
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        {/* Main Content */}
        <div>
          {activeTab === 'activity' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                padding: '24px',
                border: `1px solid ${colors.lightGray}40`
              }}
            >
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.charcoal,
                marginBottom: '24px'
              }}>
                Activity Timeline
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {activities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      padding: '16px',
                      backgroundColor: colors.lightGray + '10',
                      borderRadius: '10px',
                      borderLeft: `3px solid ${getActivityColor(activity.type)}`,
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.softGreen + '40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.lightGray + '10'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      backgroundColor: getActivityColor(activity.type) + '15',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getActivityColor(activity.type),
                      flexShrink: 0
                    }}>
                      {getActivityIcon(activity.type)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: colors.charcoal,
                        marginBottom: '4px'
                      }}>
                        {activity.title}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: colors.mediumGray,
                        marginBottom: '6px'
                      }}>
                        {activity.description}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: colors.mediumGray + '80'
                      }}>
                        <Clock size={12} />
                        {formatTimestamp(activity.timestamp)}
                      </div>
                    </div>

                    <ChevronRight size={16} color={colors.mediumGray} />
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              <button
                style={{
                  marginTop: '24px',
                  padding: '10px',
                  width: '100%',
                  backgroundColor: colors.lightGray + '20',
                  border: `1px solid ${colors.lightGray}40`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  cursor: 'pointer'
                }}
              >
                Load More Activity
              </button>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                padding: '24px',
                border: `1px solid ${colors.lightGray}40`
              }}
            >
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.charcoal,
                marginBottom: '24px'
              }}>
                Contact Details
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                {/* Add detailed contact fields here */}
                <div>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: colors.mediumGray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Source
                  </label>
                  <div style={{
                    marginTop: '4px',
                    fontSize: '14px',
                    color: colors.charcoal
                  }}>
                    {contact.data.source || 'Manual'}
                  </div>
                </div>

                <div>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: colors.mediumGray,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Created
                  </label>
                  <div style={{
                    marginTop: '4px',
                    fontSize: '14px',
                    color: colors.charcoal
                  }}>
                    {new Date(contact.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                padding: '24px',
                border: `1px solid ${colors.lightGray}40`
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px'
              }}>
                <Brain size={20} color={colors.evergreen} />
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  margin: 0
                }}>
                  AI Insights
                </h2>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* Add AI-generated insights here */}
                <div style={{
                  padding: '16px',
                  backgroundColor: colors.blue + '08',
                  borderRadius: '10px',
                  borderLeft: `3px solid ${colors.blue}`
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '6px'
                  }}>
                    High engagement detected
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: colors.mediumGray
                  }}>
                    5 email exchanges and 2 meetings in the last 2 weeks. Consider moving to proposal stage.
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          {/* Related Deals */}
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
              Related Deals
            </h3>
            
            {/* Add related deals list here */}
            <div style={{
              padding: '12px',
              backgroundColor: colors.softGreen + '40',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                color: colors.charcoal,
                marginBottom: '4px'
              }}>
                Enterprise Plan
              </div>
              <div style={{
                fontSize: '13px',
                color: colors.mediumGray
              }}>
                $120K • Negotiation
              </div>
            </div>
            
            <button
              onClick={handleCreateDeal}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: colors.lightGray + '20',
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                color: colors.evergreen,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Plus size={14} />
              New Deal
            </button>
          </div>

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
                  textAlign: 'left'
                }}
              >
                <FileText size={14} />
                Add Note
              </button>
              
              <button
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
                  textAlign: 'left'
                }}
              >
                <CheckCircle size={14} />
                Create Task
              </button>
              
              <button
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
                  textAlign: 'left'
                }}
              >
                <Phone size={14} />
                Log Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}