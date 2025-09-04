/**
 * OAuth Router
 * Handles OAuth connection status checks for Google services
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { workspaceService } from '@/lib/services/workspace-service';
import { checkOAuthConnections } from '@/lib/services/oauth-check';
import { TRPCError } from '@trpc/server';

export const oauthRouter = router({
  // Check if user has connected OAuth for a specific service
  checkConnection: protectedProcedure
    .input(z.object({
      service: z.enum(['gmail', 'calendar'])
    }))
    .query(async ({ ctx, input }) => {
      try {
        const workspaceId = await workspaceService.getWorkspaceIdFromClerkOrg(ctx.orgId);
        
        if (!workspaceId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Workspace not found'
          });
        }

        const oauthStatus = await checkOAuthConnections(workspaceId, ctx.userId);
        
        if (input.service === 'gmail') {
          return {
            connected: oauthStatus.hasGmailConnection,
            userEmail: oauthStatus.gmailEmail,
            lastSyncedAt: oauthStatus.lastSyncedAt
          };
        } else {
          return {
            connected: oauthStatus.hasCalendarConnection,
            userEmail: oauthStatus.calendarEmail,
            lastSyncedAt: oauthStatus.lastSyncedAt
          };
        }
      } catch (error) {
        console.error('Error checking OAuth connection:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check OAuth connection status'
        });
      }
    }),

  // Get OAuth status for all services
  getAllConnections: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const workspaceId = await workspaceService.getWorkspaceIdFromClerkOrg(ctx.orgId);
        
        if (!workspaceId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Workspace not found'
          });
        }

        const oauthStatus = await checkOAuthConnections(workspaceId, ctx.userId);
        
        return {
          gmail: {
            connected: oauthStatus.hasGmailConnection,
            email: oauthStatus.gmailEmail,
            lastSyncedAt: oauthStatus.lastSyncedAt
          },
          calendar: {
            connected: oauthStatus.hasCalendarConnection,
            email: oauthStatus.calendarEmail
          }
        };
      } catch (error) {
        console.error('Error getting OAuth connections:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get OAuth connections'
        });
      }
    }),

  // Disconnect OAuth service
  disconnect: protectedProcedure
    .input(z.object({
      service: z.enum(['gmail', 'calendar'])
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const workspaceId = await workspaceService.getWorkspaceIdFromClerkOrg(ctx.orgId);
        
        if (!workspaceId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Workspace not found'
          });
        }

        // Get database user
        const { db } = await import('@/lib/db');
        const { users, entities } = await import('@/lib/db/schema/unified');
        const { eq, and } = await import('drizzle-orm');

        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, ctx.userId))
          .limit(1);

        if (!dbUser) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found'
          });
        }

        // Delete the OAuth account entity
        const accountType = input.service === 'gmail' ? 'email_account' : 'calendar_account';
        
        await db
          .delete(entities)
          .where(
            and(
              eq(entities.workspaceId, workspaceId),
              eq(entities.userId, dbUser.id),
              eq(entities.type, accountType)
            )
          );

        return {
          success: true,
          message: `${input.service} disconnected successfully`
        };
      } catch (error) {
        console.error('Error disconnecting OAuth:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to disconnect OAuth service'
        });
      }
    })
});