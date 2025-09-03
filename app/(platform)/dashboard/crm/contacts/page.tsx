'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  User,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building2,
  Calendar,
  MessageSquare,
  Activity,
  ChevronRight,
  Download,
  Upload,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Edit,
  Trash,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface Contact {
  id: string
  type: string
  data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    jobTitle?: string
    companyId?: string
    sentimentScore?: number
    lastContactedAt?: string
    source?: 'manual' | 'email' | 'calendar' | 'import'
    tags?: string[]
    healthScore?: number
  }
  relationships?: Record<string, any>
  metadata?: {
    userId?: string
    autoCreated?: boolean
  }
  createdAt: string
  updatedAt: string
}

export default function ContactsPage() {
  const { organization } = useOrganization()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string | null>(null)
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | null>(null)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  // Fetch contacts with tRPC
  const { data: contacts, isLoading, refetch } = trpc.unified.getContacts.useQuery(
    { 
      limit: 100,
      search: searchQuery || undefined,
      companyId: selectedCompanyFilter || undefined
    },
    { enabled: !!organization }
  )

  // Fetch companies for filter
  const { data: companies } = trpc.unified.getCompanies.useQuery(
    { limit: 50 },
    { enabled: !!organization }
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

  // Filter contacts
  const filteredContacts = useMemo(() => {
    if (!contacts) return []
    
    let filtered = [...contacts]
    
    // Apply source filter
    if (selectedSourceFilter) {
      filtered = filtered.filter(c => c.data.source === selectedSourceFilter)
    }
    
    return filtered
  }, [contacts, selectedSourceFilter])

  // Group contacts by first letter
  const groupedContacts = useMemo(() => {
    const groups: Record<string, Contact[]> = {}
    
    filteredContacts.forEach(contact => {
      const firstLetter = contact.data.firstName?.[0]?.toUpperCase() || '#'
      if (!groups[firstLetter]) {
        groups[firstLetter] = []
      }
      groups[firstLetter].push(contact)
    })
    
    // Sort groups
    const sortedGroups = Object.keys(groups).sort()
    return sortedGroups.map(letter => ({
      letter,
      contacts: groups[letter].sort((a, b) => 
        `${a.data.firstName} ${a.data.lastName}`.localeCompare(`${b.data.firstName} ${b.data.lastName}`)
      )
    }))
  }, [filteredContacts])

  // Calculate stats
  const stats = useMemo(() => {
    if (!contacts) return null
    
    const autoCreated = contacts.filter(c => c.metadata?.autoCreated).length
    const withCompanies = contacts.filter(c => c.data.companyId).length
    const recentlyContacted = contacts.filter(c => {
      if (!c.data.lastContactedAt) return false
      const daysSince = (Date.now() - new Date(c.data.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    }).length
    
    const avgSentiment = contacts.reduce((sum, c) => sum + (c.data.sentimentScore || 0), 0) / contacts.length
    
    return {
      total: contacts.length,
      autoCreated,
      withCompanies,
      recentlyContacted,
      avgSentiment
    }
  }, [contacts])

  const getHealthIcon = (score?: number) => {
    if (!score) return <Minus size={16} color={colors.mediumGray} />
    if (score >= 80) return <TrendingUp size={16} color={colors.green} />
    if (score >= 50) return <Activity size={16} color={colors.orange} />
    return <TrendingDown size={16} color={colors.red} />
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'email': return <Mail size={14} color={colors.blue} />
      case 'calendar': return <Calendar size={14} color={colors.purple} />
      case 'import': return <Upload size={14} color={colors.orange} />
      default: return <User size={14} color={colors.mediumGray} />
    }
  }

  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case 'email': return colors.blue
      case 'calendar': return colors.purple
      case 'import': return colors.orange
      default: return colors.mediumGray
    }
  }

  const handleCreateContact = () => {
    router.push('/dashboard/crm/contacts/new')
  }

  const handleContactClick = (contactId: string) => {
    router.push(`/contacts/${contactId}`)
  }

  const handleImport = () => {
    router.push('/dashboard/crm/import')
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '4px'
            }}>
              Contacts
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.mediumGray
            }}>
              {stats?.total || 0} total contacts • {stats?.autoCreated || 0} auto-created
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleImport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: colors.white,
                color: colors.charcoal,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Upload size={18} />
              Import
            </button>
            
            <button
              onClick={handleCreateContact}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Plus size={18} />
              New Contact
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.mediumGray
            }} />
            <input
              type="text"
              placeholder="Search contacts by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                backgroundColor: colors.lightGray + '20',
                border: `1px solid ${colors.lightGray}40`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: showFilters ? colors.softGreen : colors.white,
              color: showFilters ? colors.evergreen : colors.charcoal,
              border: `1px solid ${showFilters ? colors.evergreen : colors.lightGray}40`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            <Filter size={18} />
            Filters
            {(selectedCompanyFilter || selectedSourceFilter) && (
              <span style={{
                padding: '2px 6px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {[selectedCompanyFilter, selectedSourceFilter].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: colors.lightGray + '10',
                borderRadius: '8px',
                border: `1px solid ${colors.lightGray}40`,
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Company Filter */}
                <div style={{ minWidth: '200px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Company
                  </label>
                  <select
                    value={selectedCompanyFilter || ''}
                    onChange={(e) => setSelectedCompanyFilter(e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: colors.white,
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Companies</option>
                    {companies?.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.data.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Source Filter */}
                <div style={{ minWidth: '200px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Source
                  </label>
                  <select
                    value={selectedSourceFilter || ''}
                    onChange={(e) => setSelectedSourceFilter(e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: colors.white,
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="">All Sources</option>
                    <option value="manual">Manual Entry</option>
                    <option value="email">Auto-created from Email</option>
                    <option value="calendar">Auto-created from Calendar</option>
                    <option value="import">Imported</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedCompanyFilter || selectedSourceFilter) && (
                  <button
                    onClick={() => {
                      setSelectedCompanyFilter(null)
                      setSelectedSourceFilter(null)
                    }}
                    style={{
                      alignSelf: 'flex-end',
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      color: colors.mediumGray,
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{
          padding: '16px 32px',
          backgroundColor: colors.white,
          borderBottom: `1px solid ${colors.lightGray}20`,
          display: 'flex',
          gap: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color={colors.evergreen} />
            <span style={{ fontSize: '13px', color: colors.mediumGray }}>
              <strong style={{ color: colors.charcoal }}>{stats.autoCreated}</strong> auto-created
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color={colors.blue} />
            <span style={{ fontSize: '13px', color: colors.mediumGray }}>
              <strong style={{ color: colors.charcoal }}>{stats.withCompanies}</strong> with companies
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color={colors.purple} />
            <span style={{ fontSize: '13px', color: colors.mediumGray }}>
              <strong style={{ color: colors.charcoal }}>{stats.recentlyContacted}</strong> contacted this week
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color={colors.orange} />
            <span style={{ fontSize: '13px', color: colors.mediumGray }}>
              <strong style={{ color: colors.charcoal }}>{stats.avgSentiment.toFixed(0)}%</strong> avg sentiment
            </span>
          </div>
        </div>
      )}

      {/* Contacts List */}
      <div style={{ padding: '24px 32px' }}>
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: colors.mediumGray
          }}>
            Loading contacts...
          </div>
        ) : groupedContacts.length === 0 ? (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <User size={48} color={colors.lightGray} style={{ margin: '0 auto 16px' }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '8px'
            }}>
              No contacts found
            </h3>
            <p style={{
              fontSize: '14px',
              color: colors.mediumGray,
              marginBottom: '24px'
            }}>
              {searchQuery || selectedCompanyFilter || selectedSourceFilter 
                ? 'Try adjusting your filters'
                : 'Get started by creating your first contact or importing from another system'}
            </p>
            {!searchQuery && !selectedCompanyFilter && !selectedSourceFilter && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleCreateContact}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
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
                  <Plus size={18} />
                  Create Contact
                </button>
                <button
                  onClick={handleImport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    backgroundColor: colors.white,
                    color: colors.charcoal,
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={18} />
                  Import Contacts
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            border: `1px solid ${colors.lightGray}40`,
            overflow: 'hidden'
          }}>
            {groupedContacts.map((group, groupIndex) => (
              <div key={group.letter}>
                {/* Letter Header */}
                <div style={{
                  padding: '12px 24px',
                  backgroundColor: colors.lightGray + '15',
                  borderBottom: `1px solid ${colors.lightGray}40`,
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.mediumGray,
                  letterSpacing: '0.5px'
                }}>
                  {group.letter}
                </div>
                
                {/* Contacts in Group */}
                {group.contacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: groupIndex * 0.05 + index * 0.01 }}
                    style={{
                      padding: '16px 24px',
                      borderBottom: index === group.contacts.length - 1 && groupIndex === groupedContacts.length - 1 
                        ? 'none' 
                        : `1px solid ${colors.lightGray}20`,
                      cursor: 'pointer',
                      transition: 'background-color 200ms ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.softGreen + '30'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    onClick={() => handleContactClick(contact.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                      {/* Avatar */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: colors.evergreen + '15',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colors.evergreen
                      }}>
                        {contact.data.firstName?.[0]?.toUpperCase()}
                        {contact.data.lastName?.[0]?.toUpperCase()}
                      </div>
                      
                      {/* Contact Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            fontSize: '15px',
                            fontWeight: '500',
                            color: colors.charcoal
                          }}>
                            {contact.data.firstName} {contact.data.lastName}
                          </span>
                          
                          {/* Source Badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            backgroundColor: getSourceBadgeColor(contact.data.source) + '15',
                            borderRadius: '4px'
                          }}>
                            {getSourceIcon(contact.data.source)}
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '500',
                              color: getSourceBadgeColor(contact.data.source),
                              textTransform: 'capitalize'
                            }}>
                              {contact.data.source === 'email' ? 'Email' :
                               contact.data.source === 'calendar' ? 'Calendar' :
                               contact.data.source === 'import' ? 'Imported' : 'Manual'}
                            </span>
                          </div>
                          
                          {/* Auto-created Badge */}
                          {contact.metadata?.autoCreated && (
                            <div style={{
                              padding: '2px 6px',
                              backgroundColor: colors.gold + '20',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Sparkles size={11} color={colors.gold} />
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '500',
                                color: colors.charcoal
                              }}>
                                Auto
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          fontSize: '13px',
                          color: colors.mediumGray
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={13} />
                            {contact.data.email}
                          </div>
                          
                          {contact.data.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={13} />
                              {contact.data.phone}
                            </div>
                          )}
                          
                          {contact.data.jobTitle && (
                            <span>{contact.data.jobTitle}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Side Info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '24px'
                    }}>
                      {/* Health Score */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {getHealthIcon(contact.data.healthScore)}
                        <span style={{
                          fontSize: '13px',
                          fontWeight: '500',
                          color: contact.data.healthScore 
                            ? contact.data.healthScore >= 80 ? colors.green
                            : contact.data.healthScore >= 50 ? colors.orange
                            : colors.red
                            : colors.mediumGray
                        }}>
                          {contact.data.healthScore ? `${contact.data.healthScore}%` : '--'}
                        </span>
                      </div>
                      
                      {/* Last Contact */}
                      {contact.data.lastContactedAt && (
                        <div style={{
                          fontSize: '12px',
                          color: colors.mediumGray
                        }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {new Date(contact.data.lastContactedAt).toLocaleDateString()}
                        </div>
                      )}
                      
                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedContact(contact.id)
                        }}
                        style={{
                          padding: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: colors.mediumGray
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      <ChevronRight size={16} color={colors.mediumGray} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}