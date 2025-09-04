'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { getColumnTypesByCategory, ColumnTypeDefinition } from '../types/column-types'

interface AddColumnDropdownProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: ColumnTypeDefinition) => void
  position?: { x: number; y: number }
  className?: string
}

export default function AddColumnDropdown({
  isOpen,
  onClose,
  onSelectType,
  position = { x: 0, y: 0 },
  className = ''
}: AddColumnDropdownProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    blue: '#0EA5E9',
    purple: '#8B5CF6',
    orange: '#F97316',
    gold: '#FFD600'
  }

  const categorizedTypes = getColumnTypesByCategory()

  const categoryConfig = {
    basic: {
      name: 'Basic',
      description: 'Essential field types for most data',
      color: colors.blue,
      bgColor: '#EFF6FF'
    },
    selection: {
      name: 'Selection',
      description: 'Choose from predefined options',
      color: colors.purple,
      bgColor: '#F3E8FF'
    },
    advanced: {
      name: 'Advanced',
      description: 'Formulas and calculated fields',
      color: colors.orange,
      bgColor: '#FFF7ED'
    },
    files: {
      name: 'Files',
      description: 'File uploads and attachments',
      color: colors.gold,
      bgColor: '#FFFBEB'
    },
    system: {
      name: 'System',
      description: 'Automated system fields',
      color: colors.evergreen,
      bgColor: colors.softGreen
    }
  }

  // Filter types based on search query
  const filteredTypes = React.useMemo(() => {
    if (!searchQuery.trim()) return categorizedTypes

    const filtered: typeof categorizedTypes = {
      basic: [],
      selection: [],
      advanced: [],
      files: [],
      system: []
    }

    Object.entries(categorizedTypes).forEach(([category, types]) => {
      filtered[category as keyof typeof filtered] = types.filter(type =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })

    return filtered
  }, [categorizedTypes, searchQuery])

  const handleTypeSelect = (type: ColumnTypeDefinition) => {
    onSelectType(type)
    onClose()
    setSearchQuery('')
    setSelectedCategory(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          zIndex: 100
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: Math.min(position.y, window.innerHeight - 500),
            left: Math.min(position.x, window.innerWidth - 400),
            width: '380px',
            maxHeight: '480px',
            backgroundColor: colors.white,
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: `1px solid ${colors.lightGray}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          className={className}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${colors.lightGray}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.charcoal,
                margin: 0
              }}>
                Add Column
              </h3>
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.mediumGray,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.lightGray
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search 
                size={16} 
                style={{
                  position: 'absolute',
                  left: '12px',
                  color: colors.mediumGray
                }}
              />
              <input
                type="text"
                placeholder="Search field types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  backgroundColor: '#F9FAFB',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: colors.charcoal,
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.evergreen
                  e.target.style.backgroundColor = colors.white
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightGray
                  e.target.style.backgroundColor = '#F9FAFB'
                }}
              />
            </div>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px 0'
          }}>
            {Object.entries(filteredTypes).map(([categoryKey, types]) => {
              if (types.length === 0) return null
              
              const category = categoryConfig[categoryKey as keyof typeof categoryConfig]
              
              return (
                <div key={categoryKey} style={{ marginBottom: '8px' }}>
                  {/* Category Header */}
                  <div style={{
                    padding: '12px 24px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      backgroundColor: category.color
                    }} />
                    <div>
                      <h4 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colors.charcoal,
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {category.name}
                      </h4>
                      <p style={{
                        fontSize: '11px',
                        color: colors.mediumGray,
                        margin: '2px 0 0 0'
                      }}>
                        {category.description}
                      </p>
                    </div>
                  </div>

                  {/* Field Types */}
                  <div style={{ paddingBottom: '8px' }}>
                    {types.map((type) => {
                      const IconComponent = type.icon
                      
                      return (
                        <motion.button
                          key={type.id}
                          onClick={() => handleTypeSelect(type)}
                          whileHover={{ x: 4 }}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 24px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = category.bgColor
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            backgroundColor: category.bgColor,
                            border: `1px solid ${category.color}20`
                          }}>
                            <IconComponent 
                              size={18} 
                              style={{ color: category.color }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: colors.charcoal,
                              marginBottom: '2px'
                            }}>
                              {type.name}
                            </div>
                            <div style={{
                              fontSize: '12px',
                              color: colors.mediumGray,
                              lineHeight: '1.4'
                            }}>
                              {type.description}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* No Results */}
            {searchQuery && Object.values(filteredTypes).every(types => types.length === 0) && (
              <div style={{
                padding: '40px 24px',
                textAlign: 'center',
                color: colors.mediumGray
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  No field types found
                </div>
                <div style={{
                  fontSize: '12px'
                }}>
                  Try searching for a different term
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: `1px solid ${colors.lightGray}`,
            backgroundColor: '#F9FAFB'
          }}>
            <div style={{
              fontSize: '11px',
              color: colors.mediumGray,
              textAlign: 'center'
            }}>
              💡 You can also create fields with natural language commands
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}