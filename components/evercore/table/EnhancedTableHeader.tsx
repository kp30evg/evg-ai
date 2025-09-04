'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronUp, ChevronDown, MoreHorizontal, Settings, 
  Trash2, Eye, EyeOff, ArrowUp, ArrowDown,
  Plus, Filter
} from 'lucide-react'
import { TableColumn, getColumnType } from '../types/column-types'

interface EnhancedTableHeaderProps {
  columns: TableColumn[]
  onSort: (columnId: string, direction: 'asc' | 'desc') => void
  onAddColumn: () => void
  onConfigureColumn: (columnId: string) => void
  onToggleColumn: (columnId: string, visible: boolean) => void
  onDeleteColumn: (columnId: string) => void
  onFilter: (columnId: string) => void
  currentSort?: { columnId: string; direction: 'asc' | 'desc' }
  className?: string
}

export default function EnhancedTableHeader({
  columns,
  onSort,
  onAddColumn,
  onConfigureColumn,
  onToggleColumn,
  onDeleteColumn,
  onFilter,
  currentSort,
  className = ''
}: EnhancedTableHeaderProps) {
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set())
  const [editingColumn, setEditingColumn] = useState<string | null>(null)
  const [columnNames, setColumnNames] = useState<Record<string, string>>({})

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC'
  }

  const toggleMenu = (columnId: string) => {
    const newOpenMenus = new Set(openMenus)
    if (newOpenMenus.has(columnId)) {
      newOpenMenus.delete(columnId)
    } else {
      newOpenMenus.add(columnId)
    }
    setOpenMenus(newOpenMenus)
  }

  const handleSort = (columnId: string) => {
    const currentDirection = currentSort?.columnId === columnId ? currentSort.direction : null
    const newDirection = currentDirection === 'asc' ? 'desc' : 'asc'
    onSort(columnId, newDirection)
  }

  const startEditing = (columnId: string, currentName: string) => {
    setEditingColumn(columnId)
    setColumnNames({ ...columnNames, [columnId]: currentName })
    setOpenMenus(new Set()) // Close menus when editing
  }

  const saveColumnName = (columnId: string) => {
    // Here you would typically save to database
    // For now, just close editing mode
    setEditingColumn(null)
    // onUpdateColumn(columnId, { name: columnNames[columnId] })
  }

  const cancelEditing = () => {
    setEditingColumn(null)
    setColumnNames({})
  }

  const visibleColumns = columns.filter(col => col.visible)

  return (
    <thead className={className}>
      <tr style={{
        backgroundColor: '#F9FAFB',
        borderBottom: `1px solid ${colors.lightGray}`
      }}>
        {visibleColumns.map((column) => {
          const columnType = getColumnType(column.type)
          const IconComponent = columnType?.icon
          const isCurrentSort = currentSort?.columnId === column.id
          const sortDirection = isCurrentSort ? currentSort.direction : null
          const isMenuOpen = openMenus.has(column.id)
          const isEditing = editingColumn === column.id

          return (
            <th
              key={column.id}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                position: 'relative',
                width: column.width || 'auto',
                minWidth: '120px'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flex: 1
                }}>
                  {/* Column Type Icon */}
                  {IconComponent && (
                    <IconComponent 
                      size={14} 
                      style={{ color: colors.mediumGray, flexShrink: 0 }} 
                    />
                  )}

                  {/* Column Name - Editable */}
                  {isEditing ? (
                    <input
                      type="text"
                      value={columnNames[column.id] || column.name}
                      onChange={(e) => setColumnNames({
                        ...columnNames,
                        [column.id]: e.target.value
                      })}
                      onBlur={() => saveColumnName(column.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          saveColumnName(column.id)
                        } else if (e.key === 'Escape') {
                          cancelEditing()
                        }
                      }}
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: colors.charcoal,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        flex: 1
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => startEditing(column.id, column.name)}
                      style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: colors.charcoal,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: 'pointer',
                        flex: 1,
                        padding: '2px 4px',
                        borderRadius: '3px',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.lightGray
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      {column.name}
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}>
                  {/* Sort Button */}
                  {column.sortable && (
                    <motion.button
                      onClick={() => handleSort(column.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: isCurrentSort ? colors.softGreen : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrentSort) {
                          e.currentTarget.style.backgroundColor = colors.lightGray
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrentSort) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      {isCurrentSort ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp size={12} style={{ color: colors.evergreen }} />
                        ) : (
                          <ArrowDown size={12} style={{ color: colors.evergreen }} />
                        )
                      ) : (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1px'
                        }}>
                          <ChevronUp size={10} style={{ color: colors.mediumGray }} />
                          <ChevronDown size={10} style={{ color: colors.mediumGray }} />
                        </div>
                      )}
                    </motion.button>
                  )}

                  {/* Filter Button */}
                  {column.filterable && (
                    <motion.button
                      onClick={() => onFilter(column.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.lightGray
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Filter size={12} style={{ color: colors.mediumGray }} />
                    </motion.button>
                  )}

                  {/* Column Menu */}
                  <div style={{ position: 'relative' }}>
                    <motion.button
                      onClick={() => toggleMenu(column.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        backgroundColor: isMenuOpen ? colors.softGreen : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isMenuOpen) {
                          e.currentTarget.style.backgroundColor = colors.lightGray
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMenuOpen) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <MoreHorizontal 
                        size={12} 
                        style={{ color: isMenuOpen ? colors.evergreen : colors.mediumGray }} 
                      />
                    </motion.button>

                    {/* Column Menu Dropdown */}
                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: colors.white,
                            border: `1px solid ${colors.lightGray}`,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            zIndex: 50,
                            minWidth: '160px'
                          }}
                        >
                          <div style={{ padding: '4px' }}>
                            {/* Configure Field */}
                            <button
                              onClick={() => {
                                onConfigureColumn(column.id)
                                setOpenMenus(new Set())
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
                                color: colors.charcoal,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.lightGray
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Settings size={14} />
                              Configure field
                            </button>

                            {/* Hide/Show Field */}
                            <button
                              onClick={() => {
                                onToggleColumn(column.id, !column.visible)
                                setOpenMenus(new Set())
                              }}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
                                color: colors.charcoal,
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background-color 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = colors.lightGray
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              {column.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                              {column.visible ? 'Hide field' : 'Show field'}
                            </button>

                            {/* Delete Field */}
                            {!column.required && (
                              <>
                                <div style={{
                                  height: '1px',
                                  backgroundColor: colors.lightGray,
                                  margin: '4px 8px'
                                }} />
                                <button
                                  onClick={() => {
                                    onDeleteColumn(column.id)
                                    setOpenMenus(new Set())
                                  }}
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    color: '#DC2626',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background-color 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#FEF2F2'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Delete field
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </th>
          )
        })}

        {/* Add Column Button */}
        <th style={{ padding: '12px 16px', width: '50px' }}>
          <motion.button
            onClick={onAddColumn}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: `1px dashed ${colors.mediumGray}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.softGreen
              e.currentTarget.style.borderColor = colors.evergreen
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = colors.mediumGray
            }}
          >
            <Plus size={14} style={{ color: colors.mediumGray }} />
          </motion.button>
        </th>
      </tr>
    </thead>
  )
}