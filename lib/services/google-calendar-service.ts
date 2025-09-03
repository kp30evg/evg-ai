import { google } from 'googleapis';
import { entityService } from '@/lib/entities/entity-service';
import { workspaceService } from '@/lib/services/workspace-service';

interface CalendarAccount {
  id: string;
  data: {
    email: string;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date | null;
    connected: boolean;
  };
}

interface GoogleCalendarEvent {
  id?: string;
  calendarId?: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  hangoutLink?: string;
  recurrence?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  status?: string;
  created?: string;
  updated?: string;
}

export class GoogleCalendarService {
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  constructor() {
    // Don't throw error at construction time - check when needed
  }

  private ensureCredentials() {
    if (!this.clientId || !this.clientSecret) {
      this.clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Google Calendar credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
      }
    }
  }

  private async getAuthenticatedClient(account: CalendarAccount) {
    this.ensureCredentials();
    
    const oauth2Client = new google.auth.OAuth2(
      this.clientId!,
      this.clientSecret!,
      `${process.env.NEXTJS_URL || 'http://localhost:3000'}/api/auth/calendar/callback`
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: account.data.accessToken,
      refresh_token: account.data.refreshToken,
    });

    // Check if token is expired and refresh if needed
    if (account.data.expiresAt && new Date() > account.data.expiresAt) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update stored tokens
        await entityService.update(orgId, 
          account.id,
          {
            ...account.data,
            accessToken: credentials.access_token || account.data.accessToken,
            refreshToken: credentials.refresh_token || account.data.refreshToken,
            expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null
          }
        );

        oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error refreshing calendar token:', error);
        
        // Mark account as disconnected
        await entityService.update(orgId, 
          account.id,
          { ...account.data, connected: false }
        );
        
        throw new Error('Calendar authentication expired');
      }
    }

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async listEvents(
    accountId: string, 
    orgId: string, 
    options: {
      timeMin?: Date;
      timeMax?: Date;
      calendarId?: string;
      maxResults?: number;
      singleEvents?: boolean;
      orderBy?: 'startTime' | 'updated';
    } = {}
  ) {
    try {
      // Get calendar account
      const account = await entityService.findById(orgId, accountId);
      if (!account || account.type !== 'calendar_account') {
        throw new Error('Calendar account not found');
      }

      const calendar = await this.getAuthenticatedClient(account as CalendarAccount);

      const params: any = {
        calendarId: options.calendarId || 'primary',
        timeMin: options.timeMin?.toISOString(),
        timeMax: options.timeMax?.toISOString(),
        maxResults: options.maxResults || 2500,
        singleEvents: options.singleEvents !== false,
        orderBy: options.orderBy || 'startTime'
      };

      const response = await calendar.events.list(params);
      return response.data.items || [];

    } catch (error) {
      console.error('Error listing calendar events:', error);
      throw error;
    }
  }

  async getEvent(accountId: string, orgId: string, eventId: string, calendarId = 'primary') {
    try {
      const account = await entityService.findById(orgId, accountId);
      if (!account || account.type !== 'calendar_account') {
        throw new Error('Calendar account not found');
      }

      const calendar = await this.getAuthenticatedClient(account as CalendarAccount);

      const response = await calendar.events.get({
        calendarId,
        eventId
      });

      return response.data;

    } catch (error) {
      console.error('Error getting calendar event:', error);
      throw error;
    }
  }

  async createEvent(accountId: string, orgId: string, eventData: GoogleCalendarEvent) {
    try {
      const account = await entityService.findById(orgId, accountId);
      if (!account || account.type !== 'calendar_account') {
        throw new Error('Calendar account not found');
      }

      const calendar = await this.getAuthenticatedClient(account as CalendarAccount);

      const response = await calendar.events.insert({
        calendarId: eventData.calendarId || 'primary',
        requestBody: eventData,
        sendUpdates: 'all'
      });

      return response.data;

    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(
    accountId: string, 
    orgId: string, 
    eventId: string, 
    eventData: GoogleCalendarEvent, 
    calendarId = 'primary'
  ) {
    try {
      const account = await entityService.findById(orgId, accountId);
      if (!account || account.type !== 'calendar_account') {
        throw new Error('Calendar account not found');
      }

      const calendar = await this.getAuthenticatedClient(account as CalendarAccount);

      const response = await calendar.events.update({
        calendarId,
        eventId,
        requestBody: eventData,
        sendUpdates: 'all'
      });

      return response.data;

    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(accountId: string, orgId: string, eventId: string, calendarId = 'primary') {
    try {
      const account = await entityService.findById(orgId, accountId);
      if (!account || account.type !== 'calendar_account') {
        throw new Error('Calendar account not found');
      }

      const calendar = await this.getAuthenticatedClient(account as CalendarAccount);

      await calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all'
      });

      return true;

    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async syncCalendarEvents(accountId: string, orgId: string, options: {
    syncDays?: number;
    calendarId?: string;
  } = {}) {
    try {
      const { syncDays = 90, calendarId = 'primary' } = options;
      
      // Convert Clerk orgId to workspace UUID (create if needed)
      const workspaceId = await workspaceService.createWorkspaceIfNotExists(orgId, `Workspace ${orgId}`);
      
      console.log('Calendar sync - orgId:', orgId, 'workspaceId:', workspaceId);
      
      // Calculate date range
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30); // 30 days in the past
      
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + syncDays); // Default 90 days in the future

      console.log(`Syncing calendar events from ${timeMin.toISOString()} to ${timeMax.toISOString()}`);

      // Get events from Google Calendar
      const googleEvents = await this.listEvents(accountId, orgId, {
        timeMin,
        timeMax,
        calendarId
      });

      console.log(`Found ${googleEvents.length} events from Google Calendar`);

      let importedCount = 0;
      let updatedCount = 0;

      // Process each event
      for (const googleEvent of googleEvents) {
        if (!googleEvent.id) continue;

        try {
          // Check if event already exists
          const existingEvents = await entityService.find({
            workspaceId,
            type: 'calendar_event',
            where: { googleEventId: googleEvent.id }
          });

          const eventData = this.transformGoogleEventToEntity(googleEvent, accountId, calendarId);

          if (existingEvents.length > 0) {
            // Update existing event
            await entityService.update(workspaceId, 
              existingEvents[0].id,
              eventData
            );
            updatedCount++;
          } else {
            // Create new event
            await entityService.create(
              workspaceId,
              'calendar_event',
              eventData,
              {},
              { userId: 'system' }
            );
            importedCount++;
          }

        } catch (eventError) {
          console.error(`Error processing event ${googleEvent.id}:`, eventError);
        }
      }

      // Update account last sync time
      const account = await entityService.findById(workspaceId, accountId);
      if (account) {
        await entityService.update(workspaceId, 
          accountId,
          {
            ...account.data,
            lastSync: new Date(),
            lastSyncCount: googleEvents.length
          }
        );
      }

      console.log(`Calendar sync completed: ${importedCount} imported, ${updatedCount} updated`);

      return {
        importedCount,
        updatedCount,
        totalProcessed: googleEvents.length
      };

    } catch (error) {
      console.error('Error syncing calendar events:', error);
      throw error;
    }
  }

  private transformGoogleEventToEntity(googleEvent: GoogleCalendarEvent, accountId: string, calendarId: string) {
    return {
      googleEventId: googleEvent.id!,
      calendarId,
      accountId,
      title: googleEvent.summary || 'Untitled Event',
      summary: googleEvent.summary || 'Untitled Event',
      description: googleEvent.description || '',
      startTime: googleEvent.start?.dateTime 
        ? new Date(googleEvent.start.dateTime)
        : googleEvent.start?.date 
          ? new Date(googleEvent.start.date + 'T00:00:00')
          : new Date(),
      endTime: googleEvent.end?.dateTime 
        ? new Date(googleEvent.end.dateTime)
        : googleEvent.end?.date 
          ? new Date(googleEvent.end.date + 'T23:59:59')
          : new Date(),
      start: googleEvent.start,
      end: googleEvent.end,
      attendees: googleEvent.attendees?.map(attendee => ({
        email: attendee.email,
        name: attendee.displayName,
        responseStatus: attendee.responseStatus || 'needsAction'
      })) || [],
      location: googleEvent.location || '',
      meetingLink: googleEvent.hangoutLink || '',
      recurrence: googleEvent.recurrence || [],
      reminders: googleEvent.reminders || { useDefault: true },
      status: googleEvent.status || 'confirmed',
      timeZone: googleEvent.start?.timeZone || 'UTC',
      created: googleEvent.created ? new Date(googleEvent.created) : new Date(),
      updated: googleEvent.updated ? new Date(googleEvent.updated) : new Date(),
      syncedAt: new Date()
    };
  }

  async getCalendarList(accountId: string, orgId: string) {
    try {
      const account = await entityService.findById(orgId, accountId);
      if (!account || account.type !== 'calendar_account') {
        throw new Error('Calendar account not found');
      }

      const calendar = await this.getAuthenticatedClient(account as CalendarAccount);

      const response = await calendar.calendarList.list();
      return response.data.items || [];

    } catch (error) {
      console.error('Error getting calendar list:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();