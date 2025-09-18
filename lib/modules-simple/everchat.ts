/**
 * EverChat Module - Simple implementation using EntityService
 * No inheritance, no complex abstractions - just functions using EntityService
 */

import { entityService } from '@/lib/entities/entity-service';
import { ConversationData, MessageData } from '@/lib/db/schema/unified';
import { pusher } from '@/lib/pusher';

/**
 * Send a message
 */
export async function sendMessage(
  workspaceId: string,
  content: string,
  conversationId?: string,
  dbUserId?: string,  // Database user ID (UUID)
  clerkUserId?: string,  // Clerk user ID (for metadata)
  userName?: string,
  userImage?: string
): Promise<any> {
  // Create or get conversation
  if (!conversationId) {
    const conversation = await createConversation(workspaceId, 'New Conversation', [], clerkUserId, dbUserId);
    conversationId = conversation.id;
  }

  // Create message entity with proper user isolation
  const message = await entityService.create(
    workspaceId,
    'message',
    {
      content,
      channel: 'chat',
      from: clerkUserId || 'user',  // Store Clerk ID for display
      userId: clerkUserId || 'user',  // Store Clerk ID for display
      userName: userName || 'User',
      userImage: userImage,
      timestamp: new Date(),
    } as MessageData,
    {
      conversation: conversationId, // Link to conversation
    },
    {
      userId: dbUserId,  // This will be used for the database user_id field (UUID)
      createdBy: clerkUserId, // Store Clerk ID in metadata
    }
  );

  // Update conversation's last message time
  try {
    const messageCount = await getMessageCount(workspaceId, conversationId);
    await entityService.update(
      workspaceId,
      conversationId,
      {
        lastMessageAt: new Date(),
        messageCount: messageCount,
      }
    );
  } catch (e) {
    // Conversation update failed, but message was sent
    console.error('Failed to update conversation:', e);
  }

  // Broadcast via Pusher if configured
  if (pusher) {
    try {
      await pusher.trigger(
        `workspace-${workspaceId}-conversation-${conversationId}`,
        'new-message',
        {
          id: message.id,
          ...message.data,
        }
      );
    } catch (e) {
      // Pusher not configured, continue
    }
  }

  return message;
}

/**
 * Create a conversation (or find existing DM)
 */
export async function createConversation(
  workspaceId: string,
  title: string,
  participants: string[] = [],
  clerkUserId?: string,
  dbUserId?: string
): Promise<any> {
  // Extract channel name if it starts with #
  const channel = title.startsWith('#') ? title.substring(1) : undefined;
  
  // For DM conversations, check if one already exists between these participants
  if (title.startsWith('DM:') && participants.length === 2) {
    // Sort participants to ensure consistent ordering
    const sortedParticipants = [...participants].sort();
    
    // Find existing DM conversation between these two users
    const existingConversations = await entityService.find({
      workspaceId,
      type: 'conversation'
    });
    
    const existingDM = existingConversations.find((conv: any) => {
      if (!conv.data?.title?.startsWith('DM:')) return false;
      if (!conv.data?.participants || conv.data.participants.length !== 2) return false;
      
      // Check if participants match (order doesn't matter)
      const convParticipants = [...conv.data.participants].sort();
      return convParticipants[0] === sortedParticipants[0] && 
             convParticipants[1] === sortedParticipants[1];
    });
    
    if (existingDM) {
      console.log('Found existing DM conversation:', existingDM.id);
      return existingDM;
    }
  }
  
  // Create new conversation
  return await entityService.create(
    workspaceId,
    'conversation',
    {
      title,
      channel, // Store channel name if it's a channel conversation
      participants,
      status: 'active',
      messageCount: 0,
      lastMessageAt: null,
    } as ConversationData,
    {},
    { 
      userId: dbUserId,  // Database user ID for user_id field
      createdBy: clerkUserId  // Clerk ID in metadata
    }
  );
}

/**
 * Get messages for a conversation
 */
export async function getMessages(
  workspaceId: string,
  conversationId: string,
  limit = 50
): Promise<any[]> {
  return await entityService.find({
    workspaceId,
    type: 'message',
    relationships: {
      conversation: conversationId,
    },
    limit,
    orderBy: 'createdAt',
    orderDirection: 'desc',
  });
}

/**
 * Get all conversations
 */
export async function getConversations(
  workspaceId: string,
  limit = 20
): Promise<any[]> {
  return await entityService.find({
    workspaceId,
    type: 'conversation',
    limit,
    orderBy: 'updatedAt',
    orderDirection: 'desc',
  });
}

/**
 * Search messages
 */
export async function searchMessages(
  workspaceId: string,
  searchTerm: string,
  limit = 50
): Promise<any[]> {
  return await entityService.find({
    workspaceId,
    type: 'message',
    search: searchTerm,
    limit,
  });
}

/**
 * Get message count for a conversation
 */
async function getMessageCount(
  workspaceId: string,
  conversationId: string
): Promise<number> {
  const messages = await entityService.find({
    workspaceId,
    type: 'message',
    relationships: {
      conversation: conversationId,
    },
  });
  return messages.length;
}

/**
 * Archive a conversation
 */
export async function archiveConversation(
  workspaceId: string,
  conversationId: string
): Promise<any> {
  return await entityService.update(
    workspaceId,
    conversationId,
    {
      status: 'archived',
      archivedAt: new Date(),
    }
  );
}

/**
 * Delete a message
 */
export async function deleteMessage(
  workspaceId: string,
  messageId: string
): Promise<boolean> {
  return await entityService.delete(workspaceId, messageId);
}

/**
 * Count messages in a conversation
 */
async function countMessages(
  workspaceId: string,
  conversationId: string
): Promise<number> {
  const messages = await entityService.find({
    workspaceId,
    type: 'message',
    relationships: {
      conversation: conversationId,
    },
  });
  return messages.length;
}

/**
 * Handle natural language commands for chat
 */
export async function handleChatCommand(
  workspaceId: string,
  command: string,
  clerkUserId?: string,
  dbUserId?: string
): Promise<any> {
  const lowerCommand = command.toLowerCase();

  // Send message pattern
  if (lowerCommand.startsWith('send message') || lowerCommand.startsWith('say')) {
    const match = command.match(/(?:send message|say)\s+(.+)/i);
    if (match) {
      const content = match[1];
      return await sendMessage(workspaceId, content, undefined, dbUserId, clerkUserId);
    }
  }

  // Show messages pattern
  if (lowerCommand.includes('show messages') || lowerCommand.includes('get messages')) {
    const conversations = await getConversations(workspaceId, 1);
    if (conversations.length > 0) {
      const messages = await getMessages(workspaceId, conversations[0].id);
      return {
        conversation: conversations[0],
        messages,
      };
    }
    return { messages: [] };
  }

  // Create conversation pattern
  if (lowerCommand.includes('create conversation') || lowerCommand.includes('new conversation')) {
    const match = command.match(/(?:create|new)\s+conversation\s+(?:about\s+)?(.+)/i);
    const title = match ? match[1] : 'New Conversation';
    return await createConversation(workspaceId, title, [], clerkUserId, dbUserId);
  }

  // Search pattern
  if (lowerCommand.includes('find') || lowerCommand.includes('search')) {
    const match = command.match(/(?:find|search)\s+(?:messages?\s+)?(?:about\s+)?(.+)/i);
    if (match) {
      const searchTerm = match[1];
      return await searchMessages(workspaceId, searchTerm);
    }
  }

  return {
    error: 'Command not recognized',
    suggestions: [
      'send message [text]',
      'show messages',
      'create conversation about [topic]',
      'search messages about [topic]',
    ],
  };
}