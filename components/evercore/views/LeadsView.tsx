'use client'

import React, { useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/premium/data-table'
import { Chip } from '@/components/ui/premium/chip'
import { trpc } from '@/lib/trpc/client'
import { 
  Mail, 
  Phone, 
  Globe, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  Building2,
  MapPin,
  DollarSign,
  User
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import NewLeadModal from '../modals/NewLeadModal'

interface Lead {
  id: string
  data: {
    name: string
    email: string
    phone?: string
    company?: string
    title?: string
    website?: string
    source?: string
    score?: number
    status?: string
    lastContact?: string
    owner?: string
    value?: number
    location?: string
    notes?: string
  }
  createdAt: string
  updatedAt: string
}

export default function LeadsView() {
  const [showNewLeadModal, setShowNewLeadModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch leads from database
  const { data: leads = [], isLoading, refetch } = trpc.evercore.getLeads.useQuery()
  
  // Filter leads
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads
    
    const query = searchQuery.toLowerCase()
    return leads.filter((lead: Lead) => 
      lead.data?.name?.toLowerCase().includes(query) ||
      lead.data?.email?.toLowerCase().includes(query) ||
      lead.data?.company?.toLowerCase().includes(query)
    )
  }, [leads, searchQuery])
  
  // Score color helper
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }
  
  // Lead score indicator
  const LeadScore = ({ score }: { score?: number }) => {
    const value = score || 0
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-4 rounded-full transition-all ${
                i < Math.ceil(value / 20)
                  ? value >= 80 ? 'bg-emerald-500' :
                    value >= 60 ? 'bg-blue-500' :
                    value >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className={`text-sm font-medium ${getScoreColor(score)}`}>
          {value}
        </span>
      </div>
    )
  }
  
  const columns = [
    {
      id: 'name',
      header: 'Lead',
      accessor: (lead: Lead) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
            {lead.data?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{lead.data?.name || 'Unknown'}</div>
            <div className="flex items-center gap-3 mt-0.5">
              {lead.data?.email && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {lead.data.email}
                </span>
              )}
              {lead.data?.phone && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.data.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
      width: '300px'
    },
    {
      id: 'company',
      header: 'Company',
      accessor: (lead: Lead) => (
        <div>
          {lead.data?.company && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-900">{lead.data.company}</span>
            </div>
          )}
          {lead.data?.title && (
            <div className="text-xs text-gray-500 mt-0.5">{lead.data.title}</div>
          )}
        </div>
      ),
      width: '200px'
    },
    {
      id: 'score',
      header: 'Score',
      accessor: (lead: Lead) => <LeadScore score={lead.data?.score} />,
      width: '120px'
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (lead: Lead) => {
        const status = lead.data?.status || 'new'
        const variants: Record<string, any> = {
          new: 'secondary',
          contacted: 'primary',
          qualified: 'success',
          unqualified: 'danger',
          nurturing: 'warning'
        }
        return (
          <Chip variant={variants[status] || 'default'} size="sm">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Chip>
        )
      },
      width: '120px'
    },
    {
      id: 'source',
      header: 'Source',
      accessor: (lead: Lead) => {
        const source = lead.data?.source || 'direct'
        const icons: Record<string, any> = {
          website: Globe,
          email: Mail,
          social: TrendingUp,
          referral: User,
          direct: Zap
        }
        const Icon = icons[source] || Zap
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 capitalize">{source}</span>
          </div>
        )
      },
      width: '120px'
    },
    {
      id: 'value',
      header: 'Est. Value',
      accessor: (lead: Lead) => {
        if (!lead.data?.value) return <span className="text-gray-400">—</span>
        return (
          <span className="font-medium text-gray-900">
            ${(lead.data.value / 1000).toFixed(0)}k
          </span>
        )
      },
      width: '100px',
      align: 'right' as const
    },
    {
      id: 'lastContact',
      header: 'Last Contact',
      accessor: (lead: Lead) => {
        if (!lead.data?.lastContact) {
          return <span className="text-xs text-gray-400">Never contacted</span>
        }
        const days = Math.floor((Date.now() - new Date(lead.data.lastContact).getTime()) / (1000 * 60 * 60 * 24))
        const color = days <= 7 ? 'text-emerald-600' : days <= 30 ? 'text-amber-600' : 'text-red-600'
        return (
          <span className={`text-xs ${color} flex items-center gap-1`}>
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(lead.data.lastContact), { addSuffix: true })}
          </span>
        )
      },
      width: '140px'
    },
    {
      id: 'owner',
      header: 'Owner',
      accessor: (lead: Lead) => {
        if (!lead.data?.owner) {
          return (
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Assign
            </Button>
          )
        }
        return (
          <Chip variant="default" size="sm" avatar="/api/placeholder/20/20">
            {lead.data.owner}
          </Chip>
        )
      },
      width: '120px'
    }
  ]
  
  return (
    <>
      <div className="p-6">
        <DataTable
          data={filteredLeads}
          columns={columns}
          searchPlaceholder="Search leads by name, email, or company..."
          onSearch={setSearchQuery}
          primaryAction={{
            label: 'New Lead',
            onClick: () => setShowNewLeadModal(true)
          }}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start building your pipeline by adding your first lead
              </p>
              <Button onClick={() => setShowNewLeadModal(true)}>
                Add First Lead
              </Button>
            </div>
          }
        />
      </div>
      
      {showNewLeadModal && (
        <NewLeadModal
          onClose={() => {
            setShowNewLeadModal(false)
            refetch()
          }}
        />
      )}
    </>
  )
}