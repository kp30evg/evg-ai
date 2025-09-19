/**
 * Entity Types API Router
 * Handles all dynamic entity type operations server-side
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { entityService } from '@/lib/entities/entity-service';
import { workspaceService } from '@/lib/services/workspace-service';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema/unified';
import { eq } from 'drizzle-orm';

// Import types from entity-types (these don't cause database initialization)
import type { DynamicEntity } from '@/lib/services/workspace/entity-types';
import type { EntityTypeDefinition } from '@/lib/services/workspace/workspace-config';

export const entityTypesRouter = router({
  // Create a dynamic entity
  createEntity: protectedProcedure
    .input(z.object({
      entityTypeName: z.string(),
      data: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database',
        });
      }

      try {
        // Create the entity with proper user isolation
        const entity = await entityService.create(
          workspaceId,
          input.entityTypeName,
          input.data,
          {},
          { 
            createdBy: ctx.userId,
            userId: dbUser.id // Critical for user isolation
          }
        );

        const dynamicEntity: DynamicEntity = {
          id: entity.id,
          type: input.entityTypeName,
          workspaceId,
          userId: dbUser.id,
          data: entity.data as Record<string, any>,
          relationships: entity.relationships as Record<string, any>,
          metadata: entity.metadata as Record<string, any>,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        };

        return dynamicEntity;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create entity',
        });
      }
    }),

  // Update a dynamic entity
  updateEntity: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      entityTypeName: z.string(),
      updates: z.record(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database',
        });
      }

      try {
        const entity = await entityService.update(
          workspaceId,
          input.entityId,
          input.updates,
          {},
          { 
            updatedBy: ctx.userId,
            userId: dbUser.id
          }
        );

        const dynamicEntity: DynamicEntity = {
          id: entity.id,
          type: input.entityTypeName,
          workspaceId,
          userId: dbUser.id,
          data: entity.data as Record<string, any>,
          relationships: entity.relationships as Record<string, any>,
          metadata: entity.metadata as Record<string, any>,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        };

        return dynamicEntity;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update entity',
        });
      }
    }),

  // Delete a dynamic entity
  deleteEntity: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      entityTypeName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      // Get database user for permission check
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database',
        });
      }

      try {
        await entityService.delete(
          workspaceId,
          input.entityId,
          { 
            deletedBy: ctx.userId,
            userId: dbUser.id
          }
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete entity',
        });
      }
    }),

  // Get entities of a specific type
  getEntities: protectedProcedure
    .input(z.object({
      entityTypeName: z.string(),
      filters: z.record(z.any()).optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
      orderBy: z.string().optional(),
      orderDirection: z.enum(['asc', 'desc']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      // Get database user for filtering
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database',
        });
      }

      try {
        const entities = await entityService.find({
          workspaceId,
          type: input.entityTypeName,
          filters: input.filters,
          search: input.search,
          limit: input.limit || 100,
          offset: input.offset,
          orderBy: input.orderBy,
          orderDirection: input.orderDirection,
          userId: dbUser.id // Critical for user data isolation
        });

        const dynamicEntities: DynamicEntity[] = entities.map(entity => ({
          id: entity.id,
          type: input.entityTypeName,
          workspaceId,
          userId: entity.metadata?.userId as string,
          data: entity.data as Record<string, any>,
          relationships: entity.relationships as Record<string, any>,
          metadata: entity.metadata as Record<string, any>,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        }));

        return dynamicEntities;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch entities',
        });
      }
    }),

  // Link two entities
  linkEntities: protectedProcedure
    .input(z.object({
      fromType: z.string(),
      fromId: z.string(),
      toType: z.string(),
      toId: z.string(),
      relationshipType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      try {
        // Get the source entity
        const sourceEntity = await entityService.findById(workspaceId, input.fromId);
        if (!sourceEntity) {
          throw new Error('Source entity not found');
        }

        // Update relationships
        const relationships = sourceEntity.relationships || [];
        relationships.push({
          type: input.relationshipType,
          targetType: input.toType,
          targetId: input.toId,
          createdAt: new Date(),
        });

        await entityService.update(
          workspaceId,
          input.fromId,
          sourceEntity.data,
          relationships,
          { updatedBy: ctx.userId }
        );

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to link entities',
        });
      }
    }),

  // Unlink two entities
  unlinkEntities: protectedProcedure
    .input(z.object({
      fromType: z.string(),
      fromId: z.string(),
      toType: z.string(),
      toId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      try {
        // Get the source entity
        const sourceEntity = await entityService.findById(workspaceId, input.fromId);
        if (!sourceEntity) {
          throw new Error('Source entity not found');
        }

        // Remove the relationship
        const relationships = (sourceEntity.relationships || []).filter((rel: any) =>
          !(rel.targetType === input.toType && rel.targetId === input.toId)
        );

        await entityService.update(
          workspaceId,
          input.fromId,
          sourceEntity.data,
          relationships,
          { updatedBy: ctx.userId }
        );

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to unlink entities',
        });
      }
    }),

  // Get a single entity by ID
  getEntity: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      entityTypeName: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(
        ctx.orgId,
        `Workspace ${ctx.orgId}`
      );

      // Get database user
      const [dbUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, ctx.userId))
        .limit(1);
      
      if (!dbUser) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found in database',
        });
      }

      try {
        const entity = await entityService.findById(workspaceId, input.entityId);
        
        if (!entity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Entity not found',
          });
        }

        // Check if user has access to this entity
        if (entity.metadata?.userId && entity.metadata.userId !== dbUser.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied to this entity',
          });
        }

        const dynamicEntity: DynamicEntity = {
          id: entity.id,
          type: input.entityTypeName,
          workspaceId,
          userId: entity.metadata?.userId as string,
          data: entity.data as Record<string, any>,
          relationships: entity.relationships as Record<string, any>,
          metadata: entity.metadata as Record<string, any>,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        };

        return dynamicEntity;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch entity',
        });
      }
    }),
});