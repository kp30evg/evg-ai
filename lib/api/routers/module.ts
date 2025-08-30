import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { modules } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export const moduleRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const installedModules = await ctx.db.query.modules.findMany({
        where: eq(modules.companyId, ctx.company!.id),
        orderBy: (modules, { asc }) => [asc(modules.name)],
      });

      return installedModules;
    }),

  enable: protectedProcedure
    .input(z.object({
      moduleId: z.string().uuid(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(modules)
        .set({ enabled: input.enabled })
        .where(and(
          eq(modules.id, input.moduleId),
          eq(modules.companyId, ctx.company!.id)
        ))
        .returning();

      return updated;
    }),
});