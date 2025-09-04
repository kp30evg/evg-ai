/**
 * EverCore Column Types - Comprehensive field type system for tables
 * Inspired by Airtable/Notion but optimized for evergreenOS unified data model
 */

import { LucideIcon } from 'lucide-react'
import { 
  Type, Hash, Calendar, Check, ChevronDown, Users, 
  Calculator, Link, Paperclip, Clock, User, BarChart3,
  Text, FileText, DollarSign, Percent, Star, Tag,
  Phone, Mail, MapPin, Globe
} from 'lucide-react'

export type ColumnTypeCategory = 'basic' | 'selection' | 'advanced' | 'files' | 'system'

export interface ColumnTypeDefinition {
  id: string
  name: string
  description: string
  category: ColumnTypeCategory
  icon: LucideIcon
  defaultConfig: Record<string, any>
  configSchema: ColumnConfigField[]
  validationRules?: ValidationRule[]
  displayComponent: string
  inputComponent: string
  sortable: boolean
  filterable: boolean
  searchable: boolean
  aggregatable: boolean
}

export interface ColumnConfigField {
  key: string
  label: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'textarea'
  required?: boolean
  defaultValue?: any
  options?: { value: string; label: string }[]
  placeholder?: string
  helpText?: string
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'regex' | 'unique'
  value?: any
  message: string
}

export interface TableColumn {
  id: string
  name: string
  type: string
  config: Record<string, any>
  width?: number
  visible: boolean
  sortable: boolean
  filterable: boolean
  required: boolean
  position: number
  createdAt: Date
  updatedAt: Date
}

// Column Type Definitions
export const COLUMN_TYPES: Record<string, ColumnTypeDefinition> = {
  // BASIC TYPES
  text: {
    id: 'text',
    name: 'Text',
    description: 'Single line of text',
    category: 'basic',
    icon: Type,
    defaultConfig: { maxLength: 255, placeholder: 'Enter text...' },
    configSchema: [
      { key: 'maxLength', label: 'Max Length', type: 'number', defaultValue: 255 },
      { key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'Enter text...' },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    validationRules: [
      { type: 'maxLength', value: 255, message: 'Text too long' }
    ],
    displayComponent: 'TextDisplay',
    inputComponent: 'TextInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  longText: {
    id: 'longText',
    name: 'Long Text',
    description: 'Multiple lines of text',
    category: 'basic',
    icon: FileText,
    defaultConfig: { maxLength: 5000, placeholder: 'Enter text...', rows: 4 },
    configSchema: [
      { key: 'maxLength', label: 'Max Length', type: 'number', defaultValue: 5000 },
      { key: 'rows', label: 'Rows', type: 'number', defaultValue: 4 },
      { key: 'placeholder', label: 'Placeholder', type: 'text', defaultValue: 'Enter text...' },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'LongTextDisplay',
    inputComponent: 'TextAreaInput',
    sortable: false,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  number: {
    id: 'number',
    name: 'Number',
    description: 'Numeric values',
    category: 'basic',
    icon: Hash,
    defaultConfig: { precision: 0, min: null, max: null, allowNegative: true },
    configSchema: [
      { key: 'precision', label: 'Decimal Places', type: 'number', defaultValue: 0 },
      { key: 'min', label: 'Minimum Value', type: 'number' },
      { key: 'max', label: 'Maximum Value', type: 'number' },
      { key: 'allowNegative', label: 'Allow Negative', type: 'boolean', defaultValue: true },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'NumberDisplay',
    inputComponent: 'NumberInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: true
  },

  currency: {
    id: 'currency',
    name: 'Currency',
    description: 'Monetary values',
    category: 'basic',
    icon: DollarSign,
    defaultConfig: { currency: 'USD', precision: 2, symbol: '$' },
    configSchema: [
      { 
        key: 'currency', 
        label: 'Currency', 
        type: 'select', 
        defaultValue: 'USD',
        options: [
          { value: 'USD', label: 'US Dollar ($)' },
          { value: 'EUR', label: 'Euro (€)' },
          { value: 'GBP', label: 'British Pound (£)' },
          { value: 'CAD', label: 'Canadian Dollar (C$)' }
        ]
      },
      { key: 'precision', label: 'Decimal Places', type: 'number', defaultValue: 2 },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'CurrencyDisplay',
    inputComponent: 'CurrencyInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: true
  },

  percentage: {
    id: 'percentage',
    name: 'Percentage',
    description: 'Percentage values',
    category: 'basic',
    icon: Percent,
    defaultConfig: { precision: 1, min: 0, max: 100 },
    configSchema: [
      { key: 'precision', label: 'Decimal Places', type: 'number', defaultValue: 1 },
      { key: 'min', label: 'Minimum', type: 'number', defaultValue: 0 },
      { key: 'max', label: 'Maximum', type: 'number', defaultValue: 100 },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'PercentageDisplay',
    inputComponent: 'PercentageInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: true
  },

  date: {
    id: 'date',
    name: 'Date',
    description: 'Date values',
    category: 'basic',
    icon: Calendar,
    defaultConfig: { includeTime: false, format: 'MM/DD/YYYY' },
    configSchema: [
      { key: 'includeTime', label: 'Include Time', type: 'boolean', defaultValue: false },
      { 
        key: 'format', 
        label: 'Date Format', 
        type: 'select', 
        defaultValue: 'MM/DD/YYYY',
        options: [
          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
          { value: 'MMM DD, YYYY', label: 'Jan 01, 2024' }
        ]
      },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'DateDisplay',
    inputComponent: 'DateInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: false
  },

  checkbox: {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'True/false values',
    category: 'basic',
    icon: Check,
    defaultConfig: { defaultValue: false },
    configSchema: [
      { key: 'defaultValue', label: 'Default Value', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'CheckboxDisplay',
    inputComponent: 'CheckboxInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: true
  },

  // SELECTION TYPES
  singleSelect: {
    id: 'singleSelect',
    name: 'Single Select',
    description: 'Pick one option from a list',
    category: 'selection',
    icon: ChevronDown,
    defaultConfig: { options: [], allowOther: false, colorCoded: true },
    configSchema: [
      { key: 'options', label: 'Options', type: 'multiselect', required: true },
      { key: 'allowOther', label: 'Allow Custom Values', type: 'boolean', defaultValue: false },
      { key: 'colorCoded', label: 'Color Coded', type: 'boolean', defaultValue: true },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'SingleSelectDisplay',
    inputComponent: 'SingleSelectInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: true
  },

  multiSelect: {
    id: 'multiSelect',
    name: 'Multiple Select',
    description: 'Pick multiple options from a list',
    category: 'selection',
    icon: Tag,
    defaultConfig: { options: [], maxSelections: null, colorCoded: true },
    configSchema: [
      { key: 'options', label: 'Options', type: 'multiselect', required: true },
      { key: 'maxSelections', label: 'Max Selections', type: 'number' },
      { key: 'colorCoded', label: 'Color Coded', type: 'boolean', defaultValue: true },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'MultiSelectDisplay',
    inputComponent: 'MultiSelectInput',
    sortable: false,
    filterable: true,
    searchable: true,
    aggregatable: true
  },

  user: {
    id: 'user',
    name: 'User',
    description: 'Assign to workspace users',
    category: 'selection',
    icon: Users,
    defaultConfig: { multiple: false, restrictToWorkspace: true },
    configSchema: [
      { key: 'multiple', label: 'Multiple Users', type: 'boolean', defaultValue: false },
      { key: 'restrictToWorkspace', label: 'Workspace Users Only', type: 'boolean', defaultValue: true },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'UserDisplay',
    inputComponent: 'UserInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: true
  },

  // ADVANCED TYPES
  formula: {
    id: 'formula',
    name: 'Formula',
    description: 'Calculated field based on other fields',
    category: 'advanced',
    icon: Calculator,
    defaultConfig: { formula: '', outputType: 'number' },
    configSchema: [
      { key: 'formula', label: 'Formula', type: 'textarea', required: true, placeholder: 'e.g., {Deal Value} * {Probability} / 100' },
      { 
        key: 'outputType', 
        label: 'Output Type', 
        type: 'select', 
        defaultValue: 'number',
        options: [
          { value: 'number', label: 'Number' },
          { value: 'currency', label: 'Currency' },
          { value: 'percentage', label: 'Percentage' },
          { value: 'text', label: 'Text' },
          { value: 'date', label: 'Date' }
        ]
      }
    ],
    displayComponent: 'FormulaDisplay',
    inputComponent: 'FormulaInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: true
  },

  rollup: {
    id: 'rollup',
    name: 'Rollup',
    description: 'Aggregate data from linked records',
    category: 'advanced',
    icon: BarChart3,
    defaultConfig: { 
      linkedTable: '', 
      linkedField: '', 
      aggregation: 'count',
      filter: null 
    },
    configSchema: [
      { key: 'linkedTable', label: 'Linked Table', type: 'select', required: true },
      { key: 'linkedField', label: 'Field to Aggregate', type: 'select', required: true },
      { 
        key: 'aggregation', 
        label: 'Aggregation', 
        type: 'select', 
        defaultValue: 'count',
        options: [
          { value: 'count', label: 'Count' },
          { value: 'sum', label: 'Sum' },
          { value: 'average', label: 'Average' },
          { value: 'min', label: 'Min' },
          { value: 'max', label: 'Max' },
          { value: 'countUnique', label: 'Count Unique' }
        ]
      }
    ],
    displayComponent: 'RollupDisplay',
    inputComponent: 'RollupInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: true
  },

  lookup: {
    id: 'lookup',
    name: 'Lookup',
    description: 'Pull data from linked records',
    category: 'advanced',
    icon: Link,
    defaultConfig: { linkedTable: '', linkedField: '', multiple: false },
    configSchema: [
      { key: 'linkedTable', label: 'Linked Table', type: 'select', required: true },
      { key: 'linkedField', label: 'Field to Look Up', type: 'select', required: true },
      { key: 'multiple', label: 'Multiple Values', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'LookupDisplay',
    inputComponent: 'LookupInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  linkToRecord: {
    id: 'linkToRecord',
    name: 'Link to Record',
    description: 'Connect to records in another table',
    category: 'advanced',
    icon: Link,
    defaultConfig: { linkedTable: '', multiple: false, symmetric: true },
    configSchema: [
      { key: 'linkedTable', label: 'Table to Link', type: 'select', required: true },
      { key: 'multiple', label: 'Link Multiple Records', type: 'boolean', defaultValue: false },
      { key: 'symmetric', label: 'Two-way Link', type: 'boolean', defaultValue: true }
    ],
    displayComponent: 'LinkDisplay',
    inputComponent: 'LinkInput',
    sortable: false,
    filterable: true,
    searchable: true,
    aggregatable: true
  },

  // CONTACT-SPECIFIC TYPES
  email: {
    id: 'email',
    name: 'Email',
    description: 'Email addresses with validation',
    category: 'basic',
    icon: Mail,
    defaultConfig: { allowMultiple: false, validate: true },
    configSchema: [
      { key: 'allowMultiple', label: 'Multiple Emails', type: 'boolean', defaultValue: false },
      { key: 'validate', label: 'Validate Format', type: 'boolean', defaultValue: true },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    validationRules: [
      { type: 'regex', value: '^[^@]+@[^@]+\\.[^@]+$', message: 'Invalid email format' }
    ],
    displayComponent: 'EmailDisplay',
    inputComponent: 'EmailInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  phone: {
    id: 'phone',
    name: 'Phone',
    description: 'Phone numbers with formatting',
    category: 'basic',
    icon: Phone,
    defaultConfig: { format: 'US', allowExtension: true },
    configSchema: [
      { 
        key: 'format', 
        label: 'Format', 
        type: 'select', 
        defaultValue: 'US',
        options: [
          { value: 'US', label: 'US/Canada (+1)' },
          { value: 'UK', label: 'United Kingdom (+44)' },
          { value: 'international', label: 'International' }
        ]
      },
      { key: 'allowExtension', label: 'Allow Extension', type: 'boolean', defaultValue: true },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'PhoneDisplay',
    inputComponent: 'PhoneInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  url: {
    id: 'url',
    name: 'URL',
    description: 'Website links',
    category: 'basic',
    icon: Globe,
    defaultConfig: { openInNewTab: true, showPreview: false },
    configSchema: [
      { key: 'openInNewTab', label: 'Open in New Tab', type: 'boolean', defaultValue: true },
      { key: 'showPreview', label: 'Show Preview', type: 'boolean', defaultValue: false },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'UrlDisplay',
    inputComponent: 'UrlInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  address: {
    id: 'address',
    name: 'Address',
    description: 'Physical addresses',
    category: 'basic',
    icon: MapPin,
    defaultConfig: { format: 'US', showMap: false },
    configSchema: [
      { 
        key: 'format', 
        label: 'Address Format', 
        type: 'select', 
        defaultValue: 'US',
        options: [
          { value: 'US', label: 'US Format' },
          { value: 'UK', label: 'UK Format' },
          { value: 'international', label: 'International' }
        ]
      },
      { key: 'showMap', label: 'Show Map Preview', type: 'boolean', defaultValue: false },
      { key: 'required', label: 'Required', type: 'boolean', defaultValue: false }
    ],
    displayComponent: 'AddressDisplay',
    inputComponent: 'AddressInput',
    sortable: false,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  // FILES TYPE
  attachment: {
    id: 'attachment',
    name: 'Attachment',
    description: 'File uploads',
    category: 'files',
    icon: Paperclip,
    defaultConfig: { 
      allowedTypes: ['image', 'document'], 
      maxSize: 10, // MB
      multiple: true 
    },
    configSchema: [
      { 
        key: 'allowedTypes', 
        label: 'Allowed File Types', 
        type: 'multiselect',
        options: [
          { value: 'image', label: 'Images' },
          { value: 'document', label: 'Documents' },
          { value: 'video', label: 'Videos' },
          { value: 'audio', label: 'Audio' }
        ]
      },
      { key: 'maxSize', label: 'Max Size (MB)', type: 'number', defaultValue: 10 },
      { key: 'multiple', label: 'Multiple Files', type: 'boolean', defaultValue: true }
    ],
    displayComponent: 'AttachmentDisplay',
    inputComponent: 'AttachmentInput',
    sortable: false,
    filterable: false,
    searchable: true,
    aggregatable: true
  },

  // SYSTEM TYPES
  createdTime: {
    id: 'createdTime',
    name: 'Created Time',
    description: 'When record was created',
    category: 'system',
    icon: Clock,
    defaultConfig: { includeTime: true, format: 'MMM DD, YYYY h:mm A' },
    configSchema: [
      { key: 'includeTime', label: 'Include Time', type: 'boolean', defaultValue: true },
      { 
        key: 'format', 
        label: 'Display Format', 
        type: 'select',
        options: [
          { value: 'MMM DD, YYYY h:mm A', label: 'Jan 01, 2024 3:30 PM' },
          { value: 'MM/DD/YYYY h:mm A', label: '01/01/2024 3:30 PM' },
          { value: 'relative', label: 'Relative (2 hours ago)' }
        ]
      }
    ],
    displayComponent: 'CreatedTimeDisplay',
    inputComponent: 'ReadOnlyInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: false
  },

  createdBy: {
    id: 'createdBy',
    name: 'Created By',
    description: 'Who created the record',
    category: 'system',
    icon: User,
    defaultConfig: { showAvatar: true, showName: true },
    configSchema: [
      { key: 'showAvatar', label: 'Show Avatar', type: 'boolean', defaultValue: true },
      { key: 'showName', label: 'Show Name', type: 'boolean', defaultValue: true }
    ],
    displayComponent: 'CreatedByDisplay',
    inputComponent: 'ReadOnlyInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: true
  },

  autoNumber: {
    id: 'autoNumber',
    name: 'Autonumber',
    description: 'Auto-incrementing numbers',
    category: 'system',
    icon: Hash,
    defaultConfig: { prefix: '', startAt: 1, increment: 1 },
    configSchema: [
      { key: 'prefix', label: 'Prefix', type: 'text', placeholder: 'e.g., DEAL-' },
      { key: 'startAt', label: 'Start At', type: 'number', defaultValue: 1 },
      { key: 'increment', label: 'Increment By', type: 'number', defaultValue: 1 }
    ],
    displayComponent: 'AutoNumberDisplay',
    inputComponent: 'ReadOnlyInput',
    sortable: true,
    filterable: true,
    searchable: true,
    aggregatable: false
  },

  rating: {
    id: 'rating',
    name: 'Rating',
    description: 'Star ratings',
    category: 'basic',
    icon: Star,
    defaultConfig: { maxStars: 5, allowHalf: false, icon: 'star' },
    configSchema: [
      { key: 'maxStars', label: 'Max Stars', type: 'number', defaultValue: 5 },
      { key: 'allowHalf', label: 'Half Stars', type: 'boolean', defaultValue: false },
      { 
        key: 'icon', 
        label: 'Icon', 
        type: 'select',
        defaultValue: 'star',
        options: [
          { value: 'star', label: '⭐ Star' },
          { value: 'heart', label: '❤️ Heart' },
          { value: 'thumb', label: '👍 Thumb' }
        ]
      }
    ],
    displayComponent: 'RatingDisplay',
    inputComponent: 'RatingInput',
    sortable: true,
    filterable: true,
    searchable: false,
    aggregatable: true
  }
}

// Helper functions
export function getColumnTypesByCategory(): Record<ColumnTypeCategory, ColumnTypeDefinition[]> {
  const categorized: Record<ColumnTypeCategory, ColumnTypeDefinition[]> = {
    basic: [],
    selection: [],
    advanced: [],
    files: [],
    system: []
  }

  Object.values(COLUMN_TYPES).forEach(type => {
    categorized[type.category].push(type)
  })

  return categorized
}

export function getColumnType(typeId: string): ColumnTypeDefinition | null {
  return COLUMN_TYPES[typeId] || null
}

export function isSystemField(typeId: string): boolean {
  const type = getColumnType(typeId)
  return type?.category === 'system' || false
}

export function isEditableField(typeId: string): boolean {
  return !isSystemField(typeId)
}