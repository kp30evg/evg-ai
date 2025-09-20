'use client'

import React, { useState, useMemo } from 'react'
import { DataTable } from '@/components/ui/premium/data-table'
import { Chip } from '@/components/ui/premium/chip'
import { trpc } from '@/lib/trpc/client'
import { 
  Building2,
  Globe,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  Activity,
  Phone,
  Mail,
  Link2,
  Hash,
  BarChart3
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import NewCompanyModal from '../modals/NewCompanyModal'

interface Company {
  id: string
  data: {
    name: string
    domain?: string
    industry?: string
    size?: string
    revenue?: number
    location?: string
    description?: string
    status?: string
    owner?: string
    tags?: string[]
    tier?: string
    lastActivity?: string
  }
  metadata?: {
    contactCount?: number
    activeDeals?: number
    totalValue?: number
    winRate?: number
  }
  createdAt: string
  updatedAt: string
}

export default function CompaniesView() {
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Fetch companies from database
  const { data: companies = [], isLoading, refetch } = trpc.evercore.getCompanies.useQuery()
  const { data: contacts = [] } = trpc.evercore.getContacts.useQuery()
  const { data: deals = [] } = trpc.evercore.getDeals.useQuery()
  
  // Filter companies
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies
    
    const query = searchQuery.toLowerCase()
    return companies.filter((company: Company) => 
      company.data?.name?.toLowerCase().includes(query) ||
      company.data?.domain?.toLowerCase().includes(query) ||
      company.data?.industry?.toLowerCase().includes(query)
    )
  }, [companies, searchQuery])
  
  // Calculate company metrics
  const getCompanyMetrics = (company: Company) => {
    const companyContacts = contacts.filter((c: any) => c.data?.companyId === company.id)
    const companyDeals = deals.filter((d: any) => d.data?.companyId === company.id)
    const activeDeals = companyDeals.filter((d: any) => d.data?.status !== 'won' && d.data?.status !== 'lost')
    const wonDeals = companyDeals.filter((d: any) => d.data?.status === 'won')
    const totalValue = activeDeals.reduce((sum: number, d: any) => sum + (d.data?.value || 0), 0)
    const winRate = companyDeals.length > 0 ? (wonDeals.length / companyDeals.length) * 100 : 0
    
    return {
      contactCount: companyContacts.length,
      activeDeals: activeDeals.length,
      totalValue,
      winRate
    }
  }
  
  // Get company logo
  const getCompanyLogo = (domain?: string, name?: string) => {
    if (domain) {
      return `https://logo.clearbit.com/${domain}`
    }
    if (name) {
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return `https://logo.clearbit.com/${cleanName}.com`
    }
    return null
  }
  
  // Health score
  const HealthScore = ({ company }: { company: Company }) => {
    const metrics = getCompanyMetrics(company)
    const hasActivity = company.data?.lastActivity && 
      (Date.now() - new Date(company.data.lastActivity).getTime()) < 30 * 24 * 60 * 60 * 1000
    const score = 
      (metrics.contactCount > 0 ? 25 : 0) +
      (metrics.activeDeals > 0 ? 25 : 0) +
      (hasActivity ? 25 : 0) +
      (metrics.winRate > 50 ? 25 : 0)
    
    const color = score >= 75 ? 'bg-emerald-500' : 
                  score >= 50 ? 'bg-blue-500' : 
                  score >= 25 ? 'bg-amber-500' : 'bg-gray-300'
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-3 rounded-full ${
                i < Math.ceil(score / 25) ? color : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">{score}%</span>
      </div>
    )
  }
  
  const columns = [
    {
      id: 'company',
      header: 'Company',
      accessor: (company: Company) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white p-1.5 flex items-center justify-center">
            {getCompanyLogo(company.data?.domain, company.data?.name) ? (
              <img 
                src={getCompanyLogo(company.data?.domain, company.data?.name)!}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.parentElement!.innerHTML = `<div class="w-full h-full bg-purple-100 rounded flex items-center justify-center text-purple-600 font-medium text-xs">${company.data?.name?.charAt(0).toUpperCase() || '?'}</div>`
                }}
              />
            ) : (
              <div className="w-full h-full bg-purple-100 rounded flex items-center justify-center text-purple-600 font-medium">
                {company.data?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900 flex items-center gap-2">
              {company.data?.name || 'Unknown'}
              {company.data?.tier === 'enterprise' && (
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              )}
            </div>
            {company.data?.domain && (
              <a 
                href={`https://${company.data.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="h-3 w-3" />
                {company.data.domain}
              </a>
            )}
          </div>
        </div>
      ),
      width: '250px'
    },
    {
      id: 'industry',
      header: 'Industry',
      accessor: (company: Company) => {
        if (!company.data?.industry) return <span className="text-gray-400">—</span>
        return (
          <Chip variant="default" size="sm">
            {company.data.industry}
          </Chip>
        )
      },
      width: '140px'
    },
    {
      id: 'size',
      header: 'Size',
      accessor: (company: Company) => {
        const size = company.data?.size
        if (!size) return <span className="text-gray-400">—</span>
        
        const sizeLabels: Record<string, string> = {
          '1-10': '1-10',
          '11-50': '11-50',
          '51-200': '51-200',
          '201-500': '201-500',
          '501-1000': '501-1K',
          '1001-5000': '1-5K',
          '5001+': '5K+'
        }
        
        return (
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">{sizeLabels[size] || size}</span>
          </div>
        )
      },
      width: '100px'
    },
    {
      id: 'contacts',
      header: 'Contacts',
      accessor: (company: Company) => {
        const metrics = getCompanyMetrics(company)
        if (metrics.contactCount === 0) {
          return (
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Add
            </Button>
          )
        }
        return (
          <div className="flex -space-x-2">
            {[...Array(Math.min(3, metrics.contactCount))].map((_, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-medium"
              >
                {i + 1}
              </div>
            ))}
            {metrics.contactCount > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-600 text-[10px] font-medium">
                +{metrics.contactCount - 3}
              </div>
            )}
          </div>
        )
      },
      width: '100px',
      align: 'center' as const
    },
    {
      id: 'deals',
      header: 'Active Deals',
      accessor: (company: Company) => {
        const metrics = getCompanyMetrics(company)
        if (metrics.activeDeals === 0) {
          return <span className="text-gray-400 text-sm">0</span>
        }
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{metrics.activeDeals}</span>
            <div className="text-[10px] text-gray-500">
              ({metrics.winRate.toFixed(0)}% win)
            </div>
          </div>
        )
      },
      width: '120px',
      align: 'center' as const
    },
    {
      id: 'value',
      header: 'Pipeline Value',
      accessor: (company: Company) => {
        const metrics = getCompanyMetrics(company)
        if (metrics.totalValue === 0) {
          return <span className="text-gray-400 text-sm">$0</span>
        }
        return (
          <span className="font-medium text-gray-900">
            ${(metrics.totalValue / 1000).toFixed(0)}k
          </span>
        )
      },
      width: '120px',
      align: 'right' as const
    },
    {
      id: 'health',
      header: 'Health',
      accessor: (company: Company) => <HealthScore company={company} />,
      width: '100px'
    },
    {
      id: 'activity',
      header: 'Last Activity',
      accessor: (company: Company) => {
        if (!company.data?.lastActivity) {
          return <span className="text-xs text-gray-400">No activity</span>
        }
        return (
          <span className="text-xs text-gray-600">
            {formatDistanceToNow(new Date(company.data.lastActivity), { addSuffix: true })}
          </span>
        )
      },
      width: '120px'
    },
    {
      id: 'owner',
      header: 'Owner',
      accessor: (company: Company) => {
        if (!company.data?.owner) {
          return (
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Assign
            </Button>
          )
        }
        return (
          <Chip variant="default" size="sm" avatar="/api/placeholder/20/20">
            {company.data.owner}
          </Chip>
        )
      },
      width: '100px'
    }
  ]
  
  return (
    <>
      <div className="p-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deals.filter((d: any) => d.data?.status !== 'won' && d.data?.status !== 'lost').length}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-amber-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(deals.reduce((sum: number, d: any) => sum + (d.data?.value || 0), 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
        </div>
        
        <DataTable
          data={filteredCompanies}
          columns={columns}
          searchPlaceholder="Search companies by name, domain, or industry..."
          onSearch={setSearchQuery}
          primaryAction={{
            label: 'New Company',
            onClick: () => setShowNewCompanyModal(true)
          }}
          isLoading={isLoading}
          emptyState={
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Start tracking your business relationships
              </p>
              <Button onClick={() => setShowNewCompanyModal(true)}>
                Add First Company
              </Button>
            </div>
          }
        />
      </div>
      
      {showNewCompanyModal && (
        <NewCompanyModal
          onClose={() => {
            setShowNewCompanyModal(false)
            refetch()
          }}
        />
      )}
    </>
  )
}