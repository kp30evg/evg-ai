/**
 * EverCore API Router
 * CRM-specific endpoints for managing leads, contacts, companies, and deals
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { entityService } from '@/lib/entities/entity-service';
import { workspaceService } from '@/lib/services/workspace-service';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

export const evercoreRouter = router({
  // Get all leads
  getLeads: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      const leads = await entityService.find({
        workspaceId,
        type: 'lead',
        userId: dbUser?.id,
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 1000
      });
      
      return leads;
    }),

  // Create a new lead
  createLead: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      title: z.string().optional(),
      source: z.string().optional(),
      score: z.number().optional(),
      status: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found. Please sync users first.',
        });
      }
      
      const lead = await entityService.create(
        workspaceId,
        'lead',
        {
          ...input,
          status: input.status || 'new',
          score: input.score || 0,
          source: input.source || 'direct',
        },
        {},
        { userId: dbUser.id }
      );
      
      return lead;
    }),

  // Get all contacts
  getContacts: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      const contacts = await entityService.find({
        workspaceId,
        type: 'contact',
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 1000
      });
      
      return contacts;
    }),

  // Create a new contact
  createContact: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      companyId: z.string().optional(),
      title: z.string().optional(),
      department: z.string().optional(),
      status: z.string().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found. Please sync users first.',
        });
      }
      
      const contact = await entityService.create(
        workspaceId,
        'contact',
        {
          ...input,
          status: input.status || 'cold',
        },
        {},
        { userId: dbUser.id }
      );
      
      return contact;
    }),

  // Get all companies
  getCompanies: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const companies = await entityService.find({
        workspaceId,
        type: 'company',
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 1000
      });
      
      return companies;
    }),

  // Create a new company
  createCompany: protectedProcedure
    .input(z.object({
      name: z.string(),
      domain: z.string().optional(),
      industry: z.string().optional(),
      size: z.string().optional(),
      revenue: z.number().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found. Please sync users first.',
        });
      }
      
      const company = await entityService.create(
        workspaceId,
        'company',
        input,
        {},
        { userId: dbUser.id }
      );
      
      return company;
    }),

  // Get all deals
  getDeals: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const deals = await entityService.find({
        workspaceId,
        type: 'deal',
        orderBy: 'createdAt',
        orderDirection: 'desc',
        limit: 1000
      });
      
      return deals;
    }),

  // Create a new deal
  createDeal: protectedProcedure
    .input(z.object({
      name: z.string(),
      value: z.number(),
      stage: z.string(),
      companyId: z.string().optional(),
      company: z.string().optional(),
      contactId: z.string().optional(),
      contact: z.string().optional(),
      closeDate: z.string().optional(),
      probability: z.number().optional(),
      priority: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found. Please sync users first.',
        });
      }
      
      const deal = await entityService.create(
        workspaceId,
        'deal',
        {
          ...input,
          stage: input.stage || 'qualification',
          probability: input.probability || 25,
          priority: input.priority || 'medium',
        },
        {},
        { userId: dbUser.id }
      );
      
      return deal;
    }),

  // Update a lead
  updateLead: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const updated = await entityService.update(
        workspaceId,
        input.id,
        input.data
      );
      
      return updated;
    }),

  // Update a contact
  updateContact: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const updated = await entityService.update(
        workspaceId,
        input.id,
        input.data
      );
      
      return updated;
    }),

  // Update a company
  updateCompany: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const updated = await entityService.update(
        workspaceId,
        input.id,
        input.data
      );
      
      return updated;
    }),

  // Update a deal
  updateDeal: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      const updated = await entityService.update(
        workspaceId,
        input.id,
        input.data
      );
      
      return updated;
    }),

  // Delete leads
  deleteLeads: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      for (const id of input.ids) {
        await entityService.delete(workspaceId, id);
      }
      
      return { success: true, deleted: input.ids.length };
    }),

  // Delete contacts
  deleteContacts: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      for (const id of input.ids) {
        await entityService.delete(workspaceId, id);
      }
      
      return { success: true, deleted: input.ids.length };
    }),

  // Delete companies
  deleteCompanies: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      for (const id of input.ids) {
        await entityService.delete(workspaceId, id);
      }
      
      return { success: true, deleted: input.ids.length };
    }),

  // Delete deals
  deleteDeals: protectedProcedure
    .input(z.object({
      ids: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(ctx.orgId, `Workspace ${ctx.orgId}`);
      
      for (const id of input.ids) {
        await entityService.delete(workspaceId, id);
      }
      
      return { success: true, deleted: input.ids.length };
    }),
});