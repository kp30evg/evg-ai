import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { GmailClient } from './gmail-client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface CommandContext {
  companyId: string;
  userId: string;
  userEmail: string;
}

interface ParsedCommand {
  action: 'SEND_EMAIL' | 'SEARCH_EMAILS' | 'SUMMARIZE' | 'DRAFT_REPLY' | 'SCHEDULE_EMAIL' | 'BULK_ACTION' | 
          'SHOW_EMAILS' | 'COMPOSE' | 'FORWARD' | 'EXTRACT_INFO' | 'ANALYZE' | 'QUICK_ACTION' | 'UNKNOWN';
  parameters: any;
  originalCommand: string;
}

export class EmailCommandProcessor {
  async processCommand(command: string, context: CommandContext, confirmation?: any) {
    try {
      // Check if this is a confirmation response
      if (confirmation?.action === 'send' && confirmation?.draft) {
        return await this.sendDraftEmail(confirmation.draft, context);
      }
      
      // Parse the command using OpenAI
      const parsed = await this.parseCommand(command);
      
      // Execute based on the action
      switch (parsed.action) {
        case 'SEND_EMAIL':
        case 'COMPOSE':
          return await this.handleSendEmail(parsed.parameters, context);
        case 'SEARCH_EMAILS':
        case 'SHOW_EMAILS':
          return await this.handleSearchEmails(parsed.parameters, context);
        case 'SUMMARIZE':
          return await this.handleSummarize(parsed.parameters, context);
        case 'DRAFT_REPLY':
          return await this.handleDraftReply(parsed.parameters, context);
        case 'FORWARD':
          return await this.handleForward(parsed.parameters, context);
        case 'BULK_ACTION':
        case 'QUICK_ACTION':
          return await this.handleBulkAction(parsed.parameters, context);
        case 'EXTRACT_INFO':
          return await this.handleExtractInfo(parsed.parameters, context);
        case 'ANALYZE':
          return await this.handleAnalyze(parsed.parameters, context);
        default:
          return {
            type: 'error',
            message: "I couldn't understand that command. Try something like 'Email john@example.com about the meeting' or 'Show me unread emails from this week'."
          };
      }
    } catch (error) {
      console.error('Command processing error:', error);
      return {
        type: 'error',
        message: 'Sorry, I encountered an error processing your request.'
      };
    }
  }
  
  private async parseCommand(command: string): Promise<ParsedCommand> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: `You are an email command parser. Parse the user's command and determine the action and parameters.
        
Actions:
- SHOW_EMAILS: Show/display emails (inbox, unread, today's, important, with attachments)
- SEARCH_EMAILS: Search/find specific emails by criteria
- SEND_EMAIL/COMPOSE: Send or compose new email
- DRAFT_REPLY: Reply to an existing email
- FORWARD: Forward an email to someone
- SUMMARIZE: Summarize emails or conversations
- ANALYZE: Analyze emails (urgent, needs response, commitments, sentiment)
- BULK_ACTION/QUICK_ACTION: Actions on multiple emails (archive, delete, mark read/unread, star)
- EXTRACT_INFO: Extract specific information (action items, emails, phone numbers, meeting requests)

Extract relevant parameters like:
- Recipients (to, cc, bcc)
- Subject and body content
- Search criteria (from, keywords, date range, read/unread, important, attachments)
- Time references (today, yesterday, this week, last month, etc.)
- Specific filters (urgent, needs response, angry/frustrated)
- Extraction targets (action items, contact info, meeting requests)`
      }, {
        role: 'user',
        content: command
      }],
      functions: [{
        name: 'parse_email_command',
        description: 'Parse an email command',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['SEND_EMAIL', 'SEARCH_EMAILS', 'SUMMARIZE', 'DRAFT_REPLY', 'BULK_ACTION', 
                     'SHOW_EMAILS', 'COMPOSE', 'FORWARD', 'EXTRACT_INFO', 'ANALYZE', 'QUICK_ACTION', 'UNKNOWN']
            },
            parameters: {
              type: 'object',
              properties: {
                to: { type: 'array', items: { type: 'string' } },
                cc: { type: 'array', items: { type: 'string' } },
                subject: { type: 'string' },
                body: { type: 'string' },
                searchQuery: { type: 'string' },
                from: { type: 'string' },
                dateRange: { type: 'string' },
                folder: { type: 'string' },
                isRead: { type: 'boolean' },
                hasAttachments: { type: 'boolean' },
                isImportant: { type: 'boolean' },
                isStarred: { type: 'boolean' },
                bulkAction: { type: 'string' },
                emailId: { type: 'string' },
                extractionType: { type: 'string', enum: ['action_items', 'email_addresses', 'phone_numbers', 'meeting_requests'] },
                analysisType: { type: 'string', enum: ['needs_response', 'urgent', 'sentiment', 'commitments'] },
                replyIntent: { type: 'string' },
                needsResponse: { type: 'boolean' }
              }
            }
          },
          required: ['action', 'parameters']
        }
      }],
      function_call: { name: 'parse_email_command' }
    });
    
    const parsed = JSON.parse(response.choices[0].message.function_call?.arguments || '{}');
    return {
      action: parsed.action || 'UNKNOWN',
      parameters: parsed.parameters || {},
      originalCommand: command
    };
  }
  
  private async handleSendEmail(params: any, context: CommandContext) {
    // Generate email content if needed
    let emailContent = params.body;
    
    if (!emailContent && params.subject) {
      // Use AI to generate email body
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: 'You are a professional email writer. Write clear, concise, and friendly emails.'
        }, {
          role: 'user',
          content: `Write an email about: ${params.subject}
To: ${params.to?.join(', ')}
Keep it professional but friendly.`
        }]
      });
      
      emailContent = response.choices[0].message.content;
    }
    
    // Create draft for user to review
    const draft = {
      to: params.to || [],
      cc: params.cc || [],
      subject: params.subject || 'Draft Email',
      body: emailContent || '',
      isDraft: true
    };
    
    return {
      type: 'draft_email',
      message: "I've created a draft for you to review:",
      draft,
      actions: [
        { type: 'send', label: 'Send Email', primary: true },
        { type: 'edit', label: 'Edit Draft' },
        { type: 'cancel', label: 'Cancel' }
      ],
      requiresConfirmation: true
    };
  }
  
  private async handleSearchEmails(params: any, context: CommandContext) {
    // Build query based on parameters
    let query = db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.companyId, context.companyId),
          eq(entities.type, 'email')
        )
      );
    
    // Apply search filters
    if (params.from) {
      query = query.where(
        sql`data->'from'->>'email' ILIKE ${`%${params.from}%`}`
      );
    }
    
    if (params.searchQuery) {
      query = query.where(
        sql`(data->>'subject' ILIKE ${`%${params.searchQuery}%`} OR 
             data->'body'->>'text' ILIKE ${`%${params.searchQuery}%`})`
      );
    }
    
    if (params.isRead !== undefined) {
      query = query.where(
        sql`(data->>'isRead')::boolean = ${params.isRead}`
      );
    }
    
    if (params.hasAttachments) {
      query = query.where(
        sql`jsonb_array_length(data->'attachments') > 0`
      );
    }
    
    if (params.isImportant || params.isStarred) {
      query = query.where(
        sql`(data->>'isStarred')::boolean = true OR (data->>'isImportant')::boolean = true`
      );
    }
    
    if (params.needsResponse) {
      query = query.where(
        sql`data->'from'->>'email' != ${context.userEmail} AND (data->>'isRead')::boolean = true`
      );
    }
    
    // Parse date range
    if (params.dateRange) {
      const dateFilter = this.parseDateRange(params.dateRange);
      if (dateFilter) {
        query = query.where(
          sql`(data->>'sentAt')::timestamp >= ${dateFilter.from} AND 
              (data->>'sentAt')::timestamp <= ${dateFilter.to}`
        );
      }
    }
    
    const emails = await query
      .orderBy(desc(entities.createdAt))
      .limit(20);
    
    if (emails.length === 0) {
      return {
        type: 'search_results',
        message: 'No emails found matching your criteria.',
        emails: []
      };
    }
    
    return {
      type: 'search_results',
      message: `Found ${emails.length} email${emails.length > 1 ? 's' : ''}:`,
      emails: emails.map(e => ({
        id: e.id,
        ...(e.data as any)
      }))
    };
  }
  
  private async handleSummarize(params: any, context: CommandContext) {
    // Get emails to summarize
    const emails = await this.handleSearchEmails(params, context);
    
    if (emails.emails.length === 0) {
      return {
        type: 'summary',
        message: 'No emails to summarize.'
      };
    }
    
    // Create summary using AI
    const emailTexts = emails.emails.slice(0, 10).map((e: any) => 
      `From: ${e.from?.email}\nSubject: ${e.subject}\nSnippet: ${e.body?.snippet}`
    ).join('\n\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'Summarize these emails concisely. Identify key topics, action items, and important information.'
      }, {
        role: 'user',
        content: emailTexts
      }]
    });
    
    return {
      type: 'summary',
      message: 'Email Summary:',
      summary: response.choices[0].message.content,
      emailCount: emails.emails.length
    };
  }
  
  private async handleDraftReply(params: any, context: CommandContext) {
    // Get the email to reply to
    if (!params.emailId) {
      return {
        type: 'error',
        message: 'Please specify which email you want to reply to.'
      };
    }
    
    const email = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, params.emailId),
          eq(entities.companyId, context.companyId)
        )
      )
      .limit(1);
    
    if (!email || email.length === 0) {
      return {
        type: 'error',
        message: 'Email not found.'
      };
    }
    
    const emailData = email[0].data as any;
    
    // Generate reply using AI
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'system',
        content: 'You are helping draft a reply to an email. Be professional and helpful.'
      }, {
        role: 'user',
        content: `Draft a reply to this email:
From: ${emailData.from?.email}
Subject: ${emailData.subject}
Body: ${emailData.body?.snippet}

User's intent: ${params.replyIntent || 'Professional acknowledgment'}`
      }]
    });
    
    return {
      type: 'draft_reply',
      message: "Here's a draft reply:",
      draft: {
        to: [emailData.from?.email],
        subject: `Re: ${emailData.subject}`,
        body: response.choices[0].message.content,
        inReplyTo: emailData.messageId,
        threadId: emailData.threadId
      }
    };
  }
  
  private async handleBulkAction(params: any, context: CommandContext) {
    // Get emails to act on
    const emails = await this.handleSearchEmails(params, context);
    
    if (emails.emails.length === 0) {
      return {
        type: 'info',
        message: 'No emails found to perform the action on.'
      };
    }
    
    const action = params.bulkAction?.toLowerCase();
    const emailIds = emails.emails.map((e: any) => e.id);
    
    switch (action) {
      case 'archive':
        for (const id of emailIds) {
          await db
            .update(entities)
            .set({
              data: sql`jsonb_set(data, '{labels}', '["ARCHIVED"]'::jsonb)`,
              updatedAt: new Date()
            })
            .where(eq(entities.id, id));
        }
        return {
          type: 'success',
          message: `Archived ${emailIds.length} email${emailIds.length > 1 ? 's' : ''}.`
        };
        
      case 'delete':
      case 'trash':
        for (const id of emailIds) {
          const [email] = await db.select().from(entities).where(eq(entities.id, id));
          await db
            .update(entities)
            .set({
              data: { ...(email.data as any), isTrash: true },
              updatedAt: new Date()
            })
            .where(eq(entities.id, id));
        }
        return {
          type: 'success',
          message: `Moved ${emailIds.length} email${emailIds.length > 1 ? 's' : ''} to trash.`
        };
        
      case 'mark as read':
      case 'read':
        for (const id of emailIds) {
          const [email] = await db.select().from(entities).where(eq(entities.id, id));
          await db
            .update(entities)
            .set({
              data: { ...(email.data as any), isRead: true },
              updatedAt: new Date()
            })
            .where(eq(entities.id, id));
        }
        return {
          type: 'success',
          message: `Marked ${emailIds.length} email${emailIds.length > 1 ? 's' : ''} as read.`
        };
        
      case 'mark as unread':
      case 'unread':
        for (const id of emailIds) {
          const [email] = await db.select().from(entities).where(eq(entities.id, id));
          await db
            .update(entities)
            .set({
              data: { ...(email.data as any), isRead: false },
              updatedAt: new Date()
            })
            .where(eq(entities.id, id));
        }
        return {
          type: 'success',
          message: `Marked ${emailIds.length} email${emailIds.length > 1 ? 's' : ''} as unread.`
        };
        
      default:
        return {
          type: 'error',
          message: `Unknown action: ${action}. Try 'archive', 'delete', 'mark as read', or 'mark as unread'.`
        };
    }
  }
  
  private async handleForward(params: any, context: CommandContext) {
    // Get the email to forward
    if (!params.emailId) {
      // Try to find the latest email from the specified sender
      if (params.from) {
        const emails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.companyId, context.companyId),
              eq(entities.type, 'email'),
              sql`data->'from'->>'email' ILIKE ${`%${params.from}%`}`
            )
          )
          .orderBy(desc(entities.createdAt))
          .limit(1);
        
        if (emails.length > 0) {
          params.emailId = emails[0].id;
        }
      }
    }
    
    if (!params.emailId) {
      return {
        type: 'error',
        message: 'Please specify which email you want to forward.'
      };
    }
    
    const email = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.id, params.emailId),
          eq(entities.companyId, context.companyId)
        )
      )
      .limit(1);
    
    if (!email || email.length === 0) {
      return {
        type: 'error',
        message: 'Email not found.'
      };
    }
    
    const emailData = email[0].data as any;
    
    return {
      type: 'draft_forward',
      message: "Here's the email ready to forward:",
      draft: {
        to: params.to || [],
        subject: `Fwd: ${emailData.subject}`,
        body: `\n\n---------- Forwarded message ----------\nFrom: ${emailData.from?.email}\nDate: ${emailData.sentAt}\nSubject: ${emailData.subject}\n\n${emailData.body?.text || emailData.body?.snippet}`,
        originalEmailId: params.emailId
      }
    };
  }
  
  private async handleExtractInfo(params: any, context: CommandContext) {
    // Get emails to extract from
    const emails = await this.handleSearchEmails(params, context);
    
    if (emails.emails.length === 0) {
      return {
        type: 'extraction',
        message: 'No emails found to extract information from.',
        data: []
      };
    }
    
    const extractionType = params.extractionType || 'action_items';
    let extracted: any[] = [];
    
    switch (extractionType) {
      case 'action_items':
        const emailTexts = emails.emails.slice(0, 20).map((e: any) => 
          `From: ${e.from?.email}\nSubject: ${e.subject}\nBody: ${e.body?.text || e.body?.snippet}`
        ).join('\n\n---\n\n');
        
        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'Extract all action items, tasks, and commitments from these emails. List them clearly with who is responsible if mentioned.'
          }, {
            role: 'user',
            content: emailTexts
          }]
        });
        
        return {
          type: 'extraction',
          message: 'Action items extracted from your emails:',
          data: aiResponse.choices[0].message.content
        };
        
      case 'email_addresses':
        const emailAddresses = new Set<string>();
        emails.emails.forEach((e: any) => {
          if (e.from?.email) emailAddresses.add(e.from.email);
          e.to?.forEach((t: any) => { if (t.email) emailAddresses.add(t.email); });
          e.cc?.forEach((c: any) => { if (c.email) emailAddresses.add(c.email); });
        });
        
        return {
          type: 'extraction',
          message: `Found ${emailAddresses.size} unique email addresses:`,
          data: Array.from(emailAddresses)
        };
        
      case 'phone_numbers':
        const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
        const phoneNumbers = new Set<string>();
        
        emails.emails.forEach((e: any) => {
          const text = e.body?.text || e.body?.snippet || '';
          const matches = text.match(phoneRegex);
          if (matches) {
            matches.forEach((m: string) => {
              if (m.length >= 10) phoneNumbers.add(m);
            });
          }
        });
        
        return {
          type: 'extraction',
          message: `Found ${phoneNumbers.size} phone numbers:`,
          data: Array.from(phoneNumbers)
        };
        
      case 'meeting_requests':
        const meetingEmails = emails.emails.filter((e: any) => {
          const text = (e.subject + ' ' + (e.body?.text || e.body?.snippet || '')).toLowerCase();
          return text.includes('meeting') || text.includes('call') || text.includes('schedule') || 
                 text.includes('appointment') || text.includes('discuss');
        });
        
        return {
          type: 'extraction',
          message: `Found ${meetingEmails.length} potential meeting requests:`,
          data: meetingEmails.map((e: any) => ({
            from: e.from?.email,
            subject: e.subject,
            date: e.sentAt
          }))
        };
        
      default:
        return {
          type: 'extraction',
          message: 'Unknown extraction type.',
          data: []
        };
    }
  }
  
  private async handleAnalyze(params: any, context: CommandContext) {
    const analysisType = params.analysisType || 'needs_response';
    
    switch (analysisType) {
      case 'needs_response':
        // Find emails that likely need a response
        const unrepliedEmails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.companyId, context.companyId),
              eq(entities.type, 'email'),
              sql`data->'from'->>'email' != ${context.userEmail}`,
              sql`(data->>'isRead')::boolean = true`,
              sql`NOT EXISTS (
                SELECT 1 FROM entities e2 
                WHERE e2.company_id = ${context.companyId}
                AND e2.type = 'email'
                AND e2.data->>'threadId' = entities.data->>'threadId'
                AND e2.data->'from'->>'email' = ${context.userEmail}
                AND e2.created_at > entities.created_at
              )`
            )
          )
          .orderBy(desc(entities.createdAt))
          .limit(10);
        
        if (unrepliedEmails.length === 0) {
          return {
            type: 'analysis',
            message: 'No emails requiring response found.',
            emails: []
          };
        }
        
        // Use AI to determine which actually need responses
        const emailTexts = unrepliedEmails.map((e: any) => {
          const data = e.data as any;
          return `From: ${data.from?.email}\nSubject: ${data.subject}\nBody: ${data.body?.snippet}`;
        }).join('\n\n---\n\n');
        
        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'Analyze these emails and identify which ones genuinely need a response. Consider questions asked, requests made, and action items. Ignore newsletters, notifications, and FYI emails.'
          }, {
            role: 'user',
            content: emailTexts
          }]
        });
        
        return {
          type: 'analysis',
          message: 'Emails that need your response:',
          analysis: aiResponse.choices[0].message.content,
          emails: unrepliedEmails.map(e => ({
            id: e.id,
            ...(e.data as any)
          }))
        };
        
      case 'urgent':
        // Find urgent emails
        const urgentKeywords = ['urgent', 'asap', 'immediately', 'critical', 'important', 'deadline', 'today', 'now'];
        const urgentConditions = urgentKeywords.map(keyword => 
          sql`(data->>'subject' ILIKE ${`%${keyword}%`} OR data->'body'->>'text' ILIKE ${`%${keyword}%`})`
        );
        
        const urgentEmails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.companyId, context.companyId),
              eq(entities.type, 'email'),
              sql`(data->>'isRead')::boolean = false OR (data->>'sentAt')::timestamp > NOW() - INTERVAL '2 days'`,
              sql`(${urgentConditions.reduce((acc, cond, i) => 
                i === 0 ? cond : sql`${acc} OR ${cond}`
              )})`
            )
          )
          .orderBy(desc(entities.createdAt))
          .limit(20);
        
        return {
          type: 'analysis',
          message: `Found ${urgentEmails.length} potentially urgent emails:`,
          emails: urgentEmails.map(e => ({
            id: e.id,
            ...(e.data as any)
          }))
        };
        
      case 'sentiment':
        // Analyze sentiment of recent emails
        const recentEmails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.companyId, context.companyId),
              eq(entities.type, 'email'),
              sql`(data->>'sentAt')::timestamp > NOW() - INTERVAL '7 days'`
            )
          )
          .orderBy(desc(entities.createdAt))
          .limit(30);
        
        if (recentEmails.length === 0) {
          return {
            type: 'analysis',
            message: 'No recent emails to analyze.',
            analysis: null
          };
        }
        
        const emailSentimentTexts = recentEmails.map((e: any) => {
          const data = e.data as any;
          return `From: ${data.from?.email}\nSubject: ${data.subject}\nBody: ${data.body?.snippet}`;
        }).join('\n\n---\n\n');
        
        const sentimentResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'Analyze the sentiment and tone of these emails. Identify any angry, frustrated, or concerning messages that need attention. Also note particularly positive or appreciative messages.'
          }, {
            role: 'user',
            content: emailSentimentTexts
          }]
        });
        
        return {
          type: 'analysis',
          message: 'Sentiment analysis of recent emails:',
          analysis: sentimentResponse.choices[0].message.content
        };
        
      case 'commitments':
        // Find commitments made via email
        const commitmentKeywords = ['will', 'promise', 'commit', 'deliver', 'send', 'provide', 'complete', 'finish', 'deadline'];
        const myEmails = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.companyId, context.companyId),
              eq(entities.type, 'email'),
              sql`data->'from'->>'email' = ${context.userEmail}`,
              sql`(data->>'sentAt')::timestamp > NOW() - INTERVAL '30 days'`
            )
          )
          .orderBy(desc(entities.createdAt))
          .limit(50);
        
        const commitmentEmailTexts = myEmails.map((e: any) => {
          const data = e.data as any;
          return `To: ${data.to?.map((t: any) => t.email).join(', ')}\nSubject: ${data.subject}\nBody: ${data.body?.text || data.body?.snippet}`;
        }).join('\n\n---\n\n');
        
        const commitmentResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'Extract any commitments, promises, or deadlines mentioned in these emails that were sent by the user. List what was promised, to whom, and by when if mentioned.'
          }, {
            role: 'user',
            content: commitmentEmailTexts
          }]
        });
        
        return {
          type: 'analysis',
          message: 'Commitments you\'ve made via email:',
          analysis: commitmentResponse.choices[0].message.content
        };
        
      default:
        return {
          type: 'analysis',
          message: 'Unknown analysis type.',
          analysis: null
        };
    }
  }
  
  private async sendDraftEmail(draft: any, context: CommandContext) {
    try {
      // Use the Gmail client to send the email
      const gmailClient = new GmailClient();
      const result = await gmailClient.sendEmail({
        to: draft.to,
        cc: draft.cc,
        subject: draft.subject,
        body: draft.body,
        companyId: context.companyId,
        userId: context.userId
      });
      
      return {
        type: 'success',
        message: `✅ Email sent successfully to ${draft.to.join(', ')}\n\nSubject: ${draft.subject}\n\nThe email has been delivered.`
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        type: 'error',
        message: 'Failed to send email. Please make sure your Gmail account is connected in settings.'
      };
    }
  }
  
  private parseDateRange(dateRange: string): { from: Date; to: Date } | null {
    const now = new Date();
    const lowerRange = dateRange.toLowerCase();
    
    if (lowerRange.includes('today')) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    
    if (lowerRange.includes('yesterday')) {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    
    if (lowerRange.includes('this week') || lowerRange.includes('last week')) {
      const weekOffset = lowerRange.includes('last week') ? -1 : 0;
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() + weekOffset * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    
    if (lowerRange.includes('this month') || lowerRange.includes('last month')) {
      const monthOffset = lowerRange.includes('last month') ? -1 : 0;
      const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
    
    // Try to parse "last X days"
    const daysMatch = lowerRange.match(/last (\d+) days?/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      return { from: start, to: now };
    }
    
    return null;
  }
}