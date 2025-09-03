/**
 * Google Calendar Integration for EverCal
 * Handles OAuth, sync, and CRUD operations with Google Calendar API
 */

import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { entityService } from '@/lib/entities/entity-service';
import { EventData } from '@/lib/db/schema/unified';

const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

export interface GoogleCredentials {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Create OAuth2 client for Google Calendar
 */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  );
}

/**
 * Get authorization URL for Google Calendar access
 */
export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_CALENDAR_SCOPES,
    prompt: 'consent' // Force refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleCredentials> {
  const oauth2Client = createOAuth2Client();
  
  const { tokens } = await oauth2Client.getAccessToken(code);
  
  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    scope: tokens.scope!,
    token_type: tokens.token_type!,
    expiry_date: tokens.expiry_date!
  };
}

/**
 * Create authenticated Google Calendar client
 */
export function createCalendarClient(credentials: GoogleCredentials): calendar_v3.Calendar {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(credentials);
  
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Import events from Google Calendar
 */
export async function importFromGoogleCalendar(
  workspaceId: string,
  userId: string,
  credentials: GoogleCredentials,
  calendarId: string = 'primary'
): Promise<number> {
  const calendar = createCalendarClient(credentials);
  
  // Get events from the last 30 days and next 365 days
  const timeMin = new Date();
  timeMin.setDate(timeMin.getDate() - 30);
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 365);

  const response = await calendar.events.list({
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  });

  const events = response.data.items || [];
  let importedCount = 0;

  for (const googleEvent of events) {
    try {
      // Check if event already exists
      const existingEvent = await entityService.search(
        workspaceId,
        'event',
        { googleEventId: googleEvent.id }
      );

      if (existingEvent.entities.length === 0) {
        // Convert Google event to our format
        const eventData: EventData = {
          title: googleEvent.summary || 'Untitled Event',
          description: googleEvent.description,
          startTime: new Date(googleEvent.start?.dateTime || googleEvent.start?.date || ''),
          endTime: new Date(googleEvent.end?.dateTime || googleEvent.end?.date || ''),
          attendees: googleEvent.attendees?.map(a => a.email || '').filter(Boolean) || [],
          location: googleEvent.location,
          googleEventId: googleEvent.id,
          status: googleEvent.status === 'confirmed' ? 'confirmed' : 'pending'
        };

        await entityService.create(
          workspaceId,
          'event',
          eventData,
          { user: userId },
          { userId }
        );

        importedCount++;
      }
    } catch (error) {
      console.error(`Failed to import event ${googleEvent.id}:`, error);
    }
  }

  return importedCount;
}

/**
 * Export event to Google Calendar
 */
export async function exportToGoogleCalendar(
  workspaceId: string,
  eventId: string,
  credentials: GoogleCredentials,
  calendarId: string = 'primary'
): Promise<string> {
  const calendar = createCalendarClient(credentials);
  
  // Get event from our system
  const event = await entityService.getById(workspaceId, eventId);
  if (!event || event.type !== 'event') {
    throw new Error('Event not found');
  }

  const eventData = event.data as EventData;

  // Create Google Calendar event
  const googleEvent: calendar_v3.Schema$Event = {
    summary: eventData.title,
    description: eventData.description,
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: eventData.timezone || 'UTC'
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: eventData.timezone || 'UTC'
    },
    attendees: eventData.attendees.map(email => ({ email })),
    location: eventData.location
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: googleEvent
  });

  // Update our event with Google Event ID
  if (response.data.id) {
    await entityService.update(
      workspaceId,
      eventId,
      { googleEventId: response.data.id },
      { userId: event.metadata?.createdBy }
    );
  }

  return response.data.id || '';
}

/**
 * Sync event changes to Google Calendar
 */
export async function syncEventToGoogle(
  workspaceId: string,
  eventId: string,
  credentials: GoogleCredentials,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = createCalendarClient(credentials);
  
  const event = await entityService.getById(workspaceId, eventId);
  if (!event || event.type !== 'event') {
    throw new Error('Event not found');
  }

  const eventData = event.data as EventData;

  if (!eventData.googleEventId) {
    // Event doesn't exist in Google Calendar, create it
    await exportToGoogleCalendar(workspaceId, eventId, credentials, calendarId);
    return;
  }

  // Update existing Google Calendar event
  const googleEvent: calendar_v3.Schema$Event = {
    summary: eventData.title,
    description: eventData.description,
    start: {
      dateTime: eventData.startTime.toISOString(),
      timeZone: eventData.timezone || 'UTC'
    },
    end: {
      dateTime: eventData.endTime.toISOString(),
      timeZone: eventData.timezone || 'UTC'
    },
    attendees: eventData.attendees.map(email => ({ email })),
    location: eventData.location,
    status: eventData.status === 'cancelled' ? 'cancelled' : 'confirmed'
  };

  await calendar.events.update({
    calendarId,
    eventId: eventData.googleEventId,
    requestBody: googleEvent
  });
}

/**
 * Delete event from Google Calendar
 */
export async function deleteFromGoogleCalendar(
  eventId: string,
  credentials: GoogleCredentials,
  calendarId: string = 'primary'
): Promise<void> {
  const calendar = createCalendarClient(credentials);
  
  await calendar.events.delete({
    calendarId,
    eventId
  });
}

/**
 * Get free/busy information from Google Calendar
 */
export async function getFreeBusy(
  credentials: GoogleCredentials,
  emails: string[],
  timeMin: Date,
  timeMax: Date
): Promise<{ [email: string]: Array<{ start: Date; end: Date }> }> {
  const calendar = createCalendarClient(credentials);
  
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: emails.map(email => ({ id: email }))
    }
  });

  const busyTimes: { [email: string]: Array<{ start: Date; end: Date }> } = {};

  for (const [email, data] of Object.entries(response.data.calendars || {})) {
    busyTimes[email] = (data.busy || []).map(busy => ({
      start: new Date(busy.start || ''),
      end: new Date(busy.end || '')
    }));
  }

  return busyTimes;
}

/**
 * Refresh expired access token
 */
export async function refreshAccessToken(credentials: GoogleCredentials): Promise<GoogleCredentials> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials(credentials);
  
  const { credentials: refreshedCredentials } = await oauth2Client.refreshAccessToken();
  
  return {
    ...credentials,
    access_token: refreshedCredentials.access_token!,
    expiry_date: refreshedCredentials.expiry_date!
  };
}