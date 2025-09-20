'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { theme } from '@/lib/evercore/theme'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@clerk/nextjs'
import { useCRM } from '@/lib/contexts/crm-context'
import { useWorkspaceConfig } from '@/lib/contexts/workspace-config-context'
import { trpc } from '@/lib/trpc/client'
import CRMHeader from '@/components/evercore/layouts/CRMHeader'
import CRMTabs, { Tab } from '@/components/evercore/layouts/CRMTabs'
import PremiumMetricGrid from '@/components/evercore/dashboard/PremiumMetricGrid'
import PremiumMetricCard from '@/components/evercore/dashboard/PremiumMetricCard'
import PremiumDealPipeline from '@/components/evercore/features/PremiumDealPipeline'
import CleanTaskTable, { Column } from '@/components/evercore/entities/CleanTaskTable'
import EditableCell from '@/components/evercore/cells/EditableCell'
import ContactCreateModal from '@/components/evercore/features/ContactCreateModal'
import ContactCreateSidebar from '@/components/evercore/features/ContactCreateSidebar'
import { Badge } from '@/components/ui/badge'
import * as Icons from 'lucide-react'
import { 
  Users, 
  Building2, 
  Target, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Mail,
  Database,
  Sparkles,
  Settings,
  Plus,
  CheckCircle,
  Trash2
} from 'lucide-react'

export default function CRMDashboard() {
  const { organization } = useOrganization()
  const router = useRouter()
  const utils = trpc.useUtils()
  const { 
    contacts, 
    leads,
    deals, 
    companies,
    getMetrics,
    deleteContacts,
    updateContact,
    refreshContacts
  } = useCRM()
  const { navigation, config, loading: configLoading } = useWorkspaceConfig()
  
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [contactSubTab, setContactSubTab] = useState<string>('my-contacts') // Sub-tab for contacts
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedImportedContacts, setSelectedImportedContacts] = useState<string[]>([])
  const [selectedDeals, setSelectedDeals] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [showCreateDeal, setShowCreateDeal] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [customFieldsLoaded, setCustomFieldsLoaded] = useState(false)
  
  // Dynamic columns state
  const [customContactColumns, setCustomContactColumns] = useState<Column[]>([])
  const [customDealColumns, setCustomDealColumns] = useState<Column[]>([])
  const [customCompanyColumns, setCustomCompanyColumns] = useState<Column[]>([])  
  const [customLeadColumns, setCustomLeadColumns] = useState<Column[]>([])
  
  // Hidden columns state (for persistence)
  const [hiddenContactColumns, setHiddenContactColumns] = useState<string[]>([])
  const [hiddenDealColumns, setHiddenDealColumns] = useState<string[]>([])
  const [hiddenCompanyColumns, setHiddenCompanyColumns] = useState<string[]>([])
  const [hiddenLeadColumns, setHiddenLeadColumns] = useState<string[]>([])
  
  // Load existing custom fields
  const { data: contactFields } = trpc.workspaceConfig.getCustomFields.useQuery(
    { entityType: 'contact' },
    { enabled: !!organization }
  )
  const { data: dealFields } = trpc.workspaceConfig.getCustomFields.useQuery(
    { entityType: 'deal' },
    { enabled: !!organization }
  )
  const { data: companyFields } = trpc.workspaceConfig.getCustomFields.useQuery(
    { entityType: 'company' },
    { enabled: !!organization }
  )
  const { data: leadFields } = trpc.workspaceConfig.getCustomFields.useQuery(
    { entityType: 'lead' },
    { enabled: !!organization }
  )

  // Mutations for creating custom fields
  const createContactField = trpc.workspaceConfig.createCustomField.useMutation({
    onSuccess: () => {
      // Refetch custom fields after creation
      utils.workspaceConfig.getCustomFields.invalidate()
    }
  })
  
  const createDealField = trpc.workspaceConfig.createCustomField.useMutation({
    onSuccess: () => {
      utils.workspaceConfig.getCustomFields.invalidate()
    }
  })
  
  const createCompanyField = trpc.workspaceConfig.createCustomField.useMutation({
    onSuccess: () => {
      utils.workspaceConfig.getCustomFields.invalidate()
    }
  })
  
  const createLeadField = trpc.workspaceConfig.createCustomField.useMutation({
    onSuccess: () => {
      utils.workspaceConfig.getCustomFields.invalidate()
    }
  })

  // Load hidden columns from localStorage on mount
  useEffect(() => {
    const loadHiddenColumns = () => {
      const storedHiddenContact = localStorage.getItem('hiddenContactColumns')
      const storedHiddenDeal = localStorage.getItem('hiddenDealColumns')
      const storedHiddenCompany = localStorage.getItem('hiddenCompanyColumns')
      const storedHiddenLead = localStorage.getItem('hiddenLeadColumns')
      
      if (storedHiddenContact) setHiddenContactColumns(JSON.parse(storedHiddenContact))
      if (storedHiddenDeal) setHiddenDealColumns(JSON.parse(storedHiddenDeal))
      if (storedHiddenCompany) setHiddenCompanyColumns(JSON.parse(storedHiddenCompany))
      if (storedHiddenLead) setHiddenLeadColumns(JSON.parse(storedHiddenLead))
    }
    
    loadHiddenColumns()
  }, [])

  // Save hidden columns to localStorage whenever they change
  useEffect(() => {
    if (hiddenContactColumns.length > 0 || hiddenContactColumns.length === 0) {
      localStorage.setItem('hiddenContactColumns', JSON.stringify(hiddenContactColumns))
    }
  }, [hiddenContactColumns])

  useEffect(() => {
    if (hiddenDealColumns.length > 0 || hiddenDealColumns.length === 0) {
      localStorage.setItem('hiddenDealColumns', JSON.stringify(hiddenDealColumns))
    }
  }, [hiddenDealColumns])

  useEffect(() => {
    if (hiddenCompanyColumns.length > 0 || hiddenCompanyColumns.length === 0) {
      localStorage.setItem('hiddenCompanyColumns', JSON.stringify(hiddenCompanyColumns))
    }
  }, [hiddenCompanyColumns])

  useEffect(() => {
    if (hiddenLeadColumns.length > 0 || hiddenLeadColumns.length === 0) {
      localStorage.setItem('hiddenLeadColumns', JSON.stringify(hiddenLeadColumns))
    }
  }, [hiddenLeadColumns])

  // Load custom fields into columns when they're fetched
  useEffect(() => {
    if (!customFieldsLoaded) {
      // Load contact custom fields
      if (contactFields && contactFields.length > 0) {
        const columns = contactFields.map((field: any) => ({
          id: field.id,
          label: field.label,
          accessor: `data.customFields.${field.id}.value`,
          sortable: true,
          isCustomField: true,
          render: (value: any, row: any) => (
            <EditableCell
              entityId={row.id}
              fieldId={field.id}
              fieldType={field.type || 'text'}
              value={value}
              options={field.options}
              workspaceId={organization?.id || ''}
              onValueChange={() => refreshContacts()}
            />
          )
        }))
        setCustomContactColumns(columns)
      }
      
      // Load deal custom fields
      if (dealFields && dealFields.length > 0) {
        const columns = dealFields.map((field: any) => ({
          id: field.id,
          label: field.label,
          accessor: `data.customFields.${field.id}.value`,
          sortable: true,
          isCustomField: true,
          render: (value: any, row: any) => (
            <EditableCell
              entityId={row.id}
              fieldId={field.id}
              fieldType={field.type || 'text'}
              value={value}
              options={field.options}
              workspaceId={organization?.id || ''}
              onValueChange={() => refreshContacts()}
            />
          )
        }))
        setCustomDealColumns(columns)
      }
      
      // Load company custom fields
      if (companyFields && companyFields.length > 0) {
        const columns = companyFields.map((field: any) => ({
          id: field.id,
          label: field.label,
          accessor: `data.customFields.${field.id}.value`,
          sortable: true,
          isCustomField: true,
          render: (value: any, row: any) => (
            <EditableCell
              entityId={row.id}
              fieldId={field.id}
              fieldType={field.type || 'text'}
              value={value}
              options={field.options}
              workspaceId={organization?.id || ''}
              onValueChange={() => refreshContacts()}
            />
          )
        }))
        setCustomCompanyColumns(columns)
      }
      
      // Load lead custom fields
      if (leadFields && leadFields.length > 0) {
        const columns = leadFields.map((field: any) => ({
          id: field.id,
          label: field.label,
          accessor: `data.customFields.${field.id}.value`,
          sortable: true,
          isCustomField: true,
          render: (value: any, row: any) => (
            <EditableCell
              entityId={row.id}
              fieldId={field.id}
              fieldType={field.type || 'text'}
              value={value}
              options={field.options}
              workspaceId={organization?.id || ''}
              onValueChange={() => refreshContacts()}
            />
          )
        }))
        setCustomLeadColumns(columns)
      }
      
      // Mark as loaded when any fields are present
      if (contactFields || dealFields || companyFields || leadFields) {
        setCustomFieldsLoaded(true)
      }
    }
  }, [contactFields, dealFields, companyFields, leadFields, customFieldsLoaded])
  
  // Get icon component by name
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return BarChart3
    
    // Check if it's an emoji
    if (iconName.length <= 2) return null
    
    // Get icon from lucide-react
    const IconComponent = (Icons as any)[iconName]
    return IconComponent || BarChart3
  }

  // Get entity count for badges
  const getEntityCount = (entityType?: string) => {
    switch (entityType) {
      case 'lead': return leads.length
      case 'contact': {
        // Count only My Contacts (manual or promoted)
        const myContactsCount = contacts.filter(c => 
          (!c.contactSource || c.contactSource === 'manual' || c.contactSource === 'promoted')
        ).length
        return myContactsCount
      }
      case 'company': return companies.length
      case 'deal': return deals.length
      default: return 0
    }
  }

  // Build tabs from navigation configuration
  const tabs: Tab[] = useMemo(() => {
    if (!navigation || navigation.length === 0) {
      // Fallback to default tabs if no configuration
      return [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'leads', label: 'Leads', icon: Users, badge: leads.length },
        { id: 'contacts', label: 'Contacts', icon: Users, badge: contacts.length },
        { id: 'companies', label: 'Companies', icon: Building2, badge: companies.length },
        { id: 'deals', label: 'Deals', icon: Target, badge: deals.length }
      ]
    }

    return navigation
      .filter(item => item.visible)
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        id: item.id,
        label: item.label,
        icon: getIconComponent(item.icon),
        badge: item.entityType ? getEntityCount(item.entityType) : undefined,
        emoji: item.icon?.length <= 2 ? item.icon : undefined
      }))
  }, [navigation, leads.length, contacts.length, companies.length, deals.length])

  // Get metrics from context
  const metricsData = getMetrics()
  const metrics = [
    {
      icon: Users,
      label: 'Total Contacts',
      value: contacts.length.toString(),
      trend: '+12%',
      trendDirection: 'up' as const
    },
    {
      icon: Target,
      label: 'Active Deals',
      value: metricsData.activeDeals.toString(),
      trend: '+8%',
      trendDirection: 'up' as const
    },
    {
      icon: DollarSign,
      label: 'Pipeline Value',
      value: `$${(metricsData.pipelineValue / 1000).toFixed(0)}K`,
      trend: '+25%',
      trendDirection: 'up' as const
    },
    {
      icon: TrendingUp,
      label: 'Win Rate',
      value: `${metricsData.winRate.toFixed(0)}%`,
      trend: '+5%',
      trendDirection: 'up' as const
    }
  ]

  // Pipeline stages for kanban
  const pipelineStages = [
    {
      id: 'prospecting',
      name: 'Prospecting',
      deals: deals.filter(d => d.stage === 'Prospecting').map(d => ({
        id: d.id,
        title: d.name,
        value: `$${(d.value / 1000).toFixed(0)}K`,
        company: d.company,
        probability: d.probability,
        owner: d.owner,
        daysInStage: Math.floor((Date.now() - new Date(d.lastActivity).getTime()) / (1000 * 60 * 60 * 24)),
        priority: d.probability > 60 ? 'high' as const : d.probability > 30 ? 'medium' as const : 'low' as const
      })),
      totalValue: deals.filter(d => d.stage === 'Prospecting').reduce((sum, d) => sum + d.value, 0)
    },
    {
      id: 'qualification',
      name: 'Qualification',
      deals: deals.filter(d => d.stage === 'Qualification').map(d => ({
        id: d.id,
        title: d.name,
        value: `$${(d.value / 1000).toFixed(0)}K`,
        company: d.company,
        probability: d.probability,
        owner: d.owner,
        daysInStage: Math.floor((Date.now() - new Date(d.lastActivity).getTime()) / (1000 * 60 * 60 * 24)),
        priority: d.probability > 60 ? 'high' as const : d.probability > 30 ? 'medium' as const : 'low' as const
      })),
      totalValue: deals.filter(d => d.stage === 'Qualification').reduce((sum, d) => sum + d.value, 0)
    },
    {
      id: 'proposal',
      name: 'Proposal',
      deals: deals.filter(d => d.stage === 'Proposal').map(d => ({
        id: d.id,
        title: d.name,
        value: `$${(d.value / 1000).toFixed(0)}K`,
        company: d.company,
        probability: d.probability,
        owner: d.owner,
        daysInStage: Math.floor((Date.now() - new Date(d.lastActivity).getTime()) / (1000 * 60 * 60 * 24)),
        priority: d.probability > 60 ? 'high' as const : d.probability > 30 ? 'medium' as const : 'low' as const
      })),
      totalValue: deals.filter(d => d.stage === 'Proposal').reduce((sum, d) => sum + d.value, 0)
    },
    {
      id: 'negotiation',
      name: 'Negotiation',
      deals: deals.filter(d => d.stage === 'Negotiation').map(d => ({
        id: d.id,
        title: d.name,
        value: `$${(d.value / 1000).toFixed(0)}K`,
        company: d.company,
        probability: d.probability,
        owner: d.owner,
        daysInStage: Math.floor((Date.now() - new Date(d.lastActivity).getTime()) / (1000 * 60 * 60 * 24)),
        priority: d.probability > 60 ? 'high' as const : d.probability > 30 ? 'medium' as const : 'low' as const
      })),
      totalValue: deals.filter(d => d.stage === 'Negotiation').reduce((sum, d) => sum + d.value, 0)
    },
    {
      id: 'closed-won',
      name: 'Closed Won',
      deals: deals.filter(d => d.stage === 'Closed Won').map(d => ({
        id: d.id,
        title: d.name,
        value: `$${(d.value / 1000).toFixed(0)}K`,
        company: d.company,
        probability: 100,
        owner: d.owner,
        daysInStage: Math.floor((Date.now() - new Date(d.lastActivity).getTime()) / (1000 * 60 * 60 * 24)),
        priority: 'high' as const
      })),
      totalValue: deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + d.value, 0)
    }
  ]

  // Table columns
  const contactColumns: Column[] = [
    {
      id: 'name',
      label: 'Name',
      accessor: 'name',
      sortable: true,
      width: '200px',
      isCustomField: true, // Enable dropdown menu
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-gray-900">{value}</span>
        </div>
      )
    },
    {
      id: 'company',
      label: 'Company',
      accessor: 'company',
      sortable: true,
      width: '180px',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value || '—'}</span>
      )
    },
    {
      id: 'email',
      label: 'Email',
      accessor: 'email',
      width: '280px',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => (
        <span className="text-sm text-gray-600">{value}</span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      width: '100px',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => {
        const colors = {
          Hot: 'bg-red-100 text-red-700',
          Warm: 'bg-yellow-100 text-yellow-700',
          Cold: 'bg-blue-100 text-blue-700'
        }
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-md ${colors[value as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
            {value}
          </span>
        )
      }
    },
    {
      id: 'dealValue',
      label: 'Deal Value',
      accessor: 'dealValue',
      sortable: true,
      width: '100px',
      isCustomField: true, // Enable dropdown menu
      render: (value: number) => (
        <span className="text-sm text-gray-600">${(value / 1000).toFixed(0)}K</span>
      )
    },
    {
      id: 'lastContact',
      label: 'Last Contact',
      accessor: 'lastContact',
      sortable: true,
      width: '120px',
      isCustomField: true, // Enable dropdown menu
      render: (value: Date) => {
        const days = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))
        return (
          <span className="text-sm text-gray-500">{days}d ago</span>
        )
      }
    }
  ]

  const leadColumns: Column[] = [
    {
      id: 'name',
      label: 'Task Name',
      accessor: 'name',
      sortable: true,
      isCustomField: true, // Enable dropdown menu
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
          <span className="text-sm text-gray-900">{value}</span>
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      width: 'w-32',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => {
        const colors = {
          New: 'bg-gray-100 text-gray-700',
          Contacted: 'bg-gray-100 text-gray-700',
          Qualified: 'bg-green-100 text-green-700',
          Unqualified: 'bg-gray-100 text-gray-700'
        }
        return (
          <span className={`px-3 py-1 text-xs font-medium rounded-md ${colors[value as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
            {value || 'Not Started'}
          </span>
        )
      }
    },
    {
      id: 'assignee',
      label: 'Assignee',
      accessor: (row: any) => row.owner || '',
      width: 'w-32',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => (
        value ? (
          <span className="text-sm text-gray-700">{value}</span>
        ) : (
          <button className="text-sm text-gray-400 hover:text-gray-600">+ Assign</button>
        )
      )
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      accessor: (row: any) => row.dueDate || '',
      sortable: true,
      isCustomField: true, // Enable dropdown menu
      width: 'w-32',
      render: (value: any) => (
        value ? (
          <span className="text-sm text-gray-700">{new Date(value).toLocaleDateString()}</span>
        ) : (
          <button className="text-sm text-gray-400 hover:text-gray-600">+ Set date</button>
        )
      )
    },
    {
      id: 'priority',
      label: 'Priority',
      accessor: (row: any) => row.priority || 'Medium',
      width: 'w-28',
      render: (value: string) => {
        const colors = {
          High: 'bg-red-100 text-red-700',
          Medium: 'bg-yellow-100 text-yellow-700',
          Low: 'bg-gray-100 text-gray-700'
        }
        return (
          <span className={`px-3 py-1 text-xs font-medium rounded-md ${colors[value as keyof typeof colors] || colors.Medium}`}>
            {value}
          </span>
        )
      }
    }
  ]

  // Filter data based on search and contact source
  const myContacts = contacts.filter(c => 
    (!c.contactSource || c.contactSource === 'manual' || c.contactSource === 'promoted')
  )
  
  const importedContacts = contacts.filter(c => 
    c.contactSource === 'imported'
  )
  
  const filteredMyContacts = myContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )
  
  const filteredImportedContacts = importedContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )
  
  const filteredContacts = contactSubTab === 'my-contacts' 
    ? filteredMyContacts 
    : contactSubTab === 'imported' 
      ? filteredImportedContacts
      : contacts.filter(c => 
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
        )

  const filteredLeads = leads.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.company?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  const filteredDeals = deals.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )


  const handleContactDelete = async (contact: any) => {
    if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
      await deleteContacts([contact.id])
    }
  }

  const handleContactEdit = (contact: any) => {
    // This would open an edit modal
    console.log('Edit contact:', contact)
  }
  
  const handlePromoteContacts = async (contactIds: string[]) => {
    try {
      // Promote selected contacts to "My Contacts"
      for (const contactId of contactIds) {
        const contact = contacts.find(c => c.id === contactId)
        if (contact) {
          await updateContact(contactId, {
            ...contact,
            contactSource: 'promoted',
            promotedAt: new Date(),
            promotedBy: organization?.id,
            // Set company if it was extracted
            company: contact.extractedCompany || contact.company || ''
          })
        }
      }
      
      // Clear selection and refresh
      setSelectedImportedContacts([])
      await refreshContacts()
      
      // Show success message (you can add a toast notification here)
      console.log(`Successfully promoted ${contactIds.length} contacts to My Contacts`)
    } catch (error) {
      console.error('Failed to promote contacts:', error)
    }
  }
  
  const handleBulkDelete = async (contactIds: string[]) => {
    const confirmMessage = `Are you sure you want to delete ${contactIds.length} contact${contactIds.length > 1 ? 's' : ''}?`
    if (confirm(confirmMessage)) {
      try {
        await deleteContacts(contactIds)
        setSelectedImportedContacts([])
        console.log(`Successfully deleted ${contactIds.length} contacts`)
      } catch (error) {
        console.error('Failed to delete contacts:', error)
      }
    }
  }
  
  // Handle adding custom columns
  const handleAddContactColumn = async (field: any) => {
    try {
      // First, save the field to the database
      const createdField = await createContactField.mutateAsync({
        name: field.name,
        label: field.label || field.name,
        type: field.type || 'text',
        entityType: 'contact',
        required: field.required || false,
        config: field.config || {},
        sortable: field.sortable !== false,
        filterable: field.filterable !== false
      })
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
        isCustomField: true,
        render: (value: any, row: any) => (
          <EditableCell
            entityId={row.id}
            fieldId={fieldId}
            fieldType={field.type || 'text'}
            value={value}
            options={field.options}
            workspaceId={organization?.id || ''}
            onValueChange={() => refreshContacts()}
          />
        )
      }
      setCustomContactColumns([...customContactColumns, newColumn])
    } catch (error) {
      console.error('Failed to create custom field:', error)
    }
  }
  
  const handleAddDealColumn = async (field: any) => {
    try {
      // First, save the field to the database
      const createdField = await createDealField.mutateAsync({
        name: field.name,
        label: field.label || field.name,
        type: field.type || 'text',
        entityType: 'deal',
        required: field.required || false,
        config: field.config || {},
        sortable: field.sortable !== false,
        filterable: field.filterable !== false
      })
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
        isCustomField: true,
        render: (value: any, row: any) => (
          <EditableCell
            entityId={row.id}
            fieldId={fieldId}
            fieldType={field.type || 'text'}
            value={value}
            options={field.options}
            workspaceId={organization?.id || ''}
            onValueChange={() => refreshContacts()}
          />
        )
      }
      setCustomDealColumns([...customDealColumns, newColumn])
    } catch (error) {
      console.error('Failed to create custom field:', error)
    }
  }
  
  const handleAddCompanyColumn = async (field: any) => {
    try {
      // First, save the field to the database
      const createdField = await createCompanyField.mutateAsync({
        name: field.name,
        label: field.label || field.name,
        type: field.type || 'text',
        entityType: 'company',
        required: field.required || false,
        config: field.config || {},
        sortable: field.sortable !== false,
        filterable: field.filterable !== false
      })
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
        isCustomField: true,
        render: (value: any, row: any) => (
          <EditableCell
            entityId={row.id}
            fieldId={fieldId}
            fieldType={field.type || 'text'}
            value={value}
            options={field.options}
            workspaceId={organization?.id || ''}
            onValueChange={() => refreshContacts()}
          />
        )
      }
      setCustomCompanyColumns([...customCompanyColumns, newColumn])
    } catch (error) {
      console.error('Failed to create custom field:', error)
    }
  }
  
  const handleAddLeadColumn = async (field: any) => {
    try {
      // First, save the field to the database
      const createdField = await createLeadField.mutateAsync({
        name: field.name,
        label: field.label || field.name,
        type: field.type || 'text',
        entityType: 'lead',
        required: field.required || false,
        config: field.config || {},
        sortable: field.sortable !== false,
        filterable: field.filterable !== false
      })
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
        isCustomField: true,
        render: (value: any, row: any) => (
          <EditableCell
            entityId={row.id}
            fieldId={fieldId}
            fieldType={field.type || 'text'}
            value={value}
            options={field.options}
            workspaceId={organization?.id || ''}
            onValueChange={() => refreshContacts()}
          />
        )
      }
      setCustomLeadColumns([...customLeadColumns, newColumn])
    } catch (error) {
      console.error('Failed to create custom field:', error)
    }
  }
  
  const handleDeleteContactColumn = (columnId: string) => {
    // Check if it's a custom column
    const isCustom = customContactColumns.some(col => col.id === columnId)
    
    if (isCustom) {
      // Remove from custom columns
      setCustomContactColumns(prev => prev.filter(col => col.id !== columnId))
      utils.workspaceConfig.getCustomFields.invalidate()
    } else {
      // It's a default column, just hide it (add to hidden columns list)
      setHiddenContactColumns(prev => {
        const newHidden = prev.includes(columnId) ? prev : [...prev, columnId]
        // Save to localStorage immediately
        localStorage.setItem('hiddenContactColumns', JSON.stringify(newHidden))
        return newHidden
      })
    }
  }
  
  const handleDeleteDealColumn = (columnId: string) => {
    // Check if it's a custom column
    const isCustom = customDealColumns.some(col => col.id === columnId)
    
    if (isCustom) {
      // Remove from custom columns
      setCustomDealColumns(prev => prev.filter(col => col.id !== columnId))
      utils.workspaceConfig.getCustomFields.invalidate()
    } else {
      // It's a default column, just hide it (add to hidden columns list)
      setHiddenDealColumns(prev => {
        const newHidden = prev.includes(columnId) ? prev : [...prev, columnId]
        // Save to localStorage immediately
        localStorage.setItem('hiddenDealColumns', JSON.stringify(newHidden))
        return newHidden
      })
    }
  }
  
  const handleDeleteCompanyColumn = (columnId: string) => {
    // Check if it's a custom column
    const isCustom = customCompanyColumns.some(col => col.id === columnId)
    
    if (isCustom) {
      // Remove from custom columns
      setCustomCompanyColumns(prev => prev.filter(col => col.id !== columnId))
      utils.workspaceConfig.getCustomFields.invalidate()
    } else {
      // It's a default column, just hide it (add to hidden columns list)
      setHiddenCompanyColumns(prev => {
        const newHidden = prev.includes(columnId) ? prev : [...prev, columnId]
        // Save to localStorage immediately
        localStorage.setItem('hiddenCompanyColumns', JSON.stringify(newHidden))
        return newHidden
      })
    }
  }
  
  const handleDeleteLeadColumn = (columnId: string) => {
    // Check if it's a custom column
    const isCustom = customLeadColumns.some(col => col.id === columnId)
    
    if (isCustom) {
      // Remove from custom columns
      setCustomLeadColumns(prev => prev.filter(col => col.id !== columnId))
      utils.workspaceConfig.getCustomFields.invalidate()
    } else {
      // It's a default column, just hide it (add to hidden columns list)
      setHiddenLeadColumns(prev => {
        const newHidden = prev.includes(columnId) ? prev : [...prev, columnId]
        // Save to localStorage immediately
        localStorage.setItem('hiddenLeadColumns', JSON.stringify(newHidden))
        return newHidden
      })
    }
  }

  // Define columns for all entity types
  const dealColumns: Column[] = [
    {
      id: 'name',
      label: 'Deal Name',
      accessor: 'name',
      sortable: true,
      isCustomField: true, // Enable dropdown menu
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
          <div>
            <div className="text-sm text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{row.company}</div>
          </div>
        </div>
      )
    },
    {
      id: 'stage',
      label: 'Stage',
      accessor: 'stage',
      width: 'w-36',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => {
        const colors = {
          'Prospecting': 'bg-blue-100 text-blue-700',
          'Qualification': 'bg-purple-100 text-purple-700',
          'Proposal': 'bg-amber-100 text-amber-700',
          'Negotiation': 'bg-orange-100 text-orange-700',
          'Closed Won': 'bg-green-100 text-green-700',
          'Closed Lost': 'bg-gray-100 text-gray-700'
        }
        return (
          <span className={`px-3 py-1 text-xs font-medium rounded-md ${colors[value] || 'bg-gray-100 text-gray-700'}`}>
            {value}
          </span>
        )
      }
    },
    {
      id: 'value',
      label: 'Value',
      accessor: 'value',
      sortable: true,
      width: 'w-32',
      isCustomField: true, // Enable dropdown menu
      render: (value: number) => (
        <span className="text-sm text-gray-700">${(value / 1000).toFixed(0)}K</span>
      )
    },
    {
      id: 'probability',
      label: 'Probability',
      accessor: 'probability',
      sortable: true,
      width: 'w-28',
      isCustomField: true, // Enable dropdown menu
      render: (value: number) => (
        <span className="text-sm text-gray-700">{value}%</span>
      )
    },
    {
      id: 'closeDate',
      label: 'Close Date',
      accessor: 'closeDate',
      sortable: true,
      width: 'w-32',
      isCustomField: true, // Enable dropdown menu
      render: (value: Date) => (
        <span className="text-sm text-gray-700">{new Date(value).toLocaleDateString()}</span>
      )
    },
    {
      id: 'owner',
      label: 'Owner',
      accessor: 'owner',
      width: 'w-32',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => (
        <span className="text-sm text-gray-700">{value || '—'}</span>
      )
    }
  ]

  const companyColumns: Column[] = [
    {
      id: 'name',
      label: 'Company',
      accessor: 'name',
      sortable: true,
      isCustomField: true, // Enable dropdown menu
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
          <div>
            <div className="text-sm text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{row.domain}</div>
          </div>
        </div>
      )
    },
    {
      id: 'industry',
      label: 'Industry',
      accessor: 'industry',
      width: 'w-36',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => (
        <span className="text-sm text-gray-700">{value || '—'}</span>
      )
    },
    {
      id: 'size',
      label: 'Size',
      accessor: 'size',
      width: 'w-32',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => (
        <span className="text-sm text-gray-700">{value || '—'}</span>
      )
    },
    {
      id: 'location',
      label: 'Location',
      accessor: 'location',
      width: 'w-40',
      isCustomField: true, // Enable dropdown menu
      render: (value: string) => (
        <span className="text-sm text-gray-700">{value || '—'}</span>
      )
    },
    {
      id: 'contacts',
      label: 'Contacts',
      accessor: 'id',
      sortable: false,
      width: 'w-24',
      isCustomField: true, // Enable dropdown menu
      render: (_: any, row: any) => {
        const companyContacts = contacts.filter(c => 
          c.companyId === row.id || c.company === row.name
        )
        return (
          <span className="text-sm text-gray-700">{companyContacts.length}</span>
        )
      }
    },
    {
      id: 'deals',
      label: 'Active Deals',
      accessor: 'id',
      sortable: false,
      width: 'w-28',
      isCustomField: true, // Enable dropdown menu
      render: (_: any, row: any) => {
        const companyDeals = deals.filter(d => 
          d.companyId === row.id || d.company === row.name
        )
        const activeDeals = companyDeals.filter(d => 
          d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
        )
        return (
          <span className="text-sm text-gray-700">{activeDeals.length}</span>
        )
      }
    },
    {
      id: 'value',
      label: 'Pipeline Value',
      accessor: 'id',
      sortable: false,
      width: 'w-32',
      render: (_: any, row: any) => {
        const companyDeals = deals.filter(d => 
          d.companyId === row.id || d.company === row.name
        )
        const totalValue = companyDeals
          .filter(d => d.stage !== 'Closed Lost')
          .reduce((sum, d) => sum + d.value, 0)
        
        return (
          <span className="text-sm text-gray-700">
            {totalValue > 0 ? `$${(totalValue / 1000).toFixed(0)}K` : '—'}
          </span>
        )
      }
    },
    {
      id: 'lastActivity',
      label: 'Last Activity',
      accessor: 'lastActivity',
      sortable: true,
      width: 'w-32',
      render: (value: Date) => {
        const days = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))
        return (
          <span className="text-sm text-gray-500">{days}d ago</span>
        )
      }
    }
  ]


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CRMHeader
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateContact={() => setShowCreateContact(true)}
        onCreateCompany={() => setShowCreateCompany(true)}
        onCreateDeal={() => setShowCreateDeal(true)}
      />

      {/* Tabs with Customize Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.white
      }}>
        <CRMTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <div style={{
          padding: `0 ${theme.spacing.lg}`,
          display: 'flex',
          gap: theme.spacing.sm
        }}>
          <button
            onClick={() => router.push('/dashboard/crm/customize')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              cursor: 'pointer',
              transition: theme.transitions.base,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.softGreen
              e.currentTarget.style.borderColor = theme.colors.evergreen
              e.currentTarget.style.color = theme.colors.evergreen
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = theme.colors.border
              e.currentTarget.style.color = theme.colors.text
            }}
          >
            <Settings size={16} />
            Customize
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={activeTab === 'overview' ? 'p-6 bg-gray-50' : ''}>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics */}
            <PremiumMetricGrid>
              {metrics.map((metric, index) => (
                <PremiumMetricCard key={index} {...metric} />
              ))}
            </PremiumMetricGrid>

            {/* Pipeline with Drag & Drop */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Sales Pipeline
              </h2>
              <PremiumDealPipeline
                onDealClick={(dealId) => router.push(`/dashboard/crm/deals/${dealId}`)}
                onCreateDeal={(stageId) => {
                  console.log('Create deal in stage:', stageId)
                  setShowCreateDeal(true)
                }}
                showMetrics={true}
              />
            </div>

            {/* Recent Contacts */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Contacts
              </h2>
              <CleanTaskTable
                columns={contactColumns.filter(col => !hiddenContactColumns.includes(col.id))}
                data={filteredContacts.slice(0, 5)}
                onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
              />
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div>
            {/* Sub-tabs for Contacts */}
            <div style={{
              backgroundColor: theme.colors.white,
              borderBottom: `1px solid ${theme.colors.border}`,
              paddingLeft: theme.spacing['2xl'],
              paddingRight: theme.spacing['2xl'],
            }}>
              <div style={{
                display: 'flex',
                gap: theme.spacing.lg,
              }}>
                <button
                  onClick={() => setContactSubTab('my-contacts')}
                  style={{
                    padding: `${theme.spacing.md} 0`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: contactSubTab === 'my-contacts'
                      ? `2px solid ${theme.colors.evergreen}`
                      : '2px solid transparent',
                    color: contactSubTab === 'my-contacts' 
                      ? theme.colors.evergreen 
                      : theme.colors.mediumGray,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  My Contacts
                  <span style={{
                    backgroundColor: contactSubTab === 'my-contacts'
                      ? theme.colors.evergreen
                      : theme.colors.lightGray,
                    color: contactSubTab === 'my-contacts'
                      ? theme.colors.white
                      : theme.colors.mediumGray,
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.medium,
                    padding: '2px 6px',
                    borderRadius: theme.borderRadius.sm,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {myContacts.length > 99 ? '99+' : myContacts.length}
                  </span>
                </button>
                
                <button
                  onClick={() => setContactSubTab('imported')}
                  style={{
                    padding: `${theme.spacing.md} 0`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: contactSubTab === 'imported'
                      ? `2px solid ${theme.colors.evergreen}`
                      : '2px solid transparent',
                    color: contactSubTab === 'imported'
                      ? theme.colors.evergreen
                      : theme.colors.mediumGray,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  Imported Contacts
                  <span style={{
                    backgroundColor: contactSubTab === 'imported'
                      ? theme.colors.evergreen
                      : theme.colors.lightGray,
                    color: contactSubTab === 'imported'
                      ? theme.colors.white
                      : theme.colors.mediumGray,
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.medium,
                    padding: '2px 6px',
                    borderRadius: theme.borderRadius.sm,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {importedContacts.length > 999 ? '999+' : importedContacts.length}
                  </span>
                </button>
                
                <button
                  onClick={() => setContactSubTab('all')}
                  style={{
                    padding: `${theme.spacing.md} 0`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: contactSubTab === 'all'
                      ? `2px solid ${theme.colors.evergreen}`
                      : '2px solid transparent',
                    color: contactSubTab === 'all'
                      ? theme.colors.evergreen
                      : theme.colors.mediumGray,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium,
                    cursor: 'pointer',
                    transition: theme.transitions.fast,
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                  }}
                >
                  All Contacts
                  <span style={{
                    backgroundColor: contactSubTab === 'all'
                      ? theme.colors.evergreen
                      : theme.colors.lightGray,
                    color: contactSubTab === 'all'
                      ? theme.colors.white
                      : theme.colors.mediumGray,
                    fontSize: '12px',
                    fontWeight: theme.typography.fontWeight.medium,
                    padding: '2px 6px',
                    borderRadius: theme.borderRadius.sm,
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {contacts.length > 999 ? '999+' : contacts.length}
                  </span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Bulk operations toolbar for imported contacts */}
              {contactSubTab === 'imported' && selectedImportedContacts.length > 0 && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: theme.colors.softGreen,
                  borderRadius: theme.borderRadius.md,
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: theme.colors.evergreen,
                    fontSize: '14px',
                    fontWeight: 500
                  }}>
                    <CheckCircle size={18} />
                    {selectedImportedContacts.length} contacts selected
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => handlePromoteContacts(selectedImportedContacts)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: theme.colors.evergreen,
                        color: theme.colors.white,
                        border: 'none',
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <TrendingUp size={14} />
                      Promote to My Contacts
                    </button>
                    
                    <button
                      onClick={() => handleBulkDelete(selectedImportedContacts)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: 'transparent',
                        color: theme.colors.red,
                        border: `1px solid ${theme.colors.red}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                    
                    <button
                      onClick={() => setSelectedImportedContacts([])}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: 'transparent',
                        color: theme.colors.mediumGray,
                        border: `1px solid ${theme.colors.lightGray}`,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              <CleanTaskTable
                columns={[...contactColumns, ...customContactColumns].filter(col => !hiddenContactColumns.includes(col.id))}
                data={filteredContacts}
                onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
                onRowEdit={handleContactEdit}
                onRowDelete={handleContactDelete}
                selectedRows={contactSubTab === 'imported' ? selectedImportedContacts : selectedContacts}
                onSelectionChange={contactSubTab === 'imported' ? setSelectedImportedContacts : setSelectedContacts}
                entityType="contact"
                showAddColumn={true}
                onAddColumn={handleAddContactColumn}
                onDeleteColumn={handleDeleteContactColumn}
              />
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="p-6">
            <CleanTaskTable
            columns={[...leadColumns, ...customLeadColumns].filter(col => !hiddenLeadColumns.includes(col.id))}
            data={filteredLeads}
            onRowClick={(row) => router.push(`/dashboard/crm/leads/${row.id}`)}
            onRowEdit={(row) => console.log('Edit lead', row)}
            onRowDelete={(row) => console.log('Delete lead', row)}
            selectedRows={selectedLeads}
            onSelectionChange={setSelectedLeads}
            entityType="lead"
            showAddColumn={true}
            onAddColumn={handleAddLeadColumn}
            onDeleteColumn={handleDeleteLeadColumn}
          />
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="p-6">
            <CleanTaskTable
            columns={[...companyColumns, ...customCompanyColumns].filter(col => !hiddenCompanyColumns.includes(col.id))}
            data={filteredCompanies}
            onRowClick={(row) => router.push(`/dashboard/crm/companies/${row.id}`)}
            onRowEdit={(row) => console.log('Edit company', row)}
            onRowDelete={(row) => console.log('Delete company', row)}
            selectedRows={selectedCompanies}
            onSelectionChange={setSelectedCompanies}
            entityType="company"
            showAddColumn={true}
            onAddColumn={handleAddCompanyColumn}
            onDeleteColumn={handleDeleteCompanyColumn}
          />
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="p-6">
            <CleanTaskTable
            columns={[...dealColumns, ...customDealColumns].filter(col => !hiddenDealColumns.includes(col.id))}
            data={filteredDeals}
            onRowClick={(row) => router.push(`/dashboard/crm/deals/${row.id}`)}
            onRowEdit={(row) => console.log('Edit deal', row)}
            onRowDelete={(row) => console.log('Delete deal', row)}
            selectedRows={selectedDeals}
            onSelectionChange={setSelectedDeals}
            entityType="deal"
            showAddColumn={true}
            onAddColumn={handleAddDealColumn}
            onDeleteColumn={handleDeleteDealColumn}
          />
          </div>
        )}

      </div>

      {/* Contact Create Sidebar - New Premium Experience */}
      <ContactCreateSidebar
        isOpen={showCreateContact}
        onClose={() => setShowCreateContact(false)}
        onSuccess={(contact) => {
          console.log('Contact created:', contact)
          setShowCreateContact(false)
          refreshContacts()
        }}
        onCreateAnother={() => {
          console.log('Creating another contact')
          refreshContacts()
        }}
      />
    </div>
  )
}