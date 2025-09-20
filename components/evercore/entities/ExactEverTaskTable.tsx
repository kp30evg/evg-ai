'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Search, Filter, LayoutGrid, List } from 'lucide-react'

export interface Column {
  id: string
  label: string
  accessor: string | ((row: any) => any)
  width?: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface ExactEverTaskTableProps {
  columns: Column[]
  data: any[]
  entityType?: string
  groupBy?: string
  onRowClick?: (row: any) => void
  onRowEdit?: (row: any) => void
  onRowDelete?: (row: any) => void
  selectedRows?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onAddColumn?: (field: any) => void
  showAddColumn?: boolean
}

export default function ExactEverTaskTable({
  columns,
  data,
  entityType = 'item',
  groupBy,
  onRowClick,
  onRowEdit,
  onRowDelete,
  selectedRows = [],
  onSelectionChange,
  onAddColumn,
  showAddColumn = false,
}: ExactEverTaskTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

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

  // Group data if needed
  const groupedData = React.useMemo(() => {
    if (!groupBy) {
      return { 'All': data }
    }
    const groups: Record<string, any[]> = {}
    data.forEach(item => {
      const groupKey = item[groupBy] || 'Other'
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(item)
    })
    return groups
  }, [data, groupBy])

  return (
    <div className="bg-white">
      {/* Search Bar - Clean like EverTask */}
      <div className="px-6 py-4 flex items-center gap-3 border-b border-gray-100">
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

      {/* Table */}
      <div>
        {/* Header - Clean like EverTask */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100">
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
          
          {columns.map((column, idx) => (
            <div
              key={column.id}
              className={`${
                idx === 0 ? 'flex-1' : column.width || 'w-40'
              } flex items-center gap-1 text-sm font-medium text-gray-600 ${
                column.sortable ? 'cursor-pointer hover:text-gray-900' : ''
              }`}
              style={{ minWidth: column.width }}
            >
              <span>{column.label}</span>
              {column.sortable && (
                <ChevronDown className="h-3 w-3 text-gray-400" />
              )}
            </div>
          ))}
          
          {showAddColumn && (
            <button
              onClick={() => onAddColumn?.({})}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 border border-dashed border-gray-300 rounded hover:text-gray-600 hover:border-gray-400"
            >
              <Plus className="h-3 w-3" />
              <span>Add Column</span>
            </button>
          )}
          
          {(onRowEdit || onRowDelete) && (
            <div className="w-8"></div>
          )}
        </div>

        {/* Body with Groups */}
        {Object.entries(groupedData).map(([groupName, items]) => {
          const isCollapsed = collapsedGroups.has(groupName)
          const showGroup = groupBy && groupName !== 'All'

          return (
            <div key={groupName}>
              {showGroup && (
                <div
                  className="flex items-center gap-2 px-6 py-2 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    const newCollapsed = new Set(collapsedGroups)
                    if (newCollapsed.has(groupName)) {
                      newCollapsed.delete(groupName)
                    } else {
                      newCollapsed.add(groupName)
                    }
                    setCollapsedGroups(newCollapsed)
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{groupName}</span>
                  <span className="text-xs text-gray-500">{items.length}</span>
                </div>
              )}

              {!isCollapsed && items.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-4 px-6 py-3 border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer group"
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

                  {columns.map((column, idx) => {
                    const value = getValue(row, column.accessor)
                    
                    return (
                      <div
                        key={column.id}
                        className={`${
                          idx === 0 ? 'flex-1' : column.width || 'w-40'
                        } text-sm text-gray-700`}
                        style={{ minWidth: column.width }}
                      >
                        {column.render ? column.render(value, row) : value || '—'}
                      </div>
                    )
                  })}

                  {(onRowEdit || onRowDelete) && (
                    <div className="w-8">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className={`p-1 hover:bg-gray-100 rounded ${
                          hoveredRow === row.id ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Add task row for groups */}
              {showGroup && !isCollapsed && (
                <div className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Add {entityType}</span>
                </div>
              )}

              {/* Footer for groups */}
              {showGroup && !isCollapsed && (
                <div className="px-6 py-2 text-xs text-gray-500 flex gap-4 bg-gray-50/50 border-b border-gray-100">
                  <span>{items.length} tasks</span>
                  <span>0 done</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}