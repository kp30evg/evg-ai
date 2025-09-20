'use client'

import React, { useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/premium/data-table'
import { Chip } from '@/components/ui/premium/chip'
import { trpc } from '@/lib/trpc/client'
import { 
  DollarSign,
  Building2,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Zap,
  Target,
  Activity,
  BarChart3,
  FileText,
  MessageSquare
} from 'lucide-react'
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import NewDealModal from '../modals/NewDealModal'

interface Deal {
  id: string
  data: {
    name: string
    companyId?: string
    company?: string
    contactId?: string
    contact?: string
    value: number
    stage: string
    probability?: number
    closeDate?: string
    owner?: string
    status?: string
    priority?: string
    source?: string
    notes?: string
  }
  metadata?: {
    daysInStage?: number
    totalActivities?: number
    lastActivity?: string
    riskLevel?: string
  }
  createdAt: string
  updatedAt: string
}

export default function DealsView() {
  const [showNewDealModal, setShowNewDealModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list')
  
  // Fetch deals from database
  const { data: deals = [], isLoading, refetch } = trpc.evercore.getDeals.useQuery()
  const { data: companies = [] } = trpc.evercore.getCompanies.useQuery()
  const { data: contacts = [] } = trpc.evercore.getContacts.useQuery()
  
  // Filter deals
  const filteredDeals = useMemo(() => {
    if (!searchQuery) return deals
    
    const query = searchQuery.toLowerCase()
    return deals.filter((deal: Deal) => 
      deal.data?.name?.toLowerCase().includes(query) ||
      deal.data?.company?.toLowerCase().includes(query) ||
      deal.data?.contact?.toLowerCase().includes(query)
    )
  }, [deals, searchQuery])
  
  // Calculate risk level
  const getRiskLevel = (deal: Deal) => {
    if (!deal.data?.closeDate) return 'low'
    
    const daysToClose = differenceInDays(new Date(deal.data.closeDate), new Date())
    const daysInStage = deal.metadata?.daysInStage || 0
    const hasRecentActivity = deal.metadata?.lastActivity && 
      differenceInDays(new Date(), new Date(deal.metadata.lastActivity)) < 7
    
    if (daysToClose < 7 && deal.data.stage !== 'closed_won' && deal.data.stage !== 'negotiation') {
      return 'high'
    }
    if (daysInStage > 30 && !hasRecentActivity) {
      return 'high'
    }
    if (daysInStage > 14 || !hasRecentActivity) {
      return 'medium'
    }
    return 'low'
  }
  
  // Stage progress indicator
  const StageProgress = ({ stage }: { stage: string }) => {
    const stages = ['qualification', 'proposal', 'negotiation', 'closed_won']
    const currentIndex = stages.indexOf(stage)
    
    return (
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 w-6 rounded-full transition-all ${
              i <= currentIndex 
                ? stage === 'closed_won' ? 'bg-emerald-500' : 
                  stage === 'closed_lost' ? 'bg-red-500' : 'bg-blue-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    )
  }
  
  // Deal value with probability
  const DealValue = ({ deal }: { deal: Deal }) => {
    const probability = deal.data?.probability || 
      (deal.data.stage === 'qualification' ? 25 :
       deal.data.stage === 'proposal' ? 50 :
       deal.data.stage === 'negotiation' ? 75 :
       deal.data.stage === 'closed_won' ? 100 : 0)
    
    const weightedValue = (deal.data.value * probability) / 100
    
    return (
      <div>
        <div className="font-medium text-gray-900">
          ${(deal.data.value / 1000).toFixed(0)}k
        </div>
        <div className="text-xs text-gray-500">
          ${(weightedValue / 1000).toFixed(0)}k @ {probability}%
        </div>
      </div>
    )
  }
  
  const columns = [
    {
      id: 'deal',
      header: 'Deal',
      accessor: (deal: Deal) => {
        const riskLevel = getRiskLevel(deal)
        const riskIcons = {
          high: AlertTriangle,
          medium: Clock,
          low: CheckCircle2
        }
        const RiskIcon = riskIcons[riskLevel as keyof typeof riskIcons]
        const riskColors = {
          high: 'text-red-500',
          medium: 'text-amber-500',
          low: 'text-emerald-500'
        }
        
        return (
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 ${riskColors[riskLevel as keyof typeof riskColors]}`}>
              <RiskIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{deal.data?.name || 'Untitled Deal'}</div>
              <StageProgress stage={deal.data?.stage || 'qualification'} />
            </div>
          </div>
        )
      },
      width: '250px'
    },
    {
      id: 'company',
      header: 'Company',
      accessor: (deal: Deal) => {
        const company = companies.find((c: any) => c.id === deal.data?.companyId)
        const companyName = company?.data?.name || deal.data?.company
        
        if (!companyName) return <span className="text-gray-400">—</span>
        
        return (
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">{companyName}</span>
            </div>
            {deal.data?.contact && (
              <div className="text-xs text-gray-500 mt-0.5 ml-6">
                {deal.data.contact}
              </div>
            )}
          </div>
        )
      },
      width: '200px'
    },
    {
      id: 'stage',
      header: 'Stage',
      accessor: (deal: Deal) => {
        const stage = deal.data?.stage || 'qualification'
        const variants: Record<string, any> = {
          qualification: 'qualified',
          proposal: 'proposal',
          negotiation: 'negotiation',
          closed_won: 'won',
          closed_lost: 'lost'
        }
        const icons: Record<string, any> = {
          qualification: Target,
          proposal: FileText,
          negotiation: MessageSquare,
          closed_won: CheckCircle2,
          closed_lost: XCircle
        }
        const Icon = icons[stage] || Target
        
        return (
          <Chip 
            variant={variants[stage] || 'default'} 
            size="sm"
            icon={<Icon className="h-3 w-3" />}
          >
            {stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Chip>
        )
      },
      width: '140px'
    },
    {
      id: 'value',
      header: 'Value',
      accessor: (deal: Deal) => <DealValue deal={deal} />,
      width: '120px',
      align: 'right' as const
    },
    {
      id: 'closeDate',
      header: 'Close Date',
      accessor: (deal: Deal) => {
        if (!deal.data?.closeDate) {
          return <span className="text-gray-400 text-sm">Not set</span>
        }
        
        const daysToClose = differenceInDays(new Date(deal.data.closeDate), new Date())
        const isPast = daysToClose < 0
        const isNear = daysToClose <= 7 && daysToClose >= 0
        
        return (
          <div className="text-sm">
            <div className={`font-medium ${isPast ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-gray-900'}`}>
              {format(new Date(deal.data.closeDate), 'MMM d, yyyy')}
            </div>
            <div className={`text-xs ${isPast ? 'text-red-500' : isNear ? 'text-amber-500' : 'text-gray-500'}`}>
              {isPast ? `${Math.abs(daysToClose)} days overdue` : `${daysToClose} days`}
            </div>
          </div>
        )
      },
      width: '140px'
    },
    {
      id: 'activity',
      header: 'Activity',
      accessor: (deal: Deal) => {
        const totalActivities = deal.metadata?.totalActivities || 0
        const lastActivity = deal.metadata?.lastActivity
        const daysInStage = deal.metadata?.daysInStage || 0
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Activity className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">{totalActivities} activities</span>
            </div>
            {lastActivity && (
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
              </div>
            )}
            {daysInStage > 14 && (
              <div className="text-xs text-amber-600">
                {daysInStage}d in stage
              </div>
            )}
          </div>
        )
      },
      width: '140px'
    },
    {
      id: 'priority',
      header: 'Priority',
      accessor: (deal: Deal) => {
        const priority = deal.data?.priority || 'medium'
        const variants: Record<string, any> = {
          critical: 'critical',
          high: 'high',
          medium: 'medium',
          low: 'low'
        }
        
        return (
          <Chip variant={variants[priority]} size="sm">
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Chip>
        )
      },
      width: '100px'
    },
    {
      id: 'owner',
      header: 'Owner',
      accessor: (deal: Deal) => {
        if (!deal.data?.owner) {
          return (
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Assign
            </Button>
          )
        }
        return (
          <Chip variant="default" size="sm" avatar="/api/placeholder/20/20">
            {deal.data.owner}
          </Chip>
        )
      },
      width: '100px'
    }
  ]
  
  // Calculate pipeline metrics
  const pipelineMetrics = useMemo(() => {
    const qualificationDeals = deals.filter((d: Deal) => d.data?.stage === 'qualification')
    const proposalDeals = deals.filter((d: Deal) => d.data?.stage === 'proposal')
    const negotiationDeals = deals.filter((d: Deal) => d.data?.stage === 'negotiation')
    const wonDeals = deals.filter((d: Deal) => d.data?.stage === 'closed_won')
    
    return {
      qualification: {
        count: qualificationDeals.length,
        value: qualificationDeals.reduce((sum: number, d: Deal) => sum + (d.data?.value || 0), 0)
      },
      proposal: {
        count: proposalDeals.length,
        value: proposalDeals.reduce((sum: number, d: Deal) => sum + (d.data?.value || 0), 0)
      },
      negotiation: {
        count: negotiationDeals.length,
        value: negotiationDeals.reduce((sum: number, d: Deal) => sum + (d.data?.value || 0), 0)
      },
      won: {
        count: wonDeals.length,
        value: wonDeals.reduce((sum: number, d: Deal) => sum + (d.data?.value || 0), 0)
      }
    }
  }, [deals])
  
  return (
    <>
      <div className="p-6">
        {/* Pipeline Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Qualification</span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {pipelineMetrics.qualification.count}
            </div>
            <div className="text-sm text-gray-500">
              ${(pipelineMetrics.qualification.value / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Proposal</span>
              <FileText className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {pipelineMetrics.proposal.count}
            </div>
            <div className="text-sm text-gray-500">
              ${(pipelineMetrics.proposal.value / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Negotiation</span>
              <MessageSquare className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {pipelineMetrics.negotiation.count}
            </div>
            <div className="text-sm text-gray-500">
              ${(pipelineMetrics.negotiation.value / 1000).toFixed(0)}k
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Closed Won</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {pipelineMetrics.won.count}
            </div>
            <div className="text-sm text-emerald-600 font-medium">
              ${(pipelineMetrics.won.value / 1000).toFixed(0)}k
            </div>
          </div>
        </div>
        
        <DataTable
          data={filteredDeals}
          columns={columns}
          searchPlaceholder="Search deals by name, company, or contact..."
          onSearch={setSearchQuery}
          primaryAction={{
            label: 'New Deal',
            onClick: () => setShowNewDealModal(true)
          }}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start tracking your sales pipeline
              </p>
              <Button onClick={() => setShowNewDealModal(true)}>
                Add First Deal
              </Button>
            </div>
          }
        />
      </div>
      
      {showNewDealModal && (
        <NewDealModal
          onClose={() => {
            setShowNewDealModal(false)
            refetch()
          }}
        />
      )}
    </>
  )
}