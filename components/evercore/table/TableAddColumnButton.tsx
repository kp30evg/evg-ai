'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import AddColumnDropdown from './AddColumnDropdown'
import FieldConfigModal from './FieldConfigModal'
import { ColumnTypeDefinition } from '../types/column-types'
import { theme } from '@/lib/evercore/theme'

interface TableAddColumnButtonProps {
  entityType: 'contact' | 'company' | 'deal' | 'lead' | 'product' | 'order'
  onAddField?: (field: any) => void
  style?: React.CSSProperties
}

export default function TableAddColumnButton({ 
  entityType,
  onAddField, 
  style = {} 
}: TableAddColumnButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ColumnTypeDefinition | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLTableHeaderCellElement>(null)

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        x: rect.left,
        y: rect.bottom + 4
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
    // Format the field configuration for the API
    const fieldData = {
      entityType,
      name: fieldConfig.name?.replace(/\s+/g, '_').toLowerCase() || `field_${Date.now()}`,
      label: fieldConfig.name || 'New Field',
      type: mapColumnTypeToFieldType(fieldConfig.type || selectedType?.id),
      required: fieldConfig.config?.required || false,
      defaultValue: fieldConfig.config?.defaultValue,
      options: fieldConfig.config?.options?.map((opt: any) => 
        typeof opt === 'string' ? opt : opt.label
      ),
      description: fieldConfig.config?.description,
      // Only add validation if it has valid properties
      ...(fieldConfig.config?.min !== undefined || fieldConfig.config?.max !== undefined || fieldConfig.config?.pattern
        ? {
            validation: {
              min: fieldConfig.config?.min,
              max: fieldConfig.config?.max,
              pattern: fieldConfig.config?.pattern
            }
          }
        : {})
    }
    
    onAddField?.(fieldData)
    setIsConfigOpen(false)
    setSelectedType(null)
  }
  
  // Map column types to field types
  const mapColumnTypeToFieldType = (columnType: string): string => {
    const typeMap: Record<string, string> = {
      'singleLineText': 'text',
      'longText': 'text',
      'number': 'number',
      'checkbox': 'boolean',
      'singleSelect': 'select',
      'multiSelect': 'multiselect',
      'date': 'date',
      'email': 'email',
      'phone': 'phone',
      'url': 'url',
      'currency': 'currency',
      'percentage': 'percentage'
    }
    return typeMap[columnType] || 'text'
  }

  return (
    <>
      {/* Add Column Button */}
      <div ref={buttonRef as any} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.button
          onClick={handleButtonClick}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          style={{
            width: '28px',
            height: '28px',
            backgroundColor: theme.colors.white,
            border: `1px solid ${theme.colors.lightGray}`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            margin: '0 auto',
            padding: 0,
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget
            target.style.backgroundColor = theme.colors.softGreen
            target.style.borderColor = theme.colors.evergreen + '30'
            target.style.boxShadow = '0 2px 4px rgba(29, 82, 56, 0.08)'
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget
            target.style.backgroundColor = theme.colors.white
            target.style.borderColor = theme.colors.lightGray
            target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
          }}
          title={`Add field to ${entityType}s`}
        >
          <motion.div
            initial={{ rotate: 0 }}
            whileHover={{ rotate: 90 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Plus 
              size={16} 
              strokeWidth={2.5}
              style={{
                color: theme.colors.evergreen,
                transition: 'color 0.15s ease'
              }}
            />
          </motion.div>
        </motion.button>
      </div>

      {/* Field Type Selector Dropdown */}
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
    </>
  )
}