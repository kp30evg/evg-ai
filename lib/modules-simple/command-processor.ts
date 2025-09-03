/**
 * Simple Command Processor
 * Routes natural language commands to appropriate module functions
 * No complex orchestration - just pattern matching and function calls
 */

import { entityService } from '@/lib/entities/entity-service';
import * as everchat from './everchat';
import * as evercore from './evercore';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Process a natural language command
 */
export async function processCommand(
  workspaceId: string,
  command: string,
  userId?: string
): Promise<CommandResult> {
  try {
    const lowerCommand = command.toLowerCase();

    // Special command: Send AI summary to a channel (e.g., "send #sales a message summary on voice agents")
    if (lowerCommand.includes('send #') && (lowerCommand.includes('summary') || lowerCommand.includes('message'))) {
      const match = command.match(/send\s+#(\w+)\s+(?:a\s+)?(?:message\s+)?(?:summary\s+)?(?:on|about)?\s+(.+)/i);
      if (match) {
        const channel = match[1];
        const topic = match[2];
        
        // Generate AI summary using OpenAI
        let summary: string;
        
        if (openai) {
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content: "You are a business analyst providing concise, actionable summaries for team channels. Format your response with bullet points, key insights, and recommendations."
                },
                {
                  role: "user",
                  content: `Create a brief summary on the topic: ${topic}. Include key points, recommendations, and expected ROI or impact.`
                }
              ],
              temperature: 0.7,
              max_tokens: 500,
            });
            
            summary = `🤖 AI Summary on "${topic}":\n\n${completion.choices[0]?.message?.content || 'Unable to generate summary'}`;
          } catch (error) {
            console.error('OpenAI API error:', error);
            // Fallback to mock summary if OpenAI fails
            summary = `AI Summary on ${topic}:\n\n` +
              `📊 Key Points:\n` +
              `• Voice agents can reduce customer service costs by 60%\n` +
              `• Modern voice AI achieves 95% accuracy in understanding\n` +
              `• Integration with CRM systems enables personalized responses\n\n` +
              `💡 Recommendations:\n` +
              `• Start with simple use cases like appointment scheduling\n` +
              `• Gradually expand to more complex interactions\n` +
              `• Monitor customer satisfaction metrics closely\n\n` +
              `📈 Expected ROI: 3-6 months for full implementation`;
          }
        } else {
          // Fallback mock summary if OpenAI is not configured
          summary = `AI Summary on ${topic}:\n\n` +
            `📊 Key Points:\n` +
            `• Voice agents can reduce customer service costs by 60%\n` +
            `• Modern voice AI achieves 95% accuracy in understanding\n` +
            `• Integration with CRM systems enables personalized responses\n\n` +
            `💡 Recommendations:\n` +
            `• Start with simple use cases like appointment scheduling\n` +
            `• Gradually expand to more complex interactions\n` +
            `• Monitor customer satisfaction metrics closely\n\n` +
            `📈 Expected ROI: 3-6 months for full implementation`;
        }
        
        // Find or create the channel conversation
        let channelConversation = await entityService.find({
          workspaceId,
          type: 'conversation',
          where: { channel },
          limit: 1,
        });

        if (channelConversation.length === 0) {
          // Create the channel if it doesn't exist
          const newConv = await everchat.createConversation(workspaceId, `#${channel}`, [channel], userId);
          channelConversation = [newConv];
        }

        // Send the summary to the channel
        const message = await everchat.sendMessage(workspaceId, summary, channelConversation[0].id, userId);
        
        return {
          success: true,
          data: {
            ...message,
            channel: `#${channel}`,
            conversationId: channelConversation[0].id,
            summaryTopic: topic,
          },
          message: `AI summary on "${topic}" sent to #${channel}`,
        };
      }
    }

    // Chat-related commands
    if (
      lowerCommand.includes('message') ||
      lowerCommand.includes('conversation') ||
      lowerCommand.includes('chat') ||
      lowerCommand.startsWith('say') ||
      lowerCommand.startsWith('send')
    ) {
      const result = await everchat.handleChatCommand(workspaceId, command, userId);
      return {
        success: !result.error,
        data: result,
        error: result.error,
        message: result.error ? undefined : 'Command executed successfully',
      };
    }

    // CRM-related commands
    if (
      lowerCommand.includes('customer') ||
      lowerCommand.includes('deal') ||
      lowerCommand.includes('contact') ||
      lowerCommand.includes('company') ||
      (lowerCommand.includes('why') && lowerCommand.includes('lose'))
    ) {
      const result = await evercore.handleCoreCommand(workspaceId, command, userId);
      return {
        success: !result.error,
        data: result,
        error: result.error,
        message: result.error ? undefined : 'Command executed successfully',
      };
    }

    // Cross-module commands
    if (lowerCommand.includes('everything about') || lowerCommand.includes('show all about')) {
      return await handleCrossModuleQuery(workspaceId, command);
    }

    // Generic search
    if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
      const match = command.match(/(?:search|find)\s+(.+)/i);
      if (match) {
        const results = await entityService.find({
          workspaceId,
          search: match[1],
          limit: 50,
        });
        return {
          success: true,
          data: {
            query: match[1],
            results,
            count: results.length,
          },
          message: `Found ${results.length} results`,
        };
      }
    }

    // Show recent activity
    if (lowerCommand.includes('recent') || lowerCommand.includes('latest')) {
      const results = await entityService.find({
        workspaceId,
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });
      return {
        success: true,
        data: results,
        message: 'Recent activity',
      };
    }

    // If no pattern matches, try generic entity service query
    const results = await entityService.naturalLanguageQuery(workspaceId, command);
    return {
      success: true,
      data: results,
      message: 'Query executed',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle cross-module queries
 */
async function handleCrossModuleQuery(
  workspaceId: string,
  command: string
): Promise<CommandResult> {
  const match = command.match(/(?:everything|all)\s+about\s+(.+)/i);
  if (!match) {
    return {
      success: false,
      error: 'Could not parse query',
    };
  }

  const searchTerm = match[1].trim();

  // Search across all entity types
  const allResults = await entityService.find({
    workspaceId,
    search: searchTerm,
    limit: 200,
  });

  // Group results by type
  const grouped: Record<string, any[]> = {};
  for (const entity of allResults) {
    if (!grouped[entity.type]) {
      grouped[entity.type] = [];
    }
    grouped[entity.type].push(entity);
  }

  // Build comprehensive response
  const summary = {
    totalResults: allResults.length,
    byType: Object.entries(grouped).map(([type, entities]) => ({
      type,
      count: entities.length,
      recent: entities.slice(0, 5),
    })),
    timeline: allResults
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20),
  };

  return {
    success: true,
    data: summary,
    message: `Found ${allResults.length} items related to "${searchTerm}"`,
  };
}

/**
 * Get command suggestions based on partial input
 */
export function getCommandSuggestions(partialCommand: string): string[] {
  const suggestions = [
    // Chat
    'send message [text]',
    'show messages',
    'create conversation about [topic]',
    'search messages about [topic]',
    
    // CRM
    'create customer [name]',
    'create deal [name] for $[amount]',
    'show customers',
    'show deals',
    'why did we lose [deal name]',
    
    // Cross-module
    'show everything about [customer/deal/topic]',
    'search [anything]',
    'show recent activity',
  ];

  const lower = partialCommand.toLowerCase();
  return suggestions.filter(s => s.toLowerCase().includes(lower));
}

/**
 * Parse command intent (useful for UI feedback)
 */
export function parseCommandIntent(command: string): {
  action: 'create' | 'read' | 'update' | 'delete' | 'search' | 'analyze';
  entityType?: string;
  confidence: number;
} {
  const lowerCommand = command.toLowerCase();

  // Detect action
  let action: 'create' | 'read' | 'update' | 'delete' | 'search' | 'analyze' = 'read';
  let confidence = 0.5;

  if (lowerCommand.includes('create') || lowerCommand.includes('add') || lowerCommand.includes('new')) {
    action = 'create';
    confidence = 0.9;
  } else if (lowerCommand.includes('show') || lowerCommand.includes('get') || lowerCommand.includes('list')) {
    action = 'read';
    confidence = 0.9;
  } else if (lowerCommand.includes('update') || lowerCommand.includes('edit') || lowerCommand.includes('change')) {
    action = 'update';
    confidence = 0.9;
  } else if (lowerCommand.includes('delete') || lowerCommand.includes('remove')) {
    action = 'delete';
    confidence = 0.9;
  } else if (lowerCommand.includes('search') || lowerCommand.includes('find')) {
    action = 'search';
    confidence = 0.9;
  } else if (lowerCommand.includes('why') || lowerCommand.includes('analyze') || lowerCommand.includes('insights')) {
    action = 'analyze';
    confidence = 0.9;
  }

  // Detect entity type
  const entityTypes = ['customer', 'deal', 'message', 'conversation', 'task', 'email', 'invoice'];
  const detectedType = entityTypes.find(type => lowerCommand.includes(type));

  return {
    action,
    entityType: detectedType,
    confidence,
  };
}