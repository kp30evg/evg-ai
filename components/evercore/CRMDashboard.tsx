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
import MetricGrid from '@/components/evercore/dashboard/MetricGrid'
import MetricCard from '@/components/evercore/dashboard/MetricCard'
import PipelineKanban from '@/components/evercore/dashboard/PipelineKanban'
import DealPipelineDragDrop from '@/components/evercore/features/DealPipelineDragDrop'
import EntityTable, { Column } from '@/components/evercore/entities/EntityTable'
import EditableCell from '@/components/evercore/cells/EditableCell'
import ContactCreateModal from '@/components/evercore/features/ContactCreateModal'
import { Badge } from '@/components/ui/badge'
import * as Icons from 'lucide-react'
import { 
  Users, 
  Building2, 
  Target, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  Package,
  ShoppingCart,
  Mail,
  Database,
  Sparkles,
  Settings,
  Plus
} from 'lucide-react'

export default function CRMDashboard() {
  const { organization } = useOrganization()
  const router = useRouter()
  const { 
    contacts, 
    leads,
    deals, 
    companies, 
    products,
    orders,
    getMetrics,
    deleteContacts,
    updateContact,
    refreshContacts
  } = useCRM()
  const { navigation, config, loading: configLoading } = useWorkspaceConfig()
  
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedDeals, setSelectedDeals] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [showCreateContact, setShowCreateContact] = useState(false)
  const [showCreateDeal, setShowCreateDeal] = useState(false)
  const [showCreateCompany, setShowCreateCompany] = useState(false)
  const [customFieldsLoaded, setCustomFieldsLoaded] = useState(false)
  
  // Dynamic columns state
  const [customContactColumns, setCustomContactColumns] = useState<Column[]>([])
  const [customDealColumns, setCustomDealColumns] = useState<Column[]>([])
  const [customCompanyColumns, setCustomCompanyColumns] = useState<Column[]>([])  
  const [customLeadColumns, setCustomLeadColumns] = useState<Column[]>([])
  
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
      trpc.workspaceConfig.getCustomFields.invalidate({ entityType: 'contact' })
    }
  })
  
  const createDealField = trpc.workspaceConfig.createCustomField.useMutation({
    onSuccess: () => {
      trpc.workspaceConfig.getCustomFields.invalidate({ entityType: 'deal' })
    }
  })
  
  const createCompanyField = trpc.workspaceConfig.createCustomField.useMutation({
    onSuccess: () => {
      trpc.workspaceConfig.getCustomFields.invalidate({ entityType: 'company' })
    }
  })
  
  const createLeadField = trpc.workspaceConfig.createCustomField.useMutation({
    onSuccess: () => {
      trpc.workspaceConfig.getCustomFields.invalidate({ entityType: 'lead' })
    }
  })

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
      case 'contact': return contacts.length
      case 'company': return companies.length
      case 'deal': return deals.length
      case 'product': return products.length
      case 'order': return orders.length
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
        { id: 'deals', label: 'Deals', icon: Target, badge: deals.length },
        { id: 'products', label: 'Products', icon: Package, badge: products.length },
        { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: orders.length }
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
  }, [navigation, leads.length, contacts.length, companies.length, deals.length, products.length, orders.length])

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
      width: '280px',
      render: (value: string, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{value}</span>
            {/* Source badges */}
            {row.isFromEmail && (
              <Badge style={{ 
                backgroundColor: theme.colors.info + '20', 
                color: theme.colors.info,
                fontSize: '10px',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Mail size={10} />
                Email
              </Badge>
            )}
            {row.isFromDatabase && (
              <Badge style={{ 
                backgroundColor: theme.colors.success + '20', 
                color: theme.colors.success,
                fontSize: '10px',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Database size={10} />
                Synced
              </Badge>
            )}
            {!row.isFromDatabase && !row.isFromEmail && (
              <Badge style={{ 
                backgroundColor: theme.colors.softGreen, 
                color: theme.colors.evergreen,
                fontSize: '10px',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Sparkles size={10} />
                Local
              </Badge>
            )}
          </div>
          <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.mediumGray }}>
            {row.title}
          </span>
        </div>
      )
    },
    {
      id: 'company',
      label: 'Company',
      accessor: 'company',
      sortable: true,
      width: '200px',
      render: (value: string, row: any) => {
        // If we have companyData, make it clickable
        if (row.companyData) {
          return (
            <div
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/dashboard/crm/companies/${row.companyData.id}`)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                cursor: 'pointer',
                color: theme.colors.evergreen,
                fontWeight: theme.typography.fontWeight.medium,
                transition: theme.transitions.base,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              <Building2 size={14} />
              {row.companyData.name}
            </div>
          )
        }
        // Fallback to text display
        return value || <span style={{ color: theme.colors.mediumGray }}>—</span>
      }
    },
    {
      id: 'email',
      label: 'Email',
      accessor: 'email',
      width: '250px',
      render: (value: string) => (
        <a href={`mailto:${value}`} style={{ color: theme.colors.evergreen }}>
          {value}
        </a>
      )
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      width: '140px',
      render: (value: string) => {
        const colors = {
          Hot: theme.colors.error,
          Warm: theme.colors.warning,
          Cold: theme.colors.info
        }
        return (
          <Badge style={{ backgroundColor: colors[value as keyof typeof colors] + '20', color: colors[value as keyof typeof colors] }}>
            {value}
          </Badge>
        )
      }
    },
    {
      id: 'dealValue',
      label: 'Deal Value',
      accessor: 'dealValue',
      sortable: true,
      width: '140px',
      render: (value: number) => `$${(value / 1000).toFixed(0)}K`
    },
    {
      id: 'lastContact',
      label: 'Last Contact',
      accessor: 'lastContact',
      sortable: true,
      width: '160px',
      render: (value: Date) => {
        const days = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))
        return `${days} days ago`
      }
    }
  ]

  const leadColumns: Column[] = [
    {
      id: 'name',
      label: 'Name',
      accessor: 'name',
      sortable: true,
      render: (value: string, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{value}</span>
          <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
            {row.email}
          </span>
        </div>
      )
    },
    {
      id: 'company',
      label: 'Company',
      accessor: 'company',
      sortable: true
    },
    {
      id: 'source',
      label: 'Source',
      accessor: 'source'
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      render: (value: string) => {
        const colors = {
          New: theme.colors.info,
          Contacted: theme.colors.warning,
          Qualified: theme.colors.success,
          Unqualified: theme.colors.mediumGray
        }
        return (
          <Badge style={{ backgroundColor: colors[value as keyof typeof colors] + '20', color: colors[value as keyof typeof colors] }}>
            {value}
          </Badge>
        )
      }
    },
    {
      id: 'score',
      label: 'Score',
      accessor: 'score',
      sortable: true,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <div style={{
            width: '60px',
            height: '6px',
            backgroundColor: theme.colors.lightGray,
            borderRadius: theme.borderRadius.full,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${value}%`,
              height: '100%',
              backgroundColor: value > 70 ? theme.colors.success : value > 40 ? theme.colors.warning : theme.colors.error,
              transition: theme.transitions.base
            }} />
          </div>
          <span>{value}</span>
        </div>
      )
    },
    {
      id: 'createdAt',
      label: 'Created',
      accessor: 'createdAt',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString()
    }
  ]

  // Filter data based on search
  const filteredContacts = contacts.filter(c => 
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
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
  
  // Handle adding custom columns
  const handleAddContactColumn = async (field: any) => {
    try {
      // First, save the field to the database
      const createdField = await createContactField.mutateAsync(field)
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
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
      const createdField = await createDealField.mutateAsync(field)
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
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
      const createdField = await createCompanyField.mutateAsync(field)
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
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
      const createdField = await createLeadField.mutateAsync(field)
      
      // Use the returned field ID from the database
      const fieldId = createdField.id || createdField.name || field.name
      
      // Then add it to the local state for immediate UI update
      const newColumn: Column = {
        id: fieldId,
        label: field.label,
        accessor: `data.customFields.${fieldId}.value`,
        sortable: field.sortable !== false,
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

  // Define columns for all entity types
  const dealColumns: Column[] = [
    {
      id: 'name',
      label: 'Deal Name',
      accessor: 'name',
      sortable: true,
      render: (value: string, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{value}</span>
          <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.mediumGray }}>
            {row.company}
          </span>
        </div>
      )
    },
    {
      id: 'stage',
      label: 'Stage',
      accessor: 'stage',
      render: (value: string) => {
        const stageColors: Record<string, string> = {
          'Prospecting': theme.colors.stages.prospecting,
          'Qualification': theme.colors.stages.qualification,
          'Proposal': theme.colors.stages.proposal,
          'Negotiation': theme.colors.stages.negotiation,
          'Closed Won': theme.colors.stages.closedWon,
          'Closed Lost': theme.colors.stages.closedLost
        }
        return (
          <Badge style={{ backgroundColor: stageColors[value] + '20', color: stageColors[value] }}>
            {value}
          </Badge>
        )
      }
    },
    {
      id: 'value',
      label: 'Value',
      accessor: 'value',
      sortable: true,
      render: (value: number) => `$${(value / 1000).toFixed(0)}K`
    },
    {
      id: 'probability',
      label: 'Probability',
      accessor: 'probability',
      sortable: true,
      render: (value: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <div style={{
            width: '60px',
            height: '6px',
            backgroundColor: theme.colors.lightGray,
            borderRadius: theme.borderRadius.full,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${value}%`,
              height: '100%',
              backgroundColor: value > 60 ? theme.colors.success : value > 30 ? theme.colors.warning : theme.colors.error,
              transition: theme.transitions.base
            }} />
          </div>
          <span>{value}%</span>
        </div>
      )
    },
    {
      id: 'closeDate',
      label: 'Close Date',
      accessor: 'closeDate',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString()
    },
    {
      id: 'owner',
      label: 'Owner',
      accessor: 'owner'
    }
  ]

  const companyColumns: Column[] = [
    {
      id: 'name',
      label: 'Company',
      accessor: 'name',
      sortable: true,
      render: (value: string, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{value}</span>
          <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.mediumGray }}>
            {row.domain}
          </span>
        </div>
      )
    },
    {
      id: 'industry',
      label: 'Industry',
      accessor: 'industry'
    },
    {
      id: 'size',
      label: 'Size',
      accessor: 'size'
    },
    {
      id: 'location',
      label: 'Location',
      accessor: 'location'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      accessor: 'id',
      sortable: false,
      render: (_: any, row: any) => {
        // Count contacts linked to this company
        const companyContacts = contacts.filter(c => 
          c.companyId === row.id || c.company === row.name
        )
        return (
          <div
            onClick={(e) => {
              e.stopPropagation()
              // Could filter contacts view by company
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              cursor: companyContacts.length > 0 ? 'pointer' : 'default',
            }}
          >
            <Users size={14} color={theme.colors.mediumGray} />
            <span>{companyContacts.length}</span>
          </div>
        )
      }
    },
    {
      id: 'deals',
      label: 'Active Deals',
      accessor: 'id',
      sortable: false,
      render: (_: any, row: any) => {
        // Count deals linked to this company
        const companyDeals = deals.filter(d => 
          d.companyId === row.id || d.company === row.name
        )
        const activeDeals = companyDeals.filter(d => 
          d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
        )
        return (
          <div
            onClick={(e) => {
              e.stopPropagation()
              // Could filter deals view by company
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              cursor: activeDeals.length > 0 ? 'pointer' : 'default',
            }}
          >
            <Target size={14} color={theme.colors.mediumGray} />
            <span>{activeDeals.length}</span>
          </div>
        )
      }
    },
    {
      id: 'value',
      label: 'Pipeline Value',
      accessor: 'id',
      sortable: false,
      render: (_: any, row: any) => {
        // Calculate total pipeline value for this company
        const companyDeals = deals.filter(d => 
          d.companyId === row.id || d.company === row.name
        )
        const totalValue = companyDeals
          .filter(d => d.stage !== 'Closed Lost')
          .reduce((sum, d) => sum + d.value, 0)
        
        return totalValue > 0 ? (
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>
            ${(totalValue / 1000).toFixed(0)}K
          </span>
        ) : (
          <span style={{ color: theme.colors.mediumGray }}>—</span>
        )
      }
    },
    {
      id: 'lastActivity',
      label: 'Last Activity',
      accessor: 'lastActivity',
      sortable: true,
      render: (value: Date) => {
        const days = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))
        return `${days} days ago`
      }
    }
  ]

  const productColumns: Column[] = [
    {
      id: 'name',
      label: 'Product Name',
      accessor: 'name',
      sortable: true,
      render: (value: string, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{value}</span>
          <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
            SKU: {row.sku}
          </span>
        </div>
      )
    },
    {
      id: 'category',
      label: 'Category',
      accessor: 'category'
    },
    {
      id: 'price',
      label: 'Price',
      accessor: 'price',
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      id: 'cost',
      label: 'Cost',
      accessor: 'cost',
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      id: 'margin',
      label: 'Margin',
      accessor: (row: any) => ((row.price - row.cost) / row.price * 100),
      sortable: true,
      render: (value: number) => `${value.toFixed(0)}%`
    },
    {
      id: 'inventory',
      label: 'Inventory',
      accessor: 'inventory',
      sortable: true,
      render: (value: number, row: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
          <span>{value}</span>
          {value === 0 && (
            <Badge style={{ backgroundColor: theme.colors.error + '20', color: theme.colors.error }}>
              Out of Stock
            </Badge>
          )}
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      render: (value: string) => {
        const colors = {
          Active: theme.colors.success,
          Inactive: theme.colors.warning,
          'Out of Stock': theme.colors.error
        }
        return (
          <Badge style={{ backgroundColor: colors[value as keyof typeof colors] + '20', color: colors[value as keyof typeof colors] }}>
            {value}
          </Badge>
        )
      }
    }
  ]

  const orderColumns: Column[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      accessor: 'orderNumber',
      sortable: true,
      render: (value: string) => (
        <span style={{ fontWeight: theme.typography.fontWeight.medium, color: theme.colors.evergreen }}>
          {value}
        </span>
      )
    },
    {
      id: 'customerName',
      label: 'Customer',
      accessor: 'customerName',
      sortable: true,
      render: (value: string, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>{value}</span>
          <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
            {row.customerEmail}
          </span>
        </div>
      )
    },
    {
      id: 'lineItems',
      label: 'Products',
      accessor: (row: any) => row.lineItems.length,
      sortable: true
    },
    {
      id: 'total',
      label: 'Total',
      accessor: 'total',
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      render: (value: string) => {
        const colors = {
          Pending: theme.colors.warning,
          Processing: theme.colors.info,
          Shipped: theme.colors.stages.proposal,
          Delivered: theme.colors.success,
          Cancelled: theme.colors.error
        }
        return (
          <Badge style={{ backgroundColor: colors[value as keyof typeof colors] + '20', color: colors[value as keyof typeof colors] }}>
            {value}
          </Badge>
        )
      }
    },
    {
      id: 'orderDate',
      label: 'Order Date',
      accessor: 'orderDate',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString()
    },
    {
      id: 'deliveryDate',
      label: 'Delivery',
      accessor: 'deliveryDate',
      sortable: true,
      render: (value?: Date) => value ? new Date(value).toLocaleDateString() : 'TBD'
    }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      fontFamily: theme.typography.fontFamily,
    }}>
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
      <div style={{ padding: activeTab === 'overview' ? theme.spacing.xl : 0 }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
            {/* Metrics */}
            <MetricGrid>
              {metrics.map((metric, index) => (
                <MetricCard key={index} {...metric} />
              ))}
            </MetricGrid>

            {/* Pipeline with Drag & Drop */}
            <div>
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Sales Pipeline
              </h2>
              <DealPipelineDragDrop
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
              <h2 style={{
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text,
                marginBottom: theme.spacing.lg
              }}>
                Recent Contacts
              </h2>
              <EntityTable
                columns={contactColumns}
                data={filteredContacts.slice(0, 5)}
                onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
              />
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div style={{ padding: `${theme.spacing.xl} ${theme.spacing.xl} ${theme.spacing.xl} ${theme.spacing.xl}` }}>
            <EntityTable
              columns={[...contactColumns, ...customContactColumns]}
              data={filteredContacts}
              onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
              onRowEdit={handleContactEdit}
              onRowDelete={handleContactDelete}
              selectedRows={selectedContacts}
              onSelectionChange={setSelectedContacts}
              sortBy="name"
              sortDirection="asc"
              entityType="contact"
              showAddColumn={true}
              onAddColumn={handleAddContactColumn}
            />
          </div>
        )}

        {activeTab === 'leads' && (
          <div style={{ padding: theme.spacing.xl }}>
            <EntityTable
            columns={[...leadColumns, ...customLeadColumns]}
            data={filteredLeads}
            onRowClick={(row) => router.push(`/dashboard/crm/leads/${row.id}`)}
            onRowEdit={(row) => console.log('Edit lead', row)}
            onRowDelete={(row) => console.log('Delete lead', row)}
            selectedRows={selectedLeads}
            onSelectionChange={setSelectedLeads}
            sortBy="score"
            sortDirection="desc"
            entityType="lead"
            showAddColumn={true}
            onAddColumn={handleAddLeadColumn}
          />
          </div>
        )}

        {activeTab === 'companies' && (
          <div style={{ padding: theme.spacing.xl }}>
            <EntityTable
            columns={[...companyColumns, ...customCompanyColumns]}
            data={filteredCompanies}
            onRowClick={(row) => router.push(`/dashboard/crm/companies/${row.id}`)}
            onRowEdit={(row) => console.log('Edit company', row)}
            onRowDelete={(row) => console.log('Delete company', row)}
            selectedRows={selectedCompanies}
            onSelectionChange={setSelectedCompanies}
            sortBy="value"
            sortDirection="desc"
            entityType="company"
            showAddColumn={true}
            onAddColumn={handleAddCompanyColumn}
          />
          </div>
        )}

        {activeTab === 'deals' && (
          <div style={{ padding: theme.spacing.xl }}>
            <EntityTable
            columns={[...dealColumns, ...customDealColumns]}
            data={filteredDeals}
            onRowClick={(row) => router.push(`/dashboard/crm/deals/${row.id}`)}
            onRowEdit={(row) => console.log('Edit deal', row)}
            onRowDelete={(row) => console.log('Delete deal', row)}
            selectedRows={selectedDeals}
            onSelectionChange={setSelectedDeals}
            sortBy="value"
            sortDirection="desc"
            entityType="deal"
            showAddColumn={true}
            onAddColumn={handleAddDealColumn}
          />
          </div>
        )}

        {activeTab === 'products' && (
          <div style={{ padding: theme.spacing.xl }}>
            <EntityTable
            columns={productColumns}
            data={filteredProducts}
            onRowClick={(row) => router.push(`/dashboard/crm/products/${row.id}`)}
            onRowEdit={(row) => console.log('Edit product', row)}
            onRowDelete={(row) => console.log('Delete product', row)}
            selectedRows={selectedProducts}
            onSelectionChange={setSelectedProducts}
            sortBy="name"
            sortDirection="asc"
          />
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={{ padding: theme.spacing.xl }}>
            <EntityTable
            columns={orderColumns}
            data={filteredOrders}
            onRowClick={(row) => router.push(`/dashboard/crm/orders/${row.id}`)}
            onRowEdit={(row) => console.log('Edit order', row)}
            onRowDelete={(row) => console.log('Delete order', row)}
            selectedRows={selectedOrders}
            onSelectionChange={setSelectedOrders}
            sortBy="orderDate"
            sortDirection="desc"
          />
          </div>
        )}
      </div>

      {/* Contact Create Modal */}
      <ContactCreateModal
        isOpen={showCreateContact}
        onClose={() => setShowCreateContact(false)}
        onSuccess={(contact) => {
          console.log('Contact created:', contact)
          setShowCreateContact(false)
        }}
      />
    </div>
  )
}