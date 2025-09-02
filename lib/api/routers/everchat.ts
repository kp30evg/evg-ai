import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
import { pusher, channels, events } from '@/lib/pusher';
import { createHash } from 'crypto';

// Helper to create a deterministic UUID from any string ID
function stringToUuid(str: string): string {
  // Create a deterministic UUID v5 namespace from the string
  const hash = createHash('sha256').update(str).digest('hex');
  // Format as UUID v4 (for compatibility)
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '4' + hash.substring(13, 16), // Version 4
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20), // Variant bits
    hash.substring(20, 32)
  ].join('-');
}

export const everchatRouter = router({
  // Get conversations (channels and DMs)
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const { orgId, userId } = ctx;
    const companyId = stringToUuid(orgId);

    // Get all channels and DMs for this organization
    const conversations = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.companyId, companyId),
          or(
            eq(entities.type, 'channel'),
            eq(entities.type, 'dm')
          )
        )
      )
      .orderBy(desc(entities.updatedAt));

    return conversations;
  }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      limit: z.number().optional().default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { orgId } = ctx;
      const companyId = stringToUuid(orgId);

      const allMessages = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'message')
          )
        )
        .orderBy(desc(entities.createdAt))
        .limit(input.limit * 2); // Get more to filter

      // Filter messages for the specific channel
      const messages = allMessages.filter(msg => 
        (msg.data as any).channelId === input.channelId
      ).slice(0, input.limit);

      return messages.reverse(); // Return in chronological order
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      text: z.string(),
      threadId: z.string().optional(),
      mentions: z.array(z.string()).optional(),
      attachments: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const companyId = stringToUuid(orgId);
      const userUuid = stringToUuid(userId);

      // Check if it's an AI command
      const isAiCommand = input.text.startsWith('@evergreen');

      // Create message entity
      const [message] = await db.insert(entities).values({
        companyId: companyId,
        type: 'message',
        data: {
          channelId: input.channelId,
          text: input.text,
          userId,
          userName: 'User', // Simplified for now
          userImage: null,
          threadId: input.threadId,
          mentions: input.mentions || [],
          attachments: input.attachments || [],
          aiCommand: isAiCommand,
          timestamp: new Date()
        },
        createdBy: userUuid,
        metadata: {}
      }).returning();

      // Determine the channel to broadcast to
      let channelName: string;
      if (input.channelId === 'general') {
        channelName = channels.orgGeneral(orgId);
      } else if (input.channelId.startsWith('dm-')) {
        // Extract participants from DM ID
        const participants = input.channelId.replace('dm-', '').split('-');
        channelName = channels.dm(orgId, participants[0], participants[1]);
      } else {
        // Regular channel
        channelName = channels.channel(orgId, input.channelId);
      }

      // Broadcast via Pusher if configured
      if (pusher) {
        await pusher.trigger(
          channelName,
          events.MESSAGE_NEW,
          {
            id: message.id,
            ...message.data
          }
        );
        
        // Also broadcast to general channel for notifications
        if (input.channelId !== 'general') {
          await pusher.trigger(
            channels.orgGeneral(orgId),
            events.MESSAGE_NEW,
            {
              id: message.id,
              ...message.data,
              isNotification: true
            }
          );
        }
      }

      // Process AI command if needed
      if (isAiCommand) {
        // TODO: Process with OpenAI and return response
        const command = input.text.replace('@evergreen', '').trim();
        
        // For now, return a mock response
        setTimeout(async () => {
          const [aiResponse] = await db.insert(entities).values({
            companyId: companyId,
            type: 'message',
            data: {
              channelId: input.channelId,
              text: `Processing command: "${command}"...`,
              userId: 'evergreen-ai',
              userName: 'evergreenOS AI',
              userImage: '/evergreen-icon.svg',
              threadId: message.id,
              commandResult: true,
              timestamp: new Date()
            },
            createdBy: stringToUuid('system'),
            metadata: {}
          }).returning();

          if (pusher) {
            await pusher.trigger(
              channelName,
              events.MESSAGE_NEW,
              {
                id: aiResponse.id,
                ...aiResponse.data
              }
            );
          }
        }, 1000);
      }

      return message;
    }),

  // Create or get a DM channel
  createOrGetDM: protectedProcedure
    .input(z.object({
      recipientId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const companyId = stringToUuid(orgId);
      const userUuid = stringToUuid(userId);

      // Create a sorted channel ID for consistent DM identification
      const participants = [userId, input.recipientId].sort();
      const dmId = `dm-${participants.join('-')}`;

      // Check if DM already exists
      const existingDMs = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'dm')
          )
        );
      
      const existingDM = existingDMs.filter(dm => 
        (dm.data as any).dmId === dmId
      );

      if (existingDM.length > 0) {
        return existingDM[0];
      }

      // Create new DM
      const [dm] = await db.insert(entities).values({
        companyId: companyId,
        type: 'dm',
        data: {
          dmId,
          participants,
          name: 'Direct Message', // Will be overridden on client with recipient name
        },
        createdBy: userUuid,
        metadata: {}
      }).returning();

      return dm;
    }),

  // Create a channel
  createChannel: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      isPrivate: z.boolean().default(false),
      members: z.array(z.string()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const companyId = stringToUuid(orgId);
      const userUuid = stringToUuid(userId);

      const [channel] = await db.insert(entities).values({
        companyId: companyId,
        type: 'channel',
        data: {
          name: input.name,
          description: input.description,
          isPrivate: input.isPrivate,
          members: input.members || [userId],
          createdBy: userId
        },
        createdBy: userUuid,
        metadata: {}
      }).returning();

      // Notify organization about new channel
      if (pusher) {
        await pusher.trigger(
          channels.orgGeneral(orgId),
          events.CHANNEL_CREATED,
          {
            id: channel.id,
            ...channel.data
          }
        );
      }

      return channel;
    }),

  // Send typing indicator
  sendTyping: protectedProcedure
    .input(z.object({
      channelId: z.string(),
      isTyping: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const companyId = stringToUuid(orgId);

      // Determine the channel
      let channelName: string;
      if (input.channelId === 'general') {
        channelName = channels.orgGeneral(orgId);
      } else if (input.channelId.startsWith('dm-')) {
        const participants = input.channelId.replace('dm-', '').split('-');
        channelName = channels.dm(orgId, participants[0], participants[1]);
      } else {
        channelName = channels.channel(orgId, input.channelId);
      }

      if (pusher) {
        await pusher.trigger(
          channelName,
          events.USER_TYPING,
          {
            userId,
            userName: ctx.user?.firstName ? `${ctx.user.firstName} ${ctx.user.lastName}` : 'User',
            isTyping: input.isTyping
          }
        );
      }

      return { success: true };
    }),

  // Update presence
  updatePresence: protectedProcedure
    .input(z.object({
      isOnline: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const { orgId, userId } = ctx;
      const companyId = stringToUuid(orgId);

      // This would typically be handled by Pusher presence channels automatically,
      // but we can still broadcast manual status updates
      if (pusher) {
        await pusher.trigger(
          channels.orgPresence(orgId),
          'user.status_changed',
          {
            userId,
            userName: ctx.user?.firstName ? `${ctx.user.firstName} ${ctx.user.lastName}` : 'User',
            isOnline: input.isOnline
          }
        );
      }

      return { success: true };
    })
});