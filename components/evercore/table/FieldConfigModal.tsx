'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Palette, Save, AlertCircle } from 'lucide-react'
import { ColumnTypeDefinition, TableColumn, getColumnType } from '../types/column-types'

interface FieldConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (columnData: Partial<TableColumn>) => void
  fieldType?: ColumnTypeDefinition
  existingColumn?: TableColumn
  className?: string
}

interface SelectOption {
  id: string
  label: string
  color: string
}

export default function FieldConfigModal({
  isOpen,
  onClose,
  onSave,
  fieldType,
  existingColumn,
  className = ''
}: FieldConfigModalProps) {
  const [fieldName, setFieldName] = useState('')
  const [config, setConfig] = useState<Record<string, any>>({})
  const [selectOptions, setSelectOptions] = useState<SelectOption[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    red: '#DC2626',
    blue: '#0EA5E9',
    purple: '#8B5CF6',
    orange: '#F97316',
    yellow: '#EAB308',
    green: '#16A34A',
    pink: '#EC4899',
    indigo: '#6366F1'
  }

  const selectColors = [
    { name: 'Blue', value: colors.blue },
    { name: 'Green', value: colors.green },
    { name: 'Purple', value: colors.purple },
    { name: 'Orange', value: colors.orange },
    { name: 'Yellow', value: colors.yellow },
    { name: 'Pink', value: colors.pink },
    { name: 'Indigo', value: colors.indigo },
    { name: 'Red', value: colors.red }
  ]

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (existingColumn) {
        setFieldName(existingColumn.name)
        setConfig(existingColumn.config || {})
        
        // Handle select options
        if (existingColumn.config.options) {
          setSelectOptions(existingColumn.config.options.map((opt: any, idx: number) => ({
            id: opt.id || `option-${idx}`,
            label: opt.label || opt,
            color: opt.color || selectColors[idx % selectColors.length].value
          })))
        }
      } else if (fieldType) {
        setFieldName('')
        setConfig(fieldType.defaultConfig || {})
        setSelectOptions([])
      }
      setErrors({})
    }
  }, [isOpen, existingColumn, fieldType])

  const currentType = existingColumn ? getColumnType(existingColumn.type) : fieldType

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!fieldName.trim()) {
      newErrors.fieldName = 'Field name is required'
    }

    if (currentType?.id === 'singleSelect' || currentType?.id === 'multiSelect') {
      if (selectOptions.length === 0) {
        newErrors.options = 'At least one option is required'
      }
      if (selectOptions.some(opt => !opt.label.trim())) {
        newErrors.options = 'All options must have a label'
      }
    }

    // Validate required config fields
    currentType?.configSchema.forEach(field => {
      if (field.required && !config[field.key]) {
        newErrors[field.key] = `${field.label} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    
    try {
      const columnData: Partial<TableColumn> = {
        name: fieldName,
        type: currentType!.id,
        config: {
          ...config,
          ...(selectOptions.length > 0 && { options: selectOptions })
        },
        visible: true,
        sortable: currentType!.sortable,
        filterable: currentType!.filterable,
        required: config.required || false,
        position: existingColumn?.position || 999
      }

      if (existingColumn) {
        columnData.id = existingColumn.id
        columnData.createdAt = existingColumn.createdAt
        columnData.updatedAt = new Date()
      } else {
        columnData.createdAt = new Date()
        columnData.updatedAt = new Date()
      }

      await onSave(columnData)
      onClose()
    } catch (error) {
      console.error('Error saving field:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addSelectOption = () => {
    const newOption: SelectOption = {
      id: `option-${Date.now()}`,
      label: '',
      color: selectColors[selectOptions.length % selectColors.length].value
    }
    setSelectOptions([...selectOptions, newOption])
  }

  const updateSelectOption = (id: string, updates: Partial<SelectOption>) => {
    setSelectOptions(options =>
      options.map(opt => opt.id === id ? { ...opt, ...updates } : opt)
    )
  }

  const removeSelectOption = (id: string) => {
    setSelectOptions(options => options.filter(opt => opt.id !== id))
  }

  const renderConfigField = (field: any) => {
    const value = config[field.key] ?? field.defaultValue

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <div key={field.key}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal,
              marginBottom: '6px'
            }}>
              {field.label}
              {field.required && <span style={{ color: colors.red }}> *</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={value || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors[field.key] ? colors.red : colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: colors.charcoal,
                  backgroundColor: colors.white,
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => {
                  if (!errors[field.key]) {
                    e.target.style.borderColor = colors.evergreen
                  }
                }}
                onBlur={(e) => {
                  if (!errors[field.key]) {
                    e.target.style.borderColor = colors.lightGray
                  }
                }}
              />
            ) : (
              <input
                type="text"
                value={value || ''}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors[field.key] ? colors.red : colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: colors.charcoal,
                  backgroundColor: colors.white,
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => {
                  if (!errors[field.key]) {
                    e.target.style.borderColor = colors.evergreen
                  }
                }}
                onBlur={(e) => {
                  if (!errors[field.key]) {
                    e.target.style.borderColor = colors.lightGray
                  }
                }}
              />
            )}
            {field.helpText && (
              <p style={{
                fontSize: '12px',
                color: colors.mediumGray,
                marginTop: '4px'
              }}>
                {field.helpText}
              </p>
            )}
            {errors[field.key] && (
              <p style={{
                fontSize: '12px',
                color: colors.red,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertCircle size={12} />
                {errors[field.key]}
              </p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.key}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal,
              marginBottom: '6px'
            }}>
              {field.label}
              {field.required && <span style={{ color: colors.red }}> *</span>}
            </label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => setConfig({ ...config, [field.key]: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors[field.key] ? colors.red : colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '14px',
                color: colors.charcoal,
                backgroundColor: colors.white,
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                if (!errors[field.key]) {
                  e.target.style.borderColor = colors.evergreen
                }
              }}
              onBlur={(e) => {
                if (!errors[field.key]) {
                  e.target.style.borderColor = colors.lightGray
                }
              }}
            />
            {errors[field.key] && (
              <p style={{
                fontSize: '12px',
                color: colors.red,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertCircle size={12} />
                {errors[field.key]}
              </p>
            )}
          </div>
        )

      case 'boolean':
        return (
          <div key={field.key}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => setConfig({ ...config, [field.key]: e.target.checked })}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: colors.evergreen
                }}
              />
              {field.label}
            </label>
          </div>
        )

      case 'select':
        return (
          <div key={field.key}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: colors.charcoal,
              marginBottom: '6px'
            }}>
              {field.label}
              {field.required && <span style={{ color: colors.red }}> *</span>}
            </label>
            <select
              value={value || field.defaultValue || ''}
              onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors[field.key] ? colors.red : colors.lightGray}`,
                borderRadius: '8px',
                fontSize: '14px',
                color: colors.charcoal,
                backgroundColor: colors.white,
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                if (!errors[field.key]) {
                  e.target.style.borderColor = colors.evergreen
                }
              }}
              onBlur={(e) => {
                if (!errors[field.key]) {
                  e.target.style.borderColor = colors.lightGray
                }
              }}
            >
              {field.options?.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors[field.key] && (
              <p style={{
                fontSize: '12px',
                color: colors.red,
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertCircle size={12} />
                {errors[field.key]}
              </p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const renderSelectOptionsConfig = () => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px'
      }}>
        <label style={{
          fontSize: '14px',
          fontWeight: '500',
          color: colors.charcoal
        }}>
          Options <span style={{ color: colors.red }}>*</span>
        </label>
        <motion.button
          onClick={addSelectOption}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            backgroundColor: colors.softGreen,
            border: `1px solid ${colors.evergreen}`,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: colors.evergreen,
            cursor: 'pointer'
          }}
        >
          <Plus size={12} />
          Add Option
        </motion.button>
      </div>

      <div style={{
        maxHeight: '200px',
        overflow: 'auto',
        border: `1px solid ${colors.lightGray}`,
        borderRadius: '8px',
        padding: '8px'
      }}>
        {selectOptions.map((option, index) => (
          <div
            key={option.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              marginBottom: index < selectOptions.length - 1 ? '4px' : 0,
              backgroundColor: colors.white,
              borderRadius: '6px',
              border: `1px solid ${colors.lightGray}`
            }}
          >
            <input
              type="text"
              value={option.label}
              onChange={(e) => updateSelectOption(option.id, { label: e.target.value })}
              placeholder="Option name"
              style={{
                flex: 1,
                padding: '6px 8px',
                border: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <button
                type="button"
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: option.color,
                  border: `1px solid ${colors.lightGray}`,
                  cursor: 'pointer'
                }}
                title="Change color"
              />
              <select
                value={option.color}
                onChange={(e) => updateSelectOption(option.id, { color: e.target.value })}
                style={{
                  position: 'absolute',
                  opacity: 0,
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer'
                }}
              >
                {selectColors.map(color => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => removeSelectOption(option.id)}
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
                color: colors.mediumGray
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        {selectOptions.length === 0 && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: colors.mediumGray,
            fontSize: '13px'
          }}>
            No options yet. Click "Add Option" to get started.
          </div>
        )}
      </div>
      
      {errors.options && (
        <p style={{
          fontSize: '12px',
          color: colors.red,
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <AlertCircle size={12} />
          {errors.options}
        </p>
      )}
    </div>
  )

  if (!isOpen || !currentType) return null

  const IconComponent = currentType.icon

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '480px',
            maxHeight: '80vh',
            backgroundColor: colors.white,
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
          className={className}
        >
          {/* Header */}
          <div style={{
            padding: '24px 24px 20px',
            borderBottom: `1px solid ${colors.lightGray}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: colors.softGreen,
                  border: `1px solid ${colors.evergreen}20`
                }}>
                  <IconComponent size={20} style={{ color: colors.evergreen }} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: colors.charcoal,
                    margin: 0
                  }}>
                    {existingColumn ? 'Configure Field' : `New ${currentType.name} Field`}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: colors.mediumGray,
                    margin: '2px 0 0 0'
                  }}>
                    {currentType.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.mediumGray
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Form */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {/* Field Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '6px'
                }}>
                  Field Name <span style={{ color: colors.red }}>*</span>
                </label>
                <input
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder={`Enter ${currentType.name.toLowerCase()} field name`}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.fieldName ? colors.red : colors.lightGray}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: colors.charcoal,
                    backgroundColor: colors.white,
                    outline: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => {
                    if (!errors.fieldName) {
                      e.target.style.borderColor = colors.evergreen
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.fieldName) {
                      e.target.style.borderColor = colors.lightGray
                    }
                  }}
                />
                {errors.fieldName && (
                  <p style={{
                    fontSize: '12px',
                    color: colors.red,
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <AlertCircle size={12} />
                    {errors.fieldName}
                  </p>
                )}
              </div>

              {/* Select Options Configuration */}
              {(currentType.id === 'singleSelect' || currentType.id === 'multiSelect') && renderSelectOptionsConfig()}

              {/* Other Configuration Fields */}
              {currentType.configSchema
                .filter(field => field.key !== 'options')
                .map(renderConfigField)}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 24px',
            borderTop: `1px solid ${colors.lightGray}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              fontSize: '12px',
              color: colors.mediumGray
            }}>
              {existingColumn ? 'Changes will apply to all records' : 'New column will be added to the table'}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                disabled={isLoading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <motion.button
                onClick={handleSave}
                disabled={isLoading}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                style={{
                  padding: '10px 16px',
                  backgroundColor: isLoading ? colors.mediumGray : colors.evergreen,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.white,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Save size={14} />
                {isLoading ? 'Saving...' : (existingColumn ? 'Save Changes' : 'Create Field')}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}