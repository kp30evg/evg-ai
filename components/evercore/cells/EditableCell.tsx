'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Calendar, ChevronDown, Loader2 } from 'lucide-react'
import { theme } from '@/lib/evercore/theme'
import { trpc } from '@/lib/trpc/client'

export interface EditableCellProps {
  entityId: string
  fieldId: string
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'email' | 'phone' | 'url' | 'currency' | 'percentage'
  value: any
  options?: string[]
  workspaceId: string
  onValueChange?: (value: any) => void
  placeholder?: string
}

export default function EditableCell({
  entityId,
  fieldId,
  fieldType,
  value,
  options = [],
  workspaceId,
  onValueChange,
  placeholder = '—'
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null)
  
  const setFieldValue = trpc.workspaceConfig.setFieldValue.useMutation({
    onSuccess: (newValue) => {
      setIsLoading(false)
      setIsEditing(false)
      onValueChange?.(newValue)
    },
    onError: () => {
      setIsLoading(false)
      // Reset to original value on error
      setEditValue(value)
    }
  })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement && inputRef.current.type === 'text') {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row navigation
    if (!isEditing) {
      setIsEditing(true)
      setEditValue(value || '')
    }
  }

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    await setFieldValue.mutateAsync({
      entityId,
      fieldId,
      value: editValue
    })
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === '') {
      return <span style={{ color: theme.colors.lightGray }}>{placeholder}</span>
    }

    switch (fieldType) {
      case 'currency':
        return `$${parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'percentage':
        return `${val}%`
      case 'date':
        return new Date(val).toLocaleDateString()
      case 'boolean':
        return val ? '✓' : '—'
      default:
        return val
    }
  }

  const renderInput = () => {
    switch (fieldType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.fontSize.sm,
              border: `1px solid ${theme.colors.evergreen}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.white,
              color: theme.colors.charcoal,
              outline: 'none',
              boxShadow: `0 0 0 2px ${theme.colors.evergreen}20`
            }}
          />
        )

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            step={fieldType === 'percentage' ? '1' : '0.01'}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.fontSize.sm,
              border: `1px solid ${theme.colors.evergreen}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.white,
              color: theme.colors.charcoal,
              outline: 'none',
              boxShadow: `0 0 0 2px ${theme.colors.evergreen}20`
            }}
          />
        )

      case 'date':
        return (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.fontSize.sm,
              border: `1px solid ${theme.colors.evergreen}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.white,
              color: theme.colors.charcoal,
              outline: 'none',
              boxShadow: `0 0 0 2px ${theme.colors.evergreen}20`
            }}
          />
        )

      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={editValue}
            onChange={(e) => {
              const newValue = e.target.checked
              setEditValue(newValue)
              // Auto-save for checkbox
              setIsLoading(true)
              setFieldValue.mutate({
                entityId,
                fieldId,
                value: newValue
              })
            }}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer'
            }}
          />
        )

      case 'select':
        return (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              fontSize: theme.typography.fontSize.sm,
              border: `1px solid ${theme.colors.evergreen}`,
              borderRadius: theme.borderRadius.sm,
              backgroundColor: theme.colors.white,
              color: theme.colors.charcoal,
              outline: 'none',
              boxShadow: `0 0 0 2px ${theme.colors.evergreen}20`,
              cursor: 'pointer'
            }}
          >
            <option value="">Select...</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )

      default:
        return null
    }
  }

  return (
    <div
      onClick={handleCellClick}
      style={{
        position: 'relative',
        minHeight: '24px',
        cursor: isEditing ? 'default' : 'pointer',
        padding: isEditing ? 0 : `${theme.spacing.xs} 0`,
        transition: theme.transitions.fast
      }}
      onMouseEnter={(e) => {
        if (!isEditing) {
          e.currentTarget.style.backgroundColor = theme.colors.lightGray + '20'
          e.currentTarget.style.borderRadius = theme.borderRadius.sm
        }
      }}
      onMouseLeave={(e) => {
        if (!isEditing) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <AnimatePresence mode="wait">
        {isEditing && fieldType !== 'boolean' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs
            }}
          >
            {renderInput()}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
              >
                <Loader2 size={14} style={{ color: theme.colors.evergreen }} />
              </motion.div>
            )}
          </motion.div>
        ) : fieldType === 'boolean' && isEditing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs
            }}
          >
            {renderInput()}
            {isLoading && (
              <Loader2 size={14} style={{ color: theme.colors.evergreen }} />
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.xs
            }}
          >
            {formatValue(value)}
            {isLoading && (
              <Loader2 size={14} style={{ color: theme.colors.evergreen }} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}