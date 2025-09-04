import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/lib/db';
import { entities } from '@/lib/db/schema/unified';
import { eq, and } from 'drizzle-orm';

export async function syncGoogleCalendarEvents(
  workspaceId: string, 
  userId: string, 
  tokens: any
) {
  try {
    console.log('Starting Google Calendar sync...');
    
    // Initialize OAuth client
    const oauth2Client = new OAuth2Client(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
    );
    
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Get calendar events for the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.data.items || [];
    console.log(`Found ${events.length} calendar events to sync`);
    
    let syncedCount = 0;
    for (const event of events) {
      try {
        // Check if event already exists
        const { sql } = await import('drizzle-orm');
        const existingEvent = await db
          .select()
          .from(entities)
          .where(
            and(
              eq(entities.workspaceId, workspaceId),
              eq(entities.userId, userId),
              eq(entities.type, 'calendar_event'),
              sql`data->>'googleEventId' = ${event.id}`
            )
          )
          .limit(1);
        
        if (existingEvent.length > 0) {
          // Update existing event
          await db
            .update(entities)
            .set({
              data: {
                googleEventId: event.id,
                title: event.summary || 'Untitled Event',
                description: event.description || '',
                startTime: event.start?.dateTime || event.start?.date,
                endTime: event.end?.dateTime || event.end?.date,
                location: event.location || '',
                attendees: event.attendees?.map((a: any) => a.email) || [],
                status: event.status || 'confirmed',
                htmlLink: event.htmlLink,
                isAllDay: !event.start?.dateTime
              },
              updatedAt: new Date()
            })
            .where(eq(entities.id, existingEvent[0].id));
        } else {
          // Create new event with USER ISOLATION
          await db.insert(entities).values({
            workspaceId: workspaceId,
            userId: userId, // CRITICAL: Set user ID for isolation
            type: 'calendar_event',
            data: {
              googleEventId: event.id,
              title: event.summary || 'Untitled Event',
              description: event.description || '',
              startTime: event.start?.dateTime || event.start?.date,
              endTime: event.end?.dateTime || event.end?.date,
              location: event.location || '',
              attendees: event.attendees?.map((a: any) => a.email) || [],
              status: event.status || 'confirmed',
              htmlLink: event.htmlLink,
              isAllDay: !event.start?.dateTime
            },
            metadata: {
              source: 'google_calendar',
              syncedAt: new Date().toISOString()
            }
          });
        }
        
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync calendar event ${event.id}:`, error);
      }
    }
    
    console.log(`Calendar sync completed! Synced ${syncedCount} events`);
    return { success: true, syncedCount };
    
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    throw new Error(`Failed to sync calendar: ${error}`);
  }
}