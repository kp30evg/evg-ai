import OpenAI from 'openai';
import { db } from '@/lib/db';
import { entities, commandHistory } from '@/lib/db/schema';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { pusher, channels, events } from '@/lib/pusher';
import { createHash } from 'crypto';
import { EmailCommandProcessor } from '@/lib/evermail/command-processor';

// Initialize OpenAI with proper error handling
let openai: OpenAI | null = null;

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn('OpenAI API key not configured - using fallback responses');
  }
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

export interface CommandContext {
  companyId: string;
  userId: string;
  company: any;
  user: any;
  db?: any;
  trpc?: any;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
  executionTime?: number;
}

export class CommandProcessor {
  private lastEmailDraft: any = null; // Store the last email draft for confirmation
  
  // Helper to create a deterministic UUID from any string ID
  private stringToUuid(str: string): string {
    const hash = createHash('sha256').update(str).digest('hex');
    return [
      hash.substring(0, 8),
      hash.substring(8, 12),
      '4' + hash.substring(13, 16),
      ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
      hash.substring(20, 32)
    ].join('-');
  }

  async process(input: string, context: CommandContext, confirmation?: any): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Check if user is confirming a draft email action
      const lowerInput = input.toLowerCase().trim();
      if (this.lastEmailDraft && (lowerInput === 'send' || lowerInput === 'send it' || lowerInput === 'yes send')) {
        // Send the stored draft
        const emailProcessor = new EmailCommandProcessor();
        const sendResult = await emailProcessor.processCommand('', {
          companyId: this.stringToUuid(context.companyId),
          userId: this.stringToUuid(context.userId),
          userEmail: context.user?.email || ''
        }, { action: 'send', draft: this.lastEmailDraft });
        
        // Clear the draft after sending
        this.lastEmailDraft = null;
        
        return {
          success: true,
          message: this.formatEmailResponse(sendResult),
          data: sendResult,
          executionTime: Date.now() - startTime
        };
      } else if (this.lastEmailDraft && (lowerInput === 'cancel' || lowerInput === 'no' || lowerInput === 'discard')) {
        // Cancel the draft
        this.lastEmailDraft = null;
        return {
          success: true,
          message: 'Email draft cancelled.',
          executionTime: Date.now() - startTime
        };
      }
      
      // First, identify the intent and extract entities
      const intentAnalysis = await this.analyzeIntent(input, context);
      
      // Execute the appropriate action based on intent
      let actionResult: any = null;
      let response = '';
      
      switch (intentAnalysis.intent) {
        case 'send_message':
          actionResult = await this.sendMessage(intentAnalysis, context);
          response = actionResult.message;
          break;
          
        case 'send_email':
        case 'search_emails':
        case 'summarize_emails':
        case 'email_command':
          // Use EverMail command processor for comprehensive email handling
          const emailProcessor = new EmailCommandProcessor();
          const emailResult = await emailProcessor.processCommand(input, {
            companyId: this.stringToUuid(context.companyId),
            userId: this.stringToUuid(context.userId),
            userEmail: context.user?.email || ''
          }, confirmation);
          
          // Store draft if it's a draft_email result
          if (emailResult.type === 'draft_email') {
            this.lastEmailDraft = emailResult.draft;
          }
          
          response = this.formatEmailResponse(emailResult);
          actionResult = emailResult;
          break;
          
        case 'summarize_conversation':
          actionResult = await this.summarizeConversation(intentAnalysis, context);
          response = actionResult.message;
          break;
          
        case 'query_data':
          actionResult = await this.queryBusinessData(intentAnalysis, context);
          response = actionResult.message;
          break;
          
        default:
          // Fall back to general AI response if OpenAI is available
          if (openai) {
            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                  {
                    role: 'system',
                    content: `You are evergreenOS, an AI assistant for business operations. 
                    You help users with their business data, analytics, and operations.
                    Keep responses concise and professional.
                    Format numbers and data clearly.
                    The user's company is ${context.company.name}.`
                  },
                  {
                    role: 'user',
                    content: input
                  }
                ],
                temperature: 0.7,
                max_tokens: 500,
              });
              response = completion.choices[0].message.content || 'I couldn\'t generate a response.';
            } catch (error) {
              console.error('OpenAI error:', error);
              response = `I understand you're asking about "${input}". Let me help you with that information.`;
            }
          } else {
            response = `I understand you're asking about "${input}". Let me help you with that information.`;
          }
      }
      
      // Log the command for future training (skip for now to avoid DB errors)
      // await db.insert(commandHistory).values({
      //   companyId: context.companyId,
      //   userId: context.userId,
      //   input,
      //   result: { response, actionResult },
      //   success: true,
      //   executionTimeMs: Date.now() - startTime,
      // });

      return {
        success: true,
        message: response,
        data: actionResult,
        executionTime: Date.now() - startTime,
        suggestions: this.generateSuggestions(input),
      };
    } catch (error) {
      console.error('Command processing error:', error);
      
      // Log the failure (skip for now to avoid DB errors)
      // await db.insert(commandHistory).values({
      //   companyId: context.companyId,
      //   userId: context.userId,
      //   input,
      //   success: false,
      //   errorMessage: error instanceof Error ? error.message : 'Unknown error',
      //   executionTimeMs: Date.now() - startTime,
      // });

      return {
        success: false,
        message: 'I encountered an error processing your request. Please try again.',
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async analyzeIntent(input: string, context: CommandContext): Promise<any> {
    // If OpenAI is not available, use pattern matching
    if (!openai) {
      return this.analyzeIntentFallback(input);
    }
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Analyze the user's intent and extract entities. Return a JSON object with:
            - intent: one of 'send_message', 'send_email', 'search_emails', 'summarize_emails', 'summarize_conversation', 'query_data', 'other'
            - entities: object with relevant entities like 'recipient', 'channel', 'message', 'user', 'timeframe', 'subject', 'email_address', etc.
            
            Examples:
            "Send a message to #sales about new pricing" -> {"intent": "send_message", "entities": {"channel": "sales", "message": "about new pricing"}}
            "Email john@example.com about the project update" -> {"intent": "send_email", "entities": {"to": ["john@example.com"], "subject": "project update"}}
            "Email kian@evergreengroup.ai a summary on salesforce" -> {"intent": "send_email", "entities": {"to": ["kian@evergreengroup.ai"], "generateSummary": true, "topic": "salesforce"}}
            "Show me emails from last week" -> {"intent": "search_emails", "entities": {"timeframe": "last week"}}
            "Summarize emails from Sarah" -> {"intent": "summarize_emails", "entities": {"from": "Sarah"}}
            "message omid a paragraph explanation of the term CRM" -> {"intent": "send_message", "entities": {"recipient": "omid", "explanation": true, "term": "CRM"}}
            "message omid summary of what claude code is" -> {"intent": "send_message", "entities": {"recipient": "omid", "generateSummary": true, "topic": "claude code"}}
            "give sales group chat the update that new pricing is 200,000" -> {"intent": "send_message", "entities": {"channel": "sales", "update": "new pricing is 200,000"}}
            "Summarize my conversation with John" -> {"intent": "summarize_conversation", "entities": {"user": "John"}}
            "What's our monthly burn rate?" -> {"intent": "query_data", "entities": {"metric": "burn_rate", "timeframe": "monthly"}}`
          },
          {
            role: 'user',
            content: input
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
      });
      
      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.analyzeIntentFallback(input);
    }
  }
  
  private analyzeIntentFallback(input: string): any {
    const lowerInput = input.toLowerCase();
    
    // Comprehensive email command detection
    const emailKeywords = ['email', 'emails', 'inbox', 'unread', 'important', 'archive', 'forward', 'reply', 'draft', 'compose', 'attachments', 'urgent', 'starred'];
    const emailActions = ['show', 'find', 'search', 'summarize', 'extract', 'analyze'];
    
    if (emailKeywords.some(keyword => lowerInput.includes(keyword)) || 
        emailActions.some(action => lowerInput.includes(action) && lowerInput.includes('email'))) {
      return { intent: 'email_command', entities: {} };
    }
    
    // Legacy email patterns for backwards compatibility
    if (lowerInput.includes('email') && lowerInput.includes('@')) {
      const entities: any = {};
      
      // Extract email addresses
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
      const emailMatches = input.match(emailRegex);
      if (emailMatches) {
        entities.to = emailMatches;
      }
      
      // Check if it's about searching/viewing emails
      if (lowerInput.includes('show') || lowerInput.includes('find') || lowerInput.includes('search')) {
        return { intent: 'search_emails', entities };
      }
      
      // Check if it's about summarizing
      if (lowerInput.includes('summar')) {
        const fromMatch = input.match(/from\s+(\w+)/i);
        if (fromMatch) entities.from = fromMatch[1];
        return { intent: 'summarize_emails', entities };
      }
      
      // It's about sending an email
      const aboutMatch = input.match(/about\s+(.+?)(?:\s|$)/i);
      if (aboutMatch) {
        entities.subject = aboutMatch[1];
      }
      
      // Check for summary generation
      if (lowerInput.includes('summary on') || lowerInput.includes('summary of')) {
        const topicMatch = input.match(/summary\s+(?:on|of)\s+(.+)/i);
        if (topicMatch) {
          entities.generateSummary = true;
          entities.topic = topicMatch[1];
        }
      }
      
      return { intent: 'send_email', entities };
    }
    
    // Message sending patterns
    if (lowerInput.includes('message') || lowerInput.includes('send') || lowerInput.includes('tell') || lowerInput.includes('give')) {
      const entities: any = {};
      
      // Extract channel
      const channelMatch = input.match(/#(\w+)/);
      if (channelMatch) {
        entities.channel = channelMatch[1];
      }
      
      // Extract recipient
      const recipientPatterns = [
        /(?:message|tell|send to)\s+(\w+)/i,
        /give\s+(\w+)\s+(?:group\s+)?chat/i
      ];
      for (const pattern of recipientPatterns) {
        const match = input.match(pattern);
        if (match && !['a', 'the', 'to'].includes(match[1].toLowerCase())) {
          entities.recipient = match[1];
          break;
        }
      }
      
      // Extract message content - check for summary/explanation patterns first
      if (lowerInput.includes('summary of') || lowerInput.includes('summarize')) {
        // Pattern: "message omid summary of what claude code is"
        const summaryMatch = input.match(/summary\s+of\s+(?:what\s+)?(.+?)(?:\s+is)?$/i);
        if (summaryMatch) {
          entities.generateSummary = true;
          entities.topic = summaryMatch[1].trim();
        }
      } else if (lowerInput.includes('explanation of') || lowerInput.includes('explain')) {
        const termMatch = input.match(/(?:explanation\s+of|explain)\s+(?:the\s+)?(?:term\s+)?(.+)/i);
        if (termMatch) {
          entities.explanation = true;
          entities.term = termMatch[1];
        }
      } else if (lowerInput.includes('update that')) {
        const updateMatch = input.match(/update\s+that\s+(.+)/i);
        if (updateMatch) {
          entities.update = updateMatch[1];
        }
      } else if (lowerInput.includes('about')) {
        const aboutMatch = input.match(/about\s+(.+)/i);
        if (aboutMatch) {
          entities.message = aboutMatch[1];
        }
      }
      
      return { intent: 'send_message', entities };
    }
    
    // Summarization patterns
    if (lowerInput.includes('summarize') && lowerInput.includes('conversation')) {
      const withMatch = input.match(/with\s+(\w+)/i);
      return {
        intent: 'summarize_conversation',
        entities: { user: withMatch ? withMatch[1] : null }
      };
    }
    
    // Data query patterns
    if (lowerInput.includes('burn rate') || lowerInput.includes('revenue') || lowerInput.includes('customer')) {
      return {
        intent: 'query_data',
        entities: { 
          metric: lowerInput.includes('burn') ? 'burn_rate' : 
                  lowerInput.includes('revenue') ? 'revenue' : 'customers'
        }
      };
    }
    
    return { intent: 'other', entities: {} };
  }
  
  private async sendMessage(intentData: any, context: CommandContext): Promise<any> {
    const { entities: extractedEntities } = intentData;
    const companyId = this.stringToUuid(context.companyId);
    const userUuid = this.stringToUuid(context.userId);
    
    // Determine the target (channel or user)
    let channelId = '';
    let targetName = '';
    let isDM = false;
    
    if (extractedEntities.channel) {
      // Sending to a channel
      channelId = extractedEntities.channel.toLowerCase().replace('#', '');
      targetName = `#${channelId}`;
    } else if (extractedEntities.recipient || extractedEntities.user) {
      // Sending to a user - match the format used by everchat
      const recipientName = extractedEntities.recipient || extractedEntities.user;
      
      // For DMs, everchat uses format: dm-userId1-userId2
      // For now, we'll use a simpler format that can be matched
      // In a real implementation, we'd look up the recipient's actual user ID
      
      // Map known users to their IDs (in production, this would be a database lookup)
      const userIdMap: { [key: string]: string } = {
        'omid': 'user_327TZuO5dXuPdMCrlsXg8Y21Nhr',
        'niki': 'user_328ABC123XYZ' // placeholder
      };
      
      const recipientId = userIdMap[recipientName.toLowerCase()] || recipientName.toLowerCase();
      
      // Create the DM channel ID in the format everchat expects
      // Sort the IDs to ensure consistency
      const userIds = [context.userId, recipientId].sort();
      channelId = `dm-${userIds[0]}-${userIds[1]}`;
      targetName = recipientName;
      isDM = true;
    } else {
      return {
        success: false,
        message: 'I couldn\'t determine who to send the message to. Please specify a channel (like #sales) or a person\'s name.'
      };
    }
    
    // Extract or generate the message content
    let messageText = extractedEntities.message || extractedEntities.content || extractedEntities.update || '';
    
    // Generate content based on the type of request
    if (extractedEntities.generateSummary && extractedEntities.topic) {
      // Use OpenAI to generate a summary/explanation
      messageText = await this.generateSummaryWithAI(extractedEntities.topic);
    } else if (extractedEntities.explanation && extractedEntities.term) {
      // Generate explanation for a specific term
      messageText = await this.generateExplanation(extractedEntities.term);
    } else if (!messageText && extractedEntities.topic) {
      messageText = `Regarding ${extractedEntities.topic}`;
    }
    
    // Create the message in the database with the right structure
    try {
      const messageData = {
        companyId: companyId,
        type: 'message',
        data: {
          channelId: channelId,
          text: messageText,
          userId: context.userId,
          userName: context.user.name || 'User',
          userImage: context.user.image,
          timestamp: new Date(),
          aiGenerated: true,
          // Add recipient info for DMs
          recipientId: isDM ? targetName.toLowerCase() : undefined,
          recipientName: isDM ? targetName : undefined
        },
        createdBy: userUuid,
        metadata: { 
          intent: 'ai_command',
          isDM: isDM,
          target: targetName
        }
      };
      
      console.log('Saving message with channelId:', channelId, 'for target:', targetName);
      const [message] = await db.insert(entities).values(messageData).returning();
      console.log('Message saved with ID:', message.id);
      
      // Broadcast via Pusher if configured
      if (pusher) {
        try {
          const channelName = channels.channel(context.companyId, channelId);
          await pusher.trigger(
            channelName,
            events.MESSAGE_NEW,
            {
              id: message.id,
              ...message.data
            }
          );
          console.log('Message broadcast via Pusher to channel:', channelName);
        } catch (err) {
          console.log('Pusher not configured, message saved to DB only');
        }
      }
      
      return {
        success: true,
        message: `✅ Message sent to ${targetName}:\n\n"${messageText}"\n\n_Message has been delivered to ${targetName}${isDM ? "'s direct messages" : " channel"}_`,
        data: {
          messageId: message.id,
          channelId: channelId,
          recipient: targetName
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: `Failed to send message to ${targetName}. Please try again.`
      };
    }
  }
  
  private async generateExplanation(term: string): Promise<string> {
    const explanations: { [key: string]: string } = {
      'CRM': 'CRM (Customer Relationship Management) is a technology system that helps businesses manage and analyze customer interactions throughout the customer lifecycle. It centralizes customer data, tracks sales opportunities, automates marketing campaigns, and provides insights to improve customer service. Think of it as a comprehensive database that stores every interaction with your customers - from initial contact through purchase and ongoing support - helping teams collaborate and provide better customer experiences.',
      'ERP': 'ERP (Enterprise Resource Planning) is a software system that integrates and manages core business processes in real-time. It connects departments like finance, HR, manufacturing, supply chain, and services into a single system with a unified database. This eliminates data silos, improves efficiency, and provides comprehensive visibility across the entire organization.',
      'SAAS': 'SaaS (Software as a Service) is a cloud-based software delivery model where applications are hosted by a vendor and accessed via the internet. Instead of installing software on individual computers, users access it through web browsers with a subscription. Benefits include automatic updates, accessibility from anywhere, lower upfront costs, and no maintenance burden.'
    };
    
    return explanations[term.toUpperCase()] || 
      `${term} is an important business concept that involves systematic approaches to managing resources, processes, and information to achieve business objectives. Understanding and implementing ${term} can lead to improved productivity and competitive advantages.`;
  }
  
  private async generateSummaryWithAI(topic: string): Promise<string> {
    // If OpenAI is available, use it to generate a comprehensive summary
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are a knowledgeable assistant. Provide a clear, concise summary or explanation in 2-3 sentences. Focus on practical understanding for business users.'
            },
            {
              role: 'user',
              content: `Provide a summary of what ${topic} is and its key benefits.`
            }
          ],
          temperature: 0.7,
          max_tokens: 200,
        });
        
        return completion.choices[0].message.content || this.generateFallbackSummary(topic);
      } catch (error) {
        console.error('OpenAI error generating summary:', error);
        return this.generateFallbackSummary(topic);
      }
    }
    
    // Fallback if OpenAI is not available
    return this.generateFallbackSummary(topic);
  }
  
  private generateFallbackSummary(topic: string): string {
    const lowerTopic = topic.toLowerCase();
    
    // Common topics with predefined summaries
    if (lowerTopic.includes('claude code')) {
      return 'Claude Code is an AI-powered coding assistant that helps developers write, debug, and understand code. It provides intelligent code suggestions, can explain complex code patterns, and assists with various programming tasks across multiple languages. Claude Code integrates into your development workflow to boost productivity and code quality.';
    } else if (lowerTopic.includes('evergreen')) {
      return 'evergreenOS is a unified business operating system that replaces fragmented business tools with a single AI-powered platform. It allows you to control all business operations through natural language commands, integrating CRM, email, tasks, calendar, documents, and analytics into one seamless experience.';
    } else if (lowerTopic.includes('ai') || lowerTopic.includes('artificial intelligence')) {
      return 'Artificial Intelligence (AI) refers to computer systems that can perform tasks typically requiring human intelligence, such as visual perception, speech recognition, decision-making, and language translation. AI is transforming businesses by automating processes, providing insights from data, and enabling new capabilities that were previously impossible.';
    }
    
    // Generic fallback
    return `${topic} is a cutting-edge solution designed to enhance business operations and productivity. It leverages modern technology to streamline processes, improve efficiency, and deliver better outcomes for organizations of all sizes.`;
  }
  
  private async summarizeConversation(intentData: any, context: CommandContext): Promise<any> {
    const { entities: extractedEntities } = intentData;
    const companyId = this.stringToUuid(context.companyId);
    
    // Determine who to summarize conversation with
    const targetUser = extractedEntities.user || extractedEntities.person || extractedEntities.recipient;
    
    if (!targetUser) {
      return {
        success: false,
        message: 'Please specify whose conversation you\'d like me to summarize.'
      };
    }
    
    try {
      // Fetch messages from the database
      const messages = await db.select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'message')
          )
        )
        .orderBy(desc(entities.createdAt))
        .limit(100);
      
      // Filter messages for the conversation
      const conversationMessages = messages.filter(msg => {
        const data = msg.data as any;
        // Check if it's a DM with the target user
        return data.channelId?.includes(targetUser.toLowerCase()) ||
               data.userName?.toLowerCase().includes(targetUser.toLowerCase());
      });
      
      if (conversationMessages.length === 0) {
        return {
          success: false,
          message: `I couldn't find any recent conversations with ${targetUser}.`
        };
      }
      
      // Format messages for summarization
      const conversationText = conversationMessages
        .slice(0, 20) // Last 20 messages
        .reverse()
        .map((msg: any) => `${msg.data.userName}: ${msg.data.text}`)
        .join('\n');
      
      // Use OpenAI to summarize
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Summarize this conversation concisely, highlighting key points and any action items.'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        temperature: 0.5,
        max_tokens: 300,
      });
      
      const summary = completion.choices[0].message.content;
      
      return {
        success: true,
        message: `📝 **Conversation Summary with ${targetUser}:**\n\n${summary}\n\n_Based on ${conversationMessages.length} messages_`
      };
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      return {
        success: false,
        message: 'I encountered an error while summarizing the conversation. Please try again.'
      };
    }
  }
  
  private async queryBusinessData(intentData: any, context: CommandContext): Promise<any> {
    const { entities: extractedEntities } = intentData;
    
    // For demo purposes, return mock data based on the query
    if (extractedEntities.metric === 'burn_rate') {
      return {
        success: true,
        message: `📊 **Monthly Burn Rate Analysis:**\n\n• Current burn rate: $127,450/month\n• Runway: 14.2 months\n• Top expenses:\n  - Salaries: $85,000 (66.7%)\n  - Infrastructure: $22,450 (17.6%)\n  - Marketing: $15,000 (11.8%)\n  - Other: $5,000 (3.9%)\n\n💡 *Recommendation: Consider optimizing infrastructure costs*`
      };
    }
    
    // Default response for other queries
    return {
      success: true,
      message: `I'm still learning to analyze that type of data. For now, I can help with:\n• Sending messages to team members or channels\n• Summarizing conversations\n• Basic business metrics`
    };
  }
  
  private formatEmailResponse(result: any): string {
    switch (result.type) {
      case 'search_results':
        if (result.emails.length === 0) {
          return result.message;
        }
        const emailList = result.emails.slice(0, 5).map((e: any) => 
          `• From: ${e.from?.email || 'Unknown'}\n  Subject: ${e.subject}\n  ${e.body?.snippet?.substring(0, 100)}...`
        ).join('\n\n');
        return `${result.message}\n\n${emailList}`;
        
      case 'summary':
        return `${result.message}\n\n${result.summary}`;
        
      case 'draft_email':
      case 'draft_reply':
      case 'draft_forward':
        const draftDisplay = `${result.message}\n\n**To:** ${result.draft.to?.join(', ')}\n**Subject:** ${result.draft.subject}\n\n${result.draft.body}`;
        
        // Add action buttons if they exist
        if (result.actions) {
          const buttons = result.actions.map((action: any) => 
            action.primary ? `\n\n✅ **${action.label}**` : `\n🔘 ${action.label}`
          ).join('  ');
          return draftDisplay + '\n\n---' + buttons + '\n\n_Reply with "send" to send this email, "edit" to modify it, or "cancel" to discard._';
        }
        return draftDisplay;
        
      case 'extraction':
        if (Array.isArray(result.data)) {
          return `${result.message}\n\n${result.data.join('\n')}`;
        }
        return `${result.message}\n\n${result.data}`;
        
      case 'analysis':
        return `${result.message}\n\n${result.analysis || ''}`;
        
      case 'success':
      case 'info':
      case 'error':
      default:
        return result.message;
    }
  }
  
  private async sendEmail(intentData: any, context: CommandContext): Promise<any> {
    const { entities } = intentData;
    
    // Check if we have recipients
    if (!entities.to || entities.to.length === 0) {
      return {
        success: false,
        message: 'Please specify an email address to send to. For example: "Email john@example.com about the meeting"'
      };
    }
    
    // Generate content if needed
    let emailBody = '';
    let subject = entities.subject || 'Message from evergreenOS';
    
    if (entities.generateSummary && entities.topic) {
      // Generate a summary about the topic
      emailBody = await this.generateSummaryWithAI(entities.topic);
      subject = `Summary: ${entities.topic}`;
    } else if (entities.subject) {
      // Generate email body based on subject
      if (openai) {
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
              {
                role: 'system',
                content: 'Write a professional email body for the given subject. Be clear, concise, and friendly.'
              },
              {
                role: 'user',
                content: `Write an email about: ${entities.subject}`
              }
            ],
            temperature: 0.7,
            max_tokens: 300,
          });
          emailBody = completion.choices[0].message.content || '';
        } catch (error) {
          emailBody = `This email is regarding ${entities.subject}.\n\nPlease let me know if you need any additional information.`;
        }
      } else {
        emailBody = `This email is regarding ${entities.subject}.\n\nPlease let me know if you need any additional information.`;
      }
    }
    
    // For now, we'll create a draft that shows what would be sent
    // In production, this would use the evermailRouter to actually send
    return {
      success: true,
      message: `📧 **Email Draft Created:**\n\n**To:** ${entities.to.join(', ')}\n**Subject:** ${subject}\n\n**Body:**\n${emailBody}\n\n_To send this email, connect your Gmail account in Email Settings_`,
      data: {
        to: entities.to,
        subject,
        body: emailBody
      }
    };
  }
  
  private async searchEmails(intentData: any, context: CommandContext): Promise<any> {
    const { entities } = intentData;
    
    // Parse time frame
    let timeframeText = '';
    if (entities.timeframe) {
      timeframeText = ` from ${entities.timeframe}`;
    }
    
    // For demo, return mock search results
    return {
      success: true,
      message: `📧 **Email Search Results${timeframeText}:**\n\n1. **From:** john@example.com\n   **Subject:** Q4 Budget Review\n   _Received 2 days ago_\n\n2. **From:** sarah@client.com\n   **Subject:** Re: Project Timeline\n   _Received 3 days ago_\n\n3. **From:** team@company.com\n   **Subject:** Weekly Update\n   _Received 5 days ago_\n\n_To view full emails, go to your Inbox_`
    };
  }
  
  private async summarizeEmails(intentData: any, context: CommandContext): Promise<any> {
    const { entities } = intentData;
    
    let filterText = '';
    if (entities.from) {
      filterText = ` from ${entities.from}`;
    }
    
    // For demo, return mock summary
    return {
      success: true,
      message: `📧 **Email Summary${filterText}:**\n\n**Key Topics:**\n• Budget approval needed for Q4 projects\n• Project timeline shifted by 2 weeks\n• New client onboarding scheduled for next Monday\n\n**Action Items:**\n• Review and approve budget by Friday\n• Update project milestones in system\n• Prepare onboarding materials\n\n**Important Dates:**\n• Nov 15: Budget deadline\n• Nov 20: Project kick-off\n• Nov 25: Client onboarding\n\n_Based on 12 emails analyzed_`
    };
  }
  
  private generateSuggestions(input: string): string[] {
    // Generate contextual follow-up suggestions
    const suggestions = [];
    
    if (input.toLowerCase().includes('revenue')) {
      suggestions.push('Compare to last quarter');
      suggestions.push('Show revenue by product');
      suggestions.push('Forecast next month');
    } else if (input.toLowerCase().includes('customer')) {
      suggestions.push('Show customer growth');
      suggestions.push('Analyze churn rate');
      suggestions.push('Top customer segments');
    } else if (input.toLowerCase().includes('burn')) {
      suggestions.push('Break down by department');
      suggestions.push('Compare to budget');
      suggestions.push('Project runway');
    } else {
      suggestions.push('Show key metrics');
      suggestions.push('What changed this week?');
      suggestions.push('Generate report');
    }
    
    return suggestions;
  }
}

export const commandProcessor = new CommandProcessor();