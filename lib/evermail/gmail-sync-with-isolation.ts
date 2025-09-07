import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { entities, users } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

export class GmailSyncService {
  private gmail: any;
  private workspaceId: string;
  private userId: string;
  private tokens: any;
  private userEmail: string;

  constructor(config: {
    workspaceId: string;
    userId: string;
    tokens: any;
    userEmail: string;
  }) {
    this.workspaceId = config.workspaceId;
    this.userId = config.userId;
    this.tokens = config.tokens;
    this.userEmail = config.userEmail;
  }

  async syncEmails() {
    try {
      console.log(`Starting email sync for ${this.userEmail}`);
      
      // Initialize OAuth client with tokens
      const oauth2Client = new OAuth2Client(
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
      );
      
      oauth2Client.setCredentials(this.tokens);
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Fetch recent messages
      console.log('Fetching messages from Gmail...');
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: 50, // Start with 50 most recent emails
        q: 'is:inbox OR is:sent' // Focus on inbox and sent items
      });
      
      if (!response.data.messages || response.data.messages.length === 0) {
        console.log('No messages to sync');
        return { success: true, totalSynced: 0 };
      }
      
      console.log(`Found ${response.data.messages.length} messages to sync`);
      
      // Process each message
      let totalSynced = 0;
      for (const msg of response.data.messages) {
        try {
          await this.syncMessage(msg.id!);
          totalSynced++;
          
          // Log progress every 10 messages
          if (totalSynced % 10 === 0) {
            console.log(`Synced ${totalSynced} messages...`);
          }
        } catch (error) {
          console.error(`Failed to sync message ${msg.id}:`, error);
        }
      }
      
      // Update sync timestamp
      await this.updateLastSyncTime();
      
      console.log(`Email sync completed! Synced ${totalSynced} messages for ${this.userEmail}`);
      return { success: true, totalSynced };
      
    } catch (error) {
      console.error('Gmail sync error:', error);
      throw new Error(`Failed to sync Gmail: ${error}`);
    }
  }

  private async syncMessage(messageId: string) {
    try {
      // Fetch the full message
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });
      
      const message = response.data;
      
      // Parse message headers
      const headers = message.payload?.headers || [];
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      
      // Extract email data
      const from = getHeader('from');
      const to = getHeader('to');
      const subject = getHeader('subject');
      const date = getHeader('date');
      
      // Parse email body (extract both text and HTML if available)
      const body = this.extractBody(message.payload);
      
      // Check if email already exists (to avoid duplicates)
      const { sql } = await import('drizzle-orm');
      const existingEmail = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, this.workspaceId),
            eq(entities.userId, this.userId),
            eq(entities.type, 'email'),
            sql`data->>'gmailId' = ${messageId}`
          )
        )
        .limit(1);
      
      if (existingEmail.length > 0) {
        // Email already exists, skip
        return;
      }
      
      // Parse sender info
      const fromMatch = from.match(/(.*?)\s*<(.+?)>/);
      const fromName = fromMatch ? fromMatch[1].replace(/"/g, '').trim() : from;
      const fromEmail = fromMatch ? fromMatch[2] : from;
      
      // Create email entity with USER ISOLATION
      await db.insert(entities).values({
        workspaceId: this.workspaceId,
        userId: this.userId, // CRITICAL: Set user ID for isolation
        type: 'email',
        data: {
          gmailId: messageId,
          threadId: message.threadId,
          subject: subject || '(no subject)',
          from: {
            name: fromName,
            email: fromEmail
          },
          to: to,
          date: date,
          snippet: message.snippet,
          body: {
            text: body.text,
            html: body.html,
            snippet: message.snippet || ''
          },
          isRead: !message.labelIds?.includes('UNREAD'),
          isStarred: message.labelIds?.includes('STARRED'),
          isDraft: message.labelIds?.includes('DRAFT'),
          labels: message.labelIds || [],
          hasAttachment: message.payload?.parts?.some((p: any) => p.filename) || false
        },
        metadata: {
          source: 'gmail_sync',
          syncedAt: new Date().toISOString(),
          userEmail: this.userEmail
        }
      });
      
      // Auto-create contact if not exists
      await this.createContactFromEmail(fromEmail, fromName);
      
    } catch (error) {
      console.error(`Error syncing message ${messageId}:`, error);
      throw error;
    }
  }

  private extractBody(payload: any): { text: string; html: string; snippet?: string } {
    const result = { text: '', html: '', snippet: '' };
    
    if (!payload) return result;
    
    // Single part message
    if (payload.body?.data) {
      const decodedBody = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/html') {
        result.html = decodedBody;
      } else if (payload.mimeType === 'text/plain') {
        result.text = decodedBody;
      } else {
        // For other mime types, try to detect if it's HTML
        if (decodedBody.includes('<html') || decodedBody.includes('<body') || decodedBody.includes('<div')) {
          result.html = decodedBody;
        } else {
          result.text = decodedBody;
        }
      }
      return result;
    }
    
    // Multi-part message - extract both text and HTML versions
    if (payload.parts) {
      this.extractBodyFromParts(payload.parts, result);
    }
    
    // If we only have text but it looks like HTML, move it to HTML field
    if (!result.html && result.text) {
      const textContent = result.text;
      if (textContent.includes('<html') || textContent.includes('<body') || 
          textContent.includes('<div') || textContent.includes('<p>') ||
          textContent.includes('<table') || textContent.includes('<img')) {
        result.html = textContent;
        result.text = ''; // Clear text since we're treating it as HTML
      }
    }
    
    return result;
  }

  private extractBodyFromParts(parts: any[], result: { text: string; html: string }): void {
    for (const part of parts) {
      // Get text/plain version
      if (part.mimeType === 'text/plain' && part.body?.data) {
        const decodedText = Buffer.from(part.body.data, 'base64').toString('utf-8');
        if (!result.text || decodedText.length > result.text.length) {
          result.text = decodedText;
        }
      }
      
      // Get text/html version
      if (part.mimeType === 'text/html' && part.body?.data) {
        const decodedHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
        if (!result.html || decodedHtml.length > result.html.length) {
          result.html = decodedHtml;
        }
      }
      
      // Handle multipart/alternative, multipart/mixed, and multipart/related
      if (part.mimeType?.startsWith('multipart/') && part.parts) {
        this.extractBodyFromParts(part.parts, result);
      }
      
      // Sometimes the body is nested in parts without multipart prefix
      if (part.parts && !part.body?.data) {
        this.extractBodyFromParts(part.parts, result);
      }
    }
  }

  private async createContactFromEmail(email: string, name?: string) {
    try {
      const { sql } = await import('drizzle-orm');
      // Check if contact already exists for this user
      const existingContact = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.workspaceId, this.workspaceId),
            eq(entities.userId, this.userId),
            eq(entities.type, 'contact'),
            sql`data->>'email' = ${email}`
          )
        )
        .limit(1);
      
      if (existingContact.length === 0) {
        // Create new contact with USER ISOLATION
        await db.insert(entities).values({
          workspaceId: this.workspaceId,
          userId: this.userId, // CRITICAL: Set user ID for isolation
          type: 'contact',
          data: {
            name: name || email.split('@')[0],
            email: email,
            source: 'gmail_import',
            createdFrom: 'email_sync'
          },
          metadata: {
            autoCreated: true,
            source: 'gmail_sync',
            userEmail: this.userEmail
          }
        });
      }
    } catch (error) {
      console.error(`Failed to create contact for ${email}:`, error);
      // Don't fail the sync if contact creation fails
    }
  }

  private async updateLastSyncTime() {
    try {
      // Update the email_account entity with last sync time
      await db
        .update(entities)
        .set({
          data: {
            lastSyncAt: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .where(
          and(
            eq(entities.workspaceId, this.workspaceId),
            eq(entities.userId, this.userId),
            eq(entities.type, 'email_account')
          )
        );
    } catch (error) {
      console.error('Failed to update last sync time:', error);
    }
  }
}