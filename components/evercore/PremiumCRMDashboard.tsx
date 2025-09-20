'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Building2, 
  DollarSign, 
  UserPlus,
  Search,
  Filter,
  ChevronDown,
  Plus,
  LayoutGrid,
  TrendingUp,
  Activity,
  Target,
  Sparkles,
  MoreHorizontal,
  Calendar,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowRight,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import NewContactModal from './modals/NewContactModal'
import NewDealModal from './modals/NewDealModal'
import NewCompanyModal from './modals/NewCompanyModal'
import NewLeadModal from './modals/NewLeadModal'

export default function PremiumCRMDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewContactModal, setShowNewContactModal] = useState(false)
  const [showNewDealModal, setShowNewDealModal] = useState(false)
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  
  // Fetch data
  const { data: contacts = [], refetch: refetchContacts } = trpc.evercore.getContacts.useQuery()
  const { data: deals = [], refetch: refetchDeals } = trpc.evercore.getDeals.useQuery()
  const { data: companies = [], refetch: refetchCompanies } = trpc.evercore.getCompanies.useQuery()
  const { data: leads = [], refetch: refetchLeads } = trpc.evercore.getLeads.useQuery()
  
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'leads', label: 'Leads', icon: UserPlus, count: leads.length },
    { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
    { id: 'companies', label: 'Companies', icon: Building2, count: companies.length },
    { id: 'deals', label: 'Deals', icon: DollarSign, count: deals.length }
  ]
  
  // Calculate metrics
  const totalPipeline = deals.reduce((sum: number, d: any) => sum + (d.data?.value || 0), 0)
  const activeDeals = deals.filter((d: any) => !['closed_won', 'closed_lost'].includes(d.data?.stage))
  const wonDeals = deals.filter((d: any) => d.data?.stage === 'closed_won')
  const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0
  const avgDealSize = deals.length > 0 ? totalPipeline / deals.length : 0
  
  // Recent activity
  const recentContacts = contacts
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  
  const renderContent = () => {
    switch(activeTab) {
      case 'overview':
        return <OverviewTab />
      case 'leads':
        return <LeadsTab />
      case 'contacts':
        return <ContactsTab />
      case 'companies':
        return <CompaniesTab />
      case 'deals':
        return <DealsTab />
      default:
        return <OverviewTab />
    }
  }
  
  const OverviewTab = () => (
    <div className="p-6 space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Pipeline"
          value={`$${(totalPipeline / 1000000).toFixed(2)}M`}
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          color="emerald"
        />
        <MetricCard
          title="Active Deals"
          value={activeDeals.length.toString()}
          change="+3 this week"
          trend="up"
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Win Rate"
          value={`${winRate.toFixed(0)}%`}
          change="+5.2%"
          trend="up"
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="Avg Deal Size"
          value={`$${(avgDealSize / 1000).toFixed(0)}k`}
          change="+8.1%"
          trend="up"
          icon={Activity}
          color="amber"
        />
      </div>
      
      {/* Pipeline Overview */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Sales Pipeline</h2>
          <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            View all deals →
          </button>
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          {['Qualification', 'Proposal', 'Negotiation', 'Contract', 'Closed Won'].map((stage, idx) => {
            const stageDeals = deals.filter((d: any) => d.data?.stage?.toLowerCase() === stage.toLowerCase().replace(' ', '_'))
            const stageValue = stageDeals.reduce((sum: number, d: any) => sum + (d.data?.value || 0), 0)
            
            return (
              <div key={stage} className="relative">
                <div className={cn(
                  "p-4 rounded-lg border-2 border-dashed transition-all",
                  idx === 0 && "border-blue-200 bg-blue-50/50",
                  idx === 1 && "border-purple-200 bg-purple-50/50",
                  idx === 2 && "border-amber-200 bg-amber-50/50",
                  idx === 3 && "border-orange-200 bg-orange-50/50",
                  idx === 4 && "border-emerald-200 bg-emerald-50/50"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage}</span>
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      idx === 0 && "bg-blue-100 text-blue-700",
                      idx === 1 && "bg-purple-100 text-purple-700",
                      idx === 2 && "bg-amber-100 text-amber-700",
                      idx === 3 && "bg-orange-100 text-orange-700",
                      idx === 4 && "bg-emerald-100 text-emerald-700"
                    )}>
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${(stageValue / 1000).toFixed(0)}k
                  </div>
                  <div className="mt-3 space-y-1">
                    {stageDeals.slice(0, 2).map((deal: any) => (
                      <div key={deal.id} className="text-xs text-gray-600 truncate">
                        • {deal.data?.name || 'Untitled'}
                      </div>
                    ))}
                    {stageDeals.length > 2 && (
                      <div className="text-xs text-gray-400">
                        +{stageDeals.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
                {idx < 4 && (
                  <ArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Contacts</h3>
            <button className="text-sm text-emerald-600 hover:text-emerald-700">View all</button>
          </div>
          <div className="space-y-3">
            {recentContacts.map((contact: any) => (
              <div key={contact.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                    {contact.data?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{contact.data?.name}</div>
                    <div className="text-xs text-gray-500">{contact.data?.email}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Companies</h3>
            <button className="text-sm text-emerald-600 hover:text-emerald-700">View all</button>
          </div>
          <div className="space-y-3">
            {companies.slice(0, 5).map((company: any) => (
              <div key={company.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{company.data?.name}</div>
                    <div className="text-xs text-gray-500">{company.data?.industry || 'No industry'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {deals.filter((d: any) => d.data?.companyId === company.id).length} deals
                  </div>
                  <div className="text-xs text-gray-500">
                    ${(deals.filter((d: any) => d.data?.companyId === company.id).reduce((sum: number, d: any) => sum + (d.data?.value || 0), 0) / 1000).toFixed(0)}k
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
  
  const LeadsTab = () => (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-gray-100">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronDown className="h-4 w-4" />
              Group by
            </button>
          </div>
          <button 
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Contact</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead: any) => (
                <tr key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {lead.data?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.data?.name}</div>
                        <div className="text-xs text-gray-500">{lead.data?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {lead.data?.status || 'New'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1.5 h-3 rounded-full",
                            i < Math.ceil((lead.data?.score || 0) / 20)
                              ? "bg-emerald-500"
                              : "bg-gray-200"
                          )}
                        />
                      ))}
                      <span className="ml-2 text-sm text-gray-600">{lead.data?.score || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{lead.data?.source || 'Direct'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-xs text-gray-400 hover:text-emerald-600">
                      + Assign
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500">
                      {lead.data?.lastContact ? formatDistanceToNow(new Date(lead.data.lastContact), { addSuffix: true }) : 'Never'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
  
  const ContactsTab = () => (
    <div className="p-6">
      <GroupedTable 
        data={contacts}
        groupBy="status"
        onAdd={() => setShowNewContactModal(true)}
        entityType="contact"
      />
    </div>
  )
  
  const CompaniesTab = () => (
    <div className="p-6">
      <GroupedTable 
        data={companies}
        groupBy="industry"
        onAdd={() => setShowNewCompanyModal(true)}
        entityType="company"
      />
    </div>
  )
  
  const DealsTab = () => (
    <div className="p-6">
      <GroupedTable 
        data={deals}
        groupBy="stage"
        onAdd={() => setShowNewDealModal(true)}
        entityType="deal"
      />
    </div>
  )
  
  // Grouped table component (EverTask style)
  const GroupedTable = ({ data, groupBy, onAdd, entityType }: any) => {
    const groups = useMemo(() => {
      const grouped: Record<string, any[]> = {}
      data.forEach((item: any) => {
        const key = item.data?.[groupBy] || 'Other'
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(item)
      })
      return grouped
    }, [data, groupBy])
    
    return (
      <div className="bg-white rounded-xl border border-gray-100">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${entityType}s...`}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronDown className="h-4 w-4" />
              Group by
            </button>
          </div>
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add {entityType}
          </button>
        </div>
        
        {/* Grouped content */}
        <div className="p-4 space-y-4">
          {Object.entries(groups).map(([groupName, items]) => (
            <div key={groupName} className="border border-gray-100 rounded-lg">
              {/* Group header */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-700">{groupName}</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
                    {items.length}
                  </span>
                </div>
              </div>
              
              {/* Group items */}
              <div className="divide-y divide-gray-50">
                {items.map((item: any) => (
                  <div key={item.id} className="px-4 py-3 hover:bg-gray-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <input type="checkbox" className="rounded border-gray-300" />
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                          entityType === 'contact' && "bg-gradient-to-br from-emerald-500 to-teal-600",
                          entityType === 'company' && "bg-gradient-to-br from-purple-500 to-purple-600",
                          entityType === 'deal' && "bg-gradient-to-br from-amber-500 to-orange-600"
                        )}>
                          {item.data?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.data?.name || 'Untitled'}</div>
                          <div className="text-xs text-gray-500">
                            {entityType === 'contact' && item.data?.email}
                            {entityType === 'company' && item.data?.domain}
                            {entityType === 'deal' && `$${(item.data?.value / 1000).toFixed(0)}k`}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50">
                        + Assign
                      </button>
                      <button className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50">
                        + Set date
                      </button>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        Medium
                      </span>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Add new item */}
                <div className="px-4 py-3 hover:bg-gray-50/50 cursor-pointer group">
                  <button className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-emerald-600">
                    <Plus className="h-4 w-4" />
                    Add {entityType}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const MetricCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2 rounded-lg",
          color === 'emerald' && "bg-emerald-100",
          color === 'blue' && "bg-blue-100",
          color === 'purple' && "bg-purple-100",
          color === 'amber' && "bg-amber-100"
        )}>
          <Icon className={cn(
            "h-5 w-5",
            color === 'emerald' && "text-emerald-600",
            color === 'blue' && "text-blue-600",
            color === 'purple' && "text-purple-600",
            color === 'amber' && "text-amber-600"
          )} />
        </div>
        {trend === 'up' && (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{title}</div>
      <div className={cn(
        "text-xs mt-2",
        trend === 'up' ? "text-emerald-600" : "text-red-600"
      )}>
        {change}
      </div>
    </div>
  )
  
  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 pt-6">
            {/* Title Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    EverCore
                    <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                      AI-Powered
                    </span>
                  </h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Complete customer relationship management with AI insights
                  </p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowNewContactModal(true)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  New Contact
                </button>
                <button 
                  onClick={() => setShowNewDealModal(true)}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  New Deal
                </button>
                <button 
                  onClick={() => setShowNewCompanyModal(true)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  New Company
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-lg transition-all',
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm border-t border-x border-gray-200 relative -mb-px'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                    style={{
                      borderBottom: isActive ? '2px solid white' : undefined
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full",
                        isActive ? "bg-gray-100 text-gray-700" : "bg-gray-200 text-gray-600"
                      )}>
                        {tab.count > 99 ? '99+' : tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
      
      {/* Modals */}
      {showNewContactModal && (
        <NewContactModal onClose={() => {
          setShowNewContactModal(false)
          refetchContacts()
        }} />
      )}
      {showNewDealModal && (
        <NewDealModal onClose={() => {
          setShowNewDealModal(false)
          refetchDeals()
        }} />
      )}
      {showNewCompanyModal && (
        <NewCompanyModal onClose={() => {
          setShowNewCompanyModal(false)
          refetchCompanies()
        }} />
      )}
      {showNewLeadModal && (
        <NewLeadModal onClose={() => {
          setShowNewLeadModal(false)
          refetchLeads()
        }} />
      )}
    </>
  )
}