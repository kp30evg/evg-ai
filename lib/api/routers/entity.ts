import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { entities, type NewEntity } from '@/lib/db';
import { eq, and, ilike, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const entityRouter = router({
  create: protectedProcedure
    .input(z.object({
      type: z.string(),
      data: z.any(),
      metadata: z.any().optional(),
      relationships: z.array(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [entity] = await ctx.db.insert(entities).values({
        companyId: ctx.company!.id,
        type: input.type,
        data: input.data,
        metadata: input.metadata || {},
        relationships: input.relationships || [],
        createdBy: ctx.user!.id,
      }).returning();

      return entity;
    }),

  get: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const entity = await ctx.db.query.entities.findFirst({
        where: and(
          eq(entities.id, input.id),
          eq(entities.companyId, ctx.company!.id)
        ),
      });

      if (!entity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entity not found',
        });
      }

      return entity;
    }),

  list: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(entities.companyId, ctx.company!.id),
      ];

      if (input.type) {
        conditions.push(eq(entities.type, input.type));
      }

      const results = await ctx.db.query.entities.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset: input.offset,
        orderBy: (entities, { desc }) => [desc(entities.createdAt)],
      });

      return results;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.any().optional(),
      metadata: z.any().optional(),
      relationships: z.array(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Partial<NewEntity> = {
        updatedAt: new Date(),
      };

      if (input.data !== undefined) updateData.data = input.data;
      if (input.metadata !== undefined) updateData.metadata = input.metadata;
      if (input.relationships !== undefined) updateData.relationships = input.relationships;

      const [entity] = await ctx.db
        .update(entities)
        .set(updateData)
        .where(and(
          eq(entities.id, input.id),
          eq(entities.companyId, ctx.company!.id)
        ))
        .returning();

      if (!entity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entity not found',
        });
      }

      return entity;
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [entity] = await ctx.db
        .update(entities)
        .set({ 
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(entities.id, input.id),
          eq(entities.companyId, ctx.company!.id)
        ))
        .returning();

      if (!entity) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Entity not found',
        });
      }

      return { success: true };
    }),

  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      types: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const searchPattern = `%${input.query}%`;
      
      const conditions = [
        eq(entities.companyId, ctx.company!.id),
      ];

      // Search in JSONB data
      const searchConditions = or(
        ilike(entities.searchVector, searchPattern),
      );

      if (searchConditions) {
        conditions.push(searchConditions);
      }

      if (input.types && input.types.length > 0) {
        conditions.push(or(...input.types.map(type => eq(entities.type, type))));
      }

      const results = await ctx.db.query.entities.findMany({
        where: and(...conditions),
        limit: input.limit,
        orderBy: (entities, { desc }) => [desc(entities.updatedAt)],
      });

      return results;
    }),
});