/**
 * Custom Entity Types Management
 * Allows creating and managing custom entity types beyond the default CRM entities
 * Note: Database operations have been moved to tRPC router to avoid client-side database access
 */

import { EntityTypeDefinition, FieldDefinition, PipelineStage } from './workspace-config';

export interface DynamicEntity {
  id: string;
  type: string; // Entity type name
  workspaceId: string;
  userId?: string;
  data: Record<string, any>; // Dynamic fields based on entity type definition
  relationships?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityValidationResult {
  valid: boolean;
  errors: FieldValidationError[];
}

export interface FieldValidationError {
  field: string;
  message: string;
  value?: any;
}

export class EntityTypeService {
  /**
   * Note: createEntity has been moved to tRPC router for server-side execution
   * Use the tRPC mutation from your components instead
   */

  /**
   * Validate entity data against type definition (client-safe)
   */
  validateEntity(entityType: EntityTypeDefinition, data: Record<string, any>): EntityValidationResult {
    const errors: FieldValidationError[] = [];

    // Check required fields
    entityType.fields.forEach(field => {
      if (field.required && !data[field.name]) {
        errors.push({
          field: field.name,
          message: `${field.label} is required`,
          value: data[field.name]
        });
      }

      // Type validation
      if (data[field.name] !== undefined) {
        const validationError = this.validateFieldType(field, data[field.name]);
        if (validationError) {
          errors.push(validationError);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Apply default values to entity data (client-safe)
   */
  applyDefaults(entityType: EntityTypeDefinition, data: Record<string, any>): Record<string, any> {
    const processedData = { ...data };

    // Apply default values from field definitions
    entityType.fields.forEach(field => {
      if (field.defaultValue !== undefined && processedData[field.name] === undefined) {
        processedData[field.name] = field.defaultValue;
      }
    });

    return processedData;
  }

  /**
   * Note: updateEntity has been moved to tRPC router for server-side execution
   * Use the tRPC mutation from your components instead
   */

  /**
   * Note: getEntities has been moved to tRPC router for server-side execution
   * Use the tRPC query from your components instead
   */

  /**
   * Validate field type (client-safe)
   */
  validateFieldType(field: FieldDefinition, value: any): FieldValidationError | null {
    switch (field.type) {
      case 'text':
      case 'richtext':
      case 'url':
      case 'email':
      case 'phone':
        if (typeof value !== 'string') {
          return `${field.label} must be a string`;
        }
        if (field.type === 'email' && !this.isValidEmail(value)) {
          return `${field.label} must be a valid email address`;
        }
        if (field.type === 'url' && !this.isValidUrl(value)) {
          return `${field.label} must be a valid URL`;
        }
        if (field.type === 'phone' && !this.isValidPhone(value)) {
          return `${field.label} must be a valid phone number`;
        }
        break;

      case 'number':
      case 'currency':
      case 'percentage':
        if (typeof value !== 'number' && !this.isNumeric(value)) {
          return `${field.label} must be a number`;
        }
        break;

      case 'date':
      case 'datetime':
        if (!this.isValidDate(value)) {
          return `${field.label} must be a valid date`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field.label} must be a boolean`;
        }
        break;

      case 'select':
        if (field.options && !field.options.some(opt => opt.value === value)) {
          return `${field.label} must be one of the predefined options`;
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          return `${field.label} must be an array`;
        }
        if (field.options) {
          const validValues = field.options.map(opt => opt.value);
          const invalidValues = value.filter(v => !validValues.includes(v));
          if (invalidValues.length > 0) {
            return `${field.label} contains invalid options: ${invalidValues.join(', ')}`;
          }
        }
        break;
    }

    return null;
  }

  /**
   * Validate field rules (client-safe)
   */
  validateFieldRules(field: FieldDefinition, value: any): string | null {
    const rules = field.validation!;

    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return rules.message || `${field.label} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return rules.message || `${field.label} must be at most ${rules.max}`;
      }
    }

    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        return rules.message || `${field.label} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        return rules.message || `${field.label} must be at most ${rules.maxLength} characters`;
      }
      if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
        return rules.message || `${field.label} does not match the required pattern`;
      }
    }

    // Custom validator (JavaScript function as string)
    if (rules.customValidator) {
      try {
        const validator = new Function('value', 'field', 'data', rules.customValidator);
        const result = validator(value, field, {});
        if (result !== true) {
          return rules.message || result || `${field.label} failed validation`;
        }
      } catch (error) {
        console.error('Custom validator error:', error);
        return `${field.label} has an invalid validator`;
      }
    }

    return null;
  }

  /**
   * Check if value is a valid email (client-safe)
   */
  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Check if value is a valid URL (client-safe)
   */
  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if value is a valid phone number (client-safe)
   */
  private isValidPhone(value: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(value) && value.length >= 10;
  }

  /**
   * Check if value is numeric (client-safe)
   */
  private isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Check if value is a valid date (client-safe)
   */
  private isValidDate(value: any): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Calculate formula fields
   */
  private async calculateFormulas(
    entityType: EntityTypeDefinition,
    data: Record<string, any>
  ): Promise<Record<string, any>> {
    const result = { ...data };

    for (const field of entityType.fields) {
      if (field.type === 'formula' && field.formula) {
        try {
          result[field.name] = await this.evaluateFormula(field.formula, result, entityType);
        } catch (error) {
          console.error(`Formula error for field ${field.name}:`, error);
          result[field.name] = null;
        }
      }
    }

    return result;
  }

  /**
   * Evaluate a formula expression
   */
  private async evaluateFormula(
    formula: string,
    data: Record<string, any>,
    entityType: EntityTypeDefinition
  ): Promise<any> {
    // Simple formula parser - in production, use a proper expression parser
    // Supports basic math and field references

    let expression = formula;

    // Replace field references with actual values
    for (const field of entityType.fields) {
      const fieldRef = `{${field.name}}`;
      if (expression.includes(fieldRef)) {
        const value = data[field.name];
        expression = expression.replace(
          new RegExp(fieldRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          JSON.stringify(value)
        );
      }
    }

    // Common formula functions
    const formulaFunctions = {
      SUM: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      AVG: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
      MIN: Math.min,
      MAX: Math.max,
      COUNT: (...args: any[]) => args.length,
      IF: (condition: boolean, trueVal: any, falseVal: any) => condition ? trueVal : falseVal,
      CONCAT: (...args: string[]) => args.join(''),
      TODAY: () => new Date(),
      DAYS_BETWEEN: (date1: Date, date2: Date) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      }
    };

    // Create safe evaluation context
    const context = {
      ...formulaFunctions,
      Math,
      Date,
      String,
      Number,
      Boolean,
      JSON
    };

    try {
      // Use Function constructor for safe evaluation
      const func = new Function(...Object.keys(context), `return ${expression}`);
      return func(...Object.values(context));
    } catch (error) {
      throw new Error(`Formula evaluation failed: ${error}`);
    }
  }

  /**
   * Get entity count by type
   */
  async getEntityCount(
    workspaceId: string,
    entityTypeName: string,
    userId?: string
  ): Promise<number> {
    return entityService.count({
      workspaceId,
      userId,
      type: entityTypeName
    });
  }

  /**
   * Move entity through pipeline stages
   */
  async moveEntityToStage(
    workspaceId: string,
    entityId: string,
    entityType: EntityTypeDefinition,
    newStage: string,
    userId?: string
  ): Promise<DynamicEntity> {
    if (!entityType.enablePipeline || !entityType.pipelineStages) {
      throw new Error('This entity type does not support pipeline stages');
    }

    const stage = entityType.pipelineStages.find(s => s.id === newStage);
    if (!stage) {
      throw new Error('Invalid stage');
    }

    // Update entity with new stage
    return this.updateEntity(
      workspaceId,
      entityId,
      entityType,
      {
        stage: newStage,
        stageChangedAt: new Date(),
        probability: stage.probability
      },
      userId
    );
  }

  /**
   * Helper validation methods
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  }

  private isValidDate(date: any): boolean {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
  }

  private isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
}

// Export singleton instance
export const entityTypeService = new EntityTypeService();