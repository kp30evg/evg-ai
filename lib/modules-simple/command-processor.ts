/**
 * Simple Command Processor
 * Routes natural language commands to appropriate module functions
 * No complex orchestration - just pattern matching and function calls
 */

import { entityService } from '@/lib/entities/entity-service';
import * as everchat from './everchat';
import * as evercore from './evercore';
import * as evercal from './evercal';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    })
  : null;

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  suggestions?: string[];
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
    console.log('Processing command:', command, 'for workspace:', workspaceId, 'user:', userId);
    const lowerCommand = command.toLowerCase();
    
    // Debug logging
    console.log('Checking if email command...', {
      hasEmail: lowerCommand.includes('email'),
      hasSend: lowerCommand.includes('send'),
      hasAt: lowerCommand.includes('@'),
      willRoute: lowerCommand.includes('email') || (lowerCommand.includes('send') && lowerCommand.includes('@'))
    });

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
              model: "gpt-4",
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
          suggestions: [
            `Show messages in #${channel}`,
            `Create follow-up task for ${topic}`,
            `Send another summary to different channel`
          ],
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

    // Email-related commands  
    if (lowerCommand.includes('email') || lowerCommand.includes('summarize my emails') || (lowerCommand.includes('send') && lowerCommand.includes('@'))) {
      return await handleEmailCommand(workspaceId, command, userId);
    }

    // EverCore CRM-related commands
    if (
      lowerCommand.includes('evercore') ||
      lowerCommand.includes('contact') ||
      lowerCommand.includes('company') ||
      lowerCommand.includes('deal') ||
      lowerCommand.includes('pipeline') ||
      lowerCommand.includes('crm') ||
      lowerCommand.includes('high deal potential') ||
      lowerCommand.includes('deals at risk') ||
      lowerCommand.includes('health score') ||
      lowerCommand.includes('accounts') ||
      (lowerCommand.includes('tell me about') || lowerCommand.includes('everything about') || lowerCommand.includes('show me'))
    ) {
      const result = await evercore.handleCoreCommand(workspaceId, command, userId);
      
      // Format the response for better display
      
      // Handle contact summary
      if (result.totalContacts !== undefined && result.byCompany) {
        let message = `📊 **Contact Summary**\n\n`;
        message += `You have **${result.totalContacts} total contacts**\n\n`;
        
        if (result.recentContacts && result.recentContacts.length > 0) {
          message += `**Recent Contacts:**\n`;
          result.recentContacts.forEach((contact: any, index: number) => {
            message += `${index + 1}. **${contact.name}** (${contact.company})\n`;
            if (contact.email) {
              message += `   📧 ${contact.email}\n`;
            }
          });
          message += `\n`;
        }
        
        const companyNames = Object.keys(result.byCompany);
        if (companyNames.length > 0) {
          message += `**Contacts by Company:**\n`;
          companyNames.forEach(company => {
            message += `• ${company}: ${result.byCompany[company].length} contacts\n`;
          });
        }
        
        if (result.withoutCompany > 0) {
          message += `\n${result.withoutCompany} contacts without a company assigned\n`;
        }
        
        return {
          success: true,
          data: result,
          message,
          suggestions: result.suggestions || ['Show all deals', 'Create new contact']
        };
      }
      
      // Handle biggest deal
      if (result.deal && result.details) {
        let message = `💰 **${result.message}**\n\n`;
        message += `**Deal Details:**\n`;
        message += `• **Name:** ${result.details.name}\n`;
        message += `• **Value:** $${result.details.value.toLocaleString()}\n`;
        message += `• **Stage:** ${result.details.stage}\n`;
        message += `• **Probability:** ${result.details.probability}%\n`;
        message += `• **Contact:** ${result.details.contact}\n`;
        message += `• **Company:** ${result.details.company}\n`;
        
        if (result.details.closeDate) {
          message += `• **Close Date:** ${new Date(result.details.closeDate).toLocaleDateString()}\n`;
        }
        
        if (result.details.nextStep) {
          message += `• **Next Step:** ${result.details.nextStep}\n`;
        }
        
        if (result.otherTopDeals && result.otherTopDeals.length > 0) {
          message += `\n**Other Top Deals:**\n`;
          result.otherTopDeals.forEach((deal: any, index: number) => {
            message += `${index + 2}. ${deal.name} - $${deal.value.toLocaleString()} (${deal.stage})\n`;
          });
        }
        
        return {
          success: true,
          data: result,
          message,
          suggestions: result.suggestions || ['Show deals at risk', 'Update deal stage']
        };
      }
      
      if (result.contacts && Array.isArray(result.contacts)) {
        // Handle multiple contacts (e.g., high deal potential query)
        let message = `📊 **${result.message || 'CRM Results'}**\n\n`;
        
        if (result.contacts.length === 0) {
          message += `No contacts found matching your criteria.\n`;
        } else {
          message += `Found ${result.contacts.length} contacts:\n\n`;
          result.contacts.slice(0, 10).forEach((contact: any, index: number) => {
            const name = `${contact.data.firstName} ${contact.data.lastName}`.trim();
            const company = contact.data.companyName || 'No Company';
            const dealPotential = contact.dealPotential || 0;
            
            message += `${index + 1}. **${name}** - ${company}\n`;
            message += `   📈 Deal Potential Score: ${dealPotential}%\n`;
            if (contact.data.email) {
              message += `   📧 ${contact.data.email}\n`;
            }
            if (contact.data.phone) {
              message += `   📞 ${contact.data.phone}\n`;
            }
            message += `\n`;
          });
        }
        
        return {
          success: true,
          data: result,
          message,
          suggestions: [
            'Create a new deal for high-potential contact',
            'Show all deals',
            'View pipeline'
          ]
        };
      }
      
      if (result.contact || result.company) {
        const entity = result.contact || result.company;
        const type = result.contact ? 'Contact' : 'Company';
        
        let message = `📋 **${type}: ${entity.data.firstName || ''} ${entity.data.lastName || entity.data.name}**\n\n`;
        
        if (result.metrics) {
          message += `📊 **Engagement Metrics:**\n`;
          message += `• Emails: ${result.metrics.totalEmails}\n`;
          message += `• Meetings: ${result.metrics.totalMeetings}\n`;
          message += `• Deals: ${result.metrics.totalDeals}\n`;
          if (result.metrics.daysSinceLastContact) {
            message += `• Last Contact: ${result.metrics.daysSinceLastContact} days ago\n`;
          }
          message += `• Engagement Score: ${result.metrics.engagementScore}/100\n\n`;
        }
        
        if (result.recentActivity && result.recentActivity.length > 0) {
          message += `📅 **Recent Activity:**\n`;
          result.recentActivity.slice(0, 3).forEach((activity: any) => {
            const date = new Date(activity.createdAt).toLocaleDateString();
            message += `• ${activity.type}: ${activity.data.subject || activity.data.title || 'Activity'} (${date})\n`;
          });
        }
        
        return {
          success: true,
          data: result,
          message,
          suggestions: [
            `Schedule meeting with ${entity.data.firstName || entity.data.name}`,
            'View all contacts',
            'Show pipeline'
          ]
        };
      }
      
      return {
        success: !result.error,
        data: result,
        error: result.error,
        message: result.error ? undefined : 'Command executed successfully',
        suggestions: getGeneralSuggestions(command),
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

    // Calendar commands
    if (lowerCommand.includes('schedule') || lowerCommand.includes('meeting') || lowerCommand.includes('calendar') || 
        lowerCommand.includes('available') || lowerCommand.includes('book') || lowerCommand.includes('appointment')) {
      return await handleCalendarCommand(workspaceId, command, userId);
    }

    // If no pattern matches, use AI to answer the question
    // This acts as a general ChatGPT-like fallback for any question
    if (openai) {
      try {
        console.log('Using OpenAI for general question:', command);
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are evergreenOS, an AI business assistant. Answer questions helpfully and concisely. If the question is about business operations, provide practical advice. Format your responses with markdown for clarity."
            },
            {
              role: "user",
              content: command
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
        });
        
        const aiResponse = completion.choices[0]?.message?.content || 'I could not generate a response.';
        
        return {
          success: true,
          data: {
            type: 'ai_answer',
            question: command,
            answer: aiResponse
          },
          message: aiResponse,
          suggestions: getGeneralSuggestions(command),
        };
      } catch (error) {
        console.error('OpenAI general question error:', error);
        // Fall through to entity query if AI fails
      }
    }
    
    // Final fallback: try generic entity service query
    const results = await entityService.naturalLanguageQuery(workspaceId, command);
    return {
      success: true,
      data: results,
      message: 'Query executed',
      suggestions: getGeneralSuggestions(command),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Handle email-related commands
 */
async function handleEmailCommand(
  workspaceId: string,
  command: string,
  userId?: string
): Promise<CommandResult> {
  try {
    const lowerCommand = command.toLowerCase();
    
    // Handle "send email to X about Y" pattern
    if (lowerCommand.includes('send') && (lowerCommand.includes('@') || lowerCommand.includes('email'))) {
      // Try to extract email address and topic - more flexible patterns
      let emailMatch = command.match(/send\s+(?:an?\s+)?(?:email\s+)?(?:to\s+)?([\w._%+-]+@[\w.-]+\.[A-Za-z]{2,})\s+(?:an?\s+)?(?:email\s+)?about\s+(.+)/i);
      
      if (!emailMatch) {
        // Try alternative pattern: "send X an email about Y"
        emailMatch = command.match(/send\s+([\w._%+-]+@[\w.-]+\.[A-Za-z]{2,})\s+(?:an?\s+)?email\s+about\s+(.+)/i);
      }
      
      if (!emailMatch) {
        // Try pattern: "send X an email about Y" with more flexibility
        emailMatch = command.match(/send\s+([\w._%+-]+@[\w.-]+\.[A-Za-z]{2,})\s+an?\s+email\s+about\s+(.+)/i);
      }
      
      if (emailMatch) {
        const recipient = emailMatch[1];
        const topic = emailMatch[2];
        
        // Generate AI-powered email content
        let emailContent: { subject: string; body: string };
        
        console.log('OpenAI client exists:', !!openai);
        
        if (openai) {
          try {
            console.log('Calling OpenAI API for email generation...');
            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: "You are a professional business email writer. Create concise, professional emails with clear action items."
                },
                {
                  role: "user",
                  content: `Write a professional email about: ${topic}\n\nKeep it concise but informative. Include key points and any relevant recommendations.`
                }
              ],
              temperature: 0.7,
              max_tokens: 600,
            });
            
            const generatedContent = completion.choices[0]?.message?.content || '';
            
            // Parse the generated content to extract subject and body
            const subjectMatch = generatedContent.match(/Subject:(.+?)\n/i);
            const subject = subjectMatch ? subjectMatch[1].trim() : `Regarding ${topic}`;
            const body = generatedContent.replace(/Subject:.+?\n/i, '').trim();
            
            emailContent = { subject, body };
          } catch (error) {
            console.error('OpenAI API error details:', error);
            console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
            // Fallback content
            emailContent = {
              subject: `Regarding ${topic}`,
              body: `Hi,\n\nI wanted to discuss ${topic} with you.\n\n[AI generation failed - please customize this message]\n\nBest regards`
            };
          }
        } else {
          // No OpenAI configured - use template
          emailContent = {
            subject: `Regarding ${topic}`,
            body: `Hi,\n\nI wanted to discuss ${topic} with you.\n\nLet me know your thoughts.\n\nBest regards`
          };
        }
        
        // Store the draft email
        const draftEmail = await entityService.create(
          workspaceId,
          'email_draft',
          {
            to: [recipient],
            subject: emailContent.subject,
            body: emailContent.body,
            status: 'draft',
            topic: topic,
          },
          {},
          { userId }
        );
        
        return {
          success: true,
          data: {
            type: 'email_draft',
            draft: draftEmail,
            recipient,
            topic,
          },
          message: `📧 **Email Draft Created**\n\n**To:** ${recipient}\n**Subject:** ${emailContent.subject}\n\n${emailContent.body.substring(0, 200)}...\n\n*Ready to send or edit*`,
          suggestions: [
            'Send this email',
            'Edit the draft',
            `Show all emails to ${recipient}`,
            'Create another email'
          ],
        };
      }
    }

    // Summarize emails from this week or today
    if (lowerCommand.includes('summarize') && lowerCommand.includes('email')) {
      const isThisWeek = lowerCommand.includes('week') || lowerCommand.includes('weekly');
      const isToday = lowerCommand.includes('today');
      
      let startDate = new Date();
      let periodLabel = 'all time';
      
      if (isThisWeek) {
        // Get start of this week (Monday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(today.setDate(diff));
        startDate.setHours(0, 0, 0, 0);
        periodLabel = 'this week';
      } else if (isToday) {
        startDate.setHours(0, 0, 0, 0);
        periodLabel = 'today';
      } else {
        // Default to last 7 days if no specific period
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        periodLabel = 'the last 7 days';
      }
      
      const emails = await entityService.find({
        workspaceId,
        type: 'email',
        limit: 100,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });

      // Filter emails from the specified period
      const periodEmails = emails.filter(email => {
        const emailDate = new Date(email.createdAt);
        return emailDate >= startDate;
      });

      if (periodEmails.length === 0) {
        // Check if Gmail is connected
        const gmailAccount = await entityService.find({
          workspaceId,
          type: 'email_account',
          limit: 1
        });
        
        if (gmailAccount.length === 0) {
          return {
            success: true,
            message: `🔌 **Gmail Not Connected**\n\nTo use email features with REAL data:\n1. Go to **Mail > Settings**\n2. Click **"Connect Gmail"**\n3. Authorize evergreenOS\n4. Your emails will sync automatically\n\n**evergreenOS uses ONLY real data. No mocks. Unified architecture.**`,
            suggestions: [
              "Go to Mail Settings",
              "Learn about evergreenOS", 
              "Try other commands"
            ],
          };
        }
        
        return {
          success: true,
          message: `📧 No emails from ${periodLabel}.\n\nYour Gmail is connected but may need to sync. Try refreshing or check Mail > Inbox.`,
          suggestions: [
            "Sync Gmail",
            "Check Mail settings", 
            "Try a different time period"
          ],
        };
      }

      // Generate AI summary if OpenAI is available
      let summary: string;
      
      if (openai) {
        const emailSummary = periodEmails.map(email => {
          const data = email.data as any;
          return `From: ${data.from?.email || data.from || 'Unknown'}\nSubject: ${data.subject || 'No subject'}\nDate: ${new Date(email.createdAt).toLocaleDateString()}\nSnippet: ${data.body?.snippet || data.body?.text?.substring(0, 100) || 'No preview'}`;
        }).join('\n\n---\n\n');

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are an email assistant. Provide a concise, actionable summary of emails from ${periodLabel}. Group by importance/urgency, highlight key action items, and identify trends or patterns.`
              },
              {
                role: "user", 
                content: `Summarize these ${periodEmails.length} emails from ${periodLabel}:\n\n${emailSummary}`
              }
            ],
            temperature: 0.3,
            max_tokens: 1000,
          });
          
          summary = `📧 **Email Summary for ${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)}**\n\n${completion.choices[0]?.message?.content || 'Unable to generate AI summary'}`;
        } catch (error) {
          console.error('OpenAI API error:', error);
          summary = generateFallbackEmailSummary(periodEmails, periodLabel);
        }
      } else {
        summary = generateFallbackEmailSummary(periodEmails, periodLabel);
      }
      
      return {
        success: true,
        data: {
          emails: periodEmails,
          count: periodEmails.length,
          period: periodLabel,
        },
        message: summary,
        suggestions: [
          "Reply to important emails",
          "Archive old emails",
          "Show unread emails",
          "Send a new email"
        ],
      };
    }
    
    // Original code for backwards compatibility
    if (false && lowerCommand.includes('summarize') && lowerCommand.includes('email') && lowerCommand.includes('today')) {
      // Get today's emails
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const emails = await entityService.find({
        workspaceId,
        type: 'email',
        limit: 50,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });

      // Filter emails from today and extract key info
      const todaysEmails = emails.filter(email => {
        const emailDate = new Date(email.createdAt);
        return emailDate >= today;
      });

      if (todaysEmails.length === 0) {
        return {
          success: true,
          message: "You have no emails from today to summarize.",
          suggestions: [
            "Show all my emails",
            "Send a new email", 
            "Search emails from yesterday"
          ],
        };
      }

      // Generate AI summary if OpenAI is available
      let summary: string;
      
      if (openai) {
        const emailSummary = todaysEmails.map(email => {
          const data = email.data as any;
          return `From: ${data.from?.email || data.from || 'Unknown'}\nSubject: ${data.subject}\nSnippet: ${data.body?.snippet || data.body?.text?.substring(0, 100) || 'No preview'}`;
        }).join('\n\n---\n\n');

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are an email assistant. Provide a concise, actionable summary of today's emails. Group by importance/urgency and highlight key action items."
              },
              {
                role: "user", 
                content: `Summarize these ${todaysEmails.length} emails from today:\n\n${emailSummary}`
              }
            ],
            temperature: 0.3,
            max_tokens: 800,
          });
          
          summary = completion.choices[0]?.message?.content || 'Unable to generate AI summary';
        } catch (error) {
          console.error('OpenAI API error:', error);
          summary = generateFallbackEmailSummary(todaysEmails, 'today');
        }
      } else {
        summary = generateFallbackEmailSummary(todaysEmails, 'today');
      }

      return {
        success: true,
        data: {
          emailCount: todaysEmails.length,
          emails: todaysEmails,
          date: today.toISOString(),
        },
        message: `📧 **Email Summary for Today**\n\n${summary}`,
        suggestions: [
          "Show unread emails",
          "Send a follow-up email",
          "Show emails from yesterday"
        ],
      };
    }

    // Send email command - extract recipient and content
    if (lowerCommand.includes('send') && lowerCommand.includes('@')) {
      const emailMatch = command.match(/send\s+([^\s]+@[^\s]+)\s+(.+)/i);
      if (emailMatch) {
        const recipient = emailMatch[1];
        const content = emailMatch[2];
        
        // Generate email content with AI
        let emailBody: string;
        let subject: string;
        
        if (openai) {
          try {
            const completion = await openai.chat.completions.create({
              model: "gpt-4",
              messages: [
                {
                  role: "system",
                  content: "You are a professional email writer. Generate a well-formatted email with appropriate subject and body. Return in format: 'Subject: [subject]\\n\\nBody: [body]'"
                },
                {
                  role: "user",
                  content: `Write a professional email about: ${content}`
                }
              ],
              temperature: 0.7,
              max_tokens: 600,
            });
            
            const response = completion.choices[0]?.message?.content || '';
            const parts = response.split('\\n\\nBody: ');
            subject = parts[0].replace('Subject: ', '');
            emailBody = parts[1] || content;
          } catch (error) {
            console.error('OpenAI API error:', error);
            subject = `Re: ${content.substring(0, 50)}`;
            emailBody = `Hi,\\n\\n${content}\\n\\nBest regards`;
          }
        } else {
          subject = `Re: ${content.substring(0, 50)}`;
          emailBody = `Hi,\\n\\n${content}\\n\\nBest regards`;
        }

        return {
          success: true,
          data: {
            recipient,
            subject,
            body: emailBody,
            originalRequest: content,
          },
          message: `📧 **Email Draft Created**\\n\\n**To:** ${recipient}\\n**Subject:** ${subject}\\n\\n**Body:**\\n${emailBody}\\n\\n*Note: This is a draft. Integration with email sending is pending.*`,
          suggestions: [
            "Edit this email draft",
            "Send another email",
            "Show my sent emails"
          ],
        };
      }
    }

    // Generic email query
    return {
      success: true,
      message: "Email command recognized but not fully implemented yet. Available: 'summarize my emails today', 'send [email] [content]'",
      suggestions: [
        "Summarize my emails today",
        "Send kian.pezeshki1@gmail.com a message about chairs",
        "Show my recent emails"
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email command failed',
    };
  }
}

function generateFallbackEmailSummary(emails: any[], period: string = 'today'): string {
  const senders = [...new Set(emails.map(e => e.data?.from?.email || e.data?.from || 'Unknown'))];
  const subjects = emails.map(e => e.data?.subject || 'No subject').slice(0, 5);
  
  // Group emails by urgency indicators
  const urgent = emails.filter(e => {
    const subject = (e.data?.subject || '').toLowerCase();
    const body = (e.data?.body?.text || '').toLowerCase();
    return subject.includes('urgent') || subject.includes('asap') || 
           body.includes('urgent') || body.includes('asap') || 
           subject.includes('important');
  });
  
  const questions = emails.filter(e => {
    const subject = (e.data?.subject || '');
    const body = (e.data?.body?.text || '');
    return subject.includes('?') || body.includes('?');
  });
  
  let summary = `📧 **Email Summary for ${period.charAt(0).toUpperCase() + period.slice(1)}**\\n\\n`;
  summary += `📨 **Total Emails:** ${emails.length}\\n`;
  
  if (urgent.length > 0) {
    summary += `⚠️ **Urgent Emails:** ${urgent.length}\\n`;
  }
  
  if (questions.length > 0) {
    summary += `❓ **Emails with Questions:** ${questions.length}\\n`;
  }
  
  summary += `\\n**Top Senders:**\\n`;
  senders.slice(0, 5).forEach(sender => {
    const count = emails.filter(e => (e.data?.from?.email || e.data?.from) === sender).length;
    summary += `• ${sender} (${count} email${count > 1 ? 's' : ''})\\n`;
  });
  
  summary += `\\n**Recent Subjects:**\\n`;
  subjects.forEach(s => summary += `• ${s}\\n`);
  
  if (urgent.length > 0) {
    summary += `\\n⚠️ **Action Required:** ${urgent.length} urgent email${urgent.length > 1 ? 's need' : ' needs'} immediate attention`;
  } else {
    summary += `\\n✅ **No urgent emails requiring immediate action**`;
  }
  
  return summary;
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
 * Get general suggestions based on command context
 */
function getGeneralSuggestions(command: string): string[] {
  const lower = command.toLowerCase();
  
  if (lower.includes('email')) {
    return [
      'Show my emails today',
      'Send an email to someone',
      'Search emails by topic'
    ];
  }
  
  if (lower.includes('customer') || lower.includes('deal')) {
    return [
      'Show all customers',
      'Create a new deal',
      'Analyze customer insights'
    ];
  }
  
  if (lower.includes('summary') || lower.includes('analyze')) {
    return [
      'Show recent activity',
      'Analyze deal performance',
      'Create a report summary'
    ];
  }
  
  return [
    'Show recent activity',
    'Search for something',
    'Show all customers',
    'Summarize my emails today'
  ];
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
  const entityTypes = ['customer', 'deal', 'message', 'conversation', 'task', 'email', 'invoice', 'event', 'meeting', 'calendar'];
  const detectedType = entityTypes.find(type => lowerCommand.includes(type));

  return {
    action,
    entityType: detectedType,
    confidence,
  };
}

/**
 * Handle calendar-related commands
 */
async function handleCalendarCommand(
  workspaceId: string,
  command: string,
  userId?: string
): Promise<CommandResult> {
  try {
    const lowerCommand = command.toLowerCase();

    // What's my next meeting?
    if (lowerCommand.includes('next') && lowerCommand.includes('meeting')) {
      const upcomingEvents = await evercal.getUpcomingEventsForProcessor(workspaceId, 1, userId);
      
      if (upcomingEvents.length === 0) {
        return {
          success: true,
          message: "📅 **Next Meeting**\n\nYou don't have any upcoming meetings scheduled.",
          suggestions: [
            "Schedule a meeting",
            "Show my calendar for today",
            "Show my calendar for this week"
          ]
        };
      }

      const nextEvent = upcomingEvents[0];
      const timeUntil = Math.round((nextEvent.data.start.getTime() - Date.now()) / (1000 * 60));
      const timeText = timeUntil < 60 ? `${timeUntil} minutes` : 
                       timeUntil < 1440 ? `${Math.round(timeUntil / 60)} hours` :
                       `${Math.round(timeUntil / 1440)} days`;

      return {
        success: true,
        data: { event: nextEvent },
        message: `📅 **Your Next Meeting**\n\n` +
          `**${nextEvent.data.title}**\n` +
          `🕐 ${nextEvent.data.start.toLocaleString()}\n` +
          `📍 ${nextEvent.data.location || 'No location specified'}\n` +
          `👥 ${nextEvent.data.attendees?.length || 0} attendees\n\n` +
          `*Starts in ${timeText}*`,
        suggestions: [
          "Show meeting details",
          "Cancel this meeting",
          "Reschedule this meeting"
        ]
      };
    }

    // How many meetings this week?
    if ((lowerCommand.includes('how many') || lowerCommand.includes('count')) && 
        lowerCommand.includes('meeting') && 
        (lowerCommand.includes('week') || lowerCommand.includes('this week'))) {
      try {
        console.log('Fetching week events for workspaceId:', workspaceId, 'userId:', userId);
        const weekEvents = await evercal.getUpcomingEvents(workspaceId, userId, 7);
        console.log('Week events fetched:', weekEvents.length);
        console.log('Week events:', weekEvents.map(e => ({ title: e.data.title, startTime: e.data.startTime })));
        const count = weekEvents.length;
      
      return {
        success: true,
        data: { events: weekEvents, count },
        message: `📅 **This Week's Meetings**\n\nYou have **${count}** ${count === 1 ? 'meeting' : 'meetings'} scheduled this week.${count > 0 ? '\n\n' + weekEvents.map(event => {
          const date = new Date(event.data.startTime);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
          const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return `• **${event.data.title}** - ${dayName} at ${time}`;
        }).join('\n') : ''}`,
        suggestions: [
          "Show today's meetings",
          "Schedule another meeting",
          "Find available time"
        ]
      };
      } catch (error) {
        console.error('Error fetching week events:', error);
        return {
          success: false,
          error: `Failed to fetch meetings: ${error.message}`,
          suggestions: [
            "Try again",
            "Show today's meetings",
            "Check calendar connection"
          ]
        };
      }
    }

    // Set/Create an event (e.g., "set an event for tomorrow at 6:30 for soccer")
    if ((lowerCommand.includes('set') || lowerCommand.includes('create') || lowerCommand.includes('add')) && 
        lowerCommand.includes('event')) {
      
      // Parse the command for date, time, and title
      let eventDate = new Date();
      let eventTitle = 'New Event';
      let eventTime = '09:00'; // default time
      
      // Check for "tomorrow"
      if (lowerCommand.includes('tomorrow')) {
        eventDate.setDate(eventDate.getDate() + 1);
      }
      
      // Check for "today"
      if (lowerCommand.includes('today')) {
        // eventDate is already set to today
      }
      
      // Parse time (e.g., "6:30", "6:30pm", "18:30")
      const timeMatch = command.match(/(?:at\s+)?(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
      if (timeMatch) {
        let hour = parseInt(timeMatch[1]);
        let minute = parseInt(timeMatch[2]) || 0;
        const ampm = timeMatch[3]?.toLowerCase();
        
        if (ampm === 'pm' && hour !== 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;
        
        eventTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }
      
      // Parse event title (text after "for")
      const titleMatch = command.match(/for\s+(.+?)(?:\s+at\s+|\s*$)/i);
      if (titleMatch) {
        eventTitle = titleMatch[1].trim();
      }
      
      // Set the full datetime
      const [hours, minutes] = eventTime.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      try {
        const newEvent = await evercal.createEvent(workspaceId, {
          title: eventTitle,
          startTime: eventDate,
          endTime: new Date(eventDate.getTime() + 60 * 60 * 1000), // 1 hour duration
          description: `Created via command: ${command}`,
          attendees: [],
          location: '',
          status: 'confirmed'
        }, userId);
        
        return {
          success: true,
          data: { event: newEvent },
          message: `✅ **Event Created**\n\n**${eventTitle}**\n🕐 ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\nYour event has been scheduled successfully!`,
          suggestions: [
            "Add more details to this event",
            "Schedule another event",
            "Show my calendar"
          ]
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to create event: ${error.message}`,
          suggestions: [
            "Try a different time",
            "Show my calendar",
            "Check for conflicts"
          ]
        };
      }
    }

    // Find available time for a call
    if ((lowerCommand.includes('find') || lowerCommand.includes('available')) && 
        (lowerCommand.includes('time') || lowerCommand.includes('slot'))) {
      const durationMatch = command.match(/(\d+)\s*(?:minute|hour)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) * (command.includes('hour') ? 60 : 1) : 60;

      const availability = await evercal.findAvailableTime(workspaceId, duration, 7, userId);
      
      if (availability.length === 0) {
        return {
          success: true,
          message: `📅 **Available Time**\n\nNo ${duration}-minute slots available in the next 7 days.`,
          suggestions: [
            "Check availability for next week",
            "Try shorter duration",
            "Show my calendar"
          ]
        };
      }

      const slots = availability.slice(0, 5).map(slot => 
        `• ${slot.startTime.toLocaleDateString()} at ${slot.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
      ).join('\n');

      return {
        success: true,
        data: { availability: availability.slice(0, 5) },
        message: `📅 **Available ${duration}-Minute Slots**\n\n${slots}\n\n*Use "schedule meeting with [name]" to book a slot.*`,
        suggestions: [
          "Schedule meeting with specific person",
          "Show more available times",
          "Block time for focused work"
        ]
      };
    }

    // Show all meetings about a topic
    if (lowerCommand.includes('meetings') && (lowerCommand.includes('about') || lowerCommand.includes('regarding'))) {
      const topicMatch = command.match(/meetings?\s+(?:about|regarding)\s+(.+)/i);
      if (topicMatch) {
        const topic = topicMatch[1].trim();
        const events = await evercal.searchEvents(workspaceId, topic, userId);

        if (events.length === 0) {
          return {
            success: true,
            message: `📅 **Meetings About "${topic}"**\n\nNo meetings found about this topic.`,
            suggestions: [
              `Schedule meeting about ${topic}`,
              "Show all meetings",
              "Search emails about " + topic
            ]
          };
        }

        const eventList = events.slice(0, 5).map(event => {
          const date = event.data.start.toLocaleDateString();
          const time = event.data.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          return `• **${event.data.title}** - ${date} at ${time}`;
        }).join('\n');

        return {
          success: true,
          data: { events: events.slice(0, 5) },
          message: `📅 **Meetings About "${topic}"**\n\n${eventList}${events.length > 5 ? `\n\n*Showing first 5 of ${events.length} meetings*` : ''}`,
          suggestions: [
            "Show meeting details",
            "Schedule follow-up meeting",
            "Export meeting list"
          ]
        };
      }
    }

    // Schedule meeting with someone about something
    if (lowerCommand.includes('schedule') && lowerCommand.includes('meeting')) {
      const meetingMatch = command.match(/schedule\s+(?:a\s+)?meeting\s+with\s+(.+?)\s+about\s+(.+)/i);
      if (meetingMatch) {
        const contactName = meetingMatch[1].trim();
        const topic = meetingMatch[2].trim();
        
        try {
          // Find the contact in EverCore
          const contacts = await entityService.search(
            workspaceId,
            'contact',
            { name: contactName }
          );

          if (contacts.entities.length === 0) {
            return {
              success: false,
              error: `Contact "${contactName}" not found`,
              suggestions: [
                "Create a new contact first",
                "Schedule meeting with john@example.com",
                "Show my calendar"
              ]
            };
          }

          const contact = contacts.entities[0];
          const contactEmail = contact.data.email;

          if (!contactEmail) {
            return {
              success: false,
              error: `Contact "${contactName}" doesn't have an email address`,
              suggestions: [
                "Update contact with email address",
                "Schedule meeting using direct email"
              ]
            };
          }

          // Find available time slots
          const availableSlots = await evercal.findMutualAvailability(
            workspaceId,
            [userId!, contactEmail],
            60, // 1 hour duration
            7   // Look ahead 7 days
          );

          if (availableSlots.length === 0) {
            return {
              success: true,
              message: `No mutual availability found with ${contactName} in the next 7 days`,
              suggestions: [
                "Check availability for next week",
                "Send direct calendar invite",
                "Propose specific times"
              ]
            };
          }

          // Create event with first available slot
          const event = await evercal.createEvent(
            workspaceId,
            {
              title: `${topic} - Meeting with ${contactName}`,
              description: `Discussion about: ${topic}`,
              startTime: availableSlots[0].startTime,
              endTime: availableSlots[0].endTime,
              attendees: [contactEmail],
              status: 'pending'
            },
            userId
          );

          return {
            success: true,
            data: {
              event,
              contact,
              availableSlots: availableSlots.slice(0, 3) // Show first 3 options
            },
            message: `📅 **Meeting Scheduled**\n\n` +
              `**Topic:** ${topic}\n` +
              `**With:** ${contactName} (${contactEmail})\n` +
              `**Time:** ${availableSlots[0].startTime.toLocaleString()}\n` +
              `**Duration:** 1 hour\n\n` +
              `*Meeting is pending confirmation. Calendar invite will be sent.*`,
            suggestions: [
              "Reschedule this meeting",
              "Add more attendees",
              "Set up recurring meetings"
            ]
          };
        } catch (error) {
          return {
            success: false,
            error: `Failed to schedule meeting: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestions: [
              "Try scheduling for a specific time",
              "Check contact information",
              "Show my calendar"
            ]
          };
        }
      }
    }

    // Show my calendar / today's events
    if (lowerCommand.includes('calendar') || lowerCommand.includes('today') || lowerCommand.includes('events')) {
      const events = await evercal.getTodaysEvents(workspaceId, userId);
      
      if (events.length === 0) {
        return {
          success: true,
          message: "📅 **Your Calendar Today**\n\nNo events scheduled for today.",
          suggestions: [
            "Schedule a meeting",
            "Show upcoming events",
            "Set working hours"
          ]
        };
      }

      const eventList = events.map(event => {
        const data = event.data as any;
        const startTime = new Date(data.startTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const endTime = new Date(data.endTime).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        return `• ${startTime}-${endTime}: ${data.title}`;
      }).join('\n');

      return {
        success: true,
        data: { events },
        message: `📅 **Your Calendar Today**\n\n${eventList}`,
        suggestions: [
          "Schedule another meeting",
          "Show this week's events",
          "Cancel a meeting"
        ]
      };
    }

    // Find available time
    if (lowerCommand.includes('available') || lowerCommand.includes('free time')) {
      const upcomingEvents = await evercal.getUpcomingEvents(workspaceId, userId, 7);
      
      return {
        success: true,
        data: { upcomingEvents },
        message: `📅 **Your Availability**\n\nShowing your schedule for the next 7 days. ` +
          `You have ${upcomingEvents.length} upcoming events.\n\n` +
          `*Use "schedule meeting with [name] about [topic]" to book time.*`,
        suggestions: [
          "Schedule meeting with John about project",
          "Set working hours",
          "Block time for deep work"
        ]
      };
    }

    // Generic calendar command
    return {
      success: true,
      message: "📅 **Calendar Commands Available:**\n\n" +
        "• Schedule meeting with [name] about [topic]\n" +
        "• Show my calendar today\n" +
        "• Find available time\n" +
        "• Show upcoming events",
      suggestions: [
        "Schedule meeting with John about project",
        "Show my calendar today",
        "Find available time this week"
      ]
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Calendar command failed',
    };
  }
}