'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import AddColumnDropdown from './AddColumnDropdown'
import FieldConfigModal from './FieldConfigModal'
import { ColumnTypeDefinition } from '../types/column-types'

interface AddFieldButtonProps {
  onAddField?: (field: any) => void
  className?: string
}

export default function AddFieldButton({ onAddField, className = '' }: AddFieldButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<ColumnTypeDefinition | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
  }

  const handleButtonClick = () => {
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
    onAddField?.(fieldConfig)
    setIsConfigOpen(false)
    setSelectedType(null)
  }

  return (
    <>
      <motion.button
        ref={buttonRef}
        onClick={handleButtonClick}
        className={className}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        style={{
          position: 'relative',
          width: '32px',
          height: '32px',
          backgroundColor: colors.white,
          border: `1.5px solid ${colors.lightGray}40`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          margin: '0 8px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget
          target.style.backgroundColor = colors.softGreen
          target.style.borderColor = colors.evergreen + '40'
          target.style.boxShadow = '0 4px 8px rgba(29, 82, 56, 0.12)'
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget
          target.style.backgroundColor = colors.white
          target.style.borderColor = colors.lightGray + '40'
          target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
        title="Add new field"
      >
        <motion.div
          initial={{ rotate: 0 }}
          whileHover={{ rotate: 90 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <Plus 
            size={18} 
            strokeWidth={2}
            style={{
              color: colors.evergreen,
              transition: 'color 0.2s ease'
            }}
          />
        </motion.div>

        {/* Subtle pulse animation when hovering */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeOut'
              }}
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '8px',
                border: `2px solid ${colors.evergreen}`,
                pointerEvents: 'none'
              }}
            />
          )}
        </AnimatePresence>

        {/* Tooltip on hover */}
        <motion.div
          initial={{ opacity: 0, y: 5, scale: 0.9 }}
          animate={{ opacity: 0, y: 5, scale: 0.9 }}
          whileHover={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            bottom: '-36px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '6px 10px',
            backgroundColor: colors.charcoal,
            color: colors.white,
            fontSize: '12px',
            fontWeight: '500',
            borderRadius: '6px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          Add field
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderBottom: `4px solid ${colors.charcoal}`,
            }}
          />
        </motion.div>
      </motion.button>

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