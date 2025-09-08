import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { eq, and, sql } from 'drizzle-orm';

export class GmailClient {
  private gmail: any;
  private oauth2Client: OAuth2Client;
  
  constructor(credentials?: any) {
    if (credentials) {
      this.oauth2Client = new OAuth2Client(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
      );
      
      this.oauth2Client.setCredentials(credentials);
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    }
  }
  
  async sendEmail(params: {
    to: string | string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    bodyHtml?: string;
    replyTo?: string;
    attachments?: any[];
    workspaceId?: string;
    userId?: string;
  }) {
    try {
      console.log('[GmailClient.sendEmail] Starting with params:', {
        to: params.to,
        subject: params.subject,
        workspaceId: params.workspaceId,
        userId: params.userId,
        hasGmail: !!this.gmail
      });
      
      // If no credentials provided in constructor, get from database
      if (!this.gmail && params.workspaceId && params.userId) {
        console.log('[GmailClient.sendEmail] Fetching email account from database...');
        const emailAccount = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, params.workspaceId),
              eq(entities.type, 'email_account'),
              sql`metadata->>'createdBy' = ${params.userId}` // CRITICAL: User-specific
            )
          )
          .limit(1);
        
        console.log('[GmailClient.sendEmail] Email account query result:', emailAccount.length > 0 ? 'Found' : 'Not found');
        
        if (!emailAccount || emailAccount.length === 0) {
          console.error('[GmailClient.sendEmail] No Gmail account found for user');
          throw new Error('Gmail account not connected. Please go to Mail > Settings and connect your Gmail account.');
        }
        
        const accountData = emailAccount[0].data as any;
        const tokens = JSON.parse(Buffer.from(accountData.tokens, 'base64').toString());
        
        this.oauth2Client = new OAuth2Client(
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
        );
        
        this.oauth2Client.setCredentials(tokens);
        this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      }
      
      // Create the email message
      const message = this.createMessage(params);
      
      // Send the email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });
      
      // Store sent email in database if workspaceId provided
      if (params.workspaceId && params.userId) {
        await db.insert(entities).values({
          workspaceId: params.workspaceId,
          type: 'email',
          data: {
            messageId: response.data.id,
            threadId: response.data.threadId,
            subject: params.subject,
            from: { email: 'me' },
            to: (Array.isArray(params.to) ? params.to : [params.to]).map(email => ({ email })),
            cc: params.cc?.map(email => ({ email })),
            bcc: params.bcc?.map(email => ({ email })),
            body: {
              text: params.body,
              html: this.convertToHtml(params.body)
            },
            isDraft: false,
            isRead: true,
            sentAt: new Date(),
            labels: response.data.labelIds || ['SENT']
          },
          metadata: {
            source: 'evermail_command',
            createdBy: params.userId
          }
        });
      }
      
      return {
        id: response.data.id,
        threadId: response.data.threadId,
        labelIds: response.data.labelIds
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
  
  async createDraft(params: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
  }) {
    try {
      const message = this.createMessage(params);
      
      const response = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: message
          }
        }
      });
      
      return {
        id: response.data.id,
        messageId: response.data.message.id
      };
    } catch (error) {
      console.error('Error creating draft:', error);
      throw new Error('Failed to create draft');
    }
  }
  
  async replyToEmail(params: {
    threadId: string;
    messageId: string;
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
  }) {
    try {
      const message = this.createMessage({
        ...params,
        inReplyTo: params.messageId,
        references: params.messageId
      });
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
          threadId: params.threadId
        }
      });
      
      return {
        id: response.data.id,
        threadId: response.data.threadId
      };
    } catch (error) {
      console.error('Error replying to email:', error);
      throw new Error('Failed to reply to email');
    }
  }
  
  async forwardEmail(params: {
    originalMessageId: string;
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
  }) {
    try {
      // Get the original message
      const original = await this.gmail.users.messages.get({
        userId: 'me',
        id: params.originalMessageId
      });
      
      // Create forwarded message with original content
      const forwardedBody = `
${params.body}

---------- Forwarded message ---------
${this.extractOriginalContent(original.data)}
      `;
      
      const message = this.createMessage({
        to: params.to,
        cc: params.cc,
        subject: `Fwd: ${params.subject}`,
        body: forwardedBody
      });
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });
      
      return {
        id: response.data.id,
        threadId: response.data.threadId
      };
    } catch (error) {
      console.error('Error forwarding email:', error);
      throw new Error('Failed to forward email');
    }
  }
  
  async deleteEmail(messageId: string) {
    try {
      await this.gmail.users.messages.trash({
        userId: 'me',
        id: messageId
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting email:', error);
      throw new Error('Failed to delete email');
    }
  }
  
  async markAsRead(messageId: string, isRead: boolean = true) {
    try {
      if (isRead) {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      } else {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: ['UNREAD']
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error marking email as read:', error);
      throw new Error('Failed to mark email as read');
    }
  }
  
  async starEmail(messageId: string, isStarred: boolean = true) {
    try {
      if (isStarred) {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            addLabelIds: ['STARRED']
          }
        });
      } else {
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['STARRED']
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error starring email:', error);
      throw new Error('Failed to star email');
    }
  }
  
  async archiveEmail(messageId: string) {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['INBOX']
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error archiving email:', error);
      throw new Error('Failed to archive email');
    }
  }
  
  private createMessage(params: any): string {
    const boundary = '===boundary===';
    // Ensure 'to' is always an array for consistent handling
    const toAddresses = Array.isArray(params.to) ? params.to : [params.to];
    const headers = [
      `To: ${toAddresses.join(', ')}`,
      `Subject: ${params.subject}`
    ];
    
    if (params.cc?.length) {
      headers.push(`Cc: ${params.cc.join(', ')}`);
    }
    if (params.bcc?.length) {
      headers.push(`Bcc: ${params.bcc.join(', ')}`);
    }
    if (params.replyTo) {
      headers.push(`Reply-To: ${params.replyTo}`);
    }
    if (params.inReplyTo) {
      headers.push(`In-Reply-To: ${params.inReplyTo}`);
    }
    if (params.references) {
      headers.push(`References: ${params.references}`);
    }
    
    headers.push('Content-Type: multipart/alternative; boundary=' + boundary);
    
    const message = [
      ...headers,
      '',
      '--' + boundary,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(params.body).toString('base64'),
      '',
      '--' + boundary,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(params.bodyHtml || this.convertToHtml(params.body)).toString('base64'),
      '',
      '--' + boundary + '--'
    ].join('\r\n');
    
    // Encode the message for Gmail API
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
  
  private convertToHtml(text: string): string {
    // Convert plain text to HTML, preserving line breaks and basic formatting
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>')
      .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  }
  
  private extractOriginalContent(message: any): string {
    const headers = message.payload.headers.reduce((acc: any, header: any) => {
      acc[header.name.toLowerCase()] = header.value;
      return acc;
    }, {});
    
    let body = '';
    const extractBody = (parts: any[]) => {
      for (const part of parts || []) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        } else if (part.parts) {
          extractBody(part.parts);
        }
      }
    };
    
    if (message.payload.parts) {
      extractBody(message.payload.parts);
    } else if (message.payload.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }
    
    return `
From: ${headers.from}
Date: ${headers.date}
Subject: ${headers.subject}
To: ${headers.to}

${body}`;
  }
}