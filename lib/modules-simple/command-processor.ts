/**
 * Simplified Command Processor v2
 * Let OpenAI handle the thinking, we just execute
 */

import OpenAI from 'openai';
import { entityService } from '@/lib/entities/entity-service';
import {
  fetchEmails,
  calculateEmailStats,
  formatEmailsForDisplay,
  identifyImportantEmails,
  getSenderAnalytics,
  generateFollowUpSuggestions,
  getDatabaseUserId,
  parseTimeframe
} from './email-helpers';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL
});

interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// System prompt that teaches GPT how to handle commands
const SYSTEM_PROMPT = `You are evergreenOS, an AI business assistant. 

When users give commands, analyze their intent and respond with a JSON object:
{
  "action": "email" | "calendar" | "crm" | "chat" | "search" | "answer",
  "parameters": { ... },
  "response": "Markdown formatted response to show the user"
}

For email actions, parameters should include:
- command: "send" | "draft" | "summarize" | "list" | "search"
- to: email address (for send/draft)
- subject: email subject (for send/draft)
- body: email body (for send/draft)
- query: search term (for search)

Examples:
- "summarize my emails" -> action: "email", command: "summarize"
- "send email to john@example.com" -> action: "email", command: "send", to: "john@example.com"
- "show my emails" -> action: "email", command: "list"

For calendar actions:
- command: "create" | "find" | "list"
- title, date, duration, attendees (for create)

For CRM actions:
- entity: "contact" | "deal" | "company"
- command: "create" | "list" | "search" | "analyze"

For general questions, use action "answer".

IMPORTANT: Keep responses concise and under 200 characters.`;

/**
 * Main command processor - simplified to ~100 lines
 */
export async function processCommand(
  workspaceId: string,
  command: string,
  userId?: string
): Promise<CommandResult> {
  try {
    // Quick test for basic functionality
    if (command.toLowerCase() === 'test') {
      return {
        success: true,
        message: "✅ evergreenOS is working! I can help you with emails, calendar, contacts, and more.",
        data: { type: 'test' }
      };
    }
    // Step 1: Let OpenAI analyze the command
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use faster model for better response
      messages: [
        { 
          role: "system", 
          content: `You are evergreenOS. Analyze commands and return JSON.

Rules:
- If the command contains "email" or "mail" -> action: "email"
- If the command contains "calendar" or "meeting" -> action: "calendar"
- If the command contains "contact" or "deal" -> action: "crm"
- Otherwise -> action: "answer"

Email commands:
- "summarize my emails" -> {"action":"email","parameters":{"command":"summarize"},"response":"Analyzing your emails..."}
- "summarize my emails this week" -> {"action":"email","parameters":{"command":"summarize","timeframe":"this week"},"response":"Analyzing this week's emails..."}
- "show my emails today" -> {"action":"email","parameters":{"command":"list","timeframe":"today"},"response":"Loading today's emails..."}
- "any urgent emails?" -> {"action":"email","parameters":{"command":"list","query":"urgent"},"response":"Checking for urgent emails..."}
- "who emails me the most?" -> {"action":"email","parameters":{"command":"analytics","query":"who emails"},"response":"Analyzing email senders..."}

For email draft/send commands like "send email to john@example.com about puma":
- Extract the ACTUAL email address (not "X"), e.g., "john@example.com"
- Extract the ACTUAL topic (not "Y"), e.g., "puma"
- Return: {"action":"email","parameters":{"command":"draft","to":"john@example.com","topic":"puma"},"response":"Drafting email..."}

Examples:
- "send email to kian.pezeshki1@gmail about puma" -> {"action":"email","parameters":{"command":"draft","to":"kian.pezeshki1@gmail.com","topic":"puma"},"response":"Drafting email..."}
- "email sarah@company.com about the project update" -> {"action":"email","parameters":{"command":"draft","to":"sarah@company.com","topic":"the project update"},"response":"Drafting email..."}
- "send an email to bob@test.org regarding meeting tomorrow" -> {"action":"email","parameters":{"command":"draft","to":"bob@test.org","topic":"meeting tomorrow"},"response":"Drafting email..."}

CRITICAL: Return ONLY the JSON object, no other text.`
        },
        { role: "user", content: command }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    // Try to fix truncated JSON
    let responseText = completion.choices[0].message.content || '{}';
    
    // Try to extract JSON from the response (sometimes GPT adds text around it)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }
    
    // Common fixes for truncated JSON
    if (!responseText.includes('}]') && responseText.includes('[')) {
      responseText = responseText.replace(/,\s*$/, '') + ']}';
    }
    if (!responseText.endsWith('}')) {
      responseText = responseText + '}';
    }
    
    const aiResponse = JSON.parse(responseText);
    
    // Debug logging for email commands
    if (command.toLowerCase().includes('email') || command.toLowerCase().includes('send')) {
      console.log('Email command detected:', command);
      console.log('Parsed response:', aiResponse);
    }
    
    // Ensure response has required fields
    if (!aiResponse.response) {
      aiResponse.response = 'Processing your request...';
    }
    if (!aiResponse.parameters) {
      aiResponse.parameters = {};
    }
    
    // Step 2: Execute the action based on AI's decision
    switch (aiResponse.action) {
      case 'email':
        return await handleEmail(workspaceId, aiResponse.parameters, userId, aiResponse.response);
      
      case 'calendar':
        return await handleCalendar(workspaceId, aiResponse.parameters, userId, aiResponse.response);
      
      case 'crm':
        return await handleCRM(workspaceId, aiResponse.parameters, userId, aiResponse.response);
      
      case 'search':
        const results = await entityService.find({
          workspaceId,
          search: aiResponse.parameters.query,
          limit: 20
        });
        return {
          success: true,
          message: aiResponse.response,
          data: results
        };
      
      case 'answer':
      default:
        return {
          success: true,
          message: aiResponse.response || 'I understand your request. Let me help you with that.',
          data: { type: 'ai_answer' }
        };
    }
  } catch (error) {
    console.error('Command processing error:', error);
    
    // Fallback to basic OpenAI response if JSON parsing fails
    try {
      const fallback = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are evergreenOS. Answer helpfully and concisely." },
          { role: "user", content: command }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      return {
        success: true,
        message: fallback.choices[0].message.content || "I couldn't process that command."
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: 'Failed to process command',
        message: 'I encountered an error processing your request. Please try again.'
      };
    }
  }
}

// Simplified email handler
async function handleEmail(workspaceId: string, params: any, userId?: string, aiResponse: string): Promise<CommandResult> {
  // Handle email draft generation
  if (params.command === 'draft' && params.to && params.topic) {
    try {
      // Fix common email typos - add .com if missing
      let emailAddress = params.to;
      if (emailAddress.includes('@') && !emailAddress.includes('.')) {
        // If there's an @ but no dot, assume .com was forgotten
        emailAddress = emailAddress + '.com';
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailAddress)) {
        return {
          success: false,
          message: `❌ Invalid email address: "${params.to}"\n\nPlease provide a valid email address with format: name@domain.com`,
          data: { type: 'error' }
        };
      }
      
      // Check if topic is too vague
      if (!params.topic || params.topic.trim().length < 3) {
        return {
          success: false,
          message: `❌ Please provide more details about what the email should be about.\n\nTry something like:\n- "Send email to ${params.to} about project update"\n- "Email ${params.to} regarding meeting schedule"`,
          data: { type: 'error' }
        };
      }
      
      // Generate email content using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional email assistant. Generate a well-structured email about the given topic.
            
Format the response as JSON with these fields:
- subject: Professional subject line
- body: Email body with proper formatting (use \\n for line breaks)
- bodyHtml: HTML formatted version of the email

Keep the tone professional but friendly. Include:
1. Appropriate greeting
2. Clear main message about the topic
3. Professional closing
4. Signature placeholder

The email should be concise and to the point.`
          },
          {
            role: "user",
            content: `Write an email to ${emailAddress} about: ${params.topic}`
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const emailContent = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Return draft email response for dashboard to render
      return {
        success: true,
        message: `## Email Draft\n\n**To:** ${emailAddress}\n**Subject:** ${emailContent.subject}\n\n${emailContent.body}`,
        data: {
          type: 'draft_email',
          draft: {
            to: emailAddress,
            subject: emailContent.subject || `Regarding: ${params.topic}`,
            body: emailContent.body || `Dear recipient,\n\nI wanted to reach out about ${params.topic}.\n\nBest regards`,
            bodyHtml: emailContent.bodyHtml || emailContent.body,
            topic: params.topic
          }
        }
      };
    } catch (error) {
      console.error('Email draft generation error:', error);
      return {
        success: false,
        error: 'Failed to generate email draft',
        message: 'I couldn\'t generate an email draft. Please try again.'
      };
    }
  }
  
  if (params.command === 'summarize' || params.command === 'list') {
    try {
      // Get database user ID if Clerk user ID provided
      let dbUserId = null;
      if (userId) {
        dbUserId = await getDatabaseUserId(userId);
      }
      
      // Extract timeframe from parameters or default to "this week"
      const timeframe = params.timeframe || params.query || 'this week';
      
      // Fetch real emails with user isolation
      const emails = await fetchEmails(workspaceId, dbUserId, timeframe, 100);
      
      if (emails.length === 0) {
        return { 
          success: true, 
          message: "📧 You don't have any emails to show. Try connecting your Gmail account in Mail Settings.",
          data: { type: 'email_summary', count: 0 }
        };
      }
      
      // Calculate statistics
      const stats = calculateEmailStats(emails);
      
      // Format emails for display
      const formattedEmails = formatEmailsForDisplay(emails, 5);
      
      // Identify important emails
      const importantEmails = identifyImportantEmails(emails);
      const importantFormatted = formatEmailsForDisplay(importantEmails, 3);
      
      // Generate follow-up suggestions
      const suggestions = generateFollowUpSuggestions(emails, stats);
      
      // Create rich summary message
      let summaryMessage = `## 📧 Email Summary: ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}\n\n`;
      summaryMessage += `You have **${stats.total} emails**`;
      
      if (stats.unread > 0) {
        summaryMessage += ` (${stats.unread} unread)`;
      }
      
      const uniqueSenders = new Set(emails.map(e => e.data?.from?.email)).size;
      summaryMessage += ` from ${uniqueSenders} ${uniqueSenders === 1 ? 'person' : 'people'}.\n\n`;
      
      // Add priority emails section if there are important ones
      if (importantFormatted.length > 0) {
        summaryMessage += `**Priority Emails:**\n`;
        importantFormatted.forEach(email => {
          const icon = email.priority === 'high' ? '🔴' : email.priority === 'low' ? '⚪' : '🟡';
          summaryMessage += `${icon} **${email.from.name}** - ${email.subject} (${email.timestamp})\n`;
        });
        summaryMessage += '\n';
      }
      
      // Add key stats
      summaryMessage += `**Key Stats:**\n`;
      if (stats.needingResponse > 0) {
        summaryMessage += `• ${stats.needingResponse} emails need responses\n`;
      }
      if (stats.fromVIPs > 0) {
        summaryMessage += `• ${stats.fromVIPs} from VIP contacts\n`;
      }
      if (stats.unread > 0) {
        summaryMessage += `• ${stats.unread} unread messages\n`;
      }
      summaryMessage += '\n';
      
      // Add suggestions
      if (suggestions.length > 0) {
        summaryMessage += `💡 Try: "${suggestions[0]}"`;
      }
      
      return { 
        success: true, 
        message: summaryMessage,
        data: { 
          type: 'email_summary',
          stats,
          emails: formattedEmails,
          suggestions,
          actions: [
            { type: 'button', label: 'Open EverMail', action: 'navigate', url: '/mail/inbox' },
            { type: 'button', label: 'Compose New', action: 'navigate', url: '/mail/compose' }
          ]
        }
      };
    } catch (error) {
      console.error('Email summarization error:', error);
      return { 
        success: true, 
        message: "I couldn't fetch your emails right now. Please try again or check your Gmail connection.",
        data: { type: 'error' }
      };
    }
  }
  
  // Handle "who emails me the most" analytics
  if (params.command === 'analytics' || params.query?.includes('who emails')) {
    try {
      let dbUserId = null;
      if (userId) {
        dbUserId = await getDatabaseUserId(userId);
      }
      
      const senderAnalytics = await getSenderAnalytics(workspaceId, dbUserId, 5);
      
      if (senderAnalytics.length === 0) {
        return {
          success: true,
          message: "📊 No email data available yet. Connect your Gmail account to see analytics.",
          data: { type: 'email_analytics' }
        };
      }
      
      let message = `## 📊 Email Analytics\n\n**Top Senders:**\n`;
      senderAnalytics.forEach((sender, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} **${sender.sender}** - ${sender.count} emails\n`;
      });
      
      return {
        success: true,
        message,
        data: { 
          type: 'email_analytics',
          senders: senderAnalytics 
        }
      };
    } catch (error) {
      console.error('Email analytics error:', error);
      return {
        success: true,
        message: "I couldn't analyze your email data right now. Please try again.",
        data: { type: 'error' }
      };
    }
  }
  
  // Handle urgent/important email queries
  if (params.query?.includes('urgent') || params.query?.includes('important')) {
    try {
      let dbUserId = null;
      if (userId) {
        dbUserId = await getDatabaseUserId(userId);
      }
      
      const emails = await fetchEmails(workspaceId, dbUserId, 'this week', 50);
      const importantEmails = identifyImportantEmails(emails);
      
      if (importantEmails.length === 0) {
        return {
          success: true,
          message: "✅ No urgent emails right now. You're all caught up!",
          data: { type: 'email_urgent' }
        };
      }
      
      const formatted = formatEmailsForDisplay(importantEmails, 5);
      let message = `## 🚨 Urgent/Important Emails\n\n`;
      message += `You have **${importantEmails.length} important emails** to review:\n\n`;
      
      formatted.forEach(email => {
        message += `🔴 **${email.from.name}** - ${email.subject}\n`;
        message += `   ${email.preview.substring(0, 80)}...\n`;
        message += `   _${email.timestamp}_\n\n`;
      });
      
      return {
        success: true,
        message,
        data: { 
          type: 'email_urgent',
          emails: formatted 
        }
      };
    } catch (error) {
      console.error('Urgent email check error:', error);
      return {
        success: true,
        message: "I couldn't check for urgent emails right now. Please try again.",
        data: { type: 'error' }
      };
    }
  }
  
  // Handle actual sending of email (called when user clicks Send button)
  if (params.command === 'send' && params.to && params.subject && params.body) {
    try {
      const { GmailClient } = await import('@/lib/evermail/gmail-client');
      const gmail = new GmailClient();
      
      await gmail.sendEmail({
        to: params.to,
        subject: params.subject,
        body: params.body,
        workspaceId,
        userId
      });
      
      return { 
        success: true, 
        message: `✅ Email sent successfully to ${params.to}!`,
        data: { type: 'email_sent' }
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { 
        success: false, 
        error: 'Failed to send email', 
        message: 'Unable to send email. Please make sure your Gmail account is connected in Mail Settings.' 
      };
    }
  }
  
  return { success: true, message: aiResponse };
}

// Simplified calendar handler
async function handleCalendar(workspaceId: string, params: any, userId?: string, aiResponse: string): Promise<CommandResult> {
  if (params.command === 'create') {
    try {
      const evercal = await import('./evercal');
      const event = await evercal.createEvent(workspaceId, {
        title: params.title,
        startTime: new Date(params.date),
        endTime: new Date(new Date(params.date).getTime() + (params.duration || 60) * 60000),
        attendees: params.attendees || [],
        description: params.description || '',
        location: params.location || '',
        status: 'confirmed'
      }, userId);
      
      return { success: true, message: aiResponse, data: event };
    } catch (error) {
      return { success: false, error: 'Failed to create event', message: aiResponse };
    }
  }
  
  return { success: true, message: aiResponse };
}

// Simplified CRM handler
async function handleCRM(workspaceId: string, params: any, userId?: string, aiResponse: string): Promise<CommandResult> {
  const evercore = await import('./evercore');
  const result = await evercore.handleCoreCommand(workspaceId, params.query || '', userId);
  
  return {
    success: !result.error,
    message: aiResponse,
    data: result
  };
}

export default { processCommand };