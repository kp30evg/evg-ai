'use client'

import React, { useState } from 'react'
import { ChevronDown, Plus, MoreHorizontal, Search, Filter, LayoutGrid, List } from 'lucide-react'

export interface Column {
  id: string
  label: string
  accessor: string | ((row: any) => any)
  width?: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface EverTaskStyleTableProps {
  columns: Column[]
  data: any[]
  entityType?: string
  onRowClick?: (row: any) => void
  onRowEdit?: (row: any) => void
  onRowDelete?: (row: any) => void
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onAddColumn?: (field: any) => void
  showAddColumn?: boolean
}

export default function EverTaskStyleTable({
  columns,
  data,
  entityType = 'item',
  onRowClick,
  onRowEdit,
  onRowDelete,
  selectedRows = [],
  onSelectionChange,
  onAddColumn,
  showAddColumn = false,
}: EverTaskStyleTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

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

  return (
    <div className="bg-white">
      {/* Clean Search and Filter Bar */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>
        
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <ChevronDown className="h-4 w-4" />
          <span>Group by</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <List className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Clean Table */}
      <div>
        {/* Header Row */}
        <div className="flex items-center gap-4 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
          {onSelectionChange && (
            <div className="w-5">
              <input
                type="checkbox"
                checked={selectedRows.length === data.length && data.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
            </div>
          )}
          
          {columns.map((column) => (
            <div
              key={column.id}
              className={`${column.width || 'flex-1'} flex items-center gap-1 ${
                column.sortable ? 'cursor-pointer hover:text-gray-700' : ''
              }`}
              style={{ minWidth: column.width }}
            >
              <span>{column.label}</span>
              {column.sortable && (
                <ChevronDown className="h-3 w-3 opacity-40" />
              )}
            </div>
          ))}
          
          {showAddColumn && (
            <button
              onClick={() => onAddColumn?.({})}
              className="flex items-center gap-1 px-2 text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span className="text-xs normal-case">Add Column</span>
            </button>
          )}
          
          {(onRowEdit || onRowDelete) && (
            <div className="w-8"></div>
          )}
        </div>

        {/* Data Rows */}
        {data.map((row) => (
          <div
            key={row.id}
            className={`flex items-center gap-4 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group ${
              hoveredRow === row.id ? 'bg-gray-50/50' : ''
            }`}
            onMouseEnter={() => setHoveredRow(row.id)}
            onMouseLeave={() => setHoveredRow(null)}
            onClick={() => onRowClick?.(row)}
          >
            {onSelectionChange && (
              <div className="w-5">
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
              </div>
            )}

            {columns.map((column) => {
              const value = getValue(row, column.accessor)
              
              return (
                <div
                  key={column.id}
                  className={`${column.width || 'flex-1'} text-sm`}
                  style={{ minWidth: column.width }}
                >
                  {column.render ? column.render(value, row) : (
                    <span className="text-gray-700">{value || '—'}</span>
                  )}
                </div>
              )
            })}

            {(onRowEdit || onRowDelete) && (
              <div className="w-8">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle menu
                  }}
                  className={`p-1 hover:bg-gray-100 rounded transition-all ${
                    hoveredRow === row.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {data.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-gray-500">
            No {entityType}s found
          </div>
        )}
      </div>
    </div>
  )
}