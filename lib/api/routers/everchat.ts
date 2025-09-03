import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import * as everchat from '@/lib/modules-simple/everchat';
import { processCommand } from '@/lib/modules-simple/command-processor';
import { TRPCError } from '@trpc/server';
import { pusher, channels, events } from '@/lib/pusher';
import { workspaces } from '@/lib/db/schema/unified';

export const everchatRouter = router({
  // Execute natural language command
  executeCommand: protectedProcedure
    .input(z.object({
      command: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Workspace not found',
        });
      }
      const workspaceId = ctx.workspace.id;
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

  // Send a message
  sendMessage: protectedProcedure
    .input(z.object({
      content: z.string().min(1),
      conversationId: z.string().uuid().optional(),
      channelId: z.string().optional(), // Add support for non-UUID channel IDs
    }))
    .mutation(async ({ ctx, input }) => {
      // Get or create workspace for this org
      let workspaceId: string;
      if (ctx.workspace) {
        workspaceId = ctx.workspace.id;
      } else {
        // Create workspace if it doesn't exist
        const { db } = ctx;
        const [newWorkspace] = await db.insert(workspaces).values({
          clerkOrgId: ctx.orgId,
          name: 'Default Workspace',
        }).returning();
        workspaceId = newWorkspace.id;
      }
      const userId = ctx.userId;
      
      // Get user info from context
      let userName = 'User';
      let userImage: string | undefined;
      if (ctx.user) {
        userName = ctx.user.name || ctx.user.email || userId || 'User';
        userImage = ctx.user.imageUrl || undefined;
      } else {
        // Fallback to userId if no user in context
        userName = userId || 'User';
      }
      
      try {
        // For non-UUID channels (like "general", "sales"), create/find conversation
        let conversationId = input.conversationId;
        
        if (!conversationId && input.channelId) {
          // Check if a conversation exists for this channel
          const existingConversations = await everchat.getConversations(workspaceId, 100);
          const channelConversation = existingConversations.find(
            (conv: any) => conv.data?.channel === input.channelId || conv.data?.title === `#${input.channelId}`
          );
          
          if (channelConversation) {
            conversationId = channelConversation.id;
          } else {
            // Create a new conversation for this channel
            const newConversation = await everchat.createConversation(
              workspaceId,
              `#${input.channelId}`,
              [],
              userId
            );
            conversationId = newConversation.id;
          }
        }
        
        const message = await everchat.sendMessage(
          workspaceId,
          input.content,
          conversationId,
          userId,
          userName,
          userImage
        );
        
        // Broadcast to Pusher for real-time updates
        const channelName = conversationId 
          ? channels.getConversationChannel(workspaceId, conversationId)
          : channels.getCompanyChannel(workspaceId);
        
        await pusher.trigger(channelName, events.MESSAGE_SENT, {
          message,
          timestamp: new Date().toISOString(),
        });
        
        return message;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send message',
        });
      }
    }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid().optional(),
      channelId: z.string().optional(), // Support both channelId and conversationId
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        return []; // No workspace, no messages
      }
      const workspaceId = ctx.workspace.id;
      
      try {
        let conversationId = input.conversationId;
        
        // If channelId is provided instead of conversationId, find the conversation
        if (!conversationId && input.channelId) {
          const existingConversations = await everchat.getConversations(workspaceId, 100);
          const channelConversation = existingConversations.find(
            (conv: any) => conv.data?.channel === input.channelId || conv.data?.title === `#${input.channelId}`
          );
          
          if (channelConversation) {
            conversationId = channelConversation.id;
          } else {
            // If conversation doesn't exist for this channel, return empty array
            return [];
          }
        }
        
        if (!conversationId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Either conversationId or channelId must be provided',
          });
        }
        
        return await everchat.getMessages(
          workspaceId,
          conversationId,
          input.limit
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get messages',
        });
      }
    }),

  // Get all conversations
  getConversations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        return [];
      }
      const workspaceId = ctx.workspace.id;
      
      try {
        return await everchat.getConversations(workspaceId, input.limit);
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get conversations',
        });
      }
    }),

  // Create a new conversation
  createConversation: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      participants: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Workspace not found',
        });
      }
      const workspaceId = ctx.workspace.id;
      const userId = ctx.userId;
      
      try {
        const conversation = await everchat.createConversation(
          workspaceId,
          input.title,
          input.participants,
          userId
        );
        
        return conversation;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create conversation',
        });
      }
    }),

  // Search messages
  searchMessages: protectedProcedure
    .input(z.object({
      query: z.string().min(1),
      conversationId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        return [];
      }
      const workspaceId = ctx.workspace.id;
      
      try {
        return await everchat.searchMessages(
          workspaceId,
          input.query,
          input.conversationId,
          input.limit
        );
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to search messages',
        });
      }
    }),

  // Handle natural language chat command
  handleChatCommand: protectedProcedure
    .input(z.object({
      command: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Workspace not found',
        });
      }
      const workspaceId = ctx.workspace.id;
      const userId = ctx.userId;
      
      try {
        const result = await everchat.handleChatCommand(workspaceId, input.command, userId);
        
        if (result.error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
          });
        }
        
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to handle chat command',
        });
      }
    }),
});