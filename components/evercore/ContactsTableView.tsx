'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, Building2, Calendar, Tag, 
  Star, MoreVertical, Sparkles 
} from 'lucide-react'
import EntityTable, { Column } from './entities/EntityTable'
import { trpc } from '@/lib/trpc/client'

interface Contact {
  id: string
  type: string
  data: {
    firstName: string
    lastName: string
    email: string
    phone?: string
    jobTitle?: string
    companyId?: string
    companyName?: string
    sentimentScore?: number
    lastContactedAt?: string
    source?: 'manual' | 'email' | 'calendar' | 'import'
    tags?: string[]
    healthScore?: number
    [key: string]: any // Allow dynamic fields
  }
  relationships?: Record<string, any>
  metadata?: {
    userId?: string
    autoCreated?: boolean
  }
  createdAt: string
  updatedAt: string
}

interface ContactsTableViewProps {
  contacts: Contact[]
  companies?: any[]
  onContactClick?: (contact: Contact) => void
  onContactEdit?: (contact: Contact) => void
  onContactDelete?: (contact: Contact) => void
  isLoading?: boolean
}

export default function ContactsTableView({
  contacts,
  companies = [],
  onContactClick,
  onContactEdit,
  onContactDelete,
  isLoading = false
}: ContactsTableViewProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('firstName')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [customColumns, setCustomColumns] = useState<Column[]>([])

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

  const getSourceBadge = (source?: string) => {
    const sourceColors = {
      email: colors.blue,
      calendar: colors.purple,
      import: colors.orange,
      manual: colors.mediumGray
    }
    
    const sourceIcons = {
      email: <Mail size={12} />,
      calendar: <Calendar size={12} />,
      import: <Building2 size={12} />,
      manual: <User size={12} />
    }
    
    const color = sourceColors[source as keyof typeof sourceColors] || colors.mediumGray
    const icon = sourceIcons[source as keyof typeof sourceIcons] || <User size={12} />
    
    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        backgroundColor: color + '15',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '500',
        color: color,
        textTransform: 'capitalize'
      }}>
        {icon}
        <span>{source || 'manual'}</span>
      </div>
    )
  }

  // Define default columns
  const defaultColumns: Column[] = [
    {
      id: 'name',
      label: 'Name',
      accessor: (row: Contact) => `${row.data.firstName} ${row.data.lastName}`,
      sortable: true,
      render: (value: string, row: Contact) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: colors.evergreen + '15',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.evergreen,
            flexShrink: 0
          }}>
            {row.data.firstName?.[0]?.toUpperCase()}
            {row.data.lastName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>{value}</span>
              {row.metadata?.autoCreated && (
                <div style={{
                  padding: '2px 6px',
                  backgroundColor: colors.gold + '20',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Sparkles size={10} color={colors.gold} />
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '500',
                    color: colors.charcoal
                  }}>
                    Auto
                  </span>
                </div>
              )}
            </div>
            {row.data.jobTitle && (
              <div style={{
                fontSize: '12px',
                color: colors.mediumGray,
                marginTop: '2px'
              }}>
                {row.data.jobTitle}
              </div>
            )}
          </div>
        </div>
      ),
      width: '250px'
    },
    {
      id: 'email',
      label: 'Email',
      accessor: 'data.email',
      sortable: true,
      render: (value: string) => (
        <a 
          href={`mailto:${value}`}
          style={{
            color: colors.blue,
            textDecoration: 'none',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Mail size={14} />
          {value}
        </a>
      ),
      width: '200px'
    },
    {
      id: 'phone',
      label: 'Phone',
      accessor: 'data.phone',
      sortable: true,
      render: (value: string) => value ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: colors.charcoal
        }}>
          <Phone size={14} />
          {value}
        </div>
      ) : (
        <span style={{ color: colors.lightGray }}>—</span>
      ),
      width: '150px'
    },
    {
      id: 'company',
      label: 'Company',
      accessor: 'data.companyName',
      sortable: true,
      render: (value: string) => value ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '13px',
          color: colors.charcoal
        }}>
          <Building2 size={14} color={colors.mediumGray} />
          {value}
        </div>
      ) : (
        <span style={{ color: colors.lightGray }}>—</span>
      ),
      width: '180px'
    },
    {
      id: 'source',
      label: 'Source',
      accessor: 'data.source',
      sortable: true,
      render: (value: string) => getSourceBadge(value),
      width: '120px'
    },
    {
      id: 'tags',
      label: 'Tags',
      accessor: 'data.tags',
      sortable: false,
      render: (value: string[]) => value && value.length > 0 ? (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {value.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              style={{
                padding: '2px 8px',
                backgroundColor: colors.purple + '15',
                color: colors.purple,
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500'
              }}
            >
              {tag}
            </span>
          ))}
          {value.length > 2 && (
            <span style={{
              padding: '2px 8px',
              backgroundColor: colors.lightGray,
              color: colors.mediumGray,
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500'
            }}>
              +{value.length - 2}
            </span>
          )}
        </div>
      ) : (
        <span style={{ color: colors.lightGray }}>—</span>
      ),
      width: '150px'
    },
    {
      id: 'lastContacted',
      label: 'Last Contact',
      accessor: 'data.lastContactedAt',
      sortable: true,
      render: (value: string) => value ? (
        <div style={{
          fontSize: '12px',
          color: colors.mediumGray
        }}>
          {new Date(value).toLocaleDateString()}
        </div>
      ) : (
        <span style={{ color: colors.lightGray }}>—</span>
      ),
      width: '120px'
    },
    {
      id: 'healthScore',
      label: 'Health',
      accessor: 'data.healthScore',
      sortable: true,
      align: 'center' as const,
      render: (value: number) => {
        const getHealthColor = (score?: number) => {
          if (!score) return colors.lightGray
          if (score >= 80) return colors.green
          if (score >= 50) return colors.orange
          return colors.red
        }
        
        return value ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 8px',
            backgroundColor: getHealthColor(value) + '15',
            color: getHealthColor(value),
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {value}%
          </div>
        ) : (
          <span style={{ color: colors.lightGray }}>—</span>
        )
      },
      width: '80px'
    }
  ]

  // Combine default and custom columns
  const allColumns = [...defaultColumns, ...customColumns]

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(columnId)
      setSortDirection('asc')
    }
  }

  const handleAddField = (fieldConfig: any) => {
    // Create a new column based on the field configuration
    const newColumn: Column = {
      id: fieldConfig.id || `custom_${Date.now()}`,
      label: fieldConfig.name,
      accessor: `data.${fieldConfig.key || fieldConfig.name.toLowerCase().replace(/\s+/g, '_')}`,
      sortable: fieldConfig.sortable ?? true,
      width: fieldConfig.width || '150px',
      render: (value: any) => value || <span style={{ color: colors.lightGray }}>—</span>
    }
    
    setCustomColumns([...customColumns, newColumn])
    
    // Here you would also save the field configuration to the database
    // via a tRPC mutation or similar
  }

  // Sort the data
  const sortedData = useMemo(() => {
    if (!sortBy) return contacts
    
    return [...contacts].sort((a, b) => {
      const column = allColumns.find(col => col.id === sortBy)
      if (!column) return 0
      
      const aValue = typeof column.accessor === 'function' 
        ? column.accessor(a) 
        : column.accessor.split('.').reduce((obj, key) => obj?.[key], a)
      
      const bValue = typeof column.accessor === 'function'
        ? column.accessor(b)
        : column.accessor.split('.').reduce((obj, key) => obj?.[key], b)
      
      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      const comparison = aValue < bValue ? -1 : 1
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [contacts, sortBy, sortDirection, allColumns])

  return (
    <div style={{
      width: '100%',
      position: 'relative'
    }}>
      {/* Custom Table Wrapper with Add Field Button */}
      <div style={{
        backgroundColor: colors.white,
        borderRadius: '12px',
        border: `1px solid ${colors.lightGray}40`,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Table with integrated Add Field button */}
        <div style={{
          position: 'relative',
          width: '100%'
        }}>
          <EntityTable
            columns={allColumns}
            data={sortedData}
            onRowClick={onContactClick}
            onRowEdit={onContactEdit}
            onRowDelete={onContactDelete}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSort={handleSort}
            isLoading={isLoading}
            emptyMessage="No contacts found"
            entityType="contact"
            onAddColumn={handleAddField}
            showAddColumn={true}
          />
        </div>
      </div>
    </div>
  )
}