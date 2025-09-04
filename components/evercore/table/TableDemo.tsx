'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import EnhancedTableHeader from './EnhancedTableHeader'
import AddColumnDropdown from './AddColumnDropdown'
import FieldConfigModal from './FieldConfigModal'
import { TableColumn, ColumnTypeDefinition, getColumnType } from '../types/column-types'

// Sample data for demonstration
const sampleColumns: TableColumn[] = [
  {
    id: 'name',
    name: 'Contact Name',
    type: 'text',
    config: { required: true, maxLength: 100 },
    width: 200,
    visible: true,
    sortable: true,
    filterable: true,
    required: true,
    position: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'email',
    name: 'Email',
    type: 'email',
    config: { required: true, validate: true },
    width: 180,
    visible: true,
    sortable: true,
    filterable: true,
    required: true,
    position: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
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
    position: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
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
      ],
      colorCoded: true
    },
    width: 120,
    visible: true,
    sortable: true,
    filterable: true,
    required: false,
    position: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
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
    position: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'lastContact',
    name: 'Last Contact',
    type: 'date',
    config: { format: 'MMM DD, YYYY', includeTime: false },
    width: 140,
    visible: true,
    sortable: true,
    filterable: true,
    required: false,
    position: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'createdAt',
    name: 'Created',
    type: 'createdTime',
    config: { format: 'relative', includeTime: true },
    width: 120,
    visible: false, // Hidden by default
    sortable: true,
    filterable: true,
    required: false,
    position: 6,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

const sampleData = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@acme.com',
    company: 'Acme Inc',
    status: 'hot',
    dealValue: 75000,
    lastContact: '2024-01-15',
    createdAt: '2024-01-01'
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah@techcorp.com',
    company: 'TechCorp',
    status: 'warm',
    dealValue: 45000,
    lastContact: '2024-01-10',
    createdAt: '2024-01-02'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike@startup.io',
    company: 'Startup Inc',
    status: 'cold',
    dealValue: 0,
    lastContact: '2023-12-20',
    createdAt: '2023-12-15'
  }
]

export default function TableDemo() {
  const [columns, setColumns] = useState<TableColumn[]>(sampleColumns)
  const [showAddColumn, setShowAddColumn] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedFieldType, setSelectedFieldType] = useState<ColumnTypeDefinition | undefined>()
  const [editingColumn, setEditingColumn] = useState<TableColumn | undefined>()
  const [currentSort, setCurrentSort] = useState<{ columnId: string; direction: 'asc' | 'desc' } | undefined>()
  const [addColumnPosition, setAddColumnPosition] = useState({ x: 0, y: 0 })

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC'
  }

  const handleAddColumn = (event?: React.MouseEvent) => {
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect()
      setAddColumnPosition({
        x: rect.left - 200, // Position to the left of the button
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

  const handleConfigureColumn = (columnId: string) => {
    const column = columns.find(col => col.id === columnId)
    if (column) {
      setEditingColumn(column)
      setSelectedFieldType(undefined)
      setShowConfigModal(true)
    }
  }

  const handleSaveColumn = async (columnData: Partial<TableColumn>) => {
    if (editingColumn) {
      // Update existing column
      setColumns(prevColumns =>
        prevColumns.map(col =>
          col.id === editingColumn.id ? { ...col, ...columnData } : col
        )
      )
    } else {
      // Add new column
      const newColumn: TableColumn = {
        id: `col-${Date.now()}`,
        ...columnData,
        position: columns.length,
        createdAt: new Date(),
        updatedAt: new Date()
      } as TableColumn
      
      setColumns(prevColumns => [...prevColumns, newColumn])
    }
    setShowConfigModal(false)
  }

  const handleToggleColumn = (columnId: string, visible: boolean) => {
    setColumns(prevColumns =>
      prevColumns.map(col =>
        col.id === columnId ? { ...col, visible } : col
      )
    )
  }

  const handleDeleteColumn = (columnId: string) => {
    if (window.confirm('Are you sure you want to delete this column? This action cannot be undone.')) {
      setColumns(prevColumns => prevColumns.filter(col => col.id !== columnId))
    }
  }

  const handleSort = (columnId: string, direction: 'asc' | 'desc') => {
    setCurrentSort({ columnId, direction })
    // In a real implementation, you would sort the data here
    console.log(`Sorting ${columnId} ${direction}`)
  }

  const handleFilter = (columnId: string) => {
    // In a real implementation, you would show filter UI here
    console.log(`Filtering ${columnId}`)
  }

  const formatCellValue = (column: TableColumn, value: any) => {
    const columnType = getColumnType(column.type)
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: column.config.currency || 'USD',
          minimumFractionDigits: column.config.precision || 0
        }).format(value || 0)
      
      case 'date':
        if (!value) return '-'
        const date = new Date(value)
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      
      case 'singleSelect':
        if (!value) return '-'
        const option = column.config.options?.find((opt: any) => opt.id === value)
        return option ? (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: `${option.color}15`,
            color: option.color,
            border: `1px solid ${option.color}30`
          }}>
            {option.label}
          </span>
        ) : value
      
      case 'email':
        return value ? (
          <a href={`mailto:${value}`} style={{ 
            color: colors.evergreen, 
            textDecoration: 'none' 
          }}>
            {value}
          </a>
        ) : '-'
      
      default:
        return value || '-'
    }
  }

  const visibleColumns = columns.filter(col => col.visible)

  return (
    <div style={{
      padding: '24px',
      backgroundColor: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}`,
      margin: '24px',
      minHeight: '600px'
    }}>
      {/* Demo Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: colors.charcoal,
          marginBottom: '8px'
        }}>
          Enhanced Table Demo
        </h2>
        <p style={{
          fontSize: '14px',
          color: colors.mediumGray,
          lineHeight: '1.5'
        }}>
          This demonstrates the comprehensive column type system for EverCore tables. Click the + button to add new columns, 
          or use the menu on existing columns to configure them. Try different field types like Currency, Select options, Dates, and more.
        </p>
      </div>

      {/* Table */}
      <div style={{
        border: `1px solid ${colors.lightGray}`,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{ overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '800px'
          }}>
            <EnhancedTableHeader
              columns={columns}
              onSort={handleSort}
              onAddColumn={handleAddColumn}
              onConfigureColumn={handleConfigureColumn}
              onToggleColumn={handleToggleColumn}
              onDeleteColumn={handleDeleteColumn}
              onFilter={handleFilter}
              currentSort={currentSort}
            />
            
            <tbody>
              {sampleData.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? colors.white : '#FAFBFC',
                    borderBottom: `1px solid ${colors.lightGray}`,
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.softGreen
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = rowIndex % 2 === 0 ? colors.white : '#FAFBFC'
                  }}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      style={{
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: colors.charcoal,
                        width: column.width || 'auto'
                      }}
                    >
                      {formatCellValue(column, (row as any)[column.id])}
                    </td>
                  ))}
                  <td style={{ width: '50px', padding: '12px 16px' }}>
                    {/* Empty cell for add column button alignment */}
                  </td>
                </tr>
              ))}
              
              {sampleData.length === 0 && (
                <tr>
                  <td 
                    colSpan={visibleColumns.length + 1}
                    style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: colors.mediumGray,
                      fontSize: '14px'
                    }}
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column Stats */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: colors.mediumGray
      }}>
        <div>
          {visibleColumns.length} of {columns.length} columns visible • {sampleData.length} rows
        </div>
        <div>
          💡 Try adding fields like Rating, Formula, or Multi-select
        </div>
      </div>

      {/* Add Column Dropdown */}
      <AddColumnDropdown
        isOpen={showAddColumn}
        onClose={() => setShowAddColumn(false)}
        onSelectType={handleSelectFieldType}
        position={addColumnPosition}
      />

      {/* Field Configuration Modal */}
      <FieldConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSave={handleSaveColumn}
        fieldType={selectedFieldType}
        existingColumn={editingColumn}
      />

      {/* Demo Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: colors.softGreen,
          borderRadius: '8px',
          border: `1px solid ${colors.evergreen}30`
        }}
      >
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: colors.evergreen,
          marginBottom: '12px'
        }}>
          🚀 Try These Features:
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '12px',
          fontSize: '14px',
          color: colors.charcoal
        }}>
          <div>• <strong>Add columns:</strong> Click the + button to add 20+ field types</div>
          <div>• <strong>Configure fields:</strong> Use the ⋯ menu on column headers</div>
          <div>• <strong>Sort & filter:</strong> Click the sort/filter icons</div>
          <div>• <strong>Hide/show:</strong> Toggle column visibility</div>
          <div>• <strong>Field types:</strong> Try Currency, Select, Date, Rating, and more</div>
          <div>• <strong>Natural language:</strong> Coming soon - "Add a priority field"</div>
        </div>
      </motion.div>
    </div>
  )
}