/**
 * Workspace Configuration API Router
 * Handles all workspace configuration operations server-side
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { entityService } from '@/lib/entities/entity-service';
import { workspaceService } from '@/lib/services/workspace-service';
import { TRPCError } from '@trpc/server';

// Import types from workspace-config (these don't cause database initialization)
import type { 
  WorkspaceConfiguration, 
  NavigationItem, 
  EntityTypeDefinition,
  WorkspaceTemplate 
} from '@/lib/services/workspace/workspace-config';

export const workspaceConfigRouter = router({
  // Get workspace configuration
  get: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      try {
        // Try to fetch configuration from database
        const configs = await entityService.find({
          workspaceId,
          type: 'workspace_config',
          limit: 1,
          orderBy: 'updatedAt',
          orderDirection: 'desc'
        });

        if (configs.length > 0) {
          return configs[0].data as WorkspaceConfiguration;
        }

        // Return null if no configuration exists (client will use default)
        return null;
      } catch (error) {
        console.error('Failed to fetch workspace configuration:', error);
        return null;
      }
    }),

  // Save workspace configuration
  save: protectedProcedure
    .input(z.object({
      navigation: z.array(z.any()).optional(),
      entityTypes: z.array(z.any()).optional(),
      views: z.array(z.any()).optional(),
      theme: z.any().optional(),
      features: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      try {
        // Check if configuration already exists
        const existingConfigs = await entityService.find({
          workspaceId,
          type: 'workspace_config',
          limit: 1,
          orderBy: 'updatedAt',
          orderDirection: 'desc'
        });

        const updatedConfig: Partial<WorkspaceConfiguration> = {
          ...input,
          workspaceId,
          version: existingConfigs.length > 0 
            ? ((existingConfigs[0].data as any).version || 0) + 1 
            : 1,
          updatedAt: new Date()
        };

        if (existingConfigs.length > 0) {
          // Update existing configuration
          const existing = existingConfigs[0];
          await entityService.update(
            workspaceId,
            existing.id,
            { ...existing.data, ...updatedConfig },
            {},
            { updatedBy: ctx.userId }
          );
          
          return { ...existing.data, ...updatedConfig } as WorkspaceConfiguration;
        } else {
          // Create new configuration
          const newConfig: WorkspaceConfiguration = {
            id: '',
            workspaceId,
            name: 'Custom Configuration',
            navigation: input.navigation || getDefaultNavigation(),
            entityTypes: input.entityTypes || getDefaultEntityTypes(),
            views: input.views || [],
            theme: input.theme,
            features: input.features,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const entity = await entityService.create(
            workspaceId,
            'workspace_config',
            newConfig,
            {},
            { createdBy: ctx.userId }
          );

          return { ...newConfig, id: entity.id } as WorkspaceConfiguration;
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to save configuration',
        });
      }
    }),

  // Add navigation item
  addNavigationItem: protectedProcedure
    .input(z.object({
      label: z.string(),
      icon: z.string().optional(),
      entityType: z.string().optional(),
      visible: z.boolean().default(true),
      isCustom: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      // Get current configuration
      const configs = await entityService.find({
        workspaceId,
        type: 'workspace_config',
        limit: 1,
        orderBy: 'updatedAt',
        orderDirection: 'desc'
      });

      const currentConfig = configs.length > 0 
        ? configs[0].data as WorkspaceConfiguration
        : null;

      const navigation = currentConfig?.navigation || getDefaultNavigation();
      
      const newItem: NavigationItem = {
        id: `nav_${Date.now()}`,
        label: input.label,
        icon: input.icon,
        entityType: input.entityType,
        order: navigation.length,
        isCustom: input.isCustom,
        visible: input.visible
      };

      navigation.push(newItem);

      // Save updated configuration
      if (currentConfig && configs.length > 0) {
        await entityService.update(
          workspaceId,
          configs[0].id,
          { ...currentConfig, navigation, updatedAt: new Date() },
          {},
          { updatedBy: ctx.userId }
        );
      } else {
        await entityService.create(
          workspaceId,
          'workspace_config',
          {
            id: '',
            workspaceId,
            name: 'Custom Configuration',
            navigation,
            entityTypes: getDefaultEntityTypes(),
            views: [],
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {},
          { createdBy: ctx.userId }
        );
      }

      return newItem;
    }),

  // Update navigation item
  updateNavigationItem: protectedProcedure
    .input(z.object({
      id: z.string(),
      updates: z.object({
        label: z.string().optional(),
        icon: z.string().optional(),
        visible: z.boolean().optional(),
        order: z.number().optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      const configs = await entityService.find({
        workspaceId,
        type: 'workspace_config',
        limit: 1,
        orderBy: 'updatedAt',
        orderDirection: 'desc'
      });

      if (configs.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace configuration not found',
        });
      }

      const config = configs[0].data as WorkspaceConfiguration;
      const navigation = config.navigation.map(item =>
        item.id === input.id ? { ...item, ...input.updates } : item
      );

      await entityService.update(
        workspaceId,
        configs[0].id,
        { ...config, navigation, updatedAt: new Date() },
        {},
        { updatedBy: ctx.userId }
      );

      return true;
    }),

  // Remove navigation item
  removeNavigationItem: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      const configs = await entityService.find({
        workspaceId,
        type: 'workspace_config',
        limit: 1,
        orderBy: 'updatedAt',
        orderDirection: 'desc'
      });

      if (configs.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace configuration not found',
        });
      }

      const config = configs[0].data as WorkspaceConfiguration;
      const navigation = config.navigation.filter(item => item.id !== input.id);

      await entityService.update(
        workspaceId,
        configs[0].id,
        { ...config, navigation, updatedAt: new Date() },
        {},
        { updatedBy: ctx.userId }
      );

      return true;
    }),

  // Apply template
  applyTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      const template = getTemplate(input.templateId);
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      const config: WorkspaceConfiguration = {
        id: '',
        workspaceId,
        name: template.name,
        description: template.description,
        ...template.configuration,
        template: input.templateId,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check if configuration exists
      const configs = await entityService.find({
        workspaceId,
        type: 'workspace_config',
        limit: 1,
        orderBy: 'updatedAt',
        orderDirection: 'desc'
      });

      if (configs.length > 0) {
        await entityService.update(
          workspaceId,
          configs[0].id,
          config,
          {},
          { updatedBy: ctx.userId }
        );
        return { ...config, id: configs[0].id };
      } else {
        const entity = await entityService.create(
          workspaceId,
          'workspace_config',
          config,
          {},
          { createdBy: ctx.userId }
        );
        return { ...config, id: entity.id };
      }
    }),

  // Get available templates
  getTemplates: protectedProcedure
    .query(async () => {
      return getBuiltInTemplates();
    }),
});

// Default navigation configuration
function getDefaultNavigation(): NavigationItem[] {
  return [
    { id: 'overview', label: 'Overview', icon: 'BarChart3', order: 0, isCustom: false, visible: true },
    { id: 'leads', label: 'Leads', icon: 'Users', entityType: 'lead', order: 1, isCustom: false, visible: true },
    { id: 'contacts', label: 'Contacts', icon: 'Users', entityType: 'contact', order: 2, isCustom: false, visible: true },
    { id: 'companies', label: 'Companies', icon: 'Building2', entityType: 'company', order: 3, isCustom: false, visible: true },
    { id: 'deals', label: 'Deals', icon: 'Target', entityType: 'deal', order: 4, isCustom: false, visible: true },
    { id: 'products', label: 'Products', icon: 'Package', entityType: 'product', order: 5, isCustom: false, visible: true },
    { id: 'orders', label: 'Orders', icon: 'ShoppingCart', entityType: 'order', order: 6, isCustom: false, visible: true }
  ];
}

// Default entity types
function getDefaultEntityTypes(): EntityTypeDefinition[] {
  return [
    {
      id: 'contact',
      name: 'contact',
      label: 'Contact',
      pluralLabel: 'Contacts',
      icon: 'User',
      fields: [],
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
      fields: [],
      defaultView: 'kanban',
      enablePipeline: true,
      searchableFields: ['name', 'company'],
      summaryFields: ['name', 'value', 'stage']
    },
    {
      id: 'company',
      name: 'company',
      label: 'Company',
      pluralLabel: 'Companies',
      icon: 'Building2',
      fields: [],
      defaultView: 'table',
      searchableFields: ['name', 'domain'],
      summaryFields: ['name', 'industry', 'size']
    }
  ];
}

// Get template by ID
function getTemplate(templateId: string): WorkspaceTemplate | null {
  const templates = getBuiltInTemplates();
  return templates.find(t => t.id === templateId) || null;
}

// Get built-in templates
function getBuiltInTemplates(): WorkspaceTemplate[] {
  return [
    getRealEstateTemplate(),
    getHealthcareTemplate(),
    getLegalTemplate(),
    getMortgageTemplate()
  ];
}

function getRealEstateTemplate(): WorkspaceTemplate {
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
      ],
      entityTypes: [],
      views: []
    },
    tags: ['real-estate', 'property', 'sales']
  };
}

function getHealthcareTemplate(): WorkspaceTemplate {
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
      ],
      entityTypes: [],
      views: []
    },
    tags: ['healthcare', 'medical', 'patients']
  };
}

function getLegalTemplate(): WorkspaceTemplate {
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
      ],
      entityTypes: [],
      views: []
    },
    tags: ['legal', 'law', 'cases']
  };
}

function getMortgageTemplate(): WorkspaceTemplate {
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
      ],
      entityTypes: [],
      views: []
    },
    tags: ['mortgage', 'lending', 'finance']
  };
}