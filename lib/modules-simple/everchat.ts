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
  userId?: string
): Promise<any> {
  // Create or get conversation
  if (!conversationId) {
    const conversation = await createConversation(workspaceId, 'New Conversation');
    conversationId = conversation.id;
  }

  // Create message entity
  const message = await entityService.create(
    workspaceId,
    'message',
    {
      content,
      channel: 'chat',
      from: userId || 'user',
      timestamp: new Date(),
    } as MessageData,
    {
      conversation: conversationId, // Link to conversation
    },
    {
      userId,
    }
  );

  // Update conversation's last message time
  await entityService.update(
    workspaceId,
    conversationId,
    {
      lastMessageAt: new Date(),
      messageCount: await countMessages(workspaceId, conversationId),
    }
  );

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
 * Create a conversation
 */
export async function createConversation(
  workspaceId: string,
  title: string,
  participants: string[] = [],
  userId?: string
): Promise<any> {
  // Extract channel name if it starts with #
  const channel = title.startsWith('#') ? title.substring(1) : undefined;
  
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
    { userId }
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
  userId?: string
): Promise<any> {
  const lowerCommand = command.toLowerCase();

  // Send message pattern
  if (lowerCommand.startsWith('send message') || lowerCommand.startsWith('say')) {
    const match = command.match(/(?:send message|say)\s+(.+)/i);
    if (match) {
      const content = match[1];
      return await sendMessage(workspaceId, content, undefined, userId);
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
    return await createConversation(workspaceId, title);
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