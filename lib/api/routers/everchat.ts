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
      // Ensure workspace exists
      if (!ctx.workspace) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Workspace not found',
        });
      }
      const workspaceId = ctx.workspace.id;
      const clerkUserId = ctx.userId; // This is the Clerk user ID
      const dbUserId = ctx.user?.id; // This is the database user ID (UUID)
      
      // Get user info from context
      let userName = 'User';
      let userImage: string | undefined;
      
      if (ctx.user) {
        userName = ctx.user.name || ctx.user.email || 'User';
        userImage = ctx.user.imageUrl || undefined;
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
              clerkUserId  // Use Clerk user ID for metadata
            );
            conversationId = newConversation.id;
          }
        }
        
        if (!conversationId) {
          throw new Error('No conversation ID provided and could not create one');
        }
        
        console.log('Sending message:', {
          workspaceId,
          conversationId,
          clerkUserId: clerkUserId,
          dbUserId: dbUserId,
          content: input.content.substring(0, 50)
        });
        
        const message = await everchat.sendMessage(
          workspaceId,
          input.content,
          conversationId,
          dbUserId || undefined,  // Use database user ID for user_id field
          clerkUserId,  // Pass Clerk ID for metadata
          userName,
          userImage
        );
        
        // Broadcast to Pusher for real-time updates if configured
        if (pusher) {
          try {
            // Use Clerk org ID for Pusher channels, not workspace ID
            const clerkOrgId = ctx.orgId;
            const channelName = input.channelId 
              ? channels.channel(clerkOrgId, input.channelId)
              : `private-org-${clerkOrgId}-conversation-${conversationId}`;
            
            await pusher.trigger(channelName, events.MESSAGE_NEW, {
              id: message.id,
              text: message.data.content,
              userId: message.data.from || message.data.userId,
              userName: message.data.userName,
              userImage: message.data.userImage,
              timestamp: new Date().toISOString(),
              channelId: conversationId,
            });
            console.log('Message broadcast to channel:', channelName);
          } catch (error) {
            console.log('Pusher not configured or failed:', error);
            // Continue without real-time updates
          }
        }
        
        return message;
      } catch (error) {
        console.error('Failed to send message:', error);
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
      const clerkUserId = ctx.userId;
      const dbUserId = ctx.user?.id;
      
      try {
        const conversation = await everchat.createConversation(
          workspaceId,
          input.title,
          input.participants,
          clerkUserId,  // Use Clerk ID for metadata
          dbUserId  // Database user ID for user_id field
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
      const clerkUserId = ctx.userId;
      const dbUserId = ctx.user?.id;
      
      try {
        const result = await everchat.handleChatCommand(workspaceId, input.command, clerkUserId, dbUserId);
        
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