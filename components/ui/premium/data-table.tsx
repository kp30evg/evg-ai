'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Search, Filter, ChevronDown, Columns, Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onFilter?: () => void
  onGroupBy?: () => void
  onColumnsCustomize?: () => void
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  isLoading?: boolean
  emptyState?: React.ReactNode
  groupBy?: string
  onRowClick?: (row: T) => void
  selectedRows?: Set<string>
  onRowSelect?: (rowId: string, selected: boolean) => void
  className?: string
}

interface ColumnDef<T> {
  id: string
  header: string | React.ReactNode
  accessor: (row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  className?: string
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  onSearch,
  onFilter,
  onGroupBy,
  onColumnsCustomize,
  primaryAction,
  isLoading,
  emptyState,
  groupBy,
  onRowClick,
  selectedRows,
  onRowSelect,
  className
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [hoveredRow, setHoveredRow] = React.useState<string | null>(null)

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                onSearch?.(e.target.value)
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Filter Button */}
          {onFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={onFilter}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          )}

          {/* Group By */}
          {onGroupBy && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGroupBy}
              className="gap-2"
            >
              <ChevronDown className="h-4 w-4" />
              Group by
            </Button>
          )}

          {/* Columns */}
          {onColumnsCustomize && (
            <Button
              variant="outline"
              size="sm"
              onClick={onColumnsCustomize}
              className="gap-2"
            >
              <Columns className="h-4 w-4" />
              Columns
            </Button>
          )}
        </div>

        {/* Primary Action */}
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {primaryAction.icon || <Plus className="h-4 w-4" />}
            {primaryAction.label}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {selectedRows !== undefined && (
                <th className="w-10 px-6 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={(e) => {
                      data.forEach(row => {
                        onRowSelect?.(row.id, e.target.checked)
                      })
                    }}
                  />
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.id}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
              <th className="w-10 px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton rows
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {selectedRows !== undefined && (
                    <td className="px-6 py-4">
                      <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  )}
                  {columns.map(column => (
                    <td key={column.id} className="px-6 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="w-4 h-4 bg-gray-100 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectedRows !== undefined ? 2 : 1)} className="px-6 py-12">
                  {emptyState || (
                    <div className="text-center">
                      <p className="text-gray-500">No data found</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-gray-50 transition-colors',
                    onRowClick && 'cursor-pointer',
                    hoveredRow === row.id && 'bg-gray-50/50'
                  )}
                  onClick={() => onRowClick?.(row)}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {selectedRows !== undefined && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedRows.has(row.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          onRowSelect?.(row.id, e.target.checked)
                        }}
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={column.id}
                      className={cn(
                        'px-6 py-4 text-sm',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.className
                      )}
                    >
                      {column.accessor(row)}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={cn(
                            'p-1 rounded hover:bg-gray-100 transition-opacity',
                            hoveredRow === row.id ? 'opacity-100' : 'opacity-0'
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-500" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}