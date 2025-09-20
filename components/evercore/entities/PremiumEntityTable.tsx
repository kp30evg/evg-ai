'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  Filter,
  Download,
  Upload,
  Search,
  Plus,
} from 'lucide-react'
import TableAddColumnButton from '../table/TableAddColumnButton'

export interface Column {
  id: string
  label: string
  accessor: string | ((row: any) => any)
  width?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: any) => React.ReactNode
}

export interface EntityTableProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  onRowEdit?: (row: any) => void
  onRowDelete?: (row: any) => void
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (columnId: string) => void
  isLoading?: boolean
  emptyMessage?: string
  entityType?: 'contact' | 'company' | 'deal' | 'lead' | 'product' | 'order'
  onAddColumn?: (field: any) => void
  showAddColumn?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
  showToolbar?: boolean
}

export default function PremiumEntityTable({
  columns,
  data,
  onRowClick,
  onRowEdit,
  onRowDelete,
  selectedRows = [],
  onSelectionChange,
  sortBy,
  sortDirection = 'asc',
  onSort,
  isLoading = false,
  emptyMessage = 'No data available',
  entityType,
  onAddColumn,
  showAddColumn = false,
  searchValue = '',
  onSearchChange,
  showToolbar = true,
}: EntityTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [menuOpenRow, setMenuOpenRow] = useState<string | null>(null)
  const [localSearchValue, setLocalSearchValue] = useState(searchValue)
  const checkboxRef = useRef<HTMLInputElement>(null)

  // Handle indeterminate state for checkbox
  useEffect(() => {
    if (checkboxRef.current) {
      const isIndeterminate = selectedRows.length > 0 && selectedRows.length < data.length
      checkboxRef.current.indeterminate = isIndeterminate
    }
  }, [selectedRows.length, data.length])

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

  const getValue = (row: any, accessor: string | ((row: any) => any)) => {
    if (typeof accessor === 'function') {
      return accessor(row)
    }
    return accessor.split('.').reduce((obj, key) => obj?.[key], row)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* EverTask-style Toolbar */}
      {showToolbar && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${entityType || 'items'}...`}
              value={localSearchValue}
              onChange={(e) => {
                setLocalSearchValue(e.target.value)
                onSearchChange?.(e.target.value)
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            Filter
          </button>

          {/* Group By */}
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <ChevronDown className="h-4 w-4" />
            Group by
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {onSelectionChange && (
                <th className="w-10 px-4 py-3">
                  <input
                    ref={checkboxRef}
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''
                  }`}
                  style={{ 
                    width: column.width,
                    textAlign: column.align || 'left'
                  }}
                  onClick={() => column.sortable && onSort?.(column.id)}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <ArrowUpDown className="h-3 w-3 opacity-50" />
                    )}
                  </div>
                </th>
              ))}
              {showAddColumn && (
                <th className="px-4 py-3 w-32">
                  <TableAddColumnButton 
                    onAddColumn={onAddColumn!}
                    entityType={entityType}
                  />
                </th>
              )}
              {(onRowEdit || onRowDelete) && (
                <th className="w-10 px-4 py-3"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {onSelectionChange && (
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.id} className="px-4 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                  {showAddColumn && <td className="px-4 py-3"></td>}
                  {(onRowEdit || onRowDelete) && (
                    <td className="px-4 py-3">
                      <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td 
                  colSpan={
                    columns.length + 
                    (onSelectionChange ? 1 : 0) + 
                    (showAddColumn ? 1 : 0) + 
                    (onRowEdit || onRowDelete ? 1 : 0)
                  }
                  className="px-4 py-12 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((row) => (
                <tr
                  key={row.id}
                  className={`
                    transition-colors cursor-pointer
                    ${hoveredRow === row.id ? 'bg-gray-50/50' : ''}
                    ${selectedRows.includes(row.id) ? 'bg-emerald-50/30' : ''}
                  `}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(row)}
                >
                  {onSelectionChange && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => {
                    const value = getValue(row, column.accessor)
                    return (
                      <td
                        key={column.id}
                        className="px-4 py-3 text-sm"
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {column.render ? column.render(value, row) : value}
                      </td>
                    )
                  })}
                  {showAddColumn && <td className="px-4 py-3"></td>}
                  {(onRowEdit || onRowDelete) && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className={`${hoveredRow === row.id ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpenRow(menuOpenRow === row.id ? null : row.id)
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>

                        {/* Dropdown menu */}
                        {menuOpenRow === row.id && (
                          <div className="absolute right-4 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            {onRowEdit && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRowEdit(row)
                                  setMenuOpenRow(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </button>
                            )}
                            {onRowDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onRowDelete(row)
                                  setMenuOpenRow(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination info */}
      {data.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            {selectedRows.length > 0 && (
              <span>{selectedRows.length} of {data.length} selected</span>
            )}
          </div>
          <div>
            Showing {data.length} {entityType || 'items'}
          </div>
        </div>
      )}
    </div>
  )
}