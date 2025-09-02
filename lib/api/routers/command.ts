import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { commandProcessor } from '@/lib/ai/command-processor';
import { clerkClient } from '@clerk/nextjs/server';

export const commandRouter = router({
  execute: protectedProcedure
    .input(z.object({
      input: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user details from Clerk
      let userName = 'User';
      let userImage = null;
      
      try {
        const user = await clerkClient.users.getUser(ctx.userId);
        userName = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`.trim() 
          : user.firstName || user.emailAddresses?.[0]?.emailAddress || 'User';
        userImage = user.imageUrl || null;
      } catch (error) {
        console.error('Error fetching user from Clerk:', error);
      }
      
      // Use Clerk IDs directly with proper user info
      const result = await commandProcessor.process(input.input, {
        companyId: ctx.orgId,
        userId: ctx.userId,
        company: ctx.company || { id: ctx.orgId, name: 'Organization' },
        user: { 
          id: ctx.userId, 
          name: userName, 
          image: userImage,
          firstName: ctx.user?.firstName,
          lastName: ctx.user?.lastName,
          email: ctx.user?.emailAddresses?.[0]?.emailAddress
        },
        db: ctx.db,
        trpc: ctx // Pass the context for calling other routers
      });

      return result;
    }),

  history: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Query command history - for now return empty array since table might not exist
      return [];
    }),
});