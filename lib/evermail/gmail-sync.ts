import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { entities, integrations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export class GmailSyncService {
  private gmail: any;
  
  async connectGmail(authCode: string, companyId: string, userId: string) {
    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(authCode);
      oauth2Client.setCredentials(tokens);
      
      // Get user's email address
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      // Check if integration already exists
      const existing = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.companyId, companyId),
            eq(integrations.provider, 'gmail')
          )
        )
        .limit(1);
      
      const integrationData = {
        companyId,
        provider: 'gmail' as const,
        credentials: this.encryptCredentials(tokens),
        status: 'connected' as const,
        metadata: {
          email: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
          historyId: profile.data.historyId
        },
        updatedAt: new Date()
      };
      
      if (existing.length > 0) {
        // Update existing integration
        await db
          .update(integrations)
          .set(integrationData)
          .where(eq(integrations.id, existing[0].id));
      } else {
        // Create new integration
        await db.insert(integrations).values({
          ...integrationData,
          createdAt: new Date()
        });
      }
      
      return {
        success: true,
        email: profile.data.emailAddress,
        messagesTotal: profile.data.messagesTotal
      };
    } catch (error) {
      console.error('Gmail connection error:', error);
      throw new Error('Failed to connect Gmail account');
    }
  }
  
  async performInitialSync(companyId: string) {
    try {
      // Get integration credentials
      const integration = await this.getIntegration(companyId);
      if (!integration) {
        throw new Error('Gmail integration not found');
      }
      
      // Set up Gmail client
      const credentials = this.decryptCredentials(integration.credentials);
      oauth2Client.setCredentials(credentials);
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Fetch messages in batches
      let pageToken: string | undefined;
      let totalSynced = 0;
      
      do {
        const response = await this.gmail.users.messages.list({
          userId: 'me',
          maxResults: 100,
          pageToken,
          // Start with important messages
          q: 'in:inbox OR in:sent OR in:drafts'
        });
        
        if (response.data.messages) {
          // Process messages in parallel (but limited)
          const messagePromises = response.data.messages.map((msg: any) =>
            this.syncMessage(msg.id, companyId)
          );
          
          // Process in chunks of 10 to avoid rate limits
          for (let i = 0; i < messagePromises.length; i += 10) {
            await Promise.all(messagePromises.slice(i, i + 10));
          }
          
          totalSynced += response.data.messages.length;
        }
        
        pageToken = response.data.nextPageToken;
        
        // Update sync status
        await db
          .update(integrations)
          .set({
            lastSyncAt: new Date(),
            metadata: {
              ...(integration.metadata as any),
              totalSynced,
              syncInProgress: true
            }
          })
          .where(eq(integrations.id, integration.id));
          
      } while (pageToken && totalSynced < 1000); // Limit initial sync to 1000 messages
      
      // Mark sync as complete
      await db
        .update(integrations)
        .set({
          lastSyncAt: new Date(),
          metadata: {
            ...(integration.metadata as any),
            totalSynced,
            syncInProgress: false,
            lastHistoryId: await this.getLatestHistoryId()
          }
        })
        .where(eq(integrations.id, integration.id));
      
      return { success: true, totalSynced };
    } catch (error) {
      console.error('Initial sync error:', error);
      
      // Update integration with error
      const integration = await this.getIntegration(companyId);
      if (integration) {
        await db
          .update(integrations)
          .set({
            syncError: (error as Error).message,
            metadata: {
              ...(integration.metadata as any),
              syncInProgress: false
            }
          })
          .where(eq(integrations.id, integration.id));
      }
      
      throw error;
    }
  }
  
  async performIncrementalSync(companyId: string) {
    try {
      const integration = await this.getIntegration(companyId);
      if (!integration) {
        throw new Error('Gmail integration not found');
      }
      
      const credentials = this.decryptCredentials(integration.credentials);
      oauth2Client.setCredentials(credentials);
      this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      const metadata = integration.metadata as any;
      const startHistoryId = metadata.lastHistoryId;
      
      if (!startHistoryId) {
        // No history ID, perform initial sync
        return this.performInitialSync(companyId);
      }
      
      // Get history changes
      const history = await this.gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        historyTypes: ['messageAdded', 'messageDeleted', 'labelAdded', 'labelRemoved']
      });
      
      if (history.data.history) {
        for (const record of history.data.history) {
          // Process message additions
          if (record.messagesAdded) {
            for (const msg of record.messagesAdded) {
              await this.syncMessage(msg.message.id, companyId);
            }
          }
          
          // Process message deletions
          if (record.messagesDeleted) {
            for (const msg of record.messagesDeleted) {
              await this.deleteMessage(msg.message.id, companyId);
            }
          }
          
          // Process label changes
          if (record.labelsAdded || record.labelsRemoved) {
            await this.updateMessageLabels(record, companyId);
          }
        }
      }
      
      // Update last history ID
      await db
        .update(integrations)
        .set({
          lastSyncAt: new Date(),
          syncError: null,
          metadata: {
            ...metadata,
            lastHistoryId: history.data.historyId
          }
        })
        .where(eq(integrations.id, integration.id));
      
      return { success: true };
    } catch (error) {
      console.error('Incremental sync error:', error);
      throw error;
    }
  }
  
  private async syncMessage(messageId: string, companyId: string) {
    try {
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });
      
      const emailData = this.parseGmailMessage(message.data);
      
      // Check if email already exists
      const existing = await db
        .select()
        .from(entities)
        .where(
          and(
            eq(entities.companyId, companyId),
            eq(entities.type, 'email')
          )
        )
        .limit(1);
      
      const existingEmail = existing.find((e: any) => 
        (e.data as any).messageId === messageId
      );
      
      if (existingEmail) {
        // Update existing email
        await db
          .update(entities)
          .set({
            data: emailData,
            updatedAt: new Date()
          })
          .where(eq(entities.id, existingEmail.id));
      } else {
        // Create new email entity
        await db.insert(entities).values({
          companyId,
          type: 'email',
          data: emailData,
          createdBy: companyId, // System created
          metadata: {
            source: 'gmail_sync'
          }
        });
      }
    } catch (error) {
      console.error(`Error syncing message ${messageId}:`, error);
    }
  }
  
  private parseGmailMessage(message: any) {
    const headers = message.payload.headers.reduce((acc: any, header: any) => {
      acc[header.name.toLowerCase()] = header.value;
      return acc;
    }, {});
    
    // Parse body
    let textBody = '';
    let htmlBody = '';
    
    const extractBody = (parts: any[]) => {
      for (const part of parts || []) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          textBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.mimeType === 'text/html' && part.body.data) {
          htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
        } else if (part.parts) {
          extractBody(part.parts);
        }
      }
    };
    
    if (message.payload.parts) {
      extractBody(message.payload.parts);
    } else if (message.payload.body?.data) {
      textBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    }
    
    // Parse recipients
    const parseRecipients = (field: string) => {
      if (!field) return [];
      return field.split(',').map((r: string) => {
        const match = r.match(/(.*?)<(.+?)>/);
        if (match) {
          return { name: match[1].trim(), email: match[2].trim() };
        }
        return { email: r.trim() };
      });
    };
    
    return {
      messageId: message.id,
      threadId: message.threadId,
      subject: headers.subject || '(No subject)',
      from: parseRecipients(headers.from)[0] || { email: '' },
      to: parseRecipients(headers.to),
      cc: parseRecipients(headers.cc),
      bcc: parseRecipients(headers.bcc),
      replyTo: headers['reply-to'],
      body: {
        text: textBody,
        html: htmlBody,
        snippet: message.snippet
      },
      labels: message.labelIds || [],
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED'),
      isImportant: message.labelIds?.includes('IMPORTANT'),
      isDraft: message.labelIds?.includes('DRAFT'),
      isSpam: message.labelIds?.includes('SPAM'),
      isTrash: message.labelIds?.includes('TRASH'),
      sentAt: new Date(parseInt(message.internalDate)),
      receivedAt: new Date(parseInt(message.internalDate)),
      attachments: this.extractAttachments(message.payload)
    };
  }
  
  private extractAttachments(payload: any): any[] {
    const attachments: any[] = [];
    
    const extractFromParts = (parts: any[]) => {
      for (const part of parts || []) {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size
          });
        }
        if (part.parts) {
          extractFromParts(part.parts);
        }
      }
    };
    
    if (payload.parts) {
      extractFromParts(payload.parts);
    }
    
    return attachments;
  }
  
  private async deleteMessage(messageId: string, companyId: string) {
    // Soft delete in our database
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.companyId, companyId),
          eq(entities.type, 'email')
        )
      );
    
    const email = emails.find((e: any) => (e.data as any).messageId === messageId);
    if (email) {
      await db
        .update(entities)
        .set({
          deletedAt: new Date()
        })
        .where(eq(entities.id, email.id));
    }
  }
  
  private async updateMessageLabels(record: any, companyId: string) {
    // Update labels for a message
    const messageId = record.messages?.[0]?.id;
    if (!messageId) return;
    
    const emails = await db
      .select()
      .from(entities)
      .where(
        and(
          eq(entities.companyId, companyId),
          eq(entities.type, 'email')
        )
      );
    
    const email = emails.find((e: any) => (e.data as any).messageId === messageId);
    if (email) {
      const data = email.data as any;
      let labels = data.labels || [];
      
      if (record.labelsAdded) {
        labels = [...labels, ...record.labelsAdded.map((l: any) => l.labelId)];
      }
      if (record.labelsRemoved) {
        const removed = record.labelsRemoved.map((l: any) => l.labelId);
        labels = labels.filter((l: string) => !removed.includes(l));
      }
      
      await db
        .update(entities)
        .set({
          data: {
            ...data,
            labels,
            isRead: !labels.includes('UNREAD'),
            isStarred: labels.includes('STARRED'),
            isImportant: labels.includes('IMPORTANT')
          },
          updatedAt: new Date()
        })
        .where(eq(entities.id, email.id));
    }
  }
  
  private async getLatestHistoryId(): Promise<string> {
    const profile = await this.gmail.users.getProfile({ userId: 'me' });
    return profile.data.historyId;
  }
  
  private async getIntegration(companyId: string) {
    const result = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.companyId, companyId),
          eq(integrations.provider, 'gmail')
        )
      )
      .limit(1);
    
    return result[0];
  }
  
  private encryptCredentials(credentials: any): any {
    // TODO: Implement proper encryption
    // For now, just return as-is (you should encrypt this in production!)
    return credentials;
  }
  
  private decryptCredentials(credentials: any): any {
    // TODO: Implement proper decryption
    // For now, just return as-is
    return credentials;
  }
}