/**
 * Workspace Configuration Management
 * Handles custom navigation, entity types, fields, and views for ultimate customization
 * Note: This file contains only type definitions and utilities.
 * Database operations are handled through tRPC in workspace-config-context.tsx
 */

import { LucideIcon } from 'lucide-react';

// Navigation item configuration
export interface NavigationItem {
  id: string;
  label: string;
  icon?: string; // Icon name or emoji
  entityType?: string; // Associated entity type
  route?: string; // Custom route
  badge?: number | (() => number); // Count badge
  order: number;
  isCustom: boolean;
  visible: boolean;
  permissions?: string[]; // Required permissions to view
}

// Custom entity type definition
export interface EntityTypeDefinition {
  id: string;
  name: string; // Internal name (e.g., 'property')
  label: string; // Display name (e.g., 'Property')
  pluralLabel: string; // Plural form (e.g., 'Properties')
  icon?: string;
  fields: FieldDefinition[];
  relationships?: EntityRelationship[];
  defaultView?: 'table' | 'kanban' | 'calendar' | 'gallery';
  enablePipeline?: boolean;
  pipelineStages?: PipelineStage[];
  searchableFields?: string[];
  summaryFields?: string[]; // Fields to show in compact views
  createdAt?: Date;
  updatedAt?: Date;
}

// Field definition for custom entities
export interface FieldDefinition {
  id: string;
  name: string; // Internal name
  label: string; // Display label
  type: FieldType;
  required?: boolean;
  defaultValue?: any;
  options?: SelectOption[]; // For select/multiselect
  validation?: ValidationRule;
  formula?: string; // For calculated fields
  conditional?: ConditionalRule; // Show/hide based on other fields
  helpText?: string;
  order: number;
  group?: string; // Group fields together
  width?: 'full' | 'half' | 'third' | 'quarter';
}

export type FieldType = 
  | 'text' 
  | 'number' 
  | 'currency'
  | 'percentage'
  | 'date' 
  | 'datetime'
  | 'boolean' 
  | 'select' 
  | 'multiselect'
  | 'user' // User reference
  | 'entity' // Reference to another entity
  | 'file'
  | 'image'
  | 'url' 
  | 'email' 
  | 'phone'
  | 'address'
  | 'richtext'
  | 'formula' // Calculated field
  | 'lookup' // Lookup from related entity
  | 'rollup' // Aggregate from related entities
  | 'barcode'
  | 'qrcode'
  | 'rating'
  | 'color';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

export interface ValidationRule {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  customValidator?: string; // JavaScript function as string
  message?: string; // Custom error message
}

export interface ConditionalRule {
  field: string; // Field to watch
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: any;
  action: 'show' | 'hide' | 'require' | 'disable';
}

// Pipeline configuration
export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  order: number;
  probability?: number; // For deals/opportunities
  automations?: StageAutomation[];
}

export interface StageAutomation {
  trigger: 'on_enter' | 'on_exit' | 'on_stay_days';
  days?: number; // For on_stay_days
  actions: AutomationAction[];
}

export interface AutomationAction {
  type: 'send_email' | 'create_task' | 'update_field' | 'notify_user' | 'webhook';
  config: Record<string, any>;
}

// Entity relationships
export interface EntityRelationship {
  id: string;
  fromEntity: string;
  toEntity: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  label: string;
  inverseLabel?: string; // How it appears from the other side
  required?: boolean;
  cascadeDelete?: boolean;
}

// View configuration
export interface ViewConfiguration {
  id: string;
  name: string;
  entityType: string;
  type: 'table' | 'kanban' | 'calendar' | 'gallery' | 'timeline' | 'map' | 'chart';
  filters: FilterRule[];
  sorting: SortRule[];
  groupBy?: string; // Field to group by
  columns?: string[]; // For table view
  cardTemplate?: string; // For card-based views
  calendarField?: string; // Date field for calendar view
  mapField?: string; // Location field for map view
  chartConfig?: ChartConfig; // For chart view
  isDefault?: boolean;
  isShared?: boolean;
  permissions?: string[];
}

export interface FilterRule {
  field: string;
  operator: string;
  value: any;
  combinator?: 'and' | 'or';
}

export interface SortRule {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter';
  xAxis: string;
  yAxis: string;
  aggregation?: 'sum' | 'average' | 'count' | 'min' | 'max';
  groupBy?: string;
}

// Workspace configuration
export interface WorkspaceConfiguration {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  navigation: NavigationItem[];
  entityTypes: EntityTypeDefinition[];
  views: ViewConfiguration[];
  theme?: WorkspaceTheme;
  features?: WorkspaceFeatures;
  template?: string; // Template it was created from
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceTheme {
  primaryColor?: string;
  accentColor?: string;
  mode?: 'light' | 'dark' | 'auto';
  logoUrl?: string;
  faviconUrl?: string;
}

export interface WorkspaceFeatures {
  enableKanban?: boolean;
  enableCalendar?: boolean;
  enableGallery?: boolean;
  enableTimeline?: boolean;
  enableMap?: boolean;
  enableCharts?: boolean;
  enableAutomations?: boolean;
  enableFormulas?: boolean;
  enableWebhooks?: boolean;
  enableAPI?: boolean;
}

// Industry templates
export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  icon: string;
  preview?: string; // Preview image URL
  configuration: Partial<WorkspaceConfiguration>;
  popularity?: number; // Usage count
  tags?: string[];
}

/**
 * Workspace Configuration Service
 * Note: Database operations have been moved to tRPC router to avoid client-side database access
 * This service now only provides utilities and default configurations
 */
export class WorkspaceConfigService {
  // Note: getConfiguration and saveConfiguration have been moved to tRPC router
  // to avoid client-side database access. Use the tRPC hooks in your components.

  /**
   * Get default CRM configuration
   */
  getDefaultConfiguration(workspaceId: string): WorkspaceConfiguration {
    return {
      id: '',
      workspaceId,
      name: 'Default CRM',
      description: 'Standard CRM configuration',
      navigation: [
        { id: 'overview', label: 'Overview', icon: 'BarChart3', order: 0, isCustom: false, visible: true },
        { id: 'leads', label: 'Leads', icon: 'Users', entityType: 'lead', order: 1, isCustom: false, visible: true },
        { id: 'contacts', label: 'Contacts', icon: 'Users', entityType: 'contact', order: 2, isCustom: false, visible: true },
        { id: 'companies', label: 'Companies', icon: 'Building2', entityType: 'company', order: 3, isCustom: false, visible: true },
        { id: 'deals', label: 'Deals', icon: 'Target', entityType: 'deal', order: 4, isCustom: false, visible: true },
        { id: 'products', label: 'Products', icon: 'Package', entityType: 'product', order: 5, isCustom: false, visible: true },
        { id: 'orders', label: 'Orders', icon: 'ShoppingCart', entityType: 'order', order: 6, isCustom: false, visible: true }
      ],
      entityTypes: this.getDefaultEntityTypes(),
      views: [],
      features: {
        enableKanban: true,
        enableCalendar: true,
        enableGallery: true,
        enableCharts: true,
        enableAutomations: true,
        enableFormulas: true
      },
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get default entity type definitions
   */
  private getDefaultEntityTypes(): EntityTypeDefinition[] {
    return [
      {
        id: 'contact',
        name: 'contact',
        label: 'Contact',
        pluralLabel: 'Contacts',
        icon: 'User',
        fields: this.getContactFields(),
        defaultView: 'table',
        searchableFields: ['name', 'email', 'company'],
        summaryFields: ['name', 'email', 'company']
      },
      {
        id: 'deal',
        name: 'deal',
        label: 'Deal',
        pluralLabel: 'Deals',
        icon: 'Target',
        fields: this.getDealFields(),
        defaultView: 'kanban',
        enablePipeline: true,
        pipelineStages: this.getDefaultPipelineStages(),
        searchableFields: ['name', 'company'],
        summaryFields: ['name', 'value', 'stage']
      },
      {
        id: 'company',
        name: 'company',
        label: 'Company',
        pluralLabel: 'Companies',
        icon: 'Building2',
        fields: this.getCompanyFields(),
        defaultView: 'table',
        searchableFields: ['name', 'domain'],
        summaryFields: ['name', 'industry', 'size']
      }
    ];
  }

  /**
   * Get default contact fields
   */
  private getContactFields(): FieldDefinition[] {
    return [
      { id: 'name', name: 'name', label: 'Name', type: 'text', required: true, order: 0 },
      { id: 'email', name: 'email', label: 'Email', type: 'email', required: true, order: 1 },
      { id: 'phone', name: 'phone', label: 'Phone', type: 'phone', order: 2 },
      { id: 'company', name: 'company', label: 'Company', type: 'text', order: 3 },
      { id: 'title', name: 'title', label: 'Job Title', type: 'text', order: 4 },
      { id: 'status', name: 'status', label: 'Status', type: 'select', order: 5,
        options: [
          { value: 'hot', label: 'Hot', color: 'red' },
          { value: 'warm', label: 'Warm', color: 'orange' },
          { value: 'cold', label: 'Cold', color: 'blue' }
        ]
      },
      { id: 'source', name: 'source', label: 'Source', type: 'select', order: 6,
        options: [
          { value: 'website', label: 'Website' },
          { value: 'referral', label: 'Referral' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'cold_outreach', label: 'Cold Outreach' },
          { value: 'event', label: 'Event' }
        ]
      },
      { id: 'lastContact', name: 'lastContact', label: 'Last Contact', type: 'date', order: 7 }
    ];
  }

  /**
   * Get default deal fields
   */
  private getDealFields(): FieldDefinition[] {
    return [
      { id: 'name', name: 'name', label: 'Deal Name', type: 'text', required: true, order: 0 },
      { id: 'value', name: 'value', label: 'Value', type: 'currency', required: true, order: 1 },
      { id: 'stage', name: 'stage', label: 'Stage', type: 'select', required: true, order: 2 },
      { id: 'probability', name: 'probability', label: 'Probability', type: 'percentage', order: 3 },
      { id: 'closeDate', name: 'closeDate', label: 'Expected Close Date', type: 'date', order: 4 },
      { id: 'owner', name: 'owner', label: 'Owner', type: 'user', order: 5 },
      { id: 'company', name: 'company', label: 'Company', type: 'entity', order: 6 },
      { id: 'primaryContact', name: 'primaryContact', label: 'Primary Contact', type: 'entity', order: 7 }
    ];
  }

  /**
   * Get default company fields
   */
  private getCompanyFields(): FieldDefinition[] {
    return [
      { id: 'name', name: 'name', label: 'Company Name', type: 'text', required: true, order: 0 },
      { id: 'domain', name: 'domain', label: 'Website', type: 'url', order: 1 },
      { id: 'industry', name: 'industry', label: 'Industry', type: 'select', order: 2,
        options: [
          { value: 'technology', label: 'Technology' },
          { value: 'finance', label: 'Finance' },
          { value: 'healthcare', label: 'Healthcare' },
          { value: 'retail', label: 'Retail' },
          { value: 'manufacturing', label: 'Manufacturing' }
        ]
      },
      { id: 'size', name: 'size', label: 'Company Size', type: 'select', order: 3,
        options: [
          { value: '1-10', label: '1-10 employees' },
          { value: '11-50', label: '11-50 employees' },
          { value: '51-200', label: '51-200 employees' },
          { value: '201-500', label: '201-500 employees' },
          { value: '500+', label: '500+ employees' }
        ]
      },
      { id: 'location', name: 'location', label: 'Location', type: 'address', order: 4 },
      { id: 'annualRevenue', name: 'annualRevenue', label: 'Annual Revenue', type: 'currency', order: 5 }
    ];
  }

  /**
   * Get default pipeline stages
   */
  private getDefaultPipelineStages(): PipelineStage[] {
    return [
      { id: 'prospecting', name: 'Prospecting', color: '#3B82F6', order: 0, probability: 10 },
      { id: 'qualification', name: 'Qualification', color: '#8B5CF6', order: 1, probability: 25 },
      { id: 'proposal', name: 'Proposal', color: '#F59E0B', order: 2, probability: 50 },
      { id: 'negotiation', name: 'Negotiation', color: '#EF4444', order: 3, probability: 75 },
      { id: 'closed-won', name: 'Closed Won', color: '#10B981', order: 4, probability: 100 },
      { id: 'closed-lost', name: 'Closed Lost', color: '#6B7280', order: 5, probability: 0 }
    ];
  }

  // Note: Database operations (addNavigationItem, addEntityType, createFromTemplate)
  // have been moved to tRPC router. Use the tRPC mutations in your components.
  
  /**
   * Get template by ID (client-side utility)
   */
  getTemplate(templateId: string): WorkspaceTemplate | null {
    const templates = this.getBuiltInTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Get all available templates
   */
  getBuiltInTemplates(): WorkspaceTemplate[] {
    return [
      this.getRealEstateTemplate(),
      this.getHealthcareTemplate(),
      this.getLegalTemplate(),
      this.getMortgageTemplate()
    ];
  }

  /**
   * Real Estate template
   */
  private getRealEstateTemplate(): WorkspaceTemplate {
    return {
      id: 'real-estate',
      name: 'Real Estate CRM',
      description: 'Manage properties, showings, offers, and clients',
      industry: 'Real Estate',
      icon: '🏠',
      configuration: {
        name: 'Real Estate CRM',
        navigation: [
          { id: 'overview', label: 'Dashboard', icon: 'BarChart3', order: 0, isCustom: false, visible: true },
          { id: 'properties', label: 'Properties', icon: 'Home', entityType: 'property', order: 1, isCustom: true, visible: true },
          { id: 'clients', label: 'Clients', icon: 'Users', entityType: 'client', order: 2, isCustom: true, visible: true },
          { id: 'showings', label: 'Showings', icon: 'Calendar', entityType: 'showing', order: 3, isCustom: true, visible: true },
          { id: 'offers', label: 'Offers', icon: 'FileText', entityType: 'offer', order: 4, isCustom: true, visible: true },
          { id: 'transactions', label: 'Transactions', icon: 'DollarSign', entityType: 'transaction', order: 5, isCustom: true, visible: true }
        ],
        entityTypes: [
          {
            id: 'property',
            name: 'property',
            label: 'Property',
            pluralLabel: 'Properties',
            icon: 'Home',
            fields: [
              { id: 'address', name: 'address', label: 'Address', type: 'address', required: true, order: 0 },
              { id: 'price', name: 'price', label: 'List Price', type: 'currency', required: true, order: 1 },
              { id: 'bedrooms', name: 'bedrooms', label: 'Bedrooms', type: 'number', order: 2 },
              { id: 'bathrooms', name: 'bathrooms', label: 'Bathrooms', type: 'number', order: 3 },
              { id: 'sqft', name: 'sqft', label: 'Square Feet', type: 'number', order: 4 },
              { id: 'type', name: 'type', label: 'Property Type', type: 'select', order: 5,
                options: [
                  { value: 'single_family', label: 'Single Family' },
                  { value: 'condo', label: 'Condo' },
                  { value: 'townhouse', label: 'Townhouse' },
                  { value: 'multi_family', label: 'Multi-Family' }
                ]
              },
              { id: 'status', name: 'status', label: 'Status', type: 'select', order: 6,
                options: [
                  { value: 'active', label: 'Active', color: 'green' },
                  { value: 'pending', label: 'Pending', color: 'yellow' },
                  { value: 'sold', label: 'Sold', color: 'blue' },
                  { value: 'off_market', label: 'Off Market', color: 'gray' }
                ]
              },
              { id: 'listingAgent', name: 'listingAgent', label: 'Listing Agent', type: 'user', order: 7 },
              { id: 'photos', name: 'photos', label: 'Photos', type: 'image', order: 8 }
            ],
            defaultView: 'gallery',
            searchableFields: ['address', 'type', 'status'],
            summaryFields: ['address', 'price', 'status']
          }
        ]
      },
      tags: ['real-estate', 'property', 'sales']
    };
  }

  /**
   * Healthcare template
   */
  private getHealthcareTemplate(): WorkspaceTemplate {
    return {
      id: 'healthcare',
      name: 'Healthcare Practice',
      description: 'Manage patients, appointments, treatments, and medical records',
      industry: 'Healthcare',
      icon: '⚕️',
      configuration: {
        name: 'Healthcare Practice',
        navigation: [
          { id: 'overview', label: 'Dashboard', icon: 'Activity', order: 0, isCustom: false, visible: true },
          { id: 'patients', label: 'Patients', icon: 'Users', entityType: 'patient', order: 1, isCustom: true, visible: true },
          { id: 'appointments', label: 'Appointments', icon: 'Calendar', entityType: 'appointment', order: 2, isCustom: true, visible: true },
          { id: 'treatments', label: 'Treatments', icon: 'Heart', entityType: 'treatment', order: 3, isCustom: true, visible: true },
          { id: 'prescriptions', label: 'Prescriptions', icon: 'Pill', entityType: 'prescription', order: 4, isCustom: true, visible: true },
          { id: 'billing', label: 'Billing', icon: 'CreditCard', entityType: 'bill', order: 5, isCustom: true, visible: true }
        ],
        entityTypes: [
          {
            id: 'patient',
            name: 'patient',
            label: 'Patient',
            pluralLabel: 'Patients',
            icon: 'User',
            fields: [
              { id: 'name', name: 'name', label: 'Full Name', type: 'text', required: true, order: 0 },
              { id: 'dob', name: 'dob', label: 'Date of Birth', type: 'date', required: true, order: 1 },
              { id: 'phone', name: 'phone', label: 'Phone', type: 'phone', required: true, order: 2 },
              { id: 'email', name: 'email', label: 'Email', type: 'email', order: 3 },
              { id: 'insurance', name: 'insurance', label: 'Insurance Provider', type: 'text', order: 4 },
              { id: 'allergies', name: 'allergies', label: 'Allergies', type: 'multiselect', order: 5 },
              { id: 'conditions', name: 'conditions', label: 'Medical Conditions', type: 'multiselect', order: 6 },
              { id: 'primaryDoctor', name: 'primaryDoctor', label: 'Primary Doctor', type: 'user', order: 7 }
            ],
            defaultView: 'table',
            searchableFields: ['name', 'phone', 'email'],
            summaryFields: ['name', 'dob', 'phone']
          }
        ]
      },
      tags: ['healthcare', 'medical', 'patients']
    };
  }

  /**
   * Legal template
   */
  private getLegalTemplate(): WorkspaceTemplate {
    return {
      id: 'legal',
      name: 'Legal Practice',
      description: 'Manage cases, clients, documents, and billing',
      industry: 'Legal',
      icon: '⚖️',
      configuration: {
        name: 'Legal Practice',
        navigation: [
          { id: 'overview', label: 'Dashboard', icon: 'Scale', order: 0, isCustom: false, visible: true },
          { id: 'cases', label: 'Cases', icon: 'Briefcase', entityType: 'case', order: 1, isCustom: true, visible: true },
          { id: 'clients', label: 'Clients', icon: 'Users', entityType: 'client', order: 2, isCustom: true, visible: true },
          { id: 'documents', label: 'Documents', icon: 'FileText', entityType: 'document', order: 3, isCustom: true, visible: true },
          { id: 'timeTracking', label: 'Time Tracking', icon: 'Clock', entityType: 'time_entry', order: 4, isCustom: true, visible: true },
          { id: 'billing', label: 'Billing', icon: 'DollarSign', entityType: 'invoice', order: 5, isCustom: true, visible: true }
        ],
        entityTypes: [
          {
            id: 'case',
            name: 'case',
            label: 'Case',
            pluralLabel: 'Cases',
            icon: 'Briefcase',
            fields: [
              { id: 'caseNumber', name: 'caseNumber', label: 'Case Number', type: 'text', required: true, order: 0 },
              { id: 'title', name: 'title', label: 'Case Title', type: 'text', required: true, order: 1 },
              { id: 'client', name: 'client', label: 'Client', type: 'entity', required: true, order: 2 },
              { id: 'type', name: 'type', label: 'Case Type', type: 'select', order: 3,
                options: [
                  { value: 'civil', label: 'Civil' },
                  { value: 'criminal', label: 'Criminal' },
                  { value: 'family', label: 'Family' },
                  { value: 'corporate', label: 'Corporate' },
                  { value: 'ip', label: 'Intellectual Property' }
                ]
              },
              { id: 'status', name: 'status', label: 'Status', type: 'select', order: 4,
                options: [
                  { value: 'open', label: 'Open', color: 'blue' },
                  { value: 'in_progress', label: 'In Progress', color: 'yellow' },
                  { value: 'closed', label: 'Closed', color: 'green' },
                  { value: 'on_hold', label: 'On Hold', color: 'gray' }
                ]
              },
              { id: 'leadAttorney', name: 'leadAttorney', label: 'Lead Attorney', type: 'user', order: 5 },
              { id: 'openDate', name: 'openDate', label: 'Open Date', type: 'date', order: 6 },
              { id: 'courtDate', name: 'courtDate', label: 'Next Court Date', type: 'datetime', order: 7 }
            ],
            defaultView: 'kanban',
            enablePipeline: true,
            searchableFields: ['caseNumber', 'title', 'client'],
            summaryFields: ['caseNumber', 'title', 'status']
          }
        ]
      },
      tags: ['legal', 'law', 'cases']
    };
  }

  /**
   * Mortgage template
   */
  private getMortgageTemplate(): WorkspaceTemplate {
    return {
      id: 'mortgage',
      name: 'Mortgage Lending',
      description: 'Manage loan applications, underwriting, and closings',
      industry: 'Finance',
      icon: '🏦',
      configuration: {
        name: 'Mortgage Lending',
        navigation: [
          { id: 'overview', label: 'Dashboard', icon: 'TrendingUp', order: 0, isCustom: false, visible: true },
          { id: 'applications', label: 'Applications', icon: 'FileText', entityType: 'application', order: 1, isCustom: true, visible: true },
          { id: 'borrowers', label: 'Borrowers', icon: 'Users', entityType: 'borrower', order: 2, isCustom: true, visible: true },
          { id: 'underwriting', label: 'Underwriting', icon: 'CheckCircle', entityType: 'underwriting', order: 3, isCustom: true, visible: true },
          { id: 'appraisals', label: 'Appraisals', icon: 'Home', entityType: 'appraisal', order: 4, isCustom: true, visible: true },
          { id: 'closings', label: 'Closings', icon: 'Calendar', entityType: 'closing', order: 5, isCustom: true, visible: true }
        ],
        entityTypes: [
          {
            id: 'application',
            name: 'application',
            label: 'Loan Application',
            pluralLabel: 'Loan Applications',
            icon: 'FileText',
            fields: [
              { id: 'applicationNumber', name: 'applicationNumber', label: 'Application #', type: 'text', required: true, order: 0 },
              { id: 'borrower', name: 'borrower', label: 'Primary Borrower', type: 'entity', required: true, order: 1 },
              { id: 'loanAmount', name: 'loanAmount', label: 'Loan Amount', type: 'currency', required: true, order: 2 },
              { id: 'propertyValue', name: 'propertyValue', label: 'Property Value', type: 'currency', order: 3 },
              { id: 'loanType', name: 'loanType', label: 'Loan Type', type: 'select', order: 4,
                options: [
                  { value: 'conventional', label: 'Conventional' },
                  { value: 'fha', label: 'FHA' },
                  { value: 'va', label: 'VA' },
                  { value: 'usda', label: 'USDA' },
                  { value: 'jumbo', label: 'Jumbo' }
                ]
              },
              { id: 'rate', name: 'rate', label: 'Interest Rate', type: 'percentage', order: 5 },
              { id: 'term', name: 'term', label: 'Term (months)', type: 'number', order: 6 },
              { id: 'status', name: 'status', label: 'Status', type: 'select', order: 7,
                options: [
                  { value: 'application', label: 'Application', color: 'blue' },
                  { value: 'processing', label: 'Processing', color: 'yellow' },
                  { value: 'underwriting', label: 'Underwriting', color: 'orange' },
                  { value: 'approved', label: 'Approved', color: 'green' },
                  { value: 'closing', label: 'Closing', color: 'purple' },
                  { value: 'funded', label: 'Funded', color: 'teal' },
                  { value: 'denied', label: 'Denied', color: 'red' }
                ]
              },
              { id: 'loanOfficer', name: 'loanOfficer', label: 'Loan Officer', type: 'user', order: 8 }
            ],
            defaultView: 'kanban',
            enablePipeline: true,
            pipelineStages: [
              { id: 'application', name: 'Application', color: '#3B82F6', order: 0 },
              { id: 'processing', name: 'Processing', color: '#F59E0B', order: 1 },
              { id: 'underwriting', name: 'Underwriting', color: '#F97316', order: 2 },
              { id: 'approved', name: 'Approved', color: '#10B981', order: 3 },
              { id: 'closing', name: 'Closing', color: '#8B5CF6', order: 4 },
              { id: 'funded', name: 'Funded', color: '#14B8A6', order: 5 }
            ],
            searchableFields: ['applicationNumber', 'borrower'],
            summaryFields: ['applicationNumber', 'loanAmount', 'status']
          }
        ]
      },
      tags: ['mortgage', 'lending', 'finance']
    };
  }
}

// Export singleton instance
export const workspaceConfigService = new WorkspaceConfigService();