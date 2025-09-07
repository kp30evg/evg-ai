/**
 * Simplified Command Processor v2
 * Let OpenAI handle the thinking, we just execute
 */

import OpenAI from 'openai';
import { entityService } from '@/lib/entities/entity-service';

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
- "summarize my emails" -> {"action":"email","parameters":{"command":"summarize"},"response":"Checking your emails..."}
- "show my emails" -> {"action":"email","parameters":{"command":"list"},"response":"Loading your emails..."}
- "send email to X" -> {"action":"email","parameters":{"command":"send","to":"X"},"response":"Preparing email..."}

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
  if (params.command === 'summarize') {
    try {
      // Get emails from database (don't filter by user for now)
      const emails = await entityService.find({
        workspaceId,
        type: 'email',
        limit: 10 // Get recent emails
      });
      
      if (emails.length === 0) {
        return { 
          success: true, 
          message: "You don't have any emails to summarize. Try connecting your Gmail account first.",
          data: { type: 'email_summary', count: 0 }
        };
      }
      
      // Format email data for summary
      const emailSummary = emails.map((e: any) => ({
        subject: e.data?.subject || 'No subject',
        from: e.data?.from?.email || 'Unknown',
        date: e.createdAt
      }));
      
      // Create a proper summary message
      const summaryMessage = `## Email Summary\n\nYou have **${emails.length} recent emails**.\n\n**Latest emails:**\n${emailSummary.slice(0, 5).map(e => 
        `- **${e.subject}** from ${e.from}`
      ).join('\n')}`;
      
      return { 
        success: true, 
        message: summaryMessage,
        data: { type: 'email_summary', emails: emailSummary }
      };
    } catch (error) {
      console.error('Email summarization error:', error);
      return { success: false, error: 'Failed to summarize emails', message: aiResponse };
    }
  }
  
  if (params.command === 'send' && params.to) {
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
      
      return { success: true, message: aiResponse };
    } catch (error) {
      return { success: false, error: 'Failed to send email', message: aiResponse };
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