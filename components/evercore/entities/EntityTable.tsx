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
} from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
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
}

export default function EntityTable({
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
}: EntityTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [menuOpenRow, setMenuOpenRow] = useState<string | null>(null)
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
    <div style={{
      backgroundColor: theme.colors.white,
      border: `1px solid ${theme.colors.lightGray}`,
      borderRadius: theme.borderRadius.md,
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Table Container */}
      <div 
        className="table-container"
        style={{ 
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          maxWidth: '100%',
          paddingBottom: '20px',
        }}>
        <table 
          style={{
            width: 'max-content',
            minWidth: '100%',
            borderCollapse: 'collapse',
          }}>
          {/* Header */}
          <thead>
            <tr style={{
              backgroundColor: theme.colors.lightGray + '30',
              borderBottom: `1px solid ${theme.colors.lightGray}`,
            }}>
              {/* Checkbox Column */}
              {onSelectionChange && (
                <th style={{
                  width: '48px',
                  padding: theme.spacing.md,
                  textAlign: 'center',
                }}>
                  <input
                    ref={checkboxRef}
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    style={{
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                    }}
                  />
                </th>
              )}
              
              {/* Data Columns */}
              {columns.map((column) => (
                <th
                  key={column.id}
                  style={{
                    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
                    textAlign: column.align || 'left',
                    width: column.width,
                    minWidth: column.width || '120px',
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.charcoal,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    justifyContent: column.align === 'center' ? 'center' : 
                                   column.align === 'right' ? 'flex-end' : 'flex-start',
                  }}>
                    {column.label}
                    {column.sortable && (
                      <button
                        onClick={() => onSort?.(column.id)}
                        style={{
                          padding: '2px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: theme.borderRadius.sm,
                          color: sortBy === column.id 
                            ? theme.colors.evergreen 
                            : theme.colors.mediumGray,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: theme.transitions.fast,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.colors.lightGray
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {sortBy === column.id ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              
              {/* Actions Column */}
              {(onRowEdit || onRowDelete) && (
                <th style={{
                  width: '60px',
                  padding: theme.spacing.md,
                }}></th>
              )}
              
              {/* Add Column Button */}
              {showAddColumn && entityType && (
                <th style={{
                  width: '60px',
                  minWidth: '60px',
                  padding: 0,
                  backgroundColor: theme.colors.lightGray + '30',
                }}>
                  <TableAddColumnButton
                    entityType={entityType}
                    onAddField={onAddColumn}
                  />
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0) + (onRowEdit || onRowDelete ? 1 : 0) + (showAddColumn ? 1 : 0)}>
                  <div style={{
                    padding: theme.spacing['3xl'],
                    textAlign: 'center',
                    color: theme.colors.mediumGray,
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: `3px solid ${theme.colors.lightGray}`,
                      borderTop: `3px solid ${theme.colors.evergreen}`,
                      borderRadius: theme.borderRadius.full,
                      margin: '0 auto',
                      animation: 'spin 1s linear infinite',
                    }} />
                    <style jsx>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0) + (onRowEdit || onRowDelete ? 1 : 0) + (showAddColumn ? 1 : 0)}>
                  <div style={{
                    padding: theme.spacing['3xl'],
                    textAlign: 'center',
                    color: theme.colors.mediumGray,
                    fontSize: theme.typography.fontSize.sm,
                  }}>
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <motion.tr
                  key={row.id || rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: rowIndex * 0.02 }}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: `1px solid ${theme.colors.lightGray}`,
                    backgroundColor: hoveredRow === row.id 
                      ? theme.colors.softGreen + '30' 
                      : selectedRows.includes(row.id)
                      ? theme.colors.lightGray + '20'
                      : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: theme.transitions.fast,
                  }}
                >
                  {/* Checkbox Cell */}
                  {onSelectionChange && (
                    <td style={{
                      padding: theme.spacing.md,
                      textAlign: 'center',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSelectRow(row.id)
                        }}
                        style={{
                          cursor: 'pointer',
                          width: '16px',
                          height: '16px',
                        }}
                      />
                    </td>
                  )}
                  
                  {/* Data Cells */}
                  {columns.map((column) => {
                    const value = getValue(row, column.accessor)
                    
                    return (
                      <td
                        key={column.id}
                        style={{
                          padding: `${theme.spacing.lg} ${theme.spacing.lg}`,
                          textAlign: column.align || 'left',
                          width: column.width || 'auto',
                          minWidth: column.width || 'auto',
                          fontSize: theme.typography.fontSize.sm,
                          color: theme.colors.charcoal,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {column.render ? column.render(value, row) : value}
                      </td>
                    )
                  })}
                  
                  {/* Actions Cell */}
                  {(onRowEdit || onRowDelete) && (
                    <td style={{
                      padding: theme.spacing.md,
                      position: 'relative',
                    }}>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpenRow(menuOpenRow === row.id ? null : row.id)
                          }}
                          style={{
                            padding: theme.spacing.sm,
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: theme.borderRadius.sm,
                            color: theme.colors.mediumGray,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: theme.transitions.fast,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors.lightGray
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        
                        {/* Action Menu */}
                        <AnimatePresence>
                          {menuOpenRow === row.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '4px',
                                backgroundColor: theme.colors.white,
                                border: `1px solid ${theme.colors.lightGray}`,
                                borderRadius: theme.borderRadius.base,
                                boxShadow: theme.shadows.lg,
                                zIndex: theme.zIndex.dropdown,
                                minWidth: '120px',
                                overflow: 'hidden',
                              }}
                            >
                              {onRowEdit && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onRowEdit(row)
                                    setMenuOpenRow(null)
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: theme.spacing.sm,
                                    width: '100%',
                                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    fontSize: theme.typography.fontSize.sm,
                                    color: theme.colors.charcoal,
                                    cursor: 'pointer',
                                    transition: theme.transitions.fast,
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.colors.lightGray
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <Edit size={14} />
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
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: theme.spacing.sm,
                                    width: '100%',
                                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    fontSize: theme.typography.fontSize.sm,
                                    color: theme.colors.error,
                                    cursor: 'pointer',
                                    transition: theme.transitions.fast,
                                    textAlign: 'left',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = theme.colors.error + '10'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  )}
                  
                  {/* Empty cell for Add Column button column */}
                  {showAddColumn && (
                    <td style={{
                      width: '60px',
                      minWidth: '60px',
                      padding: theme.spacing.md,
                      backgroundColor: hoveredRow === row.id 
                        ? theme.colors.softGreen + '10' 
                        : selectedRows.includes(row.id)
                        ? theme.colors.lightGray + '10'
                        : 'transparent',
                    }}></td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}