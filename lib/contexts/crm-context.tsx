'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { trpc } from '@/lib/trpc/client'

// Types matching our CRM entities
export interface Contact {
  id: string
  name: string
  email: string
  company?: string           // Company name for display (legacy)
  companyId?: string        // ID reference to company entity
  companyData?: Company     // Full company object for rich display
  title?: string
  phone?: string
  lastContact: Date
  dealValue: number
  status: 'Hot' | 'Warm' | 'Cold'
  source: string
  tags?: string[]
  customFields?: Record<string, any>
  activities?: Activity[]
  isFromEmail?: boolean      // Added: indicates if from email sync
  isFromDatabase?: boolean   // Added: indicates if from database
  createdAt?: Date          // Added: creation timestamp
  contactSource?: 'manual' | 'imported' | 'promoted' // Track origin of contact
  importedFrom?: string     // Source of import (gmail, outlook, csv)
  importedAt?: Date         // When imported
  promotedAt?: Date         // When promoted to My Contacts
  promotedBy?: string       // User who promoted
}

export interface Lead {
  id: string
  name: string
  email: string
  company?: string
  source: string
  status: 'New' | 'Contacted' | 'Qualified' | 'Unqualified'
  score: number
  assignedTo?: string
  createdAt: Date
  lastActivity: Date
}

export interface Deal {
  id: string
  name: string
  company: string
  value: number
  stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
  probability: number
  closeDate: Date
  owner: string
  contactId?: string
  companyId?: string
  products?: string[]
  lastActivity: Date
}

export interface Company {
  id: string
  name: string
  domain: string
  industry: string
  size: string
  location: string
  deals: number
  value: number
  lastActivity: Date
  contacts?: string[]
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  price: number
  cost: number
  inventory: number
  status: 'Active' | 'Inactive' | 'Out of Stock'
  createdAt: Date
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  lineItems: OrderLineItem[]
  subtotal: number
  tax: number
  total: number
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  orderDate: Date
  deliveryDate?: Date
}

export interface OrderLineItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

export interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  title: string
  description?: string
  entityType: 'contact' | 'lead' | 'deal' | 'company'
  entityId: string
  createdAt: Date
  createdBy: string
  dueDate?: Date
  completed?: boolean
  duration?: number
  outcome?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: string
  variables: string[]
  sharedWithTeam: boolean
  usageCount: number
  createdAt: Date
}

// Context State Interface
interface CRMContextState {
  // Entities
  contacts: Contact[]
  leads: Lead[]
  deals: Deal[]
  companies: Company[]
  products: Product[]
  orders: Order[]
  activities: Activity[]
  emailTemplates: EmailTemplate[]
  
  // UI State
  selectedEntityIds: string[]
  searchQuery: string
  filters: Record<string, any>
  sorting: { field: string; direction: 'asc' | 'desc' }
  
  // Actions - Contacts
  createContact: (contact: Omit<Contact, 'id'>) => Promise<Contact>
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  deleteContacts: (ids: string[]) => Promise<void>
  
  // Actions - Leads
  createLead: (lead: Omit<Lead, 'id' | 'score' | 'createdAt' | 'lastActivity'>) => Promise<Lead>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>
  convertLeadToContact: (leadId: string) => Promise<Contact>
  calculateLeadScore: (leadId: string) => number
  
  // Actions - Deals
  createDeal: (deal: Omit<Deal, 'id'>) => Promise<Deal>
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>
  moveDealToStage: (dealId: string, stage: Deal['stage']) => Promise<void>
  
  // Actions - Activities
  logActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'createdBy'>) => Promise<Activity>
  completeActivity: (activityId: string) => Promise<void>
  getActivitiesForEntity: (entityType: string, entityId: string) => Activity[]
  
  // Actions - Email Templates
  createEmailTemplate: (template: Omit<EmailTemplate, 'id' | 'usageCount' | 'createdAt'>) => Promise<EmailTemplate>
  applyEmailTemplate: (templateId: string, variables: Record<string, string>) => string
  
  // Actions - Orders
  createOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'orderDate'>) => Promise<Order>
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>
  
  // Actions - Search & Filter
  setSearchQuery: (query: string) => void
  setFilters: (filters: Record<string, any>) => void
  setSorting: (field: string, direction: 'asc' | 'desc') => void
  
  // Actions - Import/Export
  importFromCSV: (entityType: string, data: any[]) => Promise<void>
  exportToCSV: (entityType: string, ids?: string[]) => string
  
  // Actions - Refresh
  refreshContacts: () => void
  
  // Metrics
  getMetrics: () => {
    revenue: number
    activeDeals: number
    winRate: number
    pipelineValue: number
    avgDealSize: number
  }
}

// Create context
const CRMContext = createContext<CRMContextState | undefined>(undefined)

// Context Provider Component
export function CRMProvider({ children }: { children: ReactNode }) {
  // Entity States - Initialize with empty arrays (no mock data)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  
  // UI States
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [sorting, setSorting] = useState({ field: 'name', direction: 'asc' as const })

  // Fetch database contacts
  const { data: dbContacts, refetch: refetchDBContacts } = trpc.unified.getDBContacts.useQuery(
    { limit: 200, includeEmailImports: true },
    { 
      enabled: typeof window !== 'undefined',
      staleTime: 30000, // Cache for 30 seconds
    }
  )
  
  // Fetch database companies
  const { data: dbCompanies, refetch: refetchDBCompanies } = trpc.unified.getCompanies.useQuery(
    { limit: 100 },
    {
      enabled: typeof window !== 'undefined',
      staleTime: 30000, // Cache for 30 seconds
    }
  )
  
  // Load data from localStorage and merge with database
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return
    
    const loadData = async () => {
      try {
        // Load from localStorage first
        const stored = localStorage.getItem('crm_data')
        let localContacts: Contact[] = []
        
        if (stored) {
          const data = JSON.parse(stored)
          
          // Check if stored data has meaningful content (not just empty arrays)
          const hasData = (data.contacts?.length > 0 || 
                          data.leads?.length > 0 || 
                          data.deals?.length > 0 || 
                          data.companies?.length > 0)
          
          if (hasData) {
            // Load local data with proper date conversion
            localContacts = data.contacts?.map((c: any) => ({
              ...c,
              lastContact: new Date(c.lastContact),
              createdAt: c.createdAt ? new Date(c.createdAt) : undefined
            })) || []
            
            if (data.leads?.length > 0) {
              setLeads(data.leads.map((l: any) => ({
                ...l,
                createdAt: new Date(l.createdAt),
                lastActivity: new Date(l.lastActivity)
              })))
            }
            
            if (data.deals?.length > 0) {
              setDeals(data.deals.map((d: any) => ({
                ...d,
                closeDate: new Date(d.closeDate),
                lastActivity: new Date(d.lastActivity)
              })))
            }
            
            if (data.companies?.length > 0) {
              setCompanies(data.companies.map((c: any) => ({
                ...c,
                lastActivity: new Date(c.lastActivity)
              })))
            }
            
            if (data.products?.length > 0) {
              setProducts(data.products.map((p: any) => ({
                ...p,
                createdAt: new Date(p.createdAt)
              })))
            }
            
            if (data.orders?.length > 0) {
              setOrders(data.orders.map((o: any) => ({
                ...o,
                orderDate: new Date(o.orderDate),
                deliveryDate: o.deliveryDate ? new Date(o.deliveryDate) : undefined
              })))
            }
            
            if (data.activities?.length > 0) {
              setActivities(data.activities.map((a: any) => ({
                ...a,
                createdAt: new Date(a.createdAt),
                dueDate: a.dueDate ? new Date(a.dueDate) : undefined
              })))
            }
            
            if (data.emailTemplates?.length > 0) {
              setEmailTemplates(data.emailTemplates.map((t: any) => ({
                ...t,
                createdAt: new Date(t.createdAt)
              })))
            }
          }
        }
        
        // Merge database contacts with local contacts
        if (dbContacts && dbContacts.length > 0) {
          const mergedContacts = mergeContacts(localContacts, dbContacts)
          setContacts(mergedContacts)
        } else if (localContacts.length > 0) {
          setContacts(localContacts)
        }
        
        // Merge database companies with local companies
        if (dbCompanies && dbCompanies.length > 0) {
          const localCompanies = stored && JSON.parse(stored).companies ? 
            JSON.parse(stored).companies.map((c: any) => ({
              ...c,
              lastActivity: new Date(c.lastActivity)
            })) : []
          
          const mergedCompanies = mergeCompanies(
            localCompanies,
            dbCompanies
          )
          setCompanies(mergedCompanies)
        }
        // If no data at all, sample data is already loaded as initial state
        
      } catch (error) {
        console.error('Failed to load CRM data:', error)
        // Keep sample data on error
      }
    }
    
    loadData()
  }, [dbContacts, dbCompanies])
  
  // Helper function to merge contacts and remove duplicates
  const mergeContacts = useCallback((local: Contact[], database: any[]): Contact[] => {
    const emailMap = new Map<string, Contact>()
    
    // Add database contacts first (they're the source of truth)
    database.forEach(dbContact => {
      if (dbContact.email) {
        // Extract company ID from relationships
        const companyId = dbContact.relationships?.company || dbContact.companyId
        
        emailMap.set(dbContact.email.toLowerCase(), {
          ...dbContact,
          companyId,
          company: dbContact.company || dbContact.companyName, // Keep legacy field
          lastContact: new Date(dbContact.lastContact),
          createdAt: dbContact.createdAt ? new Date(dbContact.createdAt) : undefined,
          isFromDatabase: true,
          contactSource: dbContact.contactSource || dbContact.data?.contactSource || 'manual',
          importedFrom: dbContact.importedFrom || dbContact.data?.importedFrom,
          importedAt: dbContact.importedAt || dbContact.data?.importedAt,
          promotedAt: dbContact.promotedAt || dbContact.data?.promotedAt,
          promotedBy: dbContact.promotedBy || dbContact.data?.promotedBy,
        } as Contact)
      }
    })
    
    // Add local contacts that don't exist in database
    local.forEach(localContact => {
      const email = localContact.email?.toLowerCase()
      if (email && !emailMap.has(email)) {
        emailMap.set(email, {
          ...localContact,
          lastContact: localContact.lastContact instanceof Date ? localContact.lastContact : new Date(localContact.lastContact),
          createdAt: localContact.createdAt ? (localContact.createdAt instanceof Date ? localContact.createdAt : new Date(localContact.createdAt)) : undefined
        })
      }
    })
    
    return Array.from(emailMap.values())
  }, [])
  
  // Helper function to merge companies and remove duplicates
  const mergeCompanies = useCallback((local: Company[], database: any[]): Company[] => {
    const companyMap = new Map<string, Company>()
    
    // Add database companies first (they're the source of truth)
    database.forEach(dbCompany => {
      const key = dbCompany.data?.domain || dbCompany.data?.name || dbCompany.id
      if (key) {
        companyMap.set(key.toLowerCase(), {
          id: dbCompany.id,
          name: dbCompany.data?.name || '',
          domain: dbCompany.data?.domain || '',
          industry: dbCompany.data?.industry || '',
          size: dbCompany.data?.size || '1-10',
          website: dbCompany.data?.website || dbCompany.data?.domain || '',
          description: dbCompany.data?.description || '',
          healthScore: dbCompany.data?.healthScore || 50,
          logo: dbCompany.data?.logo,
          address: dbCompany.data?.address,
          phone: dbCompany.data?.phone,
          tags: dbCompany.data?.tags || [],
          lastActivity: dbCompany.updatedAt ? new Date(dbCompany.updatedAt) : new Date(),
          isFromDatabase: true,
          // Store relationships for later use
          relationships: dbCompany.relationships || {},
        } as Company)
      }
    })
    
    // Add local companies that don't exist in database
    local.forEach(localCompany => {
      const key = localCompany.domain || localCompany.name
      if (key && !companyMap.has(key.toLowerCase())) {
        companyMap.set(key.toLowerCase(), {
          ...localCompany,
          lastActivity: localCompany.lastActivity instanceof Date ? localCompany.lastActivity : new Date(localCompany.lastActivity)
        })
      }
    })
    
    return Array.from(companyMap.values())
  }, [])

  // Save to localStorage whenever data changes
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return
    
    const saveToLocalStorage = () => {
      try {
        const data = {
          contacts,
          leads,
          deals,
          companies,
          products,
          orders,
          activities,
          emailTemplates
        }
        localStorage.setItem('crm_data', JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save CRM data to localStorage:', error)
      }
    }
    saveToLocalStorage()
  }, [contacts, leads, deals, companies, products, orders, activities, emailTemplates])

  // Link contacts with their company data
  useEffect(() => {
    if (companies.length > 0 && contacts.length > 0) {
      const enrichedContacts = contacts.map(contact => {
        if (contact.companyId) {
          const companyData = companies.find(c => c.id === contact.companyId)
          if (companyData) {
            return {
              ...contact,
              companyData,
              company: companyData.name // Update legacy field
            }
          }
        } else if (contact.company) {
          // Try to match by company name
          const companyData = companies.find(c => 
            c.name.toLowerCase() === contact.company?.toLowerCase()
          )
          if (companyData) {
            return {
              ...contact,
              companyId: companyData.id,
              companyData,
            }
          }
        }
        return contact
      })
      
      // Only update if there are actual changes
      const hasChanges = enrichedContacts.some((ec, i) => 
        ec.companyData !== contacts[i].companyData ||
        ec.companyId !== contacts[i].companyId
      )
      
      if (hasChanges) {
        setContacts(enrichedContacts)
      }
    }
  }, [companies]) // Only depend on companies, not contacts to avoid infinite loop

  // Contact Actions
  const createContactMutation = trpc.unified.createEntity.useMutation()
  
  const createContact = useCallback(async (contact: Omit<Contact, 'id'>): Promise<Contact> => {
    // Check for duplicates
    const duplicate = contacts.find(c => c.email === contact.email)
    if (duplicate) {
      throw new Error(`Contact with email ${contact.email} already exists`)
    }
    
    const newContact: Contact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      activities: [],
      createdAt: new Date()
    }
    
    // Add to local state immediately
    setContacts(prev => [...prev, newContact])
    
    // Save to database asynchronously
    try {
      const dbContact = await createContactMutation.mutateAsync({
        type: 'contact',
        data: {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          companyName: contact.company, // For evercore compatibility
          title: contact.title,
          jobTitle: contact.title, // For evercore compatibility
          source: contact.source || 'manual',
          sentimentScore: contact.status === 'Hot' ? 80 : contact.status === 'Warm' ? 50 : 20,
          dealValue: contact.dealValue,
          tags: contact.tags,
          createdFrom: 'crm_ui',
          lastContactedAt: contact.lastContact
        }
      })
      
      // Update local contact with database ID
      if (dbContact?.id) {
        setContacts(prev => prev.map(c => 
          c.id === newContact.id ? { ...c, id: dbContact.id, isFromDatabase: true } : c
        ))
        newContact.id = dbContact.id
        newContact.isFromDatabase = true
      }
    } catch (error) {
      console.error('Failed to save contact to database:', error)
      // Contact still exists locally even if database save fails
    }
    
    return newContact
  }, [contacts, createContactMutation])

  const updateContactMutation = trpc.unified.updateEntity.useMutation()
  
  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    // Update local state immediately
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, ...updates } : contact
    ))
    
    // Update in database if it's a database contact
    const contact = contacts.find(c => c.id === id)
    if (contact?.isFromDatabase) {
      try {
        await updateContactMutation.mutateAsync({
          id,
          data: {
            ...contact,
            ...updates,
            contactSource: updates.contactSource || contact.contactSource,
            promotedAt: updates.promotedAt,
            promotedBy: updates.promotedBy,
            company: updates.company || contact.company,
          }
        })
      } catch (error) {
        console.error('Failed to update contact in database:', error)
      }
    }
  }, [contacts, updateContactMutation])

  const deleteContact = useCallback(async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id))
  }, [])

  const deleteContacts = useCallback(async (ids: string[]) => {
    setContacts(prev => prev.filter(c => !ids.includes(c.id)))
  }, [])

  // Lead Actions
  const createLead = useCallback(async (lead: Omit<Lead, 'id' | 'score' | 'createdAt' | 'lastActivity'>): Promise<Lead> => {
    const newLead: Lead = {
      ...lead,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      score: 50, // Initial score
      createdAt: new Date(),
      lastActivity: new Date()
    }
    
    setLeads(prev => [...prev, newLead])
    return newLead
  }, [])

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, ...updates, lastActivity: new Date() } : lead
    ))
  }, [])

  const convertLeadToContact = useCallback(async (leadId: string): Promise<Contact> => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) throw new Error('Lead not found')
    
    const contact = await createContact({
      name: lead.name,
      email: lead.email,
      company: lead.company,
      lastContact: new Date(),
      dealValue: 0,
      status: lead.status === 'Qualified' ? 'Hot' : 'Warm',
      source: lead.source
    })
    
    // Remove lead after conversion
    setLeads(prev => prev.filter(l => l.id !== leadId))
    return contact
  }, [leads, createContact])

  const calculateLeadScore = useCallback((leadId: string): number => {
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return 0
    
    let score = 50 // Base score
    
    // Scoring factors
    if (lead.status === 'Qualified') score += 30
    if (lead.status === 'Contacted') score += 10
    if (lead.company) score += 10
    
    // Activity-based scoring
    const leadActivities = activities.filter(a => a.entityType === 'lead' && a.entityId === leadId)
    score += Math.min(leadActivities.length * 5, 30) // Max 30 points from activities
    
    return Math.min(score, 100) // Cap at 100
  }, [leads, activities])

  // Deal Actions
  const createDeal = useCallback(async (deal: Omit<Deal, 'id'>): Promise<Deal> => {
    const newDeal: Deal = {
      ...deal,
      id: `deal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    setDeals(prev => [...prev, newDeal])
    return newDeal
  }, [])

  const updateDeal = useCallback(async (id: string, updates: Partial<Deal>) => {
    setDeals(prev => prev.map(deal => 
      deal.id === id ? { ...deal, ...updates, lastActivity: new Date() } : deal
    ))
  }, [])

  const moveDealToStage = useCallback(async (dealId: string, stage: Deal['stage']) => {
    // Update probability based on stage
    const stageProbabilities = {
      'Prospecting': 10,
      'Qualification': 25,
      'Proposal': 50,
      'Negotiation': 75,
      'Closed Won': 100,
      'Closed Lost': 0
    }
    
    await updateDeal(dealId, { 
      stage, 
      probability: stageProbabilities[stage] 
    })
  }, [updateDeal])

  // Activity Actions
  const logActivity = useCallback(async (activity: Omit<Activity, 'id' | 'createdAt' | 'createdBy'>): Promise<Activity> => {
    const newActivity: Activity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      createdBy: 'current_user' // Would come from auth context
    }
    
    setActivities(prev => [...prev, newActivity])
    return newActivity
  }, [])

  const completeActivity = useCallback(async (activityId: string) => {
    setActivities(prev => prev.map(activity => 
      activity.id === activityId ? { ...activity, completed: true } : activity
    ))
  }, [])

  const getActivitiesForEntity = useCallback((entityType: string, entityId: string): Activity[] => {
    return activities.filter(a => a.entityType === entityType && a.entityId === entityId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [activities])

  // Email Template Actions
  const createEmailTemplate = useCallback(async (template: Omit<EmailTemplate, 'id' | 'usageCount' | 'createdAt'>): Promise<EmailTemplate> => {
    const newTemplate: EmailTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
      createdAt: new Date()
    }
    
    setEmailTemplates(prev => [...prev, newTemplate])
    return newTemplate
  }, [])

  const applyEmailTemplate = useCallback((templateId: string, variables: Record<string, string>): string => {
    const template = emailTemplates.find(t => t.id === templateId)
    if (!template) return ''
    
    let body = template.body
    Object.entries(variables).forEach(([key, value]) => {
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })
    
    return body
  }, [emailTemplates])

  // Order Actions
  const createOrder = useCallback(async (order: Omit<Order, 'id' | 'orderNumber' | 'orderDate'>): Promise<Order> => {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}`
    const newOrder: Order = {
      ...order,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderNumber,
      orderDate: new Date()
    }
    
    setOrders(prev => [...prev, newOrder])
    return newOrder
  }, [orders])

  const updateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ))
  }, [])

  // Import/Export Actions
  const importFromCSV = useCallback(async (entityType: string, data: any[]) => {
    // Simple CSV import - would need more robust parsing in production
    switch (entityType) {
      case 'contacts':
        const newContacts = data.map(row => ({
          ...row,
          id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          lastContact: new Date(),
          activities: []
        }))
        setContacts(prev => [...prev, ...newContacts])
        break
      // Add other entity types...
    }
  }, [])

  const exportToCSV = useCallback((entityType: string, ids?: string[]): string => {
    let data: any[] = []
    
    switch (entityType) {
      case 'contacts':
        data = ids ? contacts.filter(c => ids.includes(c.id)) : contacts
        break
      case 'leads':
        data = ids ? leads.filter(l => ids.includes(l.id)) : leads
        break
      case 'deals':
        data = ids ? deals.filter(d => ids.includes(d.id)) : deals
        break
      // Add other entity types...
    }
    
    if (data.length === 0) return ''
    
    // Convert to CSV
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(item => 
      Object.values(item).map(val => 
        typeof val === 'object' ? JSON.stringify(val) : val
      ).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }, [contacts, leads, deals])

  // Metrics Calculation
  const getMetrics = useCallback(() => {
    const closedWonDeals = deals.filter(d => d.stage === 'Closed Won')
    const closedLostDeals = deals.filter(d => d.stage === 'Closed Lost')
    const activeDeals = deals.filter(d => !d.stage.includes('Closed'))
    
    return {
      revenue: closedWonDeals.reduce((sum, d) => sum + d.value, 0),
      activeDeals: activeDeals.length,
      winRate: closedWonDeals.length / (closedWonDeals.length + closedLostDeals.length || 1) * 100,
      pipelineValue: activeDeals.reduce((sum, d) => sum + d.value, 0),
      avgDealSize: deals.length > 0 ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length : 0
    }
  }, [deals])

  const value: CRMContextState = {
    // States
    contacts,
    leads,
    deals,
    companies,
    products,
    orders,
    activities,
    emailTemplates,
    selectedEntityIds,
    searchQuery,
    filters,
    sorting,
    
    // Actions
    createContact,
    updateContact,
    deleteContact,
    deleteContacts,
    createLead,
    updateLead,
    convertLeadToContact,
    calculateLeadScore,
    createDeal,
    updateDeal,
    moveDealToStage,
    logActivity,
    completeActivity,
    getActivitiesForEntity,
    createEmailTemplate,
    applyEmailTemplate,
    createOrder,
    updateOrderStatus,
    setSearchQuery,
    setFilters,
    setSorting: (field, direction) => setSorting({ field, direction }),
    importFromCSV,
    exportToCSV,
    refreshContacts: () => {
      refetchDBContacts?.()
    },
    getMetrics
  }

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  )
}

// Custom hook to use CRM context
export function useCRM() {
  const context = useContext(CRMContext)
  if (!context) {
    throw new Error('useCRM must be used within CRMProvider')
  }
  return context
}