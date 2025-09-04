'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import CreateContactSheet from '@/components/evercore/CreateContactSheet'
import CreateDealSheet from '@/components/evercore/CreateDealSheet'
import EnhancedTableHeader from '@/components/evercore/table/EnhancedTableHeader'
import AddColumnDropdown from '@/components/evercore/table/AddColumnDropdown'
import FieldConfigModal from '@/components/evercore/table/FieldConfigModal'
import { TableColumn, ColumnTypeDefinition } from '@/components/evercore/types/column-types'
import { 
  Users, 
  Building2, 
  Target, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Search,
  Filter,
  MoreHorizontal,
  Phone,
  Edit,
  Trash2,
  Eye,
  Star,
  MapPin,
  ExternalLink,
  Plus,
  Mail,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  company: string
  title: string
  phone?: string
  lastContact: Date
  dealValue: number
  status: 'Hot' | 'Warm' | 'Cold'
  source: string
}

interface Deal {
  id: string
  name: string
  company: string
  value: number
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
  probability: number
  closeDate: Date
  owner: string
  lastActivity: Date
}

interface Company {
  id: string
  name: string
  domain: string
  industry: string
  size: string
  location: string
  deals: number
  value: number
  lastActivity: Date
}

export default function CRMDashboard() {
  const { organization } = useOrganization()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'companies'>('contacts')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [showCreateDeal, setShowCreateDeal] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  
  // Enhanced Table State
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedFieldType, setSelectedFieldType] = useState<ColumnTypeDefinition | undefined>()
  const [editingColumn, setEditingColumn] = useState<TableColumn | undefined>()
  const [currentSort, setCurrentSort] = useState<{ columnId: string; direction: 'asc' | 'desc' } | undefined>()
  const [addColumnPosition, setAddColumnPosition] = useState({ x: 0, y: 0 })

  // Deals Table State
  const [dealsColumns, setDealsColumns] = useState<TableColumn[]>([
    {
      id: 'dealName',
      name: 'Deal Name',
      type: 'text',
      config: { required: true, maxLength: 100 },
      width: 200,
      visible: true,
      sortable: true,
      filterable: true,
      required: true,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'company',
      name: 'Company',
      type: 'text',
      config: { maxLength: 100 },
      width: 150,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'stage',
      name: 'Stage',
      type: 'singleSelect',
      config: {
        options: [
          { id: 'lead', label: 'Lead', color: '#6B7280' },
          { id: 'qualified', label: 'Qualified', color: '#0EA5E9' },
          { id: 'proposal', label: 'Proposal', color: '#F97316' },
          { id: 'negotiation', label: 'Negotiation', color: '#EAB308' },
          { id: 'closed-won', label: 'Closed Won', color: '#16A34A' },
          { id: 'closed-lost', label: 'Closed Lost', color: '#DC2626' }
        ],
        colorCoded: true
      },
      width: 120,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'value',
      name: 'Value',
      type: 'currency',
      config: { currency: 'USD', precision: 0 },
      width: 120,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'probability',
      name: 'Probability',
      type: 'percentage',
      config: { precision: 0, min: 0, max: 100 },
      width: 100,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'closeDate',
      name: 'Close Date',
      type: 'date',
      config: { format: 'MMM DD, YYYY', includeTime: false },
      width: 130,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])

  // Companies Table State
  const [companiesColumns, setCompaniesColumns] = useState<TableColumn[]>([
    {
      id: 'company',
      name: 'Company',
      type: 'text',
      config: { required: true, maxLength: 100 },
      width: 200,
      visible: true,
      sortable: true,
      filterable: true,
      required: true,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'industry',
      name: 'Industry',
      type: 'text',
      config: { maxLength: 50 },
      width: 150,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'size',
      name: 'Size',
      type: 'singleSelect',
      config: {
        options: [
          { id: 'startup', label: 'Startup (1-10)', color: '#0EA5E9' },
          { id: 'small', label: 'Small (11-50)', color: '#16A34A' },
          { id: 'medium', label: 'Medium (51-200)', color: '#F97316' },
          { id: 'large', label: 'Large (201-1000)', color: '#EAB308' },
          { id: 'enterprise', label: 'Enterprise (1000+)', color: '#8B5CF6' }
        ],
        colorCoded: true
      },
      width: 140,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'location',
      name: 'Location',
      type: 'address',
      config: { format: 'US', showMap: false },
      width: 150,
      visible: true,
      sortable: false,
      filterable: true,
      required: false,
      position: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'deals',
      name: 'Deals',
      type: 'number',
      config: { precision: 0, min: 0, allowNegative: false },
      width: 80,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'totalValue',
      name: 'Total Value',
      type: 'currency',
      config: { currency: 'USD', precision: 0 },
      width: 130,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  
  // Default contact table columns
  const [contactColumns, setContactColumns] = useState<TableColumn[]>([
    {
      id: 'contact',
      name: 'Contact',
      type: 'text',
      config: { required: true },
      width: 200,
      visible: true,
      sortable: true,
      filterable: true,
      required: true,
      position: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'company',
      name: 'Company',
      type: 'text',
      config: {},
      width: 150,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'status',
      name: 'Status',
      type: 'singleSelect',
      config: {
        options: [
          { id: 'hot', label: 'Hot', color: '#DC2626' },
          { id: 'warm', label: 'Warm', color: '#F97316' },
          { id: 'cold', label: 'Cold', color: '#0EA5E9' }
        ]
      },
      width: 120,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'dealValue',
      name: 'Deal Value',
      type: 'currency',
      config: { currency: 'USD', precision: 0 },
      width: 130,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'lastContact',
      name: 'Last Contact',
      type: 'date',
      config: { format: 'relative', includeTime: false },
      width: 140,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'source',
      name: 'Source',
      type: 'text',
      config: {},
      width: 100,
      visible: true,
      sortable: true,
      filterable: true,
      required: false,
      position: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    softGray: '#F1F5F9',
    gold: '#FFD600',
    blue: '#0EA5E9',
    purple: '#8B5CF6',
    orange: '#F97316',
    red: '#EF4444'
  }

  // Get trpc client
  const executeCommand = trpc.unified.executeCommand.useMutation()
  
  // Fetch real data from API
  const { data: contactsData, isLoading: contactsLoading, refetch: refetchContacts } = trpc.unified.getContacts.useQuery(
    { limit: 100 },
    { enabled: !!organization }
  );
  
  const { data: companiesData, isLoading: companiesLoading, refetch: refetchCompanies } = trpc.unified.getCompanies.useQuery(
    { limit: 100 },
    { enabled: !!organization }
  );
  
  const { data: dealsData, isLoading: dealsLoading, refetch: refetchDeals } = trpc.unified.getDeals.useQuery(
    {},
    { enabled: !!organization }
  );
  
  const { data: dashboardStats } = trpc.unified.getDashboardStats.useQuery(
    { period: 'month' },
    { enabled: !!organization }
  );

  // Transform API data to match UI structure
  const contacts: Contact[] = contactsData?.map((entity: any) => {
    // Calculate total deal value for this contact
    const relatedDeals = dealsData?.filter((deal: any) => 
      Array.isArray(deal.relationships) && deal.relationships.some((rel: any) => rel.id === entity.id && rel.type === 'primaryContact')
    ) || [];
    const totalDealValue = relatedDeals.reduce((sum: number, deal: any) => sum + (deal.data.value || 0), 0);
    
    return {
      id: entity.id,
      name: `${entity.data.firstName || ''} ${entity.data.lastName || ''}`.trim() || 'Unknown',
      email: entity.data.email || '',
      company: entity.data.companyName || entity.data.company || 'No Company',
      title: entity.data.jobTitle || '',
      phone: entity.data.phone || '',
      lastContact: entity.data.lastContactedAt ? new Date(entity.data.lastContactedAt) : new Date(entity.createdAt),
      dealValue: totalDealValue,
      status: entity.data.sentimentScore > 70 ? 'Hot' : entity.data.sentimentScore > 40 ? 'Warm' : 'Cold',
      source: entity.data.source || 'manual'
    }
  }) || [];

  // Transform companies data
  const companies: Company[] = companiesData?.map((entity: any) => {
    // Count deals and calculate total value for this company
    const relatedDeals = dealsData?.filter((deal: any) => 
      (Array.isArray(deal.relationships) && deal.relationships.some((rel: any) => rel.id === entity.id && rel.type === 'company')) ||
      deal.data.companyName === entity.data.name
    ) || [];
    const totalValue = relatedDeals.reduce((sum: number, deal: any) => sum + (deal.data.value || 0), 0);
    
    return {
      id: entity.id,
      name: entity.data.name || 'Unknown Company',
      domain: entity.data.domain || '',
      industry: entity.data.industry || 'Unknown',
      size: entity.data.employeeCount ? `${entity.data.employeeCount} employees` : 'Unknown',
      location: entity.data.address || entity.data.location || 'Unknown',
      deals: relatedDeals.length,
      value: totalValue,
      lastActivity: new Date(entity.updatedAt)
    }
  }) || [];

  // Transform deals data
  const deals: Deal[] = dealsData?.map((entity: any) => {
    // Find related company
    const relatedCompany = companiesData?.find((company: any) => 
      (Array.isArray(entity.relationships) && entity.relationships.some((rel: any) => rel.id === company.id && rel.type === 'company')) ||
      entity.data.companyName === company.data.name
    );
    
    return {
      id: entity.id,
      name: entity.data.name || 'Untitled Deal',
      company: entity.data.companyName || relatedCompany?.data.name || 'Unknown Company',
      value: entity.data.value || 0,
      stage: entity.data.stage || 'Prospecting',
      probability: entity.data.probability || 0,
      closeDate: entity.data.closeDate ? new Date(entity.data.closeDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      owner: 'You',
      lastActivity: new Date(entity.updatedAt)
    }
  }) || [];
  const isLoading = contactsLoading || companiesLoading || dealsLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hot': return colors.red
      case 'Warm': return colors.orange
      case 'Cold': return colors.blue
      default: return colors.mediumGray
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Prospecting': return colors.blue
      case 'Qualification': return colors.purple
      case 'Proposal': return colors.orange
      case 'Negotiation': return colors.evergreen
      case 'Closed Won': return '#10B981'
      case 'Closed Lost': return colors.red
      default: return colors.mediumGray
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  // Enhanced Table Handlers
  const handleAddColumn = (event?: React.MouseEvent) => {
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect()
      setAddColumnPosition({
        x: rect.left - 200,
        y: rect.bottom + 8
      })
    }
    setShowAddColumn(true)
    setSelectedFieldType(undefined)
    setEditingColumn(undefined)
  }

  const handleSelectFieldType = (type: ColumnTypeDefinition) => {
    setSelectedFieldType(type)
    setEditingColumn(undefined)
    setShowAddColumn(false)
    setShowConfigModal(true)
  }


  const handleSaveColumn = async (columnData: Partial<TableColumn>) => {
    if (editingColumn) {
      // Update existing column
      if (activeTab === 'contacts') {
        setContactColumns(prevColumns =>
          prevColumns.map(col =>
            col.id === editingColumn.id ? { ...col, ...columnData } : col
          )
        )
      } else if (activeTab === 'deals') {
        setDealsColumns(prevColumns =>
          prevColumns.map(col =>
            col.id === editingColumn.id ? { ...col, ...columnData } : col
          )
        )
      } else if (activeTab === 'companies') {
        setCompaniesColumns(prevColumns =>
          prevColumns.map(col =>
            col.id === editingColumn.id ? { ...col, ...columnData } : col
          )
        )
      }
    } else {
      // Add new column
      const newColumn: TableColumn = {
        id: `col-${Date.now()}`,
        ...columnData,
        position: getCurrentColumns().length,
        createdAt: new Date(),
        updatedAt: new Date()
      } as TableColumn
      
      if (activeTab === 'contacts') {
        setContactColumns(prevColumns => [...prevColumns, newColumn])
      } else if (activeTab === 'deals') {
        setDealsColumns(prevColumns => [...prevColumns, newColumn])
      } else if (activeTab === 'companies') {
        setCompaniesColumns(prevColumns => [...prevColumns, newColumn])
      }
    }
    setShowConfigModal(false)
  }

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    if (activeTab === 'contacts') {
      setContactColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === columnId ? { ...col, visible } : col
        )
      )
    } else if (activeTab === 'deals') {
      setDealsColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === columnId ? { ...col, visible } : col
        )
      )
    } else if (activeTab === 'companies') {
      setCompaniesColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === columnId ? { ...col, visible } : col
        )
      )
    }
  }

  const handleDeleteColumn = (columnId: string) => {
    if (window.confirm('Are you sure you want to delete this column? This action cannot be undone.')) {
      if (activeTab === 'contacts') {
        setContactColumns(prevColumns => prevColumns.filter(col => col.id !== columnId))
      } else if (activeTab === 'deals') {
        setDealsColumns(prevColumns => prevColumns.filter(col => col.id !== columnId))
      } else if (activeTab === 'companies') {
        setCompaniesColumns(prevColumns => prevColumns.filter(col => col.id !== columnId))
      }
    }
  }

  const handleConfigureColumn = (columnId: string) => {
    const currentColumns = getCurrentColumns()
    const column = currentColumns.find(col => col.id === columnId)
    if (column) {
      setEditingColumn(column)
      setSelectedFieldType(undefined)
      setShowConfigModal(true)
    }
  }

  const getCurrentColumns = (): TableColumn[] => {
    if (activeTab === 'contacts') return contactColumns
    if (activeTab === 'deals') return dealsColumns
    if (activeTab === 'companies') return companiesColumns
    return []
  }

  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    setCurrentSort({ columnId, direction })
  }

  const handleFilter = (columnId: string) => {
    console.log(`Filtering ${columnId}`)
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAFBFC',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.lightGray}`,
        padding: '24px 32px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: colors.softGreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.evergreen
            }}>
              <Users size={24} />
            </div>
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '2px'
              }}>
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: colors.charcoal,
                  margin: 0
                }}>
                  EverCore
                </h1>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.evergreen,
                  backgroundColor: colors.softGreen,
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Autonomous CRM
                </span>
              </div>
              <p style={{
                fontSize: '14px',
                color: colors.mediumGray,
                margin: 0
              }}>
                Complete customer relationship management with AI insights
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              position: 'relative',
              width: '320px'
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
                placeholder="Search contacts, deals, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px 12px 40px',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: colors.white,
                  color: colors.charcoal,
                  outline: 'none',
                  transition: 'all 200ms ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.evergreen
                  e.target.style.boxShadow = `0 0 0 3px ${colors.evergreen}15`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightGray
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/crm/contacts')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: colors.white,
                color: colors.evergreen,
                border: `1px solid ${colors.evergreen}30`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginRight: '12px'
              }}
            >
              <Users size={18} />
              View Contacts
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/crm/risk')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: colors.white,
                color: colors.red,
                border: `1px solid ${colors.red}30`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginRight: '12px'
              }}
            >
              <AlertTriangle size={18} />
              Risk Center
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard/crm/pipeline')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: colors.white,
                color: colors.evergreen,
                border: `1px solid ${colors.evergreen}30`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginRight: '12px'
              }}
            >
              <Target size={18} />
              Pipeline
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateContact(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
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
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateDeal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: colors.white,
                color: colors.evergreen,
                border: `1px solid ${colors.evergreen}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Target size={18} />
              New Deal
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateCompany(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor: colors.white,
                color: colors.evergreen,
                border: `1px solid ${colors.evergreen}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              <Building2 size={18} />
              New Company
            </motion.button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '24px',
          borderBottom: `1px solid ${colors.lightGray}`
        }}>
          {[
            { key: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
            { key: 'contacts', label: 'Contacts', icon: <Users size={18} /> },
            { key: 'deals', label: 'Deals', icon: <Target size={18} /> },
            { key: 'companies', label: 'Companies', icon: <Building2 size={18} /> }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.key ? `2px solid ${colors.evergreen}` : '2px solid transparent',
                color: activeTab === tab.key ? colors.evergreen : colors.mediumGray,
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 200ms ease'
              }}
              whileHover={{
                color: colors.evergreen
              }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        padding: '32px',
        backgroundColor: '#FAFBFC',
        minHeight: 'calc(100vh - 180px)'
      }}>
        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            color: colors.mediumGray
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                border: `3px solid ${colors.lightGray}`,
                borderTop: `3px solid ${colors.evergreen}`,
                borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite'
              }} />
              <p>Loading CRM data...</p>
              <style jsx>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          </div>
        )}
        
        {!isLoading && (
          <>
        
        {/* Contacts Table */}
        {activeTab === 'contacts' && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            border: `1px solid ${colors.lightGray}`,
            overflow: 'hidden'
          }}>
            {/* Table Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${colors.lightGray}`
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.charcoal
              }}>
                Contacts ({filteredContacts.length})
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: colors.charcoal,
                  cursor: 'pointer'
                }}>
                  <Filter size={16} />
                  Filter
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <EnhancedTableHeader
                  columns={contactColumns}
                  onSort={handleSort}
                  onAddColumn={handleAddColumn}
                  onConfigureColumn={handleConfigureColumn}
                  onToggleColumn={handleToggleColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onFilter={handleFilter}
                  currentSort={currentSort}
                />
                <tbody>
                  {filteredContacts.map((contact, index) => {
                    const visibleColumns = contactColumns.filter(col => col.visible)
                    
                    return (
                      <motion.tr
                        key={contact.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        style={{
                          borderBottom: `1px solid ${colors.lightGray}`,
                          transition: 'background-color 200ms ease',
                          cursor: 'pointer'
                        }}
                        onClick={() => router.push(`/contacts/${contact.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.softGreen + '30'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {visibleColumns.map((column) => (
                          <td key={column.id} style={{
                            padding: '16px 24px',
                            width: column.width || 'auto'
                          }}>
                            {column.id === 'contact' && (
                              <div>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: colors.charcoal,
                                  marginBottom: '2px'
                                }}>
                                  {contact.name}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: colors.mediumGray
                                }}>
                                  {contact.email}
                                </div>
                                {contact.phone && (
                                  <div style={{
                                    fontSize: '13px',
                                    color: colors.mediumGray
                                  }}>
                                    {contact.phone}
                                  </div>
                                )}
                              </div>
                            )}
                            {column.id === 'company' && (
                              <div>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: colors.charcoal,
                                  marginBottom: '2px'
                                }}>
                                  {contact.company}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: colors.mediumGray
                                }}>
                                  {contact.title}
                                </div>
                              </div>
                            )}
                            {column.id === 'status' && (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: getStatusColor(contact.status) + '15',
                                color: getStatusColor(contact.status)
                              }}>
                                {contact.status}
                              </span>
                            )}
                            {column.id === 'dealValue' && (
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: colors.charcoal
                              }}>
                                {formatCurrency(contact.dealValue)}
                              </span>
                            )}
                            {column.id === 'lastContact' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.mediumGray
                              }}>
                                {formatDate(contact.lastContact)}
                              </span>
                            )}
                            {column.id === 'source' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.mediumGray
                              }}>
                                {contact.source}
                              </span>
                            )}
                            {/* Handle custom columns */}
                            {!['contact', 'company', 'status', 'dealValue', 'lastContact', 'source'].includes(column.id) && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.mediumGray
                              }}>
                                -
                              </span>
                            )}
                          </td>
                        ))}
                        <td style={{
                          padding: '16px 24px',
                          textAlign: 'center',
                          width: '50px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: colors.mediumGray,
                              transition: 'all 200ms ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/contacts/${contact.id}`)
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen
                              e.currentTarget.style.color = colors.evergreen
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = colors.mediumGray
                            }}>
                              <Eye size={16} />
                            </button>
                            <button style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: colors.mediumGray,
                              transition: 'all 200ms ease'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/mail/compose?to=${contact.email}`)
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen
                              e.currentTarget.style.color = colors.evergreen
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = colors.mediumGray
                            }}>
                              <Mail size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deals Table */}
        {activeTab === 'deals' && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            border: `1px solid ${colors.lightGray}`,
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${colors.lightGray}`
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.charcoal
              }}>
                Deals ({deals.length})
              </h2>
            </div>

            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <EnhancedTableHeader
                  columns={dealsColumns}
                  onSort={handleSort}
                  onAddColumn={handleAddColumn}
                  onConfigureColumn={handleConfigureColumn}
                  onToggleColumn={handleToggleColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onFilter={handleFilter}
                  currentSort={currentSort}
                />
                <tbody>
                  {deals.map((deal, index) => {
                    const visibleColumns = dealsColumns.filter(col => col.visible)
                    return (
                      <motion.tr
                        key={deal.id}
                        style={{
                          borderBottom: `1px solid ${colors.lightGray}`,
                          cursor: 'pointer',
                          transition: 'all 200ms ease'
                        }}
                        whileHover={{
                          backgroundColor: colors.softGreen + '30'
                        }}
                      >
                        {visibleColumns.map((column) => (
                          <td
                            key={column.id}
                            style={{
                              padding: '16px 24px',
                              fontSize: '14px',
                              color: colors.charcoal,
                              width: column.width || 'auto'
                            }}
                          >
                            {column.id === 'dealName' && (
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: colors.charcoal
                              }}>
                                {deal.name}
                              </span>
                            )}
                            {column.id === 'company' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.charcoal
                              }}>
                                {deal.company}
                              </span>
                            )}
                            {column.id === 'stage' && (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: getStageColor(deal.stage) + '15',
                                color: getStageColor(deal.stage)
                              }}>
                                {deal.stage}
                              </span>
                            )}
                            {column.id === 'value' && (
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: colors.charcoal
                              }}>
                                {formatCurrency(deal.value)}
                              </span>
                            )}
                            {column.id === 'probability' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.charcoal
                              }}>
                                {deal.probability}%
                              </span>
                            )}
                            {column.id === 'closeDate' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.mediumGray
                              }}>
                                {deal.closeDate.toLocaleDateString()}
                              </span>
                            )}
                            {/* Handle custom columns */}
                            {!['dealName', 'company', 'stage', 'value', 'probability', 'closeDate'].includes(column.id) && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.mediumGray
                              }}>
                                -
                              </span>
                            )}
                          </td>
                        ))}
                        <td style={{
                          padding: '16px 24px',
                          textAlign: 'center',
                          width: '50px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: colors.mediumGray,
                              transition: 'all 200ms ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen
                              e.currentTarget.style.color = colors.evergreen
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = colors.mediumGray
                            }}>
                              <Eye size={16} />
                            </button>
                            <button style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: colors.mediumGray,
                              transition: 'all 200ms ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen
                              e.currentTarget.style.color = colors.evergreen
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = colors.mediumGray
                            }}>
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Companies Table */}
        {activeTab === 'companies' && (
          <div style={{
            backgroundColor: colors.white,
            borderRadius: '12px',
            border: `1px solid ${colors.lightGray}`,
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${colors.lightGray}`
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.charcoal
              }}>
                Companies ({companies.length})
              </h2>
            </div>

            <div style={{ overflow: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <EnhancedTableHeader
                  columns={companiesColumns}
                  onSort={handleSort}
                  onAddColumn={handleAddColumn}
                  onConfigureColumn={handleConfigureColumn}
                  onToggleColumn={handleToggleColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onFilter={handleFilter}
                  currentSort={currentSort}
                />
                <tbody>
                  {companies.map((company, index) => {
                    const visibleColumns = companiesColumns.filter(col => col.visible)
                    return (
                      <motion.tr
                        key={company.id}
                        style={{
                          borderBottom: `1px solid ${colors.lightGray}`,
                          cursor: 'pointer',
                          transition: 'all 200ms ease'
                        }}
                        whileHover={{
                          backgroundColor: colors.softGreen + '30'
                        }}
                      >
                        {visibleColumns.map((column) => (
                          <td
                            key={column.id}
                            style={{
                              padding: '16px 24px',
                              fontSize: '14px',
                              color: colors.charcoal,
                              width: column.width || 'auto'
                            }}
                          >
                            {column.id === 'company' && (
                              <div>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: '500',
                                  color: colors.charcoal,
                                  marginBottom: '2px'
                                }}>
                                  {company.name}
                                </div>
                                <div style={{
                                  fontSize: '13px',
                                  color: colors.mediumGray
                                }}>
                                  {company.domain}
                                </div>
                              </div>
                            )}
                            {column.id === 'industry' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.charcoal
                              }}>
                                {company.industry}
                              </span>
                            )}
                            {column.id === 'size' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.charcoal
                              }}>
                                {company.size}
                              </span>
                            )}
                            {column.id === 'location' && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.mediumGray
                              }}>
                                {company.location}
                              </span>
                            )}
                            {column.id === 'deals' && (
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: colors.charcoal
                              }}>
                                {company.deals}
                              </span>
                            )}
                            {column.id === 'totalValue' && (
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: colors.charcoal
                              }}>
                                {formatCurrency(company.value)}
                              </span>
                            )}
                            {/* Handle custom columns */}
                            {!['company', 'industry', 'size', 'location', 'deals', 'totalValue'].includes(column.id) && (
                              <span style={{
                                fontSize: '14px',
                                color: colors.mediumGray
                              }}>
                                -
                              </span>
                            )}
                          </td>
                        ))}
                        <td style={{
                          padding: '16px 24px',
                          textAlign: 'center',
                          width: '50px'
                        }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: colors.mediumGray,
                              transition: 'all 200ms ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen
                              e.currentTarget.style.color = colors.evergreen
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = colors.mediumGray
                            }}>
                              <Eye size={16} />
                            </button>
                            <button style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: colors.mediumGray,
                              transition: 'all 200ms ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.softGreen
                              e.currentTarget.style.color = colors.evergreen
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.color = colors.mediumGray
                            }}>
                              <ExternalLink size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
            {/* Stats Cards */}
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px'}}>
              <div style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: colors.softGray,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Users size={24} style={{ color: colors.mediumGray }} />
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: colors.charcoal,
                  marginBottom: '4px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {contacts.length}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Active contacts
                </div>
              </div>
              
              <div style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: colors.softGreen,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <Target size={24} style={{ color: colors.evergreen }} />
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: colors.charcoal,
                  marginBottom: '4px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {deals.length}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Deals in pipeline
                </div>
              </div>
              
              <div style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.lightGray}`,
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  backgroundColor: colors.softGreen,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <DollarSign size={24} style={{ color: colors.evergreen }} />
                </div>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: colors.charcoal,
                  marginBottom: '4px',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {formatCurrency(deals.reduce((sum, deal) => sum + deal.value, 0))}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.mediumGray,
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  Pipeline value
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px'}}>
              {/* Hot Leads & Opportunities */}
              <div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px'}}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: colors.charcoal,
                    margin: 0,
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}>
                    Hot Leads & Opportunities
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => router.push('/dashboard/crm/pipeline')}
                    style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '8px 16px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      backgroundColor: colors.white,
                      color: colors.mediumGray,
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                  >
                    View Pipeline
                  </motion.button>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  {[
                    { 
                      name: 'Enterprise Migration Deal', 
                      company: 'TechCorp Inc',
                      value: '$250K', 
                      desc: 'Large enterprise looking to migrate their entire CRM system. Decision timeline: Q4 2024.', 
                      stage: 'Negotiation',
                      priority: 'Hot',
                      trending: true,
                      icon: Building2
                    },
                    { 
                      name: 'SaaS Platform Integration', 
                      company: 'StartupXYZ',
                      value: '$75K', 
                      desc: 'Growing startup needs integrated business platform for scaling operations.', 
                      stage: 'Proposal',
                      priority: 'Warm',
                      icon: Zap
                    },
                    { 
                      name: 'Department Expansion', 
                      company: 'Global Corp',
                      value: '$180K', 
                      desc: 'Adding 3 new departments to existing evergreenOS implementation.', 
                      stage: 'Qualification',
                      priority: 'Warm',
                      icon: Users
                    },
                    { 
                      name: 'Multi-Location Rollout', 
                      company: 'Retail Chain',
                      value: '$420K', 
                      desc: 'Rolling out unified business system across 50+ retail locations.', 
                      stage: 'Discovery',
                      priority: 'Cold',
                      icon: MapPin
                    }
                  ].map((deal) => (
                    <motion.div 
                      key={deal.name} 
                      whileHover={{ scale: 1.01 }}
                      style={{
                        backgroundColor: colors.white,
                        border: `1px solid ${colors.lightGray}`,
                        borderRadius: '12px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 200ms ease'
                      }}
                    >
                      {deal.trending && (
                        <div style={{
                          display: 'inline-block',
                          backgroundColor: colors.evergreen,
                          color: colors.white,
                          fontSize: '12px',
                          fontWeight: '500',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          marginBottom: '12px',
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                          🔥 Closing Soon
                        </div>
                      )}
                      <div style={{display: 'flex', alignItems: 'flex-start', gap: '16px'}}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: colors.softGray,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <deal.icon size={24} style={{ color: colors.mediumGray }} />
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: colors.charcoal,
                              margin: 0,
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              {deal.name}
                            </h3>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: colors.evergreen,
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              {deal.value}
                            </span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <span style={{
                              fontSize: '14px',
                              color: colors.mediumGray,
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              {deal.company}
                            </span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: deal.priority === 'Hot' ? '#FEF2F2' : deal.priority === 'Warm' ? '#FFF7ED' : '#EFF6FF',
                              color: deal.priority === 'Hot' ? '#B91C1C' : deal.priority === 'Warm' ? '#C2410C' : '#1D4ED8',
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              {deal.priority}
                            </span>
                          </div>
                          <p style={{
                            fontSize: '14px',
                            color: colors.mediumGray,
                            marginBottom: '12px',
                            lineHeight: '1.5',
                            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                          }}>
                            {deal.desc}
                          </p>
                          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                            <span style={{
                              fontSize: '12px',
                              color: colors.mediumGray,
                              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                              Stage: {deal.stage}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              style={{
                                fontSize: '12px',
                                fontWeight: '500',
                                padding: '6px 12px',
                                border: `1px solid ${colors.lightGray}`,
                                borderRadius: '8px',
                                backgroundColor: colors.white,
                                color: colors.mediumGray,
                                cursor: 'pointer',
                                transition: 'all 200ms ease',
                                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                              }}
                            >
                              View Details
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Revenue Insights */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Revenue Insights</h3>
                  <div className="flex items-center" style={{gap: '8px'}}>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      className="h-8 w-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </motion.button>
                    <span className="text-sm font-medium">This Month</span>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      className="h-8 w-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                
                {/* Revenue Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((week, index) => (
                      <div key={week} className="text-center">
                        <div className={`rounded-lg mb-2 ${
                          index === 0 ? 'bg-[#1D5238]' :
                          index === 1 ? 'bg-[#E6F4EC]' :
                          index === 2 ? 'bg-[#E6F4EC]' :
                          'bg-gray-100'
                        }`} style={{
                          height: index === 0 ? '80px' :
                                 index === 1 ? '60px' :
                                 index === 2 ? '70px' : '40px'
                        }}></div>
                        <div className="text-xs text-gray-600">{week}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm font-medium text-gray-900">Best week: Week 1</div>
                  <div className="text-xs text-gray-500">$425K closed, 8 deals won</div>
                </div>
                
                {/* Recent Wins */}
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Recent Wins 🎉</h4>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      View All
                    </motion.button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {[
                      { company: 'TechStart Inc', value: '$45K', time: '2 hours ago', type: 'New Customer' },
                      { company: 'Innovation Labs', value: '$120K', time: 'Yesterday', type: 'Expansion' },
                      { company: 'Digital Solutions', value: '$78K', time: '3 days ago', type: 'Renewal' }
                    ].map((win) => (
                      <div key={win.company} className="flex items-center gap-3">
                        <div className="text-sm font-medium text-gray-600 w-16">{win.time.split(' ')[0]}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {win.company} 
                            <span className="text-[#1D5238] font-semibold">{win.value}</span>
                          </div>
                          <div className="text-xs text-gray-500">{win.type} • {win.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Insights */}
                <div className="mt-6 p-4 bg-[#E6F4EC] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#1D5238]" />
                    <h4 className="font-semibold text-[#1D5238]">AI Revenue Insights</h4>
                  </div>
                  <p className="text-sm text-[#1D5238]">
                    Your Q4 pipeline looks strong! 3 deals worth $500K+ are likely to close this month based on activity patterns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </div>
      
      {/* Create Contact Sheet */}
      <CreateContactSheet
        isOpen={showCreateContact}
        onClose={() => setShowCreateContact(false)}
        onSuccess={() => {
          refetchContacts()
          refetchCompanies() // Refresh companies in case a new one was created
          setShowCreateContact(false)
        }}
      />
      
      {/* Create Deal Sheet */}
      <CreateDealSheet
        isOpen={showCreateDeal}
        onClose={() => setShowCreateDeal(false)}
        onSuccess={() => {
          refetchDeals()
          refetchContacts() // Refresh contacts to show updated deal values
          refetchCompanies() // Refresh companies to show updated deal counts
          setShowCreateDeal(false)
        }}
      />
      
      {/* Create Company Sheet */}
      {showCreateCompany && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowCreateCompany(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: colors.charcoal,
              marginBottom: '24px'
            }}>
              Create New Company
            </h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              
              try {
                // Create company via natural language command
                const companyName = formData.get('name') as string
                const domain = formData.get('domain') as string
                const industry = formData.get('industry') as string
                
                const command = `create company "${companyName}" with domain "${domain}" in ${industry} industry`
                
                const result = await executeCommand.mutateAsync({ command })
                
                if (result.success) {
                  refetchCompanies()
                  refetchContacts() // In case contacts get linked
                  setShowCreateCompany(false)
                } else {
                  alert('Failed to create company')
                }
              } catch (error) {
                console.error('Error creating company:', error)
                alert('Error creating company')
              }
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '8px'
                  }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="Acme Inc"
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '8px'
                  }}>
                    Domain
                  </label>
                  <input
                    type="text"
                    name="domain"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    placeholder="acme.com"
                  />
                </div>
                
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: colors.charcoal,
                    marginBottom: '8px'
                  }}>
                    Industry
                  </label>
                  <select
                    name="industry"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '24px'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCreateCompany(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.white,
                    color: colors.mediumGray,
                    border: `1px solid ${colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: colors.evergreen,
                    color: colors.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Enhanced Table Modals */}
      <AddColumnDropdown
        isOpen={showAddColumn}
        onClose={() => setShowAddColumn(false)}
        onSelectType={handleSelectFieldType}
        position={addColumnPosition}
      />

      <FieldConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveColumn}
        fieldType={selectedFieldType}
        existingColumn={editingColumn}
      />
    </div>
  )
}