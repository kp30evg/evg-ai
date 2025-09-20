'use client'

import React, { useState, useRef } from 'react'
import { ChevronDown, Plus, MoreHorizontal, Search, Filter, LayoutGrid, List } from 'lucide-react'
import AddColumnDropdown from '../table/AddColumnDropdown'
import FieldConfigModal from '../table/FieldConfigModal'
import ColumnHeaderDropdown from '../table/ColumnHeaderDropdown'
import ConfirmationModal from '../modals/ConfirmationModal'
import { useToast, ToastContainer } from '../ui/Toast'
import { ColumnTypeDefinition } from '../types/column-types'
import { trpc } from '@/lib/trpc/client'

export interface Column {
  id: string
  label: string
  accessor: string | ((row: any) => any)
  width?: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
  isCustomField?: boolean
}

interface CleanTaskTableProps {
  columns: Column[]
  data: any[]
  entityType?: string
  onRowClick?: (row: any) => void
  onRowEdit?: (row: any) => void
  onRowDelete?: (row: any) => void
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onAddColumn?: (field: any) => void
  onDeleteColumn?: (columnId: string) => void
  showAddColumn?: boolean
}

export default function CleanTaskTable({
  columns,
  data,
  entityType = 'item',
  onRowClick,
  onRowEdit,
  onRowDelete,
  selectedRows = [],
  onSelectionChange,
  onAddColumn,
  onDeleteColumn,
  showAddColumn = false,
}: CleanTaskTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ColumnTypeDefinition | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; columnId: string; columnLabel: string } | null>(null)
  const [deletedColumns, setDeletedColumns] = useState<Array<{ column: Column; deletedAt: number }>>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { toasts, success, error } = useToast()
  
  const deleteColumnMutation = trpc.workspaceConfig.deleteCustomField.useMutation()

  const getValue = (row: any, accessor: string | ((row: any) => any)) => {
    if (typeof accessor === 'function') {
      return accessor(row)
    }
    return accessor.split('.').reduce((obj, key) => obj?.[key], row)
  }

  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      onSelectionChange?.([])
    } else {
      onSelectionChange?.(data.map(row => row.id))
    }
  }

  const handleSelectRow = (rowId: string) => {
    if (selectedRows.includes(rowId)) {
      onSelectionChange?.(selectedRows.filter(id => id !== rowId))
    } else {
      onSelectionChange?.([...selectedRows, rowId])
    }
  }

  const handleAddColumnClick = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        x: rect.left,
        y: rect.bottom + 8
      })
    }
    setIsDropdownOpen(true)
  }

  const handleSelectType = (type: ColumnTypeDefinition) => {
    setSelectedType(type)
    setIsDropdownOpen(false)
    setIsConfigOpen(true)
  }

  const handleFieldCreated = (fieldConfig: any) => {
    onAddColumn?.(fieldConfig)
    setIsConfigOpen(false)
    setSelectedType(null)
  }
  
  const handleDeleteColumn = (columnId: string, columnLabel: string) => {
    setDeleteConfirmation({ isOpen: true, columnId, columnLabel })
  }
  
  const confirmDeleteColumn = async () => {
    if (!deleteConfirmation) return
    
    const { columnId, columnLabel } = deleteConfirmation
    const columnToDelete = columns.find(c => c.id === columnId)
    
    if (!columnToDelete) return
    
    try {
      // Soft delete - store deleted column for undo
      const deletedColumn = {
        column: columnToDelete,
        deletedAt: Date.now()
      }
      setDeletedColumns(prev => [...prev, deletedColumn])
      
      // Call the deletion handler
      onDeleteColumn?.(columnId)
      
      // Delete from backend (soft delete by default)
      await deleteColumnMutation.mutateAsync({
        fieldId: columnId,
        removeData: false // Keep data for 30 days
      })
      
      // Show success toast with undo option
      success(`Deleted '${columnLabel}' column`, {
        message: 'Column data will be kept for 30 days',
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => handleUndoDelete(deletedColumn)
        }
      })
      
      setDeleteConfirmation(null)
      
      // Auto-remove from deleted columns after 30 seconds (for undo capability)
      setTimeout(() => {
        setDeletedColumns(prev => prev.filter(d => d !== deletedColumn))
      }, 30000)
    } catch (err) {
      error('Failed to delete column', {
        message: 'Please try again or contact support'
      })
      console.error('Failed to delete column:', err)
    }
  }
  
  const handleUndoDelete = async (deletedColumn: { column: Column; deletedAt: number }) => {
    try {
      // Re-create the field
      const { column } = deletedColumn
      onAddColumn?.({
        name: column.id,
        label: column.label,
        type: 'text', // Default type, should be stored with column metadata
        entityType: entityType
      })
      
      // Remove from deleted columns
      setDeletedColumns(prev => prev.filter(d => d !== deletedColumn))
      
      success('Column restored', {
        message: `'${column.label}' has been restored`
      })
    } catch (err) {
      error('Failed to restore column', {
        message: 'Please try again'
      })
    }
  }

  return (
    <div className="w-full bg-white">
      {/* Search Bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>
        
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <ChevronDown className="h-4 w-4" />
          <span>Group by</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button className="p-2 rounded hover:bg-gray-100">
            <List className="h-4 w-4 text-gray-600" />
          </button>
          <button className="p-2 rounded hover:bg-gray-100">
            <LayoutGrid className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-gray-100">
              {onSelectionChange && (
                <th className="w-10 px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              
              {columns.map((column, idx) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-left text-sm font-normal text-gray-500 ${
                    column.sortable ? 'cursor-pointer hover:text-gray-700' : ''
                  }`}
                  style={{ 
                    width: column.width
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    {column.isCustomField && (
                      <ColumnHeaderDropdown
                        columnId={column.id}
                        columnLabel={column.label}
                        isCustomField={true}
                        onDelete={() => handleDeleteColumn(column.id, column.label)}
                        onRename={(newName) => console.log('Rename to:', newName)}
                        onChangeType={() => console.log('Change type')}
                      />
                    )}
                  </div>
                </th>
              ))}
              
              {showAddColumn && (
                <th className="px-4 py-3">
                  <button
                    ref={buttonRef}
                    onClick={handleAddColumnClick}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded hover:text-gray-600 hover:border-gray-400 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Column</span>
                  </button>
                </th>
              )}
              
              {(onRowEdit || onRowDelete) && (
                <th className="w-10 px-4 py-3"></th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer ${
                  hoveredRow === row.id ? 'bg-gray-50/50' : ''
                }`}
                onMouseEnter={() => setHoveredRow(row.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onRowClick?.(row)}
              >
                {onSelectionChange && (
                  <td className="w-10 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelectRow(row.id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}

                {columns.map((column, idx) => {
                  const value = getValue(row, column.accessor)
                  
                  return (
                    <td
                      key={column.id}
                      className="px-4 py-3 text-sm"
                      style={{ 
                        width: column.width
                      }}
                    >
                      {column.render ? column.render(value, row) : (
                        <span className="text-gray-700">{value || '—'}</span>
                      )}
                    </td>
                  )
                })}

                {(onRowEdit || onRowDelete) && (
                  <td className="w-10 px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className={`p-1 hover:bg-gray-100 rounded transition-opacity ${
                        hoveredRow === row.id ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Column Dropdown */}
      <AddColumnDropdown
        isOpen={isDropdownOpen}
        onClose={() => setIsDropdownOpen(false)}
        onSelectType={handleSelectType}
        position={dropdownPosition}
      />

      {/* Field Configuration Modal */}
      {selectedType && (
        <FieldConfigModal
          isOpen={isConfigOpen}
          onClose={() => {
            setIsConfigOpen(false)
            setSelectedType(null)
          }}
          fieldType={selectedType}
          onSave={handleFieldCreated}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <ConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation(null)}
          onConfirm={confirmDeleteColumn}
          title={`Delete '${deleteConfirmation.columnLabel}' column?`}
          message="Are you sure you want to delete this column? All data in this column will be moved to the trash for 30 days before being permanently deleted."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}