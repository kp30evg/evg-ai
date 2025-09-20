/**
 * EverCal Module - Calendar functionality using EntityService
 * Simple functions for managing events, availability, and scheduling
 */

import { entityService } from '@/lib/entities/entity-service';
import { google } from 'googleapis';
import { addDays, format, parseISO, isWithinInterval } from 'date-fns';
import * as evercore from './evercore';
import * as everchat from './everchat';
import { activityService } from '@/lib/services/activity-service';

// Entity data types
export interface EventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: string[];
  location?: string;
  googleEventId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  recurrence?: string;
}

export interface AvailabilityData {
  userId: string;
  dayOfWeek: number; // 0-6, Sunday=0
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  timezone: string;
  isActive: boolean;
}

export interface BookingData {
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookedAt: Date;
  notes?: string;
}

/**
 * Create a calendar event
 */
export async function createEvent(
  workspaceId: string,
  data: EventData,
  userId?: string
): Promise<any> {
  const event = await entityService.create(
    workspaceId,
    'calendar_event',
    data,
    {},
    { userId }
  );

  // Auto-link to contacts if attendees exist and log activities
  for (const attendeeEmail of data.attendees) {
    const contacts = await entityService.find({
      workspaceId,
      type: 'contact',
      where: { email: attendeeEmail }
    });
    
    if (contacts.length > 0) {
      await entityService.link(
        workspaceId,
        event.id,
        contacts[0].id,
        'attendee'
      );
      
      // Log meeting scheduled activity for each contact
      await activityService.logActivity(
        workspaceId,
        contacts[0].id,
        'meeting_scheduled',
        'evercal',
        {
          eventId: event.id,
          title: data.title,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          attendees: data.attendees
        },
        { userId, participants: contacts.map(c => c.id) }
      );
    }
  }

  return event;
}

/**
 * Get events for a date range
 */
export async function getEventsByDateRange(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<any[]> {
  console.log('getEventsByDateRange called with:', { startDate, endDate, workspaceId });
  
  // First, let's see ALL entities in this workspace
  const allEntities = await entityService.find({ workspaceId });
  console.log('Found total entities in workspace:', allEntities.length);
  console.log('Entity types in workspace:', [...new Set(allEntities.map(e => e.type))]);
  
  const results = await entityService.find({
    workspaceId,
    type: 'calendar_event'
  });
  
  console.log('Found total calendar_events:', results.length);
  console.log('Sample events:', results.slice(0, 3).map(e => ({ title: e.data.title, startTime: e.data.startTime })));

  // Filter by date range in memory for now
  const filtered = results.filter(entity => {
    const startTime = new Date(entity.data.startTime);
    const inRange = startTime >= startDate && startTime <= endDate;
    if (!inRange && results.length > 0) {
      console.log('Event filtered out:', { title: entity.data.title, startTime: entity.data.startTime, startDate, endDate });
    }
    return inRange;
  });
  
  console.log('Filtered events count:', filtered.length);
  return filtered;
}

/**
 * Create availability window
 */
export async function setAvailability(
  workspaceId: string,
  data: AvailabilityData,
  userId?: string
): Promise<any> {
  return await entityService.create(
    workspaceId,
    'availability',
    data,
    { user: data.userId },
    { userId }
  );
}

/**
 * Get user's availability windows
 */
export async function getAvailability(
  workspaceId: string,
  userId: string
): Promise<any[]> {
  const results = await entityService.find({
    workspaceId,
    type: 'availability',
    where: { userId, isActive: true }
  });

  return results;
}

/**
 * Find mutual availability between multiple users
 */
export async function findMutualAvailability(
  workspaceId: string,
  userIds: string[],
  durationMinutes: number = 60,
  lookAheadDays: number = 7
): Promise<Array<{ startTime: Date; endTime: Date }>> {
  const startDate = new Date();
  const endDate = addDays(startDate, lookAheadDays);
  
  // Get all users' availability
  const allAvailability = await Promise.all(
    userIds.map(userId => getAvailability(workspaceId, userId))
  );

  // Get all existing events for these users
  const allEvents = await Promise.all(
    userIds.map(userId => 
      getEventsByDateRange(workspaceId, startDate, endDate, userId)
    )
  );

  const mutualSlots: Array<{ startTime: Date; endTime: Date }> = [];

  // Find overlapping availability windows
  // This is a simplified version - would need more complex logic for production
  for (let day = 0; day < lookAheadDays; day++) {
    const currentDate = addDays(startDate, day);
    const dayOfWeek = currentDate.getDay();

    // Find availability windows for all users on this day
    const dayAvailability = allAvailability.map(userAvail =>
      userAvail.filter(avail => avail.data.dayOfWeek === dayOfWeek)
    );

    // Find overlapping time windows (simplified logic)
    if (dayAvailability.every(userAvail => userAvail.length > 0)) {
      // Get earliest start and latest end that works for everyone
      const commonStart = dayAvailability
        .map(userAvail => userAvail[0]?.data.startTime || '09:00')
        .sort()
        .pop(); // Latest start time
      
      const commonEnd = dayAvailability
        .map(userAvail => userAvail[0]?.data.endTime || '17:00')
        .sort()[0]; // Earliest end time

      if (commonStart && commonEnd && commonStart < commonEnd) {
        const startTime = new Date(currentDate);
        const [startHour, startMin] = commonStart.split(':').map(Number);
        startTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(currentDate);
        const [endHour, endMin] = commonEnd.split(':').map(Number);
        endTime.setHours(endHour, endMin, 0, 0);

        // Check if there are no conflicting events
        const hasConflict = allEvents.some(userEvents =>
          userEvents.some(event =>
            isWithinInterval(startTime, {
              start: new Date(event.data.startTime),
              end: new Date(event.data.endTime)
            })
          )
        );

        if (!hasConflict) {
          mutualSlots.push({ startTime, endTime });
        }
      }
    }
  }

  return mutualSlots;
}

/**
 * Schedule a meeting with automatic conflict detection
 */
export async function scheduleMeeting(
  workspaceId: string,
  title: string,
  attendeeEmails: string[],
  startTime: Date,
  endTime: Date,
  description?: string,
  userId?: string
): Promise<any> {
  // Check for conflicts with existing events
  const conflicts = await Promise.all(
    attendeeEmails.map(async (email) => {
      const contacts = await entityService.find({
        workspaceId,
        type: 'contact',
        where: { email }
      });
      
      if (contacts.length > 0) {
        const existingEvents = await getEventsByDateRange(
          workspaceId,
          startTime,
          endTime,
          contacts.entities[0].id
        );
        
        return existingEvents.filter(event =>
          isWithinInterval(startTime, {
            start: new Date(event.data.startTime),
            end: new Date(event.data.endTime)
          }) || isWithinInterval(endTime, {
            start: new Date(event.data.startTime),
            end: new Date(event.data.endTime)
          })
        );
      }
      return [];
    })
  );

  const hasConflicts = conflicts.some(userConflicts => userConflicts.length > 0);
  
  if (hasConflicts) {
    throw new Error('Scheduling conflict detected. Please choose a different time.');
  }

  // Create the event
  const event = await createEvent(
    workspaceId,
    {
      title,
      description,
      startTime,
      endTime,
      attendees: attendeeEmails,
      status: 'confirmed'
    },
    userId
  );

  return event;
}

/**
 * Reschedule an existing event
 */
export async function rescheduleEvent(
  workspaceId: string,
  eventId: string,
  newStartTime: Date,
  newEndTime: Date,
  userId?: string
): Promise<any> {
  const event = await entityService.getById(workspaceId, eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  // Check for conflicts at new time
  const conflicts = await getEventsByDateRange(
    workspaceId,
    newStartTime,
    newEndTime,
    userId
  );

  const hasConflicts = conflicts.some(conflictEvent =>
    conflictEvent.id !== eventId && (
      isWithinInterval(newStartTime, {
        start: new Date(conflictEvent.data.startTime),
        end: new Date(conflictEvent.data.endTime)
      }) || isWithinInterval(newEndTime, {
        start: new Date(conflictEvent.data.startTime),
        end: new Date(conflictEvent.data.endTime)
      })
    )
  );

  if (hasConflicts) {
    throw new Error('Scheduling conflict at new time. Please choose a different time.');
  }

  // Update the event
  return await entityService.update(
    workspaceId,
    eventId,
    {
      startTime: newStartTime,
      endTime: newEndTime
    },
    { userId }
  );
}

/**
 * Get today's events for quick access
 */
export async function getTodaysEvents(
  workspaceId: string,
  userId?: string
): Promise<any[]> {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return await getEventsByDateRange(workspaceId, startOfDay, endOfDay, userId);
}

/**
 * Get upcoming events (next 7 days)
 */
export async function getUpcomingEvents(
  workspaceId: string,
  userId?: string,
  days: number = 7
): Promise<any[]> {
  const now = new Date();
  const endDate = addDays(now, days);

  return await getEventsByDateRange(workspaceId, now, endDate, userId);
}

/**
 * Cancel an event
 */
export async function cancelEvent(
  workspaceId: string,
  eventId: string,
  userId?: string
): Promise<any> {
  // Get the event details first
  const event = await entityService.findById(workspaceId, eventId);
  
  // Update the event status
  const updatedEvent = await entityService.update(
    workspaceId,
    eventId,
    { status: 'cancelled' },
    { userId }
  );
  
  // Log cancellation activity for all linked contacts
  if (event) {
    const linkedContacts = await entityService.findRelated(workspaceId, eventId, 'attendee');
    
    for (const contact of linkedContacts) {
      await activityService.logActivity(
        workspaceId,
        contact.id,
        'meeting_cancelled',
        'evercal',
        {
          eventId: eventId,
          title: event.data.title,
          originalTime: event.data.startTime,
          reason: 'Event cancelled'
        },
        { userId }
      );
    }
  }
  
  return updatedEvent;
}

/**
 * Create event from a deal - cross-module integration with EverCore
 */
export async function createEventFromDeal(
  workspaceId: string,
  dealId: string,
  eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
  },
  userId?: string
): Promise<any> {
  // Get the deal from EverCore
  const deal = await entityService.getById(workspaceId, dealId);
  if (!deal || deal.type !== 'deal') {
    throw new Error('Deal not found');
  }

  // Get contacts related to the deal
  const dealContacts = await entityService.getRelatedEntities(
    workspaceId,
    dealId,
    'contact'
  );

  // Extract attendee emails from contacts
  const attendees = dealContacts.map(contact => contact.data.email).filter(Boolean);

  // Create the event
  const event = await createEvent(
    workspaceId,
    {
      ...eventData,
      attendees,
      status: 'pending'
    },
    userId
  );

  // Link event to deal
  await entityService.addRelationship(
    workspaceId,
    event.id,
    dealId,
    'related_to_deal'
  );

  return event;
}

/**
 * Send meeting summary to chat channel - integration with EverChat
 */
export async function sendMeetingSummary(
  workspaceId: string,
  eventId: string,
  summary: string,
  channelName?: string,
  userId?: string
): Promise<any> {
  const event = await entityService.getById(workspaceId, eventId);
  if (!event || event.type !== 'calendar_event') {
    throw new Error('Event not found');
  }

  const eventData = event.data as EventData;
  
  // Create formatted message
  const message = `📅 **Meeting Summary: ${eventData.title}**\n\n` +
    `**Date:** ${eventData.startTime.toLocaleDateString()}\n` +
    `**Time:** ${eventData.startTime.toLocaleTimeString()} - ${eventData.endTime.toLocaleTimeString()}\n\n` +
    `**Summary:**\n${summary}`;

  // Send to specified channel or create a general one
  const channel = channelName || 'meetings';
  
  return await everchat.sendMessage(
    workspaceId,
    message,
    undefined, // Let it create or find conversation
    userId
  );
}

/**
 * Automatically schedule follow-up based on deal stage
 */
export async function scheduleFollowUpForDeal(
  workspaceId: string,
  dealId: string,
  userId?: string
): Promise<any> {
  const deal = await entityService.getById(workspaceId, dealId);
  if (!deal || deal.type !== 'deal') {
    throw new Error('Deal not found');
  }

  const dealData = deal.data;
  const stage = dealData.stage || 'initial';
  
  // Determine follow-up timing based on deal stage
  const followUpDays: { [key: string]: number } = {
    'initial': 2,
    'discovery': 3,
    'proposal': 1,
    'negotiation': 1,
    'closing': 1
  };

  const days = followUpDays[stage] || 7;
  const followUpDate = addDays(new Date(), days);
  followUpDate.setHours(10, 0, 0, 0); // Default to 10 AM

  // Get deal contacts
  const contacts = await entityService.getRelatedEntities(
    workspaceId,
    dealId,
    'contact'
  );

  const attendees = contacts.map(c => c.data.email).filter(Boolean);
  
  // Create follow-up event
  const event = await createEvent(
    workspaceId,
    {
      title: `Follow-up: ${dealData.name}`,
      description: `Automated follow-up for deal in ${stage} stage`,
      startTime: followUpDate,
      endTime: addDays(followUpDate, 0), // Same day, 1 hour later
      attendees,
      status: 'pending'
    },
    userId
  );

  // Link to deal
  await entityService.addRelationship(
    workspaceId,
    event.id,
    dealId,
    'follow_up_for_deal'
  );

  return event;
}

/**
 * Find events related to a customer across all deals
 */
export async function getCustomerMeetingHistory(
  workspaceId: string,
  customerId: string
): Promise<any[]> {
  // Get all deals for this customer
  const customerDeals = await entityService.find({
    workspaceId,
    type: 'deal',
    where: { customerId }
  });

  // Get all events related to these deals
  const allEvents = [];
  for (const deal of customerDeals) {
    const dealEvents = await entityService.findRelated(
      workspaceId,
      deal.id,
      'calendar_event'
    );
    allEvents.push(...dealEvents);
  }

  // Also get events where customer contacts are attendees
  const customerContacts = await entityService.find({
    workspaceId,
    type: 'contact',
    where: { customerId }
  });

  for (const contact of customerContacts) {
    const contactEmail = contact.data.email;
    if (contactEmail) {
      const contactEvents = await entityService.find({
        workspaceId,
        type: 'calendar_event'
      });
      
      // Filter events where this contact is an attendee
      const attendeeEvents = contactEvents.filter(event => 
        event.data.attendees?.includes(contactEmail)
      );
      
      allEvents.push(...attendeeEvents);
    }
  }

  // Remove duplicates and sort by date
  const uniqueEvents = allEvents.filter((event, index, self) =>
    index === self.findIndex(e => e.id === event.id)
  );

  return uniqueEvents.sort((a, b) => 
    new Date(b.data.startTime).getTime() - new Date(a.data.startTime).getTime()
  );
}

/**
 * Get upcoming events (used by command processor)
 */
export async function getUpcomingEventsForProcessor(
  workspaceId: string,
  limit: number = 10,
  userId?: string
): Promise<any[]> {
  const now = new Date();
  const endDate = addDays(now, 30); // Look ahead 30 days

  const events = await getEventsByDateRange(workspaceId, now, endDate, userId);
  
  // Sort by start time and limit results
  return events
    .sort((a, b) => new Date(a.data.startTime).getTime() - new Date(b.data.startTime).getTime())
    .slice(0, limit);
}

/**
 * Find available time slots
 */
export async function findAvailableTime(
  workspaceId: string,
  durationMinutes: number = 60,
  lookAheadDays: number = 7,
  userId?: string
): Promise<Array<{ startTime: Date; endTime: Date }>> {
  const now = new Date();
  const endDate = addDays(now, lookAheadDays);

  // Get all existing events in the time period
  const existingEvents = await getEventsByDateRange(workspaceId, now, endDate, userId);

  // Default working hours: 9 AM to 5 PM
  const workingHours = {
    startHour: 9,
    endHour: 17
  };

  const availableSlots = [];
  
  // Check each day
  for (let day = 1; day <= lookAheadDays; day++) {
    const checkDate = addDays(now, day);
    
    // Skip weekends
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Generate potential slots for this day
    for (let hour = workingHours.startHour; hour < workingHours.endHour; hour++) {
      const slotStart = new Date(checkDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Check if slot conflicts with existing events
      const hasConflict = existingEvents.some(event => {
        const eventStart = new Date(event.data.startTime);
        const eventEnd = new Date(event.data.endTime);
        
        return (slotStart < eventEnd && slotEnd > eventStart);
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: slotStart,
          endTime: slotEnd
        });
      }
    }
  }

  return availableSlots.slice(0, 20); // Limit to 20 slots
}

/**
 * Search events by title or description
 */
export async function searchEvents(
  workspaceId: string,
  searchTerm: string,
  userId?: string
): Promise<any[]> {
  const allEvents = await entityService.find({
    workspaceId,
    type: 'calendar_event'
  });

  const searchLower = searchTerm.toLowerCase();
  
  return allEvents.filter(event => {
    const title = event.data.title?.toLowerCase() || '';
    const description = event.data.description?.toLowerCase() || '';
    
    return title.includes(searchLower) || description.includes(searchLower);
  }).sort((a, b) => 
    new Date(b.data.startTime).getTime() - new Date(a.data.startTime).getTime()
  );
}