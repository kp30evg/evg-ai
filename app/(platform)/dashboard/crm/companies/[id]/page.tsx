'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useOrganization } from '@clerk/nextjs'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Activity,
  Edit2,
  Trash2,
  Star,
  Clock,
  CheckCircle,
  Send,
  FileText,
  Link2,
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
  AlertCircle,
  User,
  MessageSquare,
  BarChart3,
  PieChart,
  Briefcase,
  Award,
  Zap
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface CompanyActivity {
  id: string
  type: 'contact' | 'deal' | 'meeting' | 'email' | 'note' | 'task'
  title: string
  description: string
  timestamp: Date
  contactId?: string
  dealId?: string
  metadata?: any
}

interface CompanyContact {
  id: string
  name: string
  email: string
  jobTitle?: string
  lastContactedAt?: Date
  healthScore?: number
}

interface CompanyDeal {
  id: string
  name: string
  value: number
  stage: string
  closeDate?: Date
  probability?: number
}

export default function CompanyDetailPage() {
  const { organization } = useOrganization()
  const router = useRouter()
  const params = useParams()
  const companyId = params.id as string
  
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'activity' | 'insights'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
  // Fetch company data
  const { data: company, isLoading } = trpc.unified.getEntity.useQuery(
    { id: companyId },
    { enabled: !!organization && !!companyId }
  )
  
  // Fetch related entities (contacts, deals, etc.)
  const { data: relatedEntities } = trpc.unified.getRelatedEntities.useQuery(
    { entityId: companyId },
    { enabled: !!organization && !!companyId }
  )
  
  // Fetch company insights
  const { data: insights } = trpc.unified.getCompanyInsights.useQuery(
    { companyId },
    { enabled: !!organization && !!companyId }
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

  // Mock data - will be replaced with real data
  const activities: CompanyActivity[] = [
    {
      id: '1',
      type: 'deal',
      title: 'New deal created: Enterprise Plan',
      description: '$120K annual contract with Sarah Chen',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: '2',
      type: 'contact',
      title: 'New contact added: John Smith',
      description: 'VP of Engineering, auto-created from email',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6)
    },
    {
      id: '3',
      type: 'meeting',
      title: 'Product demo completed',
      description: '45 min enterprise features walkthrough',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      id: '4',
      type: 'email',
      title: 'Email campaign: Q4 Pricing Update',
      description: 'Sent to 5 contacts at this company',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
    }
  ]

  const contacts: CompanyContact[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah.chen@acme.com',
      jobTitle: 'CEO',
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      healthScore: 85
    },
    {
      id: '2',
      name: 'John Smith',
      email: 'john.smith@acme.com',
      jobTitle: 'VP of Engineering',
      lastContactedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      healthScore: 72
    },
    {
      id: '3',
      name: 'Lisa Johnson',
      email: 'lisa.johnson@acme.com',
      jobTitle: 'CTO',
      healthScore: 65
    }
  ]

  const deals: CompanyDeal[] = [
    {
      id: '1',
      name: 'Enterprise Plan',
      value: 120000,
      stage: 'Negotiation',
      closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      probability: 75
    },
    {
      id: '2',
      name: 'Professional Services',
      value: 25000,
      stage: 'Proposal',
      closeDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      probability: 60
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail size={16} />
      case 'meeting': return <Calendar size={16} />
      case 'contact': return <User size={16} />
      case 'deal': return <Target size={16} />
      case 'note': return <FileText size={16} />
      case 'task': return <CheckCircle size={16} />
      default: return <Activity size={16} />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email': return colors.blue
      case 'meeting': return colors.purple
      case 'contact': return colors.green
      case 'deal': return colors.evergreen
      case 'note': return colors.orange
      case 'task': return colors.gold
      default: return colors.mediumGray
    }
  }

  const getDealStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'prospecting': return colors.blue
      case 'qualification': return colors.purple
      case 'proposal': return colors.orange
      case 'negotiation': return colors.evergreen
      case 'closing': return colors.gold
      case 'closed_won': return colors.green
      case 'closed_lost': return colors.red
      default: return colors.mediumGray
    }
  }

  const getHealthIcon = (score?: number) => {
    if (!score) return <Activity size={16} color={colors.mediumGray} />
    if (score >= 80) return <TrendingUp size={16} color={colors.green} />
    if (score >= 50) return <Activity size={16} color={colors.orange} />
    return <TrendingDown size={16} color={colors.red} />
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

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return '$0'
    if (revenue >= 1000000000) return `$${(revenue / 1000000000).toFixed(1)}B`
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(1)}K`
    return `$${revenue}`
  }

  const getCompanySizeLabel = (employeeCount?: number) => {
    if (!employeeCount) return 'Unknown'
    if (employeeCount <= 10) return 'Startup'
    if (employeeCount <= 50) return 'Small'
    if (employeeCount <= 250) return 'Medium'
    if (employeeCount <= 1000) return 'Large'
    return 'Enterprise'
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this company?')) {
      router.push('/dashboard/crm/companies')
    }
  }

  const handleCreateContact = () => {
    router.push(`/dashboard/crm/contacts/new?companyId=${companyId}`)
  }

  const handleCreateDeal = () => {
    router.push(`/dashboard/crm/deals/new?companyId=${companyId}`)
  }

  const handleVisitWebsite = () => {
    const url = company?.data.website || `https://${company?.data.domain}`
    window.open(url, '_blank')
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
        <div style={{ color: colors.mediumGray }}>Loading company...</div>
      </div>
    )
  }

  if (!company) {
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
            Company not found
          </h2>
          <p style={{ fontSize: '14px', color: colors.mediumGray, marginBottom: '24px' }}>
            This company may have been deleted or you don't have permission to view it.
          </p>
          <button
            onClick={() => router.push('/dashboard/crm/companies')}
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
            Back to Companies
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
            onClick={() => router.push('/dashboard/crm/companies')}
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
            Companies
          </button>
        </div>

        {/* Company Header */}
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
            {/* Company Logo */}
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: colors.evergreen + '15',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: '600',
              color: colors.evergreen
            }}>
              {company.data.name?.[0]?.toUpperCase() || 'C'}
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
                  {company.data.name}
                </h1>
                
                {/* Website Link */}
                {(company.data.website || company.data.domain) && (
                  <button
                    onClick={handleVisitWebsite}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      backgroundColor: colors.blue + '15',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      color: colors.blue,
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    <Globe size={14} />
                    Visit Website
                    <ExternalLink size={10} />
                  </button>
                )}
                
                {/* Auto-created badge */}
                {company.metadata?.autoCreated && (
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
                {company.data.healthScore && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: company.data.healthScore >= 80 ? colors.green + '10' :
                                    company.data.healthScore >= 50 ? colors.orange + '10' :
                                    colors.red + '10',
                    borderRadius: '6px'
                  }}>
                    {getHealthIcon(company.data.healthScore)}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: company.data.healthScore >= 80 ? colors.green :
                             company.data.healthScore >= 50 ? colors.orange :
                             colors.red
                    }}>
                      {company.data.healthScore}%
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
                {company.data.industry && (
                  <span style={{ textTransform: 'capitalize' }}>{company.data.industry}</span>
                )}
                
                {company.data.employeeCount && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={14} />
                    {company.data.employeeCount} employees • {getCompanySizeLabel(company.data.employeeCount)}
                  </div>
                )}
                
                {company.data.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    {company.data.location}
                  </div>
                )}
                
                {company.data.annualRevenue && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={14} />
                    {formatRevenue(company.data.annualRevenue)} revenue
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
              onClick={handleCreateContact}
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
              <User size={16} />
              Add Contact
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
                  Edit Company
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
                  Delete Company
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
          {(['overview', 'contacts', 'deals', 'activity', 'insights'] as const).map(tab => (
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
      <div style={{ padding: '32px' }}>
        {activeTab === 'overview' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '24px'
          }}>
            {/* Main Overview */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Key Metrics */}
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
                  marginBottom: '20px'
                }}>
                  Key Metrics
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '20px'
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.blue + '08',
                    borderRadius: '10px',
                    borderLeft: `3px solid ${colors.blue}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <Users size={18} color={colors.blue} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: colors.charcoal }}>
                        Contacts
                      </span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: colors.blue }}>
                      {contacts.length}
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.evergreen + '08',
                    borderRadius: '10px',
                    borderLeft: `3px solid ${colors.evergreen}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <Target size={18} color={colors.evergreen} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: colors.charcoal }}>
                        Active Deals
                      </span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: colors.evergreen }}>
                      {deals.length}
                    </div>
                  </div>

                  <div style={{
                    padding: '16px',
                    backgroundColor: colors.green + '08',
                    borderRadius: '10px',
                    borderLeft: `3px solid ${colors.green}`
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '8px'
                    }}>
                      <DollarSign size={18} color={colors.green} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: colors.charcoal }}>
                        Pipeline Value
                      </span>
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: colors.green }}>
                      ${(deals.reduce((sum, deal) => sum + deal.value, 0) / 1000).toFixed(0)}K
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
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
                  marginBottom: '20px'
                }}>
                  Recent Activity
                </h2>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {activities.slice(0, 5).map((activity, index) => (
                    <div
                      key={activity.id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: colors.lightGray + '10',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${getActivityColor(activity.type)}`
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: getActivityColor(activity.type) + '15',
                        borderRadius: '6px',
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
                          marginBottom: '2px'
                        }}>
                          {activity.title}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: colors.mediumGray,
                          marginBottom: '4px'
                        }}>
                          {activity.description}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: colors.mediumGray + '80'
                        }}>
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {/* Key Contacts */}
              <div style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.lightGray}40`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.charcoal
                  }}>
                    Key Contacts
                  </h3>
                  <button
                    onClick={handleCreateContact}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: colors.evergreen,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {contacts.slice(0, 3).map(contact => (
                    <div
                      key={contact.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: colors.lightGray + '10',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: colors.evergreen + '15',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.evergreen
                      }}>
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: colors.charcoal
                        }}>
                          {contact.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: colors.mediumGray
                        }}>
                          {contact.jobTitle}
                        </div>
                      </div>
                      {contact.healthScore && (
                        <div style={{
                          padding: '2px 6px',
                          backgroundColor: contact.healthScore >= 80 ? colors.green + '15' :
                                          contact.healthScore >= 50 ? colors.orange + '15' :
                                          colors.red + '15',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: contact.healthScore >= 80 ? colors.green :
                                 contact.healthScore >= 50 ? colors.orange :
                                 colors.red
                        }}>
                          {contact.healthScore}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Deals */}
              <div style={{
                backgroundColor: colors.white,
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.lightGray}40`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: colors.charcoal
                  }}>
                    Active Deals
                  </h3>
                  <button
                    onClick={handleCreateDeal}
                    style={{
                      padding: '4px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: colors.evergreen,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      style={{
                        padding: '12px',
                        backgroundColor: colors.softGreen + '40',
                        borderRadius: '8px',
                        borderLeft: `3px solid ${getDealStageColor(deal.stage)}`
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: colors.charcoal
                        }}>
                          {deal.name}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: colors.evergreen
                        }}>
                          ${(deal.value / 1000).toFixed(0)}K
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{
                          padding: '2px 6px',
                          backgroundColor: getDealStageColor(deal.stage) + '15',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: getDealStageColor(deal.stage)
                        }}>
                          {deal.stage}
                        </div>
                        {deal.probability && (
                          <div style={{
                            fontSize: '12px',
                            color: colors.mediumGray
                          }}>
                            {deal.probability}% probability
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tab contents would go here */}
        {activeTab !== 'overview' && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '8px',
              textTransform: 'capitalize'
            }}>
              {activeTab} Tab
            </h3>
            <p style={{
              fontSize: '14px',
              color: colors.mediumGray
            }}>
              This tab is coming soon!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}