import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { commandProcessor } from '@/lib/ai/command-processor';

export const commandRouter = router({
  execute: protectedProcedure
    .input(z.object({
      input: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await commandProcessor.process(input.input, {
        companyId: ctx.company!.id,
        userId: ctx.user!.id,
        company: ctx.company!,
        user: ctx.user!,
      });

      return result;
    }),

  history: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const history = await ctx.db.query.commandHistory.findMany({
        where: (commandHistory, { eq }) => eq(commandHistory.companyId, ctx.company!.id),
        limit: input.limit,
        offset: input.offset,
        orderBy: (commandHistory, { desc }) => [desc(commandHistory.createdAt)],
      });

      return history;
    }),
});