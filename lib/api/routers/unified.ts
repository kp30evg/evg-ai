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

// Helper to create a deterministic UUID from any string ID
function stringToUuid(str: string): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(str).digest('hex');
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32)
  ].join('-');
}

export const unifiedRouter = router({
  // Execute natural language command
  executeCommand: protectedProcedure
    .input(z.object({
      command: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = stringToUuid(ctx.orgId); // Convert orgId to UUID format
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

  // Direct entity operations
  createEntity: protectedProcedure
    .input(z.object({
      type: z.string(),
      data: z.any(),
      relationships: z.record(z.any()).optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
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
      const workspaceId = stringToUuid(ctx.orgId);
      
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
      const workspaceId = stringToUuid(ctx.orgId);
      
      return await everchat.getConversations(workspaceId, input.limit);
    }),

  // CRM-specific operations
  createCustomer: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = stringToUuid(ctx.orgId);
      const userId = ctx.userId;
      
      return await evercore.createCustomer(workspaceId, input, userId);
    }),

  createDeal: protectedProcedure
    .input(z.object({
      name: z.string(),
      value: z.number(),
      stage: z.string(),
      customerId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = stringToUuid(ctx.orgId);
      const userId = ctx.userId;
      
      return await evercore.createDeal(workspaceId, input, userId);
    }),

  getCustomers: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = stringToUuid(ctx.orgId);
      
      return await evercore.getCustomers(workspaceId);
    }),

  getDeals: protectedProcedure
    .input(z.object({
      stage: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = stringToUuid(ctx.orgId);
      
      return await evercore.getDeals(workspaceId, input.stage);
    }),

  getCustomerInsights: protectedProcedure
    .input(z.object({
      customerId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = stringToUuid(ctx.orgId);
      
      return await evercore.getCustomerInsights(workspaceId, input.customerId);
    }),

  // Analytics
  getEntityStats: protectedProcedure
    .query(async ({ ctx }) => {
      const workspaceId = stringToUuid(ctx.orgId);
      
      // Get counts by type
      const types = ['customer', 'deal', 'message', 'conversation', 'task', 'email', 'invoice'];
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