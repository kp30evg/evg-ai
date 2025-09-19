'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { theme } from '@/lib/evercore/theme'
import { useCRM } from '@/lib/contexts/crm-context'
import { trpc } from '@/lib/trpc/client'
import EntityTable, { Column } from '@/components/evercore/entities/EntityTable'
import MetricCard from '@/components/evercore/dashboard/MetricCard'
import { 
  Building2,
  Users,
  Target,
  DollarSign,
  Globe,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Mail,
  ChevronLeft,
  Edit,
  Plus,
  ExternalLink,
  Activity
} from 'lucide-react'

export default function CompanyDetailView() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.id as string
  
  const { 
    contacts, 
    deals, 
    companies,
    activities 
  } = useCRM()
  
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals' | 'activity'>('contacts')
  
  // Find the company
  const company = companies.find(c => c.id === companyId)
  
  if (!company) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: theme.colors.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Building2 size={48} color={theme.colors.mediumGray} />
          <h2 style={{ color: theme.colors.charcoal, marginTop: theme.spacing.md }}>
            Company not found
          </h2>
          <button
            onClick={() => router.push('/dashboard/crm?tab=companies')}
            style={{
              marginTop: theme.spacing.md,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: theme.colors.evergreen,
              color: theme.colors.white,
              border: 'none',
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
            }}
          >
            Back to Companies
          </button>
        </div>
      </div>
    )
  }
  
  // Get related entities
  const companyContacts = contacts.filter(c => 
    c.companyId === company.id || c.company === company.name
  )
  
  const companyDeals = deals.filter(d => 
    d.companyId === company.id || d.company === company.name
  )
  
  const activeDeals = companyDeals.filter(d => 
    d.stage !== 'Closed Won' && d.stage !== 'Closed Lost'
  )
  
  const totalPipelineValue = companyDeals
    .filter(d => d.stage !== 'Closed Lost')
    .reduce((sum, d) => sum + d.value, 0)
  
  const closedRevenue = companyDeals
    .filter(d => d.stage === 'Closed Won')
    .reduce((sum, d) => sum + d.value, 0)
  
  // Contact columns for the table
  const contactColumns: Column[] = [
    {
      id: 'name',
      label: 'Name',
      accessor: 'name',
      sortable: true,
      render: (value: string, row: any) => (
        <div 
          onClick={() => router.push(`/dashboard/crm/contacts/${row.id}`)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            color: theme.colors.evergreen,
          }}
        >
          <span style={{ fontWeight: theme.typography.fontWeight.medium }}>
            {value}
          </span>
          {row.title && (
            <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.mediumGray }}>
              {row.title}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'email',
      label: 'Email',
      accessor: 'email',
      render: (value: string) => (
        <a href={`mailto:${value}`} style={{ color: theme.colors.evergreen }}>
          {value}
        </a>
      )
    },
    {
      id: 'phone',
      label: 'Phone',
      accessor: 'phone',
      render: (value?: string) => value || <span style={{ color: theme.colors.mediumGray }}>—</span>
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      render: (value: string) => {
        const colors = {
          Hot: theme.colors.error,
          Warm: theme.colors.warning,
          Cold: theme.colors.info
        }
        return (
          <span style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            backgroundColor: colors[value as keyof typeof colors] + '20',
            color: colors[value as keyof typeof colors],
            borderRadius: theme.borderRadius.sm,
            fontSize: theme.typography.fontSize.sm,
          }}>
            {value}
          </span>
        )
      }
    },
    {
      id: 'lastContact',
      label: 'Last Contact',
      accessor: 'lastContact',
      sortable: true,
      render: (value: Date) => {
        const days = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))
        return `${days} days ago`
      }
    }
  ]
  
  // Deal columns for the table
  const dealColumns: Column[] = [
    {
      id: 'name',
      label: 'Deal Name',
      accessor: 'name',
      sortable: true,
      render: (value: string, row: any) => (
        <div
          onClick={() => router.push(`/dashboard/crm/deals/${row.id}`)}
          style={{
            cursor: 'pointer',
            color: theme.colors.evergreen,
            fontWeight: theme.typography.fontWeight.medium,
          }}
        >
          {value}
        </div>
      )
    },
    {
      id: 'stage',
      label: 'Stage',
      accessor: 'stage',
      render: (value: string) => (
        <span style={{
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          backgroundColor: theme.colors.softGreen,
          color: theme.colors.evergreen,
          borderRadius: theme.borderRadius.sm,
          fontSize: theme.typography.fontSize.sm,
        }}>
          {value}
        </span>
      )
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
      render: (value: number) => `${value}%`
    },
    {
      id: 'owner',
      label: 'Owner',
      accessor: 'owner'
    },
    {
      id: 'closeDate',
      label: 'Expected Close',
      accessor: 'closeDate',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString()
    }
  ]
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background,
      fontFamily: theme.typography.fontFamily,
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderBottom: `1px solid ${theme.colors.border}`,
        padding: theme.spacing.lg,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs,
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.borderRadius.md,
              color: theme.colors.text,
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div style={{ display: 'flex', gap: theme.spacing.lg }}>
            {/* Company Logo Placeholder */}
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: theme.colors.softGreen,
              borderRadius: theme.borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Building2 size={32} color={theme.colors.evergreen} />
            </div>
            
            {/* Company Info */}
            <div>
              <h1 style={{
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.charcoal,
                margin: 0,
              }}>
                {company.name}
              </h1>
              
              <div style={{
                display: 'flex',
                gap: theme.spacing.md,
                marginTop: theme.spacing.sm,
                flexWrap: 'wrap',
              }}>
                {company.industry && (
                  <span style={{ color: theme.colors.mediumGray }}>
                    {company.industry}
                  </span>
                )}
                {company.size && (
                  <span style={{ color: theme.colors.mediumGray }}>
                    • {company.size} employees
                  </span>
                )}
                {company.domain && (
                  <a
                    href={`https://${company.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.colors.evergreen,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                      textDecoration: 'none',
                    }}
                  >
                    <Globe size={14} />
                    {company.domain}
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              
              {company.description && (
                <p style={{
                  marginTop: theme.spacing.sm,
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                }}>
                  {company.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <button
              onClick={() => console.log('Edit company')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text,
                cursor: 'pointer',
              }}
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={() => console.log('Create deal')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                backgroundColor: theme.colors.evergreen,
                color: theme.colors.white,
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              New Deal
            </button>
          </div>
        </div>
      </div>
      
      {/* Metrics */}
      <div style={{
        padding: theme.spacing.lg,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: theme.spacing.md,
      }}>
        <MetricCard
          icon={Users}
          label="Contacts"
          value={companyContacts.length.toString()}
          trend={0}
        />
        <MetricCard
          icon={Target}
          label="Active Deals"
          value={activeDeals.length.toString()}
          trend={0}
        />
        <MetricCard
          icon={DollarSign}
          label="Pipeline Value"
          value={`$${(totalPipelineValue / 1000).toFixed(0)}K`}
          trend={0}
        />
        <MetricCard
          icon={TrendingUp}
          label="Closed Revenue"
          value={`$${(closedRevenue / 1000).toFixed(0)}K`}
          trend={0}
        />
        <MetricCard
          icon={Activity}
          label="Health Score"
          value={`${company.healthScore || 50}%`}
          trend={0}
        />
      </div>
      
      {/* Tabs */}
      <div style={{
        backgroundColor: theme.colors.white,
        borderTop: `1px solid ${theme.colors.border}`,
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        gap: theme.spacing.lg,
        padding: `0 ${theme.spacing.lg}`,
      }}>
        {(['contacts', 'deals', 'activity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: `${theme.spacing.md} 0`,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${theme.colors.evergreen}` : '2px solid transparent',
              color: activeTab === tab ? theme.colors.evergreen : theme.colors.text,
              fontWeight: activeTab === tab ? theme.typography.fontWeight.medium : theme.typography.fontWeight.regular,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab} ({tab === 'contacts' ? companyContacts.length : tab === 'deals' ? companyDeals.length : 0})
          </button>
        ))}
      </div>
      
      {/* Content */}
      <div style={{ padding: theme.spacing.lg }}>
        {activeTab === 'contacts' && (
          <EntityTable
            columns={contactColumns}
            data={companyContacts}
            onRowClick={(row) => router.push(`/dashboard/crm/contacts/${row.id}`)}
            sortBy="name"
            sortDirection="asc"
          />
        )}
        
        {activeTab === 'deals' && (
          <EntityTable
            columns={dealColumns}
            data={companyDeals}
            onRowClick={(row) => router.push(`/dashboard/crm/deals/${row.id}`)}
            sortBy="value"
            sortDirection="desc"
          />
        )}
        
        {activeTab === 'activity' && (
          <div style={{
            padding: theme.spacing.lg,
            backgroundColor: theme.colors.white,
            borderRadius: theme.borderRadius.md,
            textAlign: 'center',
            color: theme.colors.mediumGray,
          }}>
            <Activity size={48} />
            <p style={{ marginTop: theme.spacing.md }}>
              Activity timeline coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  )
}