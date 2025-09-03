'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { 
  Building2,
  Search,
  Filter,
  Plus,
  Globe,
  Users,
  MapPin,
  Calendar,
  MessageSquare,
  Activity,
  ChevronRight,
  Download,
  Upload,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  MoreVertical,
  Edit,
  Trash,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  Linkedin
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface Company {
  id: string
  type: string
  data: {
    name: string
    domain?: string
    industry?: string
    employeeCount?: number
    annualRevenue?: number
    location?: string
    description?: string
    website?: string
    linkedinUrl?: string
    healthScore?: number
    tags?: string[]
    source?: 'manual' | 'email' | 'import' | 'enrichment'
  }
  relationships?: Record<string, any>
  metadata?: {
    userId?: string
    autoCreated?: boolean
    contactCount?: number
    dealCount?: number
    totalDealValue?: number
  }
  createdAt: string
  updatedAt: string
}

export default function CompaniesPage() {
  const { organization } = useOrganization()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndustryFilter, setSelectedIndustryFilter] = useState<string | null>(null)
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string | null>(null)
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // Fetch companies with tRPC
  const { data: companies, isLoading, refetch } = trpc.unified.getCompanies.useQuery(
    { 
      limit: 100,
      search: searchQuery || undefined
    },
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

  // Filter companies
  const filteredCompanies = useMemo(() => {
    if (!companies) return []
    
    let filtered = [...companies]
    
    // Apply industry filter
    if (selectedIndustryFilter) {
      filtered = filtered.filter(c => c.data.industry === selectedIndustryFilter)
    }
    
    // Apply size filter
    if (selectedSizeFilter) {
      filtered = filtered.filter(c => {
        const size = c.data.employeeCount
        if (!size) return selectedSizeFilter === 'unknown'
        
        switch (selectedSizeFilter) {
          case 'startup': return size <= 10
          case 'small': return size > 10 && size <= 50
          case 'medium': return size > 50 && size <= 250
          case 'large': return size > 250 && size <= 1000
          case 'enterprise': return size > 1000
          default: return true
        }
      })
    }
    
    // Apply source filter
    if (selectedSourceFilter) {
      filtered = filtered.filter(c => c.data.source === selectedSourceFilter)
    }
    
    return filtered
  }, [companies, selectedIndustryFilter, selectedSizeFilter, selectedSourceFilter])

  // Calculate stats
  const stats = useMemo(() => {
    if (!companies) return null
    
    const autoCreated = companies.filter(c => c.metadata?.autoCreated).length
    const withWebsites = companies.filter(c => c.data.website || c.data.domain).length
    const totalContacts = companies.reduce((sum, c) => sum + (c.metadata?.contactCount || 0), 0)
    const totalDeals = companies.reduce((sum, c) => sum + (c.metadata?.dealCount || 0), 0)
    const totalValue = companies.reduce((sum, c) => sum + (c.metadata?.totalDealValue || 0), 0)
    
    return {
      total: companies.length,
      autoCreated,
      withWebsites,
      totalContacts,
      totalDeals,
      totalValue
    }
  }, [companies])

  const getCompanySizeLabel = (employeeCount?: number) => {
    if (!employeeCount) return 'Unknown'
    if (employeeCount <= 10) return 'Startup'
    if (employeeCount <= 50) return 'Small'
    if (employeeCount <= 250) return 'Medium'
    if (employeeCount <= 1000) return 'Large'
    return 'Enterprise'
  }

  const getCompanySizeColor = (employeeCount?: number) => {
    if (!employeeCount) return colors.mediumGray
    if (employeeCount <= 10) return colors.purple
    if (employeeCount <= 50) return colors.blue
    if (employeeCount <= 250) return colors.green
    if (employeeCount <= 1000) return colors.orange
    return colors.evergreen
  }

  const getHealthIcon = (score?: number) => {
    if (!score) return <Activity size={16} color={colors.mediumGray} />
    if (score >= 80) return <TrendingUp size={16} color={colors.green} />
    if (score >= 50) return <Activity size={16} color={colors.orange} />
    return <TrendingDown size={16} color={colors.red} />
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'email': return <Mail size={14} color={colors.blue} />
      case 'import': return <Upload size={14} color={colors.orange} />
      case 'enrichment': return <Sparkles size={14} color={colors.gold} />
      default: return <Building2 size={14} color={colors.mediumGray} />
    }
  }

  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case 'email': return colors.blue
      case 'import': return colors.orange
      case 'enrichment': return colors.gold
      default: return colors.mediumGray
    }
  }

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return '--'
    if (revenue >= 1000000000) return `$${(revenue / 1000000000).toFixed(1)}B`
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(1)}K`
    return `$${revenue}`
  }

  const handleCreateCompany = () => {
    router.push('/dashboard/crm/companies/new')
  }

  const handleCompanyClick = (companyId: string) => {
    router.push(`/dashboard/crm/companies/${companyId}`)
  }

  const handleImport = () => {
    router.push('/dashboard/crm/import?type=companies')
  }

  const handleEnrichData = () => {
    // Trigger data enrichment for companies
    console.log('Starting company data enrichment...')
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
              Companies
            </h1>
            <p style={{
              fontSize: '14px',
              color: colors.mediumGray
            }}>
              {stats?.total || 0} companies • {stats?.totalContacts || 0} contacts • {stats?.autoCreated || 0} auto-created
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleEnrichData}
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
              <Sparkles size={18} />
              Enrich Data
            </button>
            
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
              onClick={handleCreateCompany}
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
              New Company
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
              placeholder="Search companies by name, domain, or industry..."
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
            {(selectedIndustryFilter || selectedSizeFilter || selectedSourceFilter) && (
              <span style={{
                padding: '2px 6px',
                backgroundColor: colors.evergreen,
                color: colors.white,
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {[selectedIndustryFilter, selectedSizeFilter, selectedSourceFilter].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: colors.lightGray + '30',
            borderRadius: '8px',
            padding: '2px'
          }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                backgroundColor: viewMode === 'list' ? colors.white : 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: viewMode === 'list' ? colors.charcoal : colors.mediumGray,
                cursor: 'pointer'
              }}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                backgroundColor: viewMode === 'grid' ? colors.white : 'transparent',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                color: viewMode === 'grid' ? colors.charcoal : colors.mediumGray,
                cursor: 'pointer'
              }}
            >
              Grid
            </button>
          </div>
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
                {/* Industry Filter */}
                <div style={{ minWidth: '200px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Industry
                  </label>
                  <select
                    value={selectedIndustryFilter || ''}
                    onChange={(e) => setSelectedIndustryFilter(e.target.value || null)}
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
                    <option value="">All Industries</option>
                    <option value="technology">Technology</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="consulting">Consulting</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Size Filter */}
                <div style={{ minWidth: '200px' }}>
                  <label style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '6px',
                    display: 'block'
                  }}>
                    Company Size
                  </label>
                  <select
                    value={selectedSizeFilter || ''}
                    onChange={(e) => setSelectedSizeFilter(e.target.value || null)}
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
                    <option value="">All Sizes</option>
                    <option value="startup">Startup (1-10)</option>
                    <option value="small">Small (11-50)</option>
                    <option value="medium">Medium (51-250)</option>
                    <option value="large">Large (251-1000)</option>
                    <option value="enterprise">Enterprise (1000+)</option>
                    <option value="unknown">Unknown</option>
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
                    <option value="import">Imported</option>
                    <option value="enrichment">Data Enrichment</option>
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedIndustryFilter || selectedSizeFilter || selectedSourceFilter) && (
                  <button
                    onClick={() => {
                      setSelectedIndustryFilter(null)
                      setSelectedSizeFilter(null)
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
            <Globe size={16} color={colors.blue} />
            <span style={{ fontSize: '13px', color: colors.mediumGray }}>
              <strong style={{ color: colors.charcoal }}>{stats.withWebsites}</strong> with websites
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color={colors.purple} />
            <span style={{ fontSize: '13px', color: colors.mediumGray }}>
              <strong style={{ color: colors.charcoal }}>{stats.totalContacts}</strong> total contacts
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={16} color={colors.green} />
            <span style={{ fontSize: '13px', color: colors.mediumGray }}>
              <strong style={{ color: colors.charcoal }}>${(stats.totalValue / 1000000).toFixed(1)}M</strong> in deals
            </span>
          </div>
        </div>
      )}

      {/* Companies List/Grid */}
      <div style={{ padding: '24px 32px' }}>
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: colors.mediumGray
          }}>
            Loading companies...
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            padding: '48px',
            textAlign: 'center',
            border: `1px solid ${colors.lightGray}40`
          }}>
            <Building2 size={48} color={colors.lightGray} style={{ margin: '0 auto 16px' }} />
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '8px'
            }}>
              No companies found
            </h3>
            <p style={{
              fontSize: '14px',
              color: colors.mediumGray,
              marginBottom: '24px'
            }}>
              {searchQuery || selectedIndustryFilter || selectedSizeFilter || selectedSourceFilter 
                ? 'Try adjusting your filters'
                : 'Get started by creating your first company or importing from another system'}
            </p>
            {!searchQuery && !selectedIndustryFilter && !selectedSizeFilter && !selectedSourceFilter && (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={handleCreateCompany}
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
                  Create Company
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
                  Import Companies
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
            {filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                style={{
                  padding: '20px 24px',
                  borderBottom: index === filteredCompanies.length - 1 ? 'none' : `1px solid ${colors.lightGray}20`,
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
                onClick={() => handleCompanyClick(company.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {/* Company Logo/Icon */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: colors.evergreen + '15',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: colors.evergreen
                  }}>
                    {company.data.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  
                  {/* Company Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px'
                    }}>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: colors.charcoal
                      }}>
                        {company.data.name}
                      </span>
                      
                      {/* Website Link */}
                      {(company.data.website || company.data.domain) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(company.data.website || `https://${company.data.domain}`, '_blank')
                          }}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: colors.blue + '15',
                            borderRadius: '4px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Globe size={12} color={colors.blue} />
                          <ExternalLink size={10} color={colors.blue} />
                        </button>
                      )}
                      
                      {/* Source Badge */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        backgroundColor: getSourceBadgeColor(company.data.source) + '15',
                        borderRadius: '4px'
                      }}>
                        {getSourceIcon(company.data.source)}
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          color: getSourceBadgeColor(company.data.source),
                          textTransform: 'capitalize'
                        }}>
                          {company.data.source === 'email' ? 'Email' :
                           company.data.source === 'import' ? 'Import' :
                           company.data.source === 'enrichment' ? 'Enriched' : 'Manual'}
                        </span>
                      </div>
                      
                      {/* Auto-created Badge */}
                      {company.metadata?.autoCreated && (
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
                      {company.data.industry && (
                        <span style={{ textTransform: 'capitalize' }}>{company.data.industry}</span>
                      )}
                      
                      {company.data.employeeCount && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          backgroundColor: getCompanySizeColor(company.data.employeeCount) + '15',
                          borderRadius: '4px'
                        }}>
                          <Users size={12} color={getCompanySizeColor(company.data.employeeCount)} />
                          <span style={{ color: getCompanySizeColor(company.data.employeeCount), fontWeight: '500' }}>
                            {getCompanySizeLabel(company.data.employeeCount)}
                          </span>
                        </div>
                      )}
                      
                      {company.data.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} />
                          {company.data.location}
                        </div>
                      )}
                      
                      {company.data.annualRevenue && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={12} />
                          {formatRevenue(company.data.annualRevenue)} revenue
                        </div>
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
                  {/* Contacts & Deals */}
                  <div style={{
                    textAlign: 'center',
                    minWidth: '60px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colors.charcoal
                    }}>
                      {company.metadata?.contactCount || 0}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: colors.mediumGray
                    }}>
                      contacts
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    minWidth: '60px'
                  }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colors.evergreen
                    }}>
                      {formatRevenue(company.metadata?.totalDealValue)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: colors.mediumGray
                    }}>
                      deals
                    </div>
                  </div>
                  
                  {/* Health Score */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {getHealthIcon(company.data.healthScore)}
                    <span style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: company.data.healthScore 
                        ? company.data.healthScore >= 80 ? colors.green
                        : company.data.healthScore >= 50 ? colors.orange
                        : colors.red
                        : colors.mediumGray
                    }}>
                      {company.data.healthScore ? `${company.data.healthScore}%` : '--'}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCompany(company.id)
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
        )}
      </div>
    </div>
  )
}