'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus,
  Settings,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  List,
  Link2,
  Mail,
  Phone,
  DollarSign,
  Percent,
  Trash2,
  Edit,
  Save,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  Check
} from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface FieldDefinition {
  id: string
  name: string
  label: string
  type: string
  entityType: string
  options?: string[]
  required?: boolean
  defaultValue?: any
  description?: string
  createdAt: Date
}

interface CustomFieldManagerProps {
  entityType: 'contact' | 'company' | 'deal'
  onFieldAdded?: (field: FieldDefinition) => void
  height?: string
}

export default function CustomFieldManager({ 
  entityType, 
  onFieldAdded,
  height = '500px'
}: CustomFieldManagerProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([])
  const [isAddingField, setIsAddingField] = useState(false)
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    defaultValue: '',
    options: [''],
    description: ''
  })
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const colors = {
    evergreen: '#1D5238',
    white: '#FFFFFF',
    charcoal: '#222B2E',
    mediumGray: '#6B7280',
    lightGray: '#E5E7EB',
    softGreen: '#E6F4EC',
    gold: '#FFD600',
    blue: '#0EA5E9',
    purple: '#8B5CF6',
    orange: '#F97316',
    red: '#EF4444',
    green: '#10B981'
  }
  
  // Load existing fields
  const fieldsQuery = trpc.unified.getCustomFields.useQuery(
    { entityType },
    { enabled: !!entityType }
  )
  
  // Get field suggestions
  const suggestionsQuery = trpc.unified.suggestFields.useQuery(
    { 
      entityType,
      existingFields: fields.map(f => f.name) 
    },
    { enabled: !!entityType && fields.length > 0 }
  )
  
  useEffect(() => {
    if (fieldsQuery.data) {
      setFields(fieldsQuery.data)
    }
  }, [fieldsQuery.data])
  
  useEffect(() => {
    if (suggestionsQuery.data) {
      setSuggestions(suggestionsQuery.data)
    }
  }, [suggestionsQuery.data])
  
  const createFieldMutation = trpc.unified.createCustomField.useMutation({
    onSuccess: (field) => {
      setFields([...fields, field])
      setIsAddingField(false)
      setNaturalLanguageInput('')
      resetNewField()
      onFieldAdded?.(field)
    }
  })
  
  const createFromNaturalLanguageMutation = trpc.unified.createFieldFromNaturalLanguage.useMutation({
    onSuccess: (field) => {
      setFields([...fields, field])
      setIsAddingField(false)
      setNaturalLanguageInput('')
      onFieldAdded?.(field)
    }
  })
  
  const deleteFieldMutation = trpc.unified.deleteCustomField.useMutation({
    onSuccess: (_, variables) => {
      setFields(fields.filter(f => f.id !== variables.fieldId))
    }
  })
  
  const handleNaturalLanguageSubmit = () => {
    if (!naturalLanguageInput) return
    
    setIsProcessing(true)
    createFromNaturalLanguageMutation.mutate(
      { 
        command: naturalLanguageInput,
        entityType 
      },
      {
        onSettled: () => setIsProcessing(false)
      }
    )
  }
  
  const handleAdvancedSubmit = () => {
    if (!newField.name || !newField.label) return
    
    setIsProcessing(true)
    createFieldMutation.mutate(
      {
        entityType,
        ...newField,
        options: (newField.type === 'select' || newField.type === 'multiselect') 
          ? newField.options.filter(o => o) 
          : undefined
      },
      {
        onSettled: () => setIsProcessing(false)
      }
    )
  }
  
  const applySuggestion = (suggestion: any) => {
    setNewField({
      name: suggestion.name,
      label: suggestion.label,
      type: suggestion.type,
      required: false,
      defaultValue: '',
      options: suggestion.options || [''],
      description: suggestion.description
    })
    setShowAdvanced(true)
  }
  
  const resetNewField = () => {
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      defaultValue: '',
      options: [''],
      description: ''
    })
  }
  
  const getFieldIcon = (type: string) => {
    const icons: Record<string, any> = {
      text: <Type size={14} />,
      number: <Hash size={14} />,
      date: <Calendar size={14} />,
      boolean: <ToggleLeft size={14} />,
      select: <List size={14} />,
      multiselect: <List size={14} />,
      url: <Link2 size={14} />,
      email: <Mail size={14} />,
      phone: <Phone size={14} />,
      currency: <DollarSign size={14} />,
      percentage: <Percent size={14} />
    }
    return icons[type] || <Type size={14} />
  }
  
  const getFieldTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      text: colors.blue,
      number: colors.green,
      date: colors.orange,
      boolean: colors.purple,
      select: colors.gold,
      currency: colors.evergreen,
      percentage: colors.red
    }
    return typeColors[type] || colors.mediumGray
  }
  
  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'currency', label: 'Currency' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Checkbox' },
    { value: 'select', label: 'Select' },
    { value: 'multiselect', label: 'Multi-Select' },
    { value: 'url', label: 'URL' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' }
  ]
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height,
      backgroundColor: colors.white,
      borderRadius: '12px',
      border: `1px solid ${colors.lightGray}40`,
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${colors.lightGray}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Settings size={20} color={colors.charcoal} />
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: colors.charcoal,
            margin: 0
          }}>
            Custom Fields
          </h3>
          <span style={{
            padding: '4px 8px',
            backgroundColor: colors.lightGray + '30',
            borderRadius: '4px',
            fontSize: '12px',
            color: colors.mediumGray,
            fontWeight: '500'
          }}>
            {fields.length} fields
          </span>
        </div>
        
        <button
          onClick={() => setIsAddingField(!isAddingField)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: colors.evergreen,
            color: colors.white,
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.charcoal
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.evergreen
          }}
        >
          <Plus size={16} />
          Add Field
        </button>
      </div>
      
      {/* Add Field Panel */}
      <AnimatePresence>
        {isAddingField && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{
              borderBottom: `1px solid ${colors.lightGray}20`,
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '20px 24px' }}>
              {/* Natural Language Input */}
              <div style={{
                marginBottom: '16px'
              }}>
                <label style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: colors.charcoal,
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Sparkles size={14} color={colors.gold} />
                  Describe the field you want to add
                </label>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  <input
                    type="text"
                    placeholder='e.g., "Add a field for tracking contract renewal dates"'
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNaturalLanguageSubmit()
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: `1px solid ${colors.lightGray}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: colors.charcoal,
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = colors.evergreen
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = colors.lightGray
                    }}
                  />
                  <button
                    onClick={handleNaturalLanguageSubmit}
                    disabled={!naturalLanguageInput || isProcessing}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: naturalLanguageInput && !isProcessing 
                        ? colors.evergreen 
                        : colors.lightGray,
                      color: naturalLanguageInput && !isProcessing 
                        ? colors.white 
                        : colors.mediumGray,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: naturalLanguageInput && !isProcessing ? 'pointer' : 'not-allowed',
                      transition: 'all 200ms ease'
                    }}
                  >
                    {isProcessing ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
              
              {/* Advanced Options Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.mediumGray,
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Advanced Options
              </button>
              
              {/* Advanced Field Creation */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: '16px',
                      padding: '16px',
                      backgroundColor: colors.lightGray + '20',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <label style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: colors.mediumGray,
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          Field Name (Internal)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., renewalDate"
                          value={newField.name}
                          onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colors.lightGray}`,
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: colors.charcoal,
                            outline: 'none'
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: colors.mediumGray,
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          Display Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Renewal Date"
                          value={newField.label}
                          onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colors.lightGray}`,
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: colors.charcoal,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <label style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: colors.mediumGray,
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          Field Type
                        </label>
                        <select
                          value={newField.type}
                          onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colors.lightGray}`,
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: colors.charcoal,
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {fieldTypes.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'end',
                        gap: '12px'
                      }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: colors.charcoal,
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={newField.required}
                            onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                            style={{ cursor: 'pointer' }}
                          />
                          Required
                        </label>
                      </div>
                    </div>
                    
                    {(newField.type === 'select' || newField.type === 'multiselect') && (
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: colors.mediumGray,
                          display: 'block',
                          marginBottom: '4px'
                        }}>
                          Options
                        </label>
                        {newField.options.map((option, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            gap: '8px',
                            marginBottom: '6px'
                          }}>
                            <input
                              type="text"
                              placeholder={`Option ${idx + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...newField.options]
                                newOptions[idx] = e.target.value
                                setNewField({ ...newField, options: newOptions })
                              }}
                              style={{
                                flex: 1,
                                padding: '6px 12px',
                                border: `1px solid ${colors.lightGray}`,
                                borderRadius: '4px',
                                fontSize: '13px',
                                color: colors.charcoal,
                                outline: 'none'
                              }}
                            />
                            {idx === newField.options.length - 1 ? (
                              <button
                                onClick={() => setNewField({ 
                                  ...newField, 
                                  options: [...newField.options, ''] 
                                })}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: colors.lightGray + '30',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Plus size={16} color={colors.mediumGray} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const newOptions = newField.options.filter((_, i) => i !== idx)
                                  setNewField({ ...newField, options: newOptions })
                                }}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: colors.lightGray + '30',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                <X size={16} color={colors.mediumGray} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => {
                          setShowAdvanced(false)
                          resetNewField()
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: colors.mediumGray,
                          border: `1px solid ${colors.lightGray}`,
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAdvancedSubmit}
                        disabled={!newField.name || !newField.label || isProcessing}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: newField.name && newField.label && !isProcessing 
                            ? colors.evergreen 
                            : colors.lightGray,
                          color: newField.name && newField.label && !isProcessing 
                            ? colors.white 
                            : colors.mediumGray,
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: newField.name && newField.label && !isProcessing 
                            ? 'pointer' 
                            : 'not-allowed'
                        }}
                      >
                        {isProcessing ? 'Creating...' : 'Create Field'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: colors.softGreen,
          borderBottom: `1px solid ${colors.lightGray}20`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Sparkles size={16} color={colors.evergreen} />
            <span style={{
              fontSize: '13px',
              fontWeight: '600',
              color: colors.evergreen
            }}>
              Suggested Fields
            </span>
          </div>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {suggestions.slice(0, 3).map(suggestion => (
              <button
                key={suggestion.name}
                onClick={() => applySuggestion(suggestion)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.evergreen}40`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: colors.evergreen,
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.softGreen
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.white
                }}
              >
                {getFieldIcon(suggestion.type)}
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Fields List */}
      <div style={{
        flex: 1,
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: '#FAFBFC'
      }}>
        {fields.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: colors.mediumGray
          }}>
            <Settings size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              No custom fields yet
            </p>
            <p style={{ fontSize: '14px' }}>
              Add fields to track specific data for your {entityType}s
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gap: '12px'
          }}>
            {fields.map(field => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '16px',
                  backgroundColor: colors.white,
                  borderRadius: '8px',
                  border: `1px solid ${colors.lightGray}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: getFieldTypeColor(field.type) + '15',
                    color: getFieldTypeColor(field.type)
                  }}>
                    {getFieldIcon(field.type)}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.charcoal,
                      marginBottom: '2px'
                    }}>
                      {field.label}
                      {field.required && (
                        <span style={{
                          marginLeft: '6px',
                          padding: '2px 6px',
                          backgroundColor: colors.red + '15',
                          color: colors.red,
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: '600'
                        }}>
                          REQUIRED
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: colors.mediumGray
                    }}>
                      {field.name} • {field.type}
                      {field.description && ` • ${field.description}`}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => deleteFieldMutation.mutate({ 
                    fieldId: field.id,
                    removeData: false 
                  })}
                  style={{
                    padding: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.mediumGray,
                    cursor: 'pointer',
                    borderRadius: '4px',
                    transition: 'all 200ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.red + '15'
                    e.currentTarget.style.color = colors.red
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.mediumGray
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}