'use client'

import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Search, Filter, LayoutGrid, List } from 'lucide-react'

export interface Column {
  id: string
  label: string
  accessor: string | ((row: any) => any)
  width?: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface CleanEntityTableProps {
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

export default function CleanEntityTable({
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
}: CleanEntityTableProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Group data if groupBy is provided
  const groupedData = useMemo(() => {
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

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName)
    } else {
      newCollapsed.add(groupName)
    }
    setCollapsedGroups(newCollapsed)
  }

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
    <div className="bg-white rounded-lg">
      {/* Search and Filter Bar */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
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
          Filter
        </button>
        
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <ChevronDown className="h-4 w-4" />
          Group by
        </button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <List className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4 py-2 border-b border-gray-100">
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          {onSelectionChange && (
            <div className="w-5">
              <input
                type="checkbox"
                checked={selectedRows.length === data.length && data.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </div>
          )}
          
          {columns.map((column, idx) => (
            <div
              key={column.id}
              className={`${
                idx === 0 ? 'flex-1' : column.width || 'w-32'
              } flex items-center gap-1 cursor-pointer hover:text-gray-700`}
              onClick={() => column.sortable && console.log('Sort by', column.id)}
            >
              <span>{column.label}</span>
              {column.sortable && (
                <ChevronDown className="h-3 w-3 opacity-50" />
              )}
            </div>
          ))}
          
          {showAddColumn && (
            <button
              onClick={() => onAddColumn?.({})}
              className="flex items-center gap-1 text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span className="text-xs normal-case">Add Column</span>
            </button>
          )}
          
          {(onRowEdit || onRowDelete) && (
            <div className="w-8"></div>
          )}
        </div>
      </div>

      {/* Table Body - Grouped */}
      <div className="divide-y divide-gray-50">
        {Object.entries(groupedData).map(([groupName, groupItems]) => {
          const isCollapsed = collapsedGroups.has(groupName)
          const hasGrouping = groupBy && groupName !== 'All'
          
          return (
            <div key={groupName}>
              {hasGrouping && (
                <div
                  className="px-4 py-2 bg-gray-50 flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleGroup(groupName)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span>{groupName}</span>
                    <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                      {groupItems.length}
                    </span>
                  </span>
                </div>
              )}

              {!isCollapsed && (
                <div>
                  {groupItems.map((row) => (
                    <div
                      key={row.id}
                      className="px-4 py-3 hover:bg-gray-50/50 transition-colors cursor-pointer flex items-center gap-4"
                      onClick={() => onRowClick?.(row)}
                    >
                      {onSelectionChange && (
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(row.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            handleSelectRow(row.id)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      )}

                      {columns.map((column, idx) => {
                        const value = getValue(row, column.accessor)
                        
                        return (
                          <div
                            key={column.id}
                            className={`${
                              idx === 0 
                                ? 'flex-1 font-medium text-gray-900' 
                                : `${column.width || 'w-32'} text-sm text-gray-600`
                            }`}
                          >
                            {column.render ? column.render(value, row) : value}
                          </div>
                        )
                      })}

                      {(onRowEdit || onRowDelete) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle menu
                          }}
                          className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add new item row */}
                  {hasGrouping && (
                    <div
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-gray-400 hover:text-emerald-600 transition-colors"
                      onClick={() => console.log('Add new', entityType, 'to', groupName)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add {entityType}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Group footer */}
              {hasGrouping && !isCollapsed && (
                <div className="px-4 py-2 text-xs text-gray-500 flex gap-4 border-t border-gray-50">
                  <span>{groupItems.length} tasks</span>
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