/**
 * Unified API Router
 * Simple, direct access to EntityService - no complex abstractions
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { entityService } from '@/lib/entities/entity-service';
import { processCommand } from '@/lib/modules-simple/command-processor';
import * as everchat from '@/lib/modules-simple/everchat';
import * as evercore from '@/lib/modules-simple/evercore';
import { TRPCError } from '@trpc/server';
import { workspaceService } from '@/lib/services/workspace-service';
import { GmailClient } from '@/lib/evermail/gmail-client';
import { db } from '@/lib/db';
import { users, entities, relationships } from '@/lib/db/schema/unified';
import { eq, and, or, sql } from 'drizzle-orm';


export const unifiedRouter = router({
  // Execute natural language command
  executeCommand: protectedProcedure
    .input(z.object({
      command: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      const userId = ctx.userId;
      
      try {
        const result = await processCommand(workspaceId, input.command, userId);
        
        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || 'Command execution failed',
          });
        }
        
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }),

  // Send email endpoint for dashboard
  sendEmail: protectedProcedure
    .input(z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
      bodyHtml: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      try {
        // Get database user first
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, ctx.userId))
          .limit(1);
        
        if (!dbUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found in database. Please sync users first.',
          });
        }

        const gmail = new GmailClient();
        await gmail.sendEmail({
          to: input.to,
          subject: input.subject,
          body: input.body,
          bodyHtml: input.bodyHtml,
          workspaceId,
          userId: dbUser.id
        });
        
        return {
          success: true,
          message: `Email sent successfully to ${input.to}`,
        };
      } catch (error) {
        console.error('Failed to send email:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send email',
        });
      }
    }),

  // Direct entity operations
  createEntity: protectedProcedure
    .input(z.object({
      type: z.string(),
      data: z.any(),
      relationships: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await entityService.create(
        workspaceId,
        input.type,
        input.data,
        input.relationships || {},
        { ...input.metadata, userId: ctx.userId }
      );
    }),

  getEntity: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const entity = await entityService.findById(workspaceId, input.id);
      
      if (!entity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entity not found',
        });
      }
      
      return entity;
    }),

  findEntities: protectedProcedure
    .input(z.object({
      type: z.union([z.string(), z.array(z.string())]).optional(),
      where: z.record(z.any()).optional(),
      relationships: z.record(z.string()).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(1000).default(50),
      offset: z.number().min(0).default(0),
      orderBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
      orderDirection: z.enum(['asc', 'desc']).default('desc'),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await entityService.find({
        workspaceId,
        ...input,
      });
    }),

  updateEntity: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.any().optional(),
      relationships: z.any().optional(),
      metadata: z.any().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await entityService.update(
        workspaceId,
        input.id,
        input.data,
        input.relationships,
        input.metadata
      );
    }),

  deleteEntity: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const success = await entityService.delete(workspaceId, input.id);
      
      if (!success) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entity not found or already deleted',
        });
      }
      
      return { success };
    }),

  linkEntities: protectedProcedure
    .input(z.object({
      entity1Id: z.string().uuid(),
      entity2Id: z.string().uuid(),
      relationshipType: z.string(),
      bidirectional: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      await entityService.link(
        workspaceId,
        input.entity1Id,
        input.entity2Id,
        input.relationshipType,
        input.bidirectional
      );
      
      return { success: true };
    }),

  getRelatedEntities: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      relationshipType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await entityService.findRelated(
        workspaceId,
        input.entityId,
        input.relationshipType
      );
    }),

  // Chat-specific operations (convenience wrappers)
  sendMessage: protectedProcedure
    .input(z.object({
      content: z.string().min(1),
      conversationId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      const userId = ctx.userId;
      
      return await everchat.sendMessage(
        workspaceId,
        input.content,
        input.conversationId,
        userId
      );
    }),

  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await everchat.getMessages(
        workspaceId,
        input.conversationId,
        input.limit
      );
    }),

  getConversations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await everchat.getConversations(workspaceId, input.limit);
    }),

  // CRM-specific operations
  createContact: protectedProcedure
    .input(z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      jobTitle: z.string().optional(),
      companyId: z.string().uuid().optional(),
      companyName: z.string().optional(), // NEW: Accept company name
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      const userId = ctx.userId;
      
      return await evercore.createContact(workspaceId, input, userId);
    }),
  
  createCompany: protectedProcedure
    .input(z.object({
      name: z.string(),
      domain: z.string().optional(),
      industry: z.string().optional(),
      employeeCount: z.number().optional(),
      annualRevenue: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      const userId = ctx.userId;
      
      return await evercore.createCompany(workspaceId, input, userId);
    }),

  createDeal: protectedProcedure
    .input(z.object({
      name: z.string(),
      value: z.number(),
      stage: z.string(),
      companyId: z.string().uuid().optional(),
      primaryContactId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      const userId = ctx.userId;
      
      return await evercore.createDeal(workspaceId, input, userId);
    }),

  getDeals: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
      companyId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await evercore.getDeals(workspaceId, input);
    }),

  updateDealStage: protectedProcedure
    .input(z.object({
      dealId: z.string().uuid(),
      stage: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await evercore.updateDealStage(workspaceId, input.dealId, input.stage);
    }),
  
  // Deal Intelligence endpoints
  calculateDealScore: protectedProcedure
    .input(z.object({
      dealId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import the deal intelligence module
      const { calculateDealScore } = await import('@/lib/services/evercore/deal-intelligence');
      
      try {
        return await calculateDealScore(workspaceId, input.dealId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to calculate deal score',
        });
      }
    }),
  
  detectDealsAtRisk: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import the deal intelligence module
      const { detectDealsAtRisk } = await import('@/lib/services/evercore/deal-intelligence');
      
      try {
        return await detectDealsAtRisk(workspaceId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to detect deals at risk',
        });
      }
    }),
  
  predictRevenue: protectedProcedure
    .input(z.object({
      periodDays: z.number().optional().default(90),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import the deal intelligence module
      const { predictRevenue } = await import('@/lib/services/evercore/deal-intelligence');
      
      try {
        return await predictRevenue(workspaceId, input.periodDays);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to predict revenue',
        });
      }
    }),
  
  // Activity Timeline endpoints
  getTimeline: protectedProcedure
    .input(z.object({
      entityType: z.enum(['contact', 'company', 'deal']),
      entityId: z.string().uuid(),
      filters: z.object({
        types: z.array(z.string()).optional(),
        searchQuery: z.string().optional(),
        dateRange: z.object({
          start: z.date(),
          end: z.date()
        }).optional()
      }).optional()
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import the timeline module
      const { getContactTimeline, getCompanyTimeline, getDealTimeline } = 
        await import('@/lib/services/evercore/activity-timeline');
      
      try {
        switch (input.entityType) {
          case 'contact':
            return await getContactTimeline(workspaceId, input.entityId, input.filters);
          case 'company':
            return await getCompanyTimeline(workspaceId, input.entityId, input.filters);
          case 'deal':
            return await getDealTimeline(workspaceId, input.entityId, input.filters);
          default:
            throw new Error('Invalid entity type');
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get timeline',
        });
      }
    }),
  
  getEngagementInsights: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import the timeline module
      const { getEngagementInsights } = await import('@/lib/services/evercore/activity-timeline');
      
      try {
        return await getEngagementInsights(workspaceId, input.entityId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get engagement insights',
        });
      }
    }),
  
  getActivitySummary: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      days: z.number().optional().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import the timeline module
      const { getActivitySummary } = await import('@/lib/services/evercore/activity-timeline');
      
      try {
        return await getActivitySummary(workspaceId, input.entityId, input.days);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get activity summary',
        });
      }
    }),

  getContactInsights: protectedProcedure
    .input(z.object({
      contactId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await evercore.getContactInsights(workspaceId, input.contactId);
    }),
  
  getCompanyInsights: protectedProcedure
    .input(z.object({
      companyId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await evercore.getCompanyInsights(workspaceId, input.companyId);
    }),

  // Dashboard Stats
  getDashboardStats: protectedProcedure
    .input(z.object({
      period: z.enum(['today', 'week', 'month', 'year']).default('month'),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get contacts, companies, and deals
      const contacts = await evercore.getContacts(workspaceId);
      const companies = await evercore.getCompanies(workspaceId);
      const deals = await evercore.getDeals(workspaceId);
      
      // Calculate metrics based on period
      const now = Date.now();
      const periodMs = input.period === 'today' ? 24 * 60 * 60 * 1000 :
                       input.period === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                       input.period === 'month' ? 30 * 24 * 60 * 60 * 1000 :
                       365 * 24 * 60 * 60 * 1000;
      
      const recentContacts = contacts.filter(c => 
        (now - new Date(c.createdAt).getTime()) < periodMs
      );
      
      const recentDeals = deals.filter(d =>
        (now - new Date(d.createdAt).getTime()) < periodMs
      );
      
      // Calculate pipeline value
      const totalPipelineValue = deals
        .filter(d => !['closed_won', 'closed_lost'].includes(d.data.stage?.toLowerCase() || ''))
        .reduce((sum, deal) => sum + (deal.data.value || 0), 0);
      
      const closedDealsValue = deals
        .filter(d => d.data.stage?.toLowerCase() === 'closed_won')
        .filter(d => (now - new Date(d.createdAt).getTime()) < periodMs)
        .reduce((sum, deal) => sum + (deal.data.value || 0), 0);
      
      // Calculate growth
      const previousPeriodStart = now - (periodMs * 2);
      const previousPeriodEnd = now - periodMs;
      
      const previousContacts = contacts.filter(c => {
        const created = new Date(c.createdAt).getTime();
        return created >= previousPeriodStart && created < previousPeriodEnd;
      });
      
      const contactsGrowth = previousContacts.length > 0 
        ? ((recentContacts.length - previousContacts.length) / previousContacts.length) * 100
        : 0;
      
      const previousDeals = deals.filter(d => {
        const created = new Date(d.createdAt).getTime();
        return created >= previousPeriodStart && created < previousPeriodEnd;
      });
      
      const dealsGrowth = previousDeals.length > 0
        ? ((recentDeals.length - previousDeals.length) / previousDeals.length) * 100
        : 0;
      
      return {
        contacts: {
          total: contacts.length,
          new: recentContacts.length,
          growth: contactsGrowth
        },
        companies: {
          total: companies.length,
          new: companies.filter(c => 
            (now - new Date(c.createdAt).getTime()) < periodMs
          ).length
        },
        deals: {
          total: deals.length,
          active: deals.filter(d => 
            !['closed_won', 'closed_lost'].includes(d.data.stage?.toLowerCase() || '')
          ).length,
          new: recentDeals.length,
          growth: dealsGrowth
        },
        revenue: {
          pipeline: totalPipelineValue,
          closed: closedDealsValue,
          avgDealSize: deals.length > 0 
            ? deals.reduce((sum, d) => sum + (d.data.value || 0), 0) / deals.length
            : 0
        }
      };
    }),

  // CRM Dashboard
  getCRMDashboard: protectedProcedure
    .input(z.object({
      period: z.enum(['today', 'week', 'month']).default('week'),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get contacts, companies, and deals
      const contacts = await evercore.getContacts(workspaceId);
      const companies = await evercore.getCompanies(workspaceId);
      const deals = await evercore.getDeals(workspaceId);
      
      // Calculate metrics based on period
      const now = Date.now();
      const periodMs = input.period === 'today' ? 24 * 60 * 60 * 1000 :
                       input.period === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                       30 * 24 * 60 * 60 * 1000;
      
      const recentContacts = contacts.filter(c => 
        (now - new Date(c.createdAt).getTime()) < periodMs
      );
      
      const recentDeals = deals.filter(d =>
        (now - new Date(d.createdAt).getTime()) < periodMs
      );
      
      // Calculate pipeline value
      const totalPipelineValue = deals
        .filter(d => !['closed_won', 'closed_lost'].includes(d.data.stage?.toLowerCase()))
        .reduce((sum, deal) => sum + (deal.data.value || 0), 0);
      
      const closingThisMonth = deals
        .filter(d => {
          const closeDate = d.data.closeDate ? new Date(d.data.closeDate) : null;
          if (!closeDate) return false;
          const thisMonth = new Date();
          return closeDate.getMonth() === thisMonth.getMonth() && 
                 closeDate.getFullYear() === thisMonth.getFullYear();
        })
        .reduce((sum, deal) => sum + (deal.data.value || 0), 0);
      
      return {
        metrics: {
          totalContacts: contacts.length,
          newContacts: recentContacts.length,
          totalCompanies: companies.length,
          totalDeals: deals.length,
          newDeals: recentDeals.length,
          totalPipelineValue,
          closingThisMonth,
        },
        recentActivity: await entityService.find({
          workspaceId,
          type: ['contact', 'company', 'deal', 'email', 'calendar_event'],
          limit: 10,
          orderBy: 'createdAt',
          orderDirection: 'desc',
        }),
      };
    }),

  // Get contacts (new people-focused method)
  getContacts: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      search: z.string().optional(),
      companyId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await evercore.getContacts(workspaceId, {
        limit: input.limit,
        search: input.search,
        companyId: input.companyId,
      });
    }),
  
  // Get database contacts with user isolation
  getDBContacts: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(100),
      includeEmailImports: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        console.warn('User not found in database for contacts fetch');
        return [];
      }
      
      // Fetch contacts with user isolation
      const contacts = await entityService.find({
        workspaceId,
        userId: dbUser.id, // User isolation - only get this user's contacts
        type: 'contact',
        limit: input.limit,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      
      // Transform to CRM format
      return contacts.map((entity: any) => ({
        id: entity.id,
        name: entity.data.name || `${entity.data.firstName || ''} ${entity.data.lastName || ''}`.trim() || 'Unknown',
        email: entity.data.email || '',
        company: entity.data.companyName || entity.data.company || '',
        title: entity.data.jobTitle || entity.data.title || '',
        phone: entity.data.phone || '',
        lastContact: entity.data.lastContactedAt || entity.createdAt,
        dealValue: entity.data.dealValue || 0,
        status: entity.data.sentimentScore > 70 ? 'Hot' : entity.data.sentimentScore > 40 ? 'Warm' : 'Cold',
        source: entity.data.source || entity.data.createdFrom || 'manual',
        tags: entity.data.tags || [],
        isFromEmail: entity.data.createdFrom === 'email_sync' || entity.data.source === 'gmail_import',
        createdAt: entity.createdAt,
      }));
    }),

  // Get companies
  getCompanies: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      return await evercore.getCompanies(workspaceId, {
        limit: input.limit,
        search: input.search,
      });
    }),
  
  // Get contacts for a company
  getCompanyContacts: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get all contacts that belong to this company
      const contacts = await evercore.getContacts(workspaceId, {
        limit: input.limit
      });
      
      // Filter for contacts that belong to the company
      return contacts.filter((c: any) => 
        c.relationships?.company === input.companyId ||
        c.companyId === input.companyId
      );
    }),
    
  // Get deals for a company
  getCompanyDeals: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get all deals that belong to this company
      const deals = await evercore.getDeals(workspaceId);
      
      // Filter for deals that belong to the company
      return deals.filter((d: any) => 
        d.data?.companyId === input.companyId ||
        d.relationships?.company === input.companyId
      );
    }),
    
  // Get related entities using the relationships table
  getRelatedEntities: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      relationshipType: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Query the relationships table
      const relatedEntities = await db
        .select()
        .from(relationships)
        .where(
          and(
            eq(relationships.workspaceId, workspaceId),
            or(
              eq(relationships.sourceEntityId, input.entityId),
              eq(relationships.targetEntityId, input.entityId)
            ),
            input.relationshipType ? eq(relationships.relationshipType, input.relationshipType) : sql`true`
          )
        )
        .limit(input.limit);
        
      // Get the actual entity data for related entities
      const entityIds = relatedEntities.map(r => 
        r.sourceEntityId === input.entityId ? r.targetEntityId : r.sourceEntityId
      ).filter(Boolean);
      
      if (entityIds.length === 0) return [];
      
      const relatedEntityData = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, workspaceId),
            sql`${entities.id} = ANY(${entityIds})`
          )
        );
        
      return relatedEntityData;
    }),

  // Custom Fields endpoints
  createFieldFromNaturalLanguage: protectedProcedure
    .input(z.object({
      command: z.string(),
      entityType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import the custom fields module
      const { createFieldFromNaturalLanguage } = await import('@/lib/services/evercore/custom-fields');
      
      try {
        return await createFieldFromNaturalLanguage(
          workspaceId,
          input.command,
          ctx.userId
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create field',
        });
      }
    }),
  
  createCustomField: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      name: z.string(),
      label: z.string(),
      type: z.enum(['text', 'number', 'date', 'boolean', 'select', 'multiselect', 'url', 'email', 'phone', 'currency', 'percentage']),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
      defaultValue: z.any().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const { createCustomField } = await import('@/lib/services/evercore/custom-fields');
      
      try {
        return await createCustomField(workspaceId, input, ctx.userId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create custom field',
        });
      }
    }),
  
  getCustomFields: protectedProcedure
    .input(z.object({
      entityType: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const { getCustomFields } = await import('@/lib/services/evercore/custom-fields');
      
      try {
        return await getCustomFields(workspaceId, input.entityType);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get custom fields',
        });
      }
    }),
  
  setFieldValue: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      fieldId: z.string(),
      value: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const { setFieldValue } = await import('@/lib/services/evercore/custom-fields');
      
      try {
        await setFieldValue(
          workspaceId,
          input.entityId,
          input.fieldId,
          input.value,
          ctx.userId
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to set field value',
        });
      }
    }),
  
  deleteCustomField: protectedProcedure
    .input(z.object({
      fieldId: z.string(),
      removeData: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const { deleteCustomField } = await import('@/lib/services/evercore/custom-fields');
      
      try {
        await deleteCustomField(workspaceId, input.fieldId, input.removeData);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete field',
        });
      }
    }),
  
  suggestFields: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      existingFields: z.array(z.string()),
    }))
    .query(async ({ ctx, input }) => {
      const { suggestFields } = await import('@/lib/services/evercore/custom-fields');
      
      try {
        return await suggestFields(input.entityType, input.existingFields);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get field suggestions',
        });
      }
    }),
  
  // Pipeline Management endpoints
  getPipelines: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get all pipelines for this workspace
      const pipelines = await entityService.find({
        workspaceId,
        type: 'pipeline',
        orderBy: 'createdAt',
        orderDirection: 'asc',
      });
      
      return pipelines.map(p => ({
        id: p.id,
        name: p.data.name,
        stages: p.data.stages || [],
        isDefault: p.data.isDefault || false,
        dealCount: p.data.dealCount || 0,
        totalValue: p.data.totalValue || 0,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));
    }),
  
  createPipeline: protectedProcedure
    .input(z.object({
      name: z.string(),
      stages: z.array(z.object({
        name: z.string(),
        probability: z.number().min(0).max(100),
        rottenAfterDays: z.number().optional(),
      })),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      // If setting as default, unset other defaults
      if (input.isDefault) {
        const existingPipelines = await entityService.find({
          workspaceId,
          type: 'pipeline',
        });
        
        for (const pipeline of existingPipelines) {
          if (pipeline.data.isDefault) {
            await entityService.update(
              workspaceId,
              pipeline.id,
              { ...pipeline.data, isDefault: false }
            );
          }
        }
      }
      
      // Create the pipeline
      const pipeline = await entityService.create(
        workspaceId,
        'pipeline',
        {
          name: input.name,
          stages: input.stages.map((stage, index) => ({
            ...stage,
            order: index,
            id: `stage_${Date.now()}_${index}`,
          })),
          isDefault: input.isDefault || false,
          dealCount: 0,
          totalValue: 0,
        },
        {},
        {
          userId: dbUser?.id,
          createdBy: ctx.userId,
        }
      );
      
      // Log activity
      if (dbUser) {
        await entityService.logActivity(
          workspaceId,
          pipeline.id,
          'pipeline_created',
          {
            pipelineName: input.name,
            stageCount: input.stages.length,
          },
          {
            userId: dbUser.id,
            sourceModule: 'evercore',
          }
        );
      }
      
      return pipeline;
    }),
  
  updatePipeline: protectedProcedure
    .input(z.object({
      pipelineId: z.string().uuid(),
      name: z.string().optional(),
      stages: z.array(z.object({
        name: z.string(),
        probability: z.number().min(0).max(100),
        rottenAfterDays: z.number().optional(),
      })).optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      // Get existing pipeline
      const existing = await entityService.findById(workspaceId, input.pipelineId);
      if (!existing || existing.type !== 'pipeline') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pipeline not found',
        });
      }
      
      // If setting as default, unset other defaults
      if (input.isDefault) {
        const allPipelines = await entityService.find({
          workspaceId,
          type: 'pipeline',
        });
        
        for (const pipeline of allPipelines) {
          if (pipeline.id !== input.pipelineId && pipeline.data.isDefault) {
            await entityService.update(
              workspaceId,
              pipeline.id,
              { ...pipeline.data, isDefault: false }
            );
          }
        }
      }
      
      // Update the pipeline
      const updatedData: any = { ...existing.data };
      if (input.name !== undefined) updatedData.name = input.name;
      if (input.stages !== undefined) {
        updatedData.stages = input.stages.map((stage, index) => ({
          ...stage,
          order: index,
          id: `stage_${Date.now()}_${index}`,
        }));
      }
      if (input.isDefault !== undefined) updatedData.isDefault = input.isDefault;
      
      const updated = await entityService.update(
        workspaceId,
        input.pipelineId,
        updatedData
      );
      
      // Log activity
      if (dbUser) {
        await entityService.logActivity(
          workspaceId,
          input.pipelineId,
          'pipeline_updated',
          {
            changes: {
              name: input.name,
              stageCount: input.stages?.length,
              isDefault: input.isDefault,
            },
          },
          {
            userId: dbUser.id,
            sourceModule: 'evercore',
          }
        );
      }
      
      return updated;
    }),
  
  deletePipeline: protectedProcedure
    .input(z.object({
      pipelineId: z.string().uuid(),
      migrateDealsToPipelineId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Check if pipeline exists and has deals
      const pipeline = await entityService.findById(workspaceId, input.pipelineId);
      if (!pipeline || pipeline.type !== 'pipeline') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pipeline not found',
        });
      }
      
      // Check if it's the default pipeline
      if (pipeline.data.isDefault) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete the default pipeline. Set another pipeline as default first.',
        });
      }
      
      // Find deals in this pipeline
      const deals = await entityService.find({
        workspaceId,
        type: 'deal',
        where: { pipelineId: input.pipelineId },
      });
      
      if (deals.length > 0 && !input.migrateDealsToPipelineId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `This pipeline has ${deals.length} deals. Provide a migrateDealsToPipelineId to move them.`,
        });
      }
      
      // Migrate deals if needed
      if (deals.length > 0 && input.migrateDealsToPipelineId) {
        const targetPipeline = await entityService.findById(workspaceId, input.migrateDealsToPipelineId);
        if (!targetPipeline || targetPipeline.type !== 'pipeline') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Target pipeline not found',
          });
        }
        
        // Update all deals to new pipeline
        for (const deal of deals) {
          await entityService.update(
            workspaceId,
            deal.id,
            {
              ...deal.data,
              pipelineId: input.migrateDealsToPipelineId,
              // Reset stage to first stage of new pipeline
              stage: targetPipeline.data.stages[0]?.name || 'Lead',
            }
          );
        }
      }
      
      // Delete the pipeline
      await entityService.delete(workspaceId, input.pipelineId);
      
      return { success: true, migratedDeals: deals.length };
    }),
  
  moveDealToStage: protectedProcedure
    .input(z.object({
      dealId: z.string().uuid(),
      stage: z.string(),
      pipelineId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      // Get the deal
      const deal = await entityService.findById(workspaceId, input.dealId);
      if (!deal || deal.type !== 'deal') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }
      
      const oldStage = deal.data.stage;
      const oldPipelineId = deal.data.pipelineId;
      
      // Update deal stage and optionally pipeline
      const updatedData = {
        ...deal.data,
        stage: input.stage,
        lastStageChangeAt: new Date().toISOString(),
        stageHistory: [
          ...(deal.data.stageHistory || []),
          {
            fromStage: oldStage,
            toStage: input.stage,
            timestamp: new Date().toISOString(),
            userId: dbUser?.id,
          },
        ],
      };
      
      if (input.pipelineId) {
        updatedData.pipelineId = input.pipelineId;
      }
      
      const updated = await entityService.update(
        workspaceId,
        input.dealId,
        updatedData
      );
      
      // Log activity
      if (dbUser) {
        await entityService.logActivity(
          workspaceId,
          input.dealId,
          'deal_stage_changed',
          {
            fromStage: oldStage,
            toStage: input.stage,
            fromPipeline: oldPipelineId,
            toPipeline: input.pipelineId || oldPipelineId,
          },
          {
            userId: dbUser.id,
            sourceModule: 'evercore',
          }
        );
      }
      
      return updated;
    }),
  
  getPipelineStats: protectedProcedure
    .input(z.object({
      pipelineId: z.string().uuid(),
      dateRange: z.object({
        start: z.date(),
        end: z.date(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get pipeline
      const pipeline = await entityService.findById(workspaceId, input.pipelineId);
      if (!pipeline || pipeline.type !== 'pipeline') {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Pipeline not found',
        });
      }
      
      // Get all deals in pipeline
      const deals = await entityService.find({
        workspaceId,
        type: 'deal',
        where: { pipelineId: input.pipelineId },
      });
      
      // Calculate stats per stage
      const stageStats = (pipeline.data.stages || []).map(stage => {
        const stageDeals = deals.filter(d => d.data.stage === stage.name);
        const totalValue = stageDeals.reduce((sum, d) => sum + (d.data.value || 0), 0);
        const avgValue = stageDeals.length > 0 ? totalValue / stageDeals.length : 0;
        const avgAge = stageDeals.reduce((sum, d) => {
          const age = Date.now() - new Date(d.createdAt).getTime();
          return sum + age;
        }, 0) / (stageDeals.length || 1);
        
        return {
          stageName: stage.name,
          probability: stage.probability,
          dealCount: stageDeals.length,
          totalValue,
          avgValue,
          avgAgeDays: Math.floor(avgAge / (1000 * 60 * 60 * 24)),
          rottenDeals: stageDeals.filter(d => {
            if (!stage.rottenAfterDays) return false;
            const age = Date.now() - new Date(d.data.lastStageChangeAt || d.createdAt).getTime();
            return age > stage.rottenAfterDays * 24 * 60 * 60 * 1000;
          }).length,
        };
      });
      
      // Calculate conversion rates
      const conversionRates = [];
      for (let i = 0; i < stageStats.length - 1; i++) {
        const fromStage = stageStats[i];
        const toStage = stageStats[i + 1];
        if (fromStage.dealCount > 0) {
          conversionRates.push({
            from: fromStage.stageName,
            to: toStage.stageName,
            rate: (toStage.dealCount / fromStage.dealCount) * 100,
          });
        }
      }
      
      // Calculate velocity metrics
      const closedDeals = deals.filter(d => 
        d.data.stage === 'Closed Won' || d.data.stage === 'closed_won'
      );
      
      const avgSalesCycle = closedDeals.reduce((sum, d) => {
        const cycle = new Date(d.updatedAt).getTime() - new Date(d.createdAt).getTime();
        return sum + cycle;
      }, 0) / (closedDeals.length || 1);
      
      return {
        pipelineName: pipeline.data.name,
        totalDeals: deals.length,
        totalValue: deals.reduce((sum, d) => sum + (d.data.value || 0), 0),
        weightedValue: deals.reduce((sum, d) => {
          const stage = pipeline.data.stages.find(s => s.name === d.data.stage);
          const probability = stage?.probability || 0;
          return sum + (d.data.value || 0) * (probability / 100);
        }, 0),
        avgDealValue: deals.length > 0 
          ? deals.reduce((sum, d) => sum + (d.data.value || 0), 0) / deals.length 
          : 0,
        avgSalesCycleDays: Math.floor(avgSalesCycle / (1000 * 60 * 60 * 24)),
        winRate: deals.length > 0 
          ? (closedDeals.length / deals.length) * 100 
          : 0,
        stageStats,
        conversionRates,
      };
    }),
  
  // Activity Timeline API endpoints
  logActivity: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      type: z.string(),
      module: z.string(),
      content: z.any().optional(),
      participants: z.array(z.string()).optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      // Import activity service
      const { activityService } = await import('@/lib/services/activity-service');
      
      try {
        return await activityService.logActivity(
          workspaceId,
          input.entityId,
          input.type,
          input.module,
          input.content,
          {
            userId: dbUser?.id,
            participants: input.participants,
            metadata: input.metadata,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to log activity',
        });
      }
    }),
  
  getEntityActivities: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      types: z.array(z.string()).optional(),
      modules: z.array(z.string()).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import activity service
      const { activityService } = await import('@/lib/services/activity-service');
      
      try {
        return await activityService.getEntityTimeline(
          workspaceId,
          input.entityId,
          {
            types: input.types,
            modules: input.modules,
            startDate: input.startDate,
            endDate: input.endDate,
            limit: input.limit,
            offset: input.offset,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get activities',
        });
      }
    }),
  
  getGlobalActivityTimeline: protectedProcedure
    .input(z.object({
      types: z.array(z.string()).optional(),
      modules: z.array(z.string()).optional(),
      entities: z.array(z.string()).optional(),
      users: z.array(z.string()).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import activity service
      const { activityService } = await import('@/lib/services/activity-service');
      
      try {
        return await activityService.getGlobalTimeline(
          workspaceId,
          {
            types: input.types,
            modules: input.modules,
            entities: input.entities,
            users: input.users,
            startDate: input.startDate,
            endDate: input.endDate,
            limit: input.limit,
            offset: input.offset,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get global timeline',
        });
      }
    }),
  
  getActivityInsights: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid().optional(),
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Import activity service
      const { activityService } = await import('@/lib/services/activity-service');
      
      try {
        const summary = await activityService.getActivitySummary(
          workspaceId,
          input.entityId,
          input.days
        );
        
        // Add additional insights
        const insights = {
          ...summary,
          topActivityTypes: Object.entries(summary.byType)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count })),
          topModules: Object.entries(summary.byModule)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([module, count]) => ({ module, count })),
        };
        
        return insights;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get activity insights',
        });
      }
    }),
  
  bulkLogActivities: protectedProcedure
    .input(z.object({
      activities: z.array(z.object({
        entityId: z.string().uuid(),
        type: z.string(),
        module: z.string(),
        content: z.any().optional(),
        participants: z.array(z.string()).optional(),
        metadata: z.record(z.any()).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user ID
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      // Import activity service
      const { activityService } = await import('@/lib/services/activity-service');
      
      try {
        const activitiesWithUser = input.activities.map(activity => ({
          ...activity,
          userId: dbUser?.id,
        }));
        
        return await activityService.bulkLogActivities(
          workspaceId,
          activitiesWithUser
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to log activities',
        });
      }
    }),
  
  // Relationship management endpoints
  createRelationship: protectedProcedure
    .input(z.object({
      sourceEntityId: z.string().uuid(),
      targetEntityId: z.string().uuid(),
      relationshipType: z.string(),
      strengthScore: z.number().min(0).max(100).optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      try {
        return await entityService.createRelationship(
          workspaceId,
          input.sourceEntityId,
          input.targetEntityId,
          input.relationshipType,
          {
            strengthScore: input.strengthScore,
            metadata: input.metadata,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create relationship',
        });
      }
    }),
  
  getEntityRelationships: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      type: z.string().optional(),
      direction: z.enum(['source', 'target', 'both']).default('both'),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      try {
        return await entityService.getRelationships(
          workspaceId,
          input.entityId,
          {
            type: input.type,
            direction: input.direction,
          }
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get relationships',
        });
      }
    }),
  
  generateFieldReport: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      fieldId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const { generateFieldReport } = await import('@/lib/services/evercore/custom-fields');
      
      try {
        return await generateFieldReport(workspaceId, input.entityType, input.fieldId);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate report',
        });
      }
    }),

  // Analytics
  getEntityStats: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get counts by type
      const types = ['contact', 'company', 'deal', 'message', 'conversation', 'task', 'email', 'calendar_event', 'invoice'];
      const stats: Record<string, number> = {};
      
      for (const type of types) {
        const count = await entityService.count({
          workspaceId,
          type,
        });
        stats[type] = count;
      }
      
      // Get recent activity
      const recentEntities = await entityService.find({
        workspaceId,
        limit: 10,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      
      return {
        counts: stats,
        totalEntities: Object.values(stats).reduce((a, b) => a + b, 0),
        recentActivity: recentEntities,
      };
    }),
});