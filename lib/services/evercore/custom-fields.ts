/**
 * Natural Language Field Creation - Dynamic entity schema extension
 * Users can add custom fields to any entity type through natural language
 * "Add a field for deal size to contacts"
 * "Track renewal dates for companies"
 * "Add a checkbox for qualified leads"
 */

import { entityService } from '@/lib/entities/entity-service';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FieldDefinition {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'url' | 'email' | 'phone' | 'currency' | 'percentage';
  entityType: string; // Which entity type this field belongs to
  options?: string[]; // For select/multiselect
  required?: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string; // JavaScript function as string
  };
  description?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface FieldValue {
  fieldId: string;
  value: any;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Process natural language command to create custom field
 */
export async function createFieldFromNaturalLanguage(
  workspaceId: string,
  command: string,
  userId: string
): Promise<FieldDefinition> {
  try {
    const prompt = `
      Parse this request to add a custom field to an entity:
      "${command}"
      
      Extract the following information:
      1. Entity type (contact, company, deal, etc.)
      2. Field name (camelCase)
      3. Field label (human readable)
      4. Field type (text, number, date, boolean, select, multiselect, url, email, phone, currency, percentage)
      5. Whether it's required
      6. Default value if any
      7. Options if it's a select/multiselect
      8. Any validation rules mentioned
      
      Return as JSON with this structure:
      {
        "entityType": "contact",
        "name": "dealSize",
        "label": "Deal Size",
        "type": "currency",
        "required": false,
        "defaultValue": null,
        "options": null,
        "validation": {
          "min": 0
        },
        "description": "The size of the deal in dollars"
      }
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at parsing natural language requests to create database fields. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });
    
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Create field definition
    const fieldDef: FieldDefinition = {
      id: generateFieldId(parsed.entityType, parsed.name),
      name: parsed.name,
      label: parsed.label,
      type: parsed.type,
      entityType: parsed.entityType,
      options: parsed.options,
      required: parsed.required || false,
      defaultValue: parsed.defaultValue,
      validation: parsed.validation,
      description: parsed.description,
      createdBy: userId,
      createdAt: new Date()
    };
    
    // Save field definition to workspace metadata
    await saveFieldDefinition(workspaceId, fieldDef);
    
    // Optionally migrate existing entities to include default value
    if (fieldDef.defaultValue !== undefined) {
      await migrateExistingEntities(workspaceId, fieldDef);
    }
    
    return fieldDef;
  } catch (error) {
    console.error('Failed to create field from natural language:', error);
    throw new Error('Failed to parse field creation request');
  }
}

/**
 * Create a custom field programmatically
 */
export async function createCustomField(
  workspaceId: string,
  fieldDef: Omit<FieldDefinition, 'id' | 'createdAt'>,
  userId: string
): Promise<FieldDefinition> {
  const field: FieldDefinition = {
    ...fieldDef,
    id: generateFieldId(fieldDef.entityType, fieldDef.name),
    createdBy: userId,
    createdAt: new Date()
  };
  
  // Validate field definition
  validateFieldDefinition(field);
  
  // Save to workspace
  await saveFieldDefinition(workspaceId, field);
  
  // Migrate if needed
  if (field.defaultValue !== undefined) {
    await migrateExistingEntities(workspaceId, field);
  }
  
  return field;
}

/**
 * Get all custom fields for an entity type
 */
export async function getCustomFields(
  workspaceId: string,
  entityType: string
): Promise<FieldDefinition[]> {
  // Get workspace metadata that stores field definitions
  const workspaces = await entityService.find({
    workspaceId,
    type: 'workspace_metadata',
    limit: 1
  });
  
  const workspace = workspaces[0];
  
  if (!workspace?.data?.customFields) {
    return [];
  }
  
  return workspace.data.customFields.filter((f: FieldDefinition) => 
    f.entityType === entityType
  );
}

/**
 * Get custom field values for an entity
 */
export async function getFieldValues(
  workspaceId: string,
  entityId: string
): Promise<Record<string, any>> {
  const entity = await entityService.findById(workspaceId, entityId);
  if (!entity) return {};
  
  // Custom fields are stored in entity.data.customFields
  return entity.data.customFields || {};
}

/**
 * Set custom field value
 */
export async function setFieldValue(
  workspaceId: string,
  entityId: string,
  fieldId: string,
  value: any,
  userId: string
): Promise<void> {
  const entity = await entityService.findById(workspaceId, entityId);
  if (!entity) {
    throw new Error('Entity not found');
  }
  
  // Get field definition
  const fields = await getCustomFields(workspaceId, entity.type);
  const fieldDef = fields.find(f => f.id === fieldId);
  
  if (!fieldDef) {
    throw new Error('Field definition not found');
  }
  
  // Validate value
  validateFieldValue(value, fieldDef);
  
  // Update entity
  const customFields = entity.data.customFields || {};
  customFields[fieldId] = {
    value,
    updatedAt: new Date(),
    updatedBy: userId
  };
  
  await entityService.update(
    workspaceId,
    entityId,
    {
      ...entity.data,
      customFields
    }
  );
}

/**
 * Bulk set field values
 */
export async function bulkSetFieldValues(
  workspaceId: string,
  updates: Array<{
    entityId: string;
    fieldId: string;
    value: any;
  }>,
  userId: string
): Promise<{ updated: number; failed: number }> {
  let updated = 0;
  let failed = 0;
  
  for (const update of updates) {
    try {
      await setFieldValue(
        workspaceId,
        update.entityId,
        update.fieldId,
        update.value,
        userId
      );
      updated++;
    } catch (error) {
      console.error(`Failed to update field ${update.fieldId} for entity ${update.entityId}:`, error);
      failed++;
    }
  }
  
  return { updated, failed };
}

/**
 * Delete a custom field
 */
export async function deleteCustomField(
  workspaceId: string,
  fieldId: string,
  removeData: boolean = false
): Promise<void> {
  // Get workspace metadata
  const workspaces = await entityService.find({
    workspaceId,
    type: 'workspace_metadata',
    limit: 1
  });
  
  const workspace = workspaces[0];
  
  if (!workspace?.data?.customFields) {
    return;
  }
  
  // Find and remove field definition
  const fieldIndex = workspace.data.customFields.findIndex((f: FieldDefinition) => f.id === fieldId);
  if (fieldIndex === -1) {
    throw new Error('Field not found');
  }
  
  const field = workspace.data.customFields[fieldIndex];
  workspace.data.customFields.splice(fieldIndex, 1);
  
  // Update workspace metadata
  await entityService.update(
    workspaceId,
    workspace.id,
    workspace.data
  );
  
  // Optionally remove field data from all entities
  if (removeData) {
    await removeFieldDataFromEntities(workspaceId, field.entityType, fieldId);
  }
}

/**
 * Generate reports based on custom fields
 */
export async function generateFieldReport(
  workspaceId: string,
  entityType: string,
  fieldId: string
): Promise<{
  fieldInfo: FieldDefinition;
  totalEntities: number;
  withValue: number;
  withoutValue: number;
  uniqueValues?: any[];
  valueDistribution?: Record<string, number>;
  averageValue?: number; // For numeric fields
  earliestDate?: Date; // For date fields
  latestDate?: Date; // For date fields
}> {
  // Get field definition
  const fields = await getCustomFields(workspaceId, entityType);
  const fieldDef = fields.find(f => f.id === fieldId);
  
  if (!fieldDef) {
    throw new Error('Field not found');
  }
  
  // Get all entities of this type
  const entities = await entityService.find({
    workspaceId,
    type: entityType,
    limit: 10000
  });
  
  let withValue = 0;
  let withoutValue = 0;
  const values: any[] = [];
  const valueCount: Record<string, number> = {};
  
  for (const entity of entities) {
    const fieldValue = entity.data.customFields?.[fieldId]?.value;
    
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      withValue++;
      values.push(fieldValue);
      
      // Count occurrences for distribution
      const key = String(fieldValue);
      valueCount[key] = (valueCount[key] || 0) + 1;
    } else {
      withoutValue++;
    }
  }
  
  const report: any = {
    fieldInfo: fieldDef,
    totalEntities: entities.length,
    withValue,
    withoutValue
  };
  
  // Add type-specific analysis
  if (fieldDef.type === 'number' || fieldDef.type === 'currency' || fieldDef.type === 'percentage') {
    const numValues = values.filter(v => typeof v === 'number');
    if (numValues.length > 0) {
      report.averageValue = numValues.reduce((a, b) => a + b, 0) / numValues.length;
      report.minValue = Math.min(...numValues);
      report.maxValue = Math.max(...numValues);
    }
  } else if (fieldDef.type === 'date') {
    const dates = values.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
    if (dates.length > 0) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      report.earliestDate = dates[0];
      report.latestDate = dates[dates.length - 1];
    }
  } else if (fieldDef.type === 'select' || fieldDef.type === 'multiselect') {
    report.valueDistribution = valueCount;
    report.uniqueValues = Object.keys(valueCount);
  } else if (fieldDef.type === 'boolean') {
    report.trueCount = values.filter(v => v === true).length;
    report.falseCount = values.filter(v => v === false).length;
  }
  
  return report;
}

/**
 * Smart field suggestions based on entity type
 */
export async function suggestFields(
  entityType: string,
  existingFields: string[]
): Promise<Array<{
  name: string;
  label: string;
  type: string;
  description: string;
  reason: string;
}>> {
  const commonFieldsByType: Record<string, any[]> = {
    contact: [
      { name: 'linkedinUrl', label: 'LinkedIn Profile', type: 'url', description: 'LinkedIn profile URL' },
      { name: 'birthday', label: 'Birthday', type: 'date', description: 'Contact birthday' },
      { name: 'leadScore', label: 'Lead Score', type: 'number', description: 'Qualification score (0-100)' },
      { name: 'preferredContactMethod', label: 'Preferred Contact Method', type: 'select', options: ['Email', 'Phone', 'LinkedIn', 'Slack'] },
      { name: 'timezone', label: 'Timezone', type: 'text', description: 'Contact timezone' },
      { name: 'isDecisionMaker', label: 'Decision Maker', type: 'boolean', description: 'Can make purchasing decisions' }
    ],
    company: [
      { name: 'fiscalYearEnd', label: 'Fiscal Year End', type: 'date', description: 'End of fiscal year' },
      { name: 'contractValue', label: 'Contract Value', type: 'currency', description: 'Total contract value' },
      { name: 'renewalDate', label: 'Renewal Date', type: 'date', description: 'Contract renewal date' },
      { name: 'accountTier', label: 'Account Tier', type: 'select', options: ['Strategic', 'Enterprise', 'Mid-Market', 'SMB'] },
      { name: 'technologies', label: 'Technologies Used', type: 'multiselect', options: ['AWS', 'Azure', 'Google Cloud', 'Salesforce', 'HubSpot'] },
      { name: 'healthScore', label: 'Account Health', type: 'percentage', description: 'Overall account health' }
    ],
    deal: [
      { name: 'competitor', label: 'Main Competitor', type: 'text', description: 'Primary competitor for this deal' },
      { name: 'budget', label: 'Budget', type: 'currency', description: 'Available budget' },
      { name: 'decisionDate', label: 'Decision Date', type: 'date', description: 'Expected decision date' },
      { name: 'probability', label: 'Win Probability', type: 'percentage', description: 'Likelihood of winning' },
      { name: 'nextSteps', label: 'Next Steps', type: 'text', description: 'Next actions required' },
      { name: 'painPoints', label: 'Pain Points', type: 'multiselect', options: ['Cost', 'Efficiency', 'Scale', 'Integration', 'Support'] }
    ]
  };
  
  const suggestions = commonFieldsByType[entityType] || [];
  
  // Filter out already existing fields
  return suggestions
    .filter(s => !existingFields.includes(s.name))
    .map(s => ({
      ...s,
      reason: `Commonly used in ${entityType} management to track ${s.description.toLowerCase()}`
    }));
}

// Helper functions

function generateFieldId(entityType: string, fieldName: string): string {
  return `${entityType}_${fieldName}_${Date.now()}`;
}

function validateFieldDefinition(field: FieldDefinition): void {
  if (!field.name || !field.label || !field.type || !field.entityType) {
    throw new Error('Missing required field properties');
  }
  
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
    throw new Error('Field name must start with a letter and contain only letters, numbers, and underscores');
  }
  
  const validTypes = ['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email', 'phone', 'currency', 'percentage'];
  if (!validTypes.includes(field.type)) {
    throw new Error(`Invalid field type: ${field.type}`);
  }
  
  if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
    throw new Error('Select fields must have options');
  }
}

function validateFieldValue(value: any, fieldDef: FieldDefinition): void {
  if (fieldDef.required && (value === undefined || value === null || value === '')) {
    throw new Error(`Field ${fieldDef.label} is required`);
  }
  
  if (value === undefined || value === null) {
    return; // Allow null/undefined for non-required fields
  }
  
  // Type validation
  switch (fieldDef.type) {
    case 'number':
    case 'currency':
    case 'percentage':
      if (typeof value !== 'number') {
        throw new Error(`Field ${fieldDef.label} must be a number`);
      }
      if (fieldDef.validation?.min !== undefined && value < fieldDef.validation.min) {
        throw new Error(`Field ${fieldDef.label} must be at least ${fieldDef.validation.min}`);
      }
      if (fieldDef.validation?.max !== undefined && value > fieldDef.validation.max) {
        throw new Error(`Field ${fieldDef.label} must be at most ${fieldDef.validation.max}`);
      }
      break;
      
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new Error(`Field ${fieldDef.label} must be true or false`);
      }
      break;
      
    case 'date':
      if (!(value instanceof Date) && isNaN(new Date(value).getTime())) {
        throw new Error(`Field ${fieldDef.label} must be a valid date`);
      }
      break;
      
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new Error(`Field ${fieldDef.label} must be a valid email`);
      }
      break;
      
    case 'url':
      try {
        new URL(value);
      } catch {
        throw new Error(`Field ${fieldDef.label} must be a valid URL`);
      }
      break;
      
    case 'phone':
      if (!/^\+?[\d\s\-\(\)]+$/.test(value)) {
        throw new Error(`Field ${fieldDef.label} must be a valid phone number`);
      }
      break;
      
    case 'select':
      if (fieldDef.options && !fieldDef.options.includes(value)) {
        throw new Error(`Field ${fieldDef.label} must be one of: ${fieldDef.options.join(', ')}`);
      }
      break;
      
    case 'multiselect':
      if (!Array.isArray(value)) {
        throw new Error(`Field ${fieldDef.label} must be an array`);
      }
      if (fieldDef.options) {
        for (const v of value) {
          if (!fieldDef.options.includes(v)) {
            throw new Error(`Field ${fieldDef.label} values must be from: ${fieldDef.options.join(', ')}`);
          }
        }
      }
      break;
  }
  
  // Custom validation
  if (fieldDef.validation?.pattern) {
    const regex = new RegExp(fieldDef.validation.pattern);
    if (!regex.test(String(value))) {
      throw new Error(`Field ${fieldDef.label} does not match required pattern`);
    }
  }
}

async function saveFieldDefinition(workspaceId: string, field: FieldDefinition): Promise<void> {
  // Get or create workspace metadata
  const workspaces = await entityService.find({
    workspaceId,
    type: 'workspace_metadata',
    limit: 1
  });
  
  let workspace = workspaces[0];
  
  if (!workspace) {
    workspace = await entityService.create(
      workspaceId,
      'workspace_metadata',
      {
        customFields: [field]
      },
      {},
      { system: true }
    );
  } else {
    const customFields = workspace.data.customFields || [];
    
    // Check if field already exists
    const existingIndex = customFields.findIndex((f: FieldDefinition) => 
      f.entityType === field.entityType && f.name === field.name
    );
    
    if (existingIndex >= 0) {
      // Update existing field
      customFields[existingIndex] = field;
    } else {
      // Add new field
      customFields.push(field);
    }
    
    await entityService.update(
      workspaceId,
      workspace.id,
      {
        ...workspace.data,
        customFields
      }
    );
  }
}

async function migrateExistingEntities(workspaceId: string, field: FieldDefinition): Promise<void> {
  if (field.defaultValue === undefined) return;
  
  // Get all entities of this type
  const entities = await entityService.find({
    workspaceId,
    type: field.entityType,
    limit: 10000
  });
  
  // Update each entity with default value
  for (const entity of entities) {
    const customFields = entity.data.customFields || {};
    
    // Only set if not already set
    if (!customFields[field.id]) {
      customFields[field.id] = {
        value: field.defaultValue,
        updatedAt: new Date(),
        updatedBy: 'system'
      };
      
      await entityService.update(
        workspaceId,
        entity.id,
        {
          ...entity.data,
          customFields
        }
      );
    }
  }
}

async function removeFieldDataFromEntities(
  workspaceId: string,
  entityType: string,
  fieldId: string
): Promise<void> {
  // Get all entities of this type
  const entities = await entityService.find({
    workspaceId,
    type: entityType,
    limit: 10000
  });
  
  // Remove field from each entity
  for (const entity of entities) {
    if (entity.data.customFields?.[fieldId]) {
      delete entity.data.customFields[fieldId];
      
      await entityService.update(
        workspaceId,
        entity.id,
        entity.data
      );
    }
  }
}

/**
 * Export field definitions for backup/migration
 */
export async function exportFieldDefinitions(
  workspaceId: string
): Promise<{
  version: string;
  exportedAt: Date;
  fields: FieldDefinition[];
}> {
  const workspaces = await entityService.find({
    workspaceId,
    type: 'workspace_metadata',
    limit: 1
  });
  
  const workspace = workspaces[0];
  
  return {
    version: '1.0.0',
    exportedAt: new Date(),
    fields: workspace?.data?.customFields || []
  };
}

/**
 * Import field definitions
 */
export async function importFieldDefinitions(
  workspaceId: string,
  data: {
    version: string;
    fields: FieldDefinition[];
  },
  userId: string
): Promise<{
  imported: number;
  skipped: number;
  errors: string[];
}> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  
  for (const field of data.fields) {
    try {
      // Check if field already exists
      const existing = await getCustomFields(workspaceId, field.entityType);
      if (existing.some(f => f.name === field.name)) {
        skipped++;
        continue;
      }
      
      // Create field
      await createCustomField(
        workspaceId,
        {
          ...field,
          createdBy: userId
        },
        userId
      );
      imported++;
    } catch (error) {
      errors.push(`Failed to import field ${field.name}: ${error}`);
    }
  }
  
  return { imported, skipped, errors };
}