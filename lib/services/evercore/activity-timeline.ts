/**
 * Unified Activity Timeline - Complete customer interaction history
 * Shows ALL touchpoints across EVERY evergreenOS module in one timeline
 * This is the single source of truth for all customer interactions
 * 
 * Supported modules:
 * - EverMail (email)
 * - EverChat (messages) 
 * - EverCal (meetings, calendar events)
 * - EverCore (deals, tasks, notes)
 * - EverDocs (documents, contracts)
 * - EverSupport (tickets, issues)
 * - EverInvoice (invoices, payments)
 * - EverMarketing (campaigns, forms)
 * - Future modules automatically included
 */

import { entityService } from '@/lib/entities/entity-service';

export interface TimelineEvent {
  id: string;
  type: string; // Dynamic type to support ANY entity type from any module
  module?: string; // Which evergreenOS module this came from
  timestamp: Date;
  title: string;
  description?: string;
  participants?: string[];
  icon?: string;
  color?: string;
  metadata?: {
    dealId?: string;
    contactId?: string;
    companyId?: string;
    value?: number;
    stage?: string;
    sentiment?: number;
    important?: boolean;
    source?: string; // Which integration/source (Gmail, Slack, etc)
    [key: string]: any; // Allow any additional metadata from future modules
  };
  relatedEntities?: {
    type: string;
    id: string;
    name: string;
  }[];
  rawEntity?: any; // Store original entity for future module compatibility
}

export interface TimelineFilters {
  types?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  participants?: string[];
  dealId?: string;
  contactId?: string;
  companyId?: string;
  searchQuery?: string;
}

/**
 * Get unified timeline for a contact - includes EVERYTHING
 */
export async function getContactTimeline(
  workspaceId: string,
  contactId: string,
  filters?: TimelineFilters
): Promise<TimelineEvent[]> {
  // Get ALL related entities - this captures everything from every module
  const related = await entityService.findRelated(workspaceId, contactId);
  
  // Get contact details
  const contact = await entityService.findById(workspaceId, contactId);
  if (!contact) return [];
  
  // Also get entities where this contact is mentioned in metadata or relationships
  const mentionedIn = await entityService.find({
    workspaceId,
    where: {
      $or: [
        { 'metadata.contactId': contactId },
        { 'data.contactId': contactId },
        { 'data.participants': { $contains: contact.data.email } },
        { 'data.attendees': { $contains: contact.data.email } },
        { 'data.to': { $contains: contact.data.email } },
        { 'data.from': contact.data.email },
        { 'data.cc': { $contains: contact.data.email } },
        { 'data.bcc': { $contains: contact.data.email } }
      ]
    },
    limit: 1000
  });
  
  // Combine all related entities
  const allRelated = [...related, ...mentionedIn];
  
  // Remove duplicates
  const uniqueEntities = Array.from(
    new Map(allRelated.map(e => [e.id, e])).values()
  );
  
  // Transform ALL entities into timeline events
  const events: TimelineEvent[] = [];
  
  for (const entity of uniqueEntities) {
    const event = transformToTimelineEvent(entity, contact);
    if (event && shouldIncludeEvent(event, filters)) {
      events.push(event);
    }
  }
  
  // Add system events
  if (contact.data.enrichedAt) {
    events.push({
      id: `enrich-${contactId}`,
      type: 'enrichment',
      module: 'evercore',
      timestamp: new Date(contact.data.enrichedAt),
      title: 'Contact Enriched',
      description: 'Profile automatically enriched with company and social data',
      icon: 'sparkles',
      color: '#FFD600',
      metadata: { contactId, important: true }
    });
  }
  
  // Add contact creation event
  events.push({
    id: `created-${contactId}`,
    type: 'contact_created',
    module: 'evercore',
    timestamp: new Date(contact.createdAt),
    title: 'Contact Created',
    description: `${contact.data.firstName} ${contact.data.lastName} added to CRM`,
    icon: 'user-plus',
    color: '#10B981',
    metadata: { 
      contactId,
      important: true,
      source: contact.data.source || 'manual'
    }
  });
  
  // Sort by timestamp descending (most recent first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get unified timeline for a company
 */
export async function getCompanyTimeline(
  workspaceId: string,
  companyId: string,
  filters?: TimelineFilters
): Promise<TimelineEvent[]> {
  // Get company and all related entities
  const company = await entityService.findById(workspaceId, companyId);
  if (!company) return [];
  
  const related = await entityService.findRelated(workspaceId, companyId);
  
  // Get all contacts at this company
  const contacts = await entityService.find({
    workspaceId,
    type: 'contact',
    relationships: { company: companyId },
    limit: 100
  });
  
  // Get activities for all contacts
  const allEvents: TimelineEvent[] = [];
  
  // Add company-level events
  for (const entity of related) {
    const event = transformToTimelineEvent(entity, company);
    if (event && shouldIncludeEvent(event, filters)) {
      allEvents.push(event);
    }
  }
  
  // Add contact-level events
  for (const contact of contacts) {
    const contactRelated = await entityService.findRelated(workspaceId, contact.id);
    for (const entity of contactRelated) {
      const event = transformToTimelineEvent(entity, contact);
      if (event && shouldIncludeEvent(event, filters)) {
        allEvents.push(event);
      }
    }
  }
  
  // Deduplicate and sort
  const uniqueEvents = Array.from(
    new Map(allEvents.map(e => [e.id, e])).values()
  );
  
  return uniqueEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get unified timeline for a deal
 */
export async function getDealTimeline(
  workspaceId: string,
  dealId: string,
  filters?: TimelineFilters
): Promise<TimelineEvent[]> {
  const deal = await entityService.findById(workspaceId, dealId);
  if (!deal) return [];
  
  const related = await entityService.findRelated(workspaceId, dealId);
  const events: TimelineEvent[] = [];
  
  // Add deal stage changes
  if (deal.data.stageHistory) {
    for (const change of deal.data.stageHistory) {
      events.push({
        id: `stage-${dealId}-${change.timestamp}`,
        type: 'deal_change',
        timestamp: new Date(change.timestamp),
        title: `Stage changed to ${change.stage}`,
        description: `Deal moved from ${change.fromStage} to ${change.stage}`,
        icon: 'target',
        color: '#1D5238',
        metadata: {
          dealId,
          stage: change.stage,
          value: deal.data.value
        }
      });
    }
  }
  
  // Add all related activities
  for (const entity of related) {
    const event = transformToTimelineEvent(entity, deal);
    if (event && shouldIncludeEvent(event, filters)) {
      events.push(event);
    }
  }
  
  // Add deal creation
  events.push({
    id: `created-${dealId}`,
    type: 'deal_change',
    timestamp: new Date(deal.createdAt),
    title: 'Deal Created',
    description: `${deal.data.name} - ${formatCurrency(deal.data.value)}`,
    icon: 'plus-circle',
    color: '#10B981',
    metadata: {
      dealId,
      value: deal.data.value,
      important: true
    }
  });
  
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Transform ANY entity to timeline event - extensible for future modules
 */
function transformToTimelineEvent(entity: any, context: any): TimelineEvent | null {
  const baseEvent: TimelineEvent = {
    id: entity.id,
    type: entity.type, // Keep original type for future compatibility
    timestamp: new Date(entity.createdAt),
    metadata: {
      ...entity.metadata,
      entityType: entity.type
    },
    rawEntity: entity // Store for future module use
  };
  
  // Determine which module this came from
  const moduleMap: Record<string, string> = {
    'email': 'evermail',
    'email_account': 'evermail',
    'message': 'everchat',
    'channel': 'everchat',
    'calendar_event': 'evercal',
    'meeting': 'evercal',
    'contact': 'evercore',
    'company': 'evercore',
    'deal': 'evercore',
    'task': 'evercore',
    'note': 'evercore',
    'invoice': 'everinvoice',
    'payment': 'everinvoice',
    'ticket': 'eversupport',
    'document': 'everdocs',
    'contract': 'everdocs',
    'campaign': 'evermarketing',
    'form_submission': 'evermarketing',
    // Future modules will automatically work
  };
  
  baseEvent.module = moduleMap[entity.type] || 'unknown';
  
  // Handle known types with specific formatting
  switch (entity.type) {
    case 'email':
      return {
        ...baseEvent,
        title: entity.data.subject || 'Email',
        description: entity.data.preview || entity.data.snippet || entity.data.body?.slice(0, 200),
        participants: extractEmailParticipants(entity),
        icon: 'mail',
        color: '#0EA5E9',
        metadata: {
          ...baseEvent.metadata,
          sentiment: entity.data.sentiment,
          source: entity.data.source || 'gmail',
          threadId: entity.data.threadId
        }
      };
    
    case 'message':
      return {
        ...baseEvent,
        title: `Message${entity.data.channel ? ` in #${entity.data.channel}` : ''}`,
        description: entity.data.content?.slice(0, 200) || entity.data.text?.slice(0, 200),
        participants: [entity.data.userId, entity.data.username].filter(Boolean),
        icon: 'message-square',
        color: '#8B5CF6',
        metadata: {
          ...baseEvent.metadata,
          channel: entity.data.channel,
          source: 'everchat'
        }
      };
    
    case 'calendar_event':
    case 'meeting':
      return {
        ...baseEvent,
        title: entity.data.title || entity.data.summary || 'Meeting',
        description: entity.data.description || entity.data.location,
        participants: extractMeetingParticipants(entity),
        icon: 'calendar',
        color: '#F97316',
        metadata: {
          ...baseEvent.metadata,
          important: true,
          startTime: entity.data.startTime,
          endTime: entity.data.endTime,
          source: entity.data.source || 'google_calendar'
        }
      };
    
    case 'task':
      return {
        ...baseEvent,
        title: entity.data.title || entity.data.name || 'Task',
        description: entity.data.description || entity.data.notes,
        participants: [entity.data.assignedTo, entity.data.assignee].filter(Boolean),
        icon: entity.data.completed || entity.data.status === 'done' ? 'check-square' : 'square',
        color: entity.data.completed || entity.data.status === 'done' ? '#10B981' : '#6B7280',
        metadata: {
          ...baseEvent.metadata,
          dueDate: entity.data.dueDate,
          priority: entity.data.priority
        }
      };
    
    case 'deal':
      return {
        ...baseEvent,
        title: `Deal: ${entity.data.name}`,
        description: `Stage: ${entity.data.stage} • Value: $${entity.data.value}`,
        icon: 'target',
        color: '#1D5238',
        metadata: {
          ...baseEvent.metadata,
          value: entity.data.value,
          stage: entity.data.stage,
          important: true
        }
      };
    
    case 'note':
      return {
        ...baseEvent,
        title: entity.data.title || 'Note Added',
        description: entity.data.content?.slice(0, 200) || entity.data.body?.slice(0, 200),
        icon: 'file-text',
        color: '#6B7280'
      };
    
    case 'call':
      return {
        ...baseEvent,
        title: `Call${entity.data.direction ? ` (${entity.data.direction})` : ''}`,
        description: formatCallDetails(entity),
        participants: [entity.data.with, entity.data.phoneNumber].filter(Boolean),
        icon: 'phone',
        color: '#10B981',
        metadata: {
          ...baseEvent.metadata,
          duration: entity.data.duration,
          recording: entity.data.recordingUrl
        }
      };
    
    case 'invoice':
      return {
        ...baseEvent,
        title: `Invoice #${entity.data.number || entity.data.id}`,
        description: `Amount: $${entity.data.amount} • Status: ${entity.data.status}`,
        icon: 'file-text',
        color: '#FFD600',
        metadata: {
          ...baseEvent.metadata,
          amount: entity.data.amount,
          status: entity.data.status,
          dueDate: entity.data.dueDate
        }
      };
    
    case 'payment':
      return {
        ...baseEvent,
        title: `Payment Received`,
        description: `Amount: $${entity.data.amount}`,
        icon: 'dollar-sign',
        color: '#10B981',
        metadata: {
          ...baseEvent.metadata,
          amount: entity.data.amount,
          method: entity.data.method
        }
      };
    
    case 'ticket':
    case 'support_ticket':
      return {
        ...baseEvent,
        title: entity.data.subject || `Ticket #${entity.data.number}`,
        description: entity.data.description?.slice(0, 200),
        icon: 'help-circle',
        color: '#EF4444',
        metadata: {
          ...baseEvent.metadata,
          priority: entity.data.priority,
          status: entity.data.status
        }
      };
    
    case 'document':
    case 'contract':
      return {
        ...baseEvent,
        title: entity.data.name || entity.data.title || 'Document',
        description: entity.data.description || `Type: ${entity.data.type}`,
        icon: 'file',
        color: '#6B7280',
        metadata: {
          ...baseEvent.metadata,
          fileUrl: entity.data.url,
          signed: entity.data.signed
        }
      };
    
    case 'campaign':
      return {
        ...baseEvent,
        title: `Campaign: ${entity.data.name}`,
        description: entity.data.description || `Type: ${entity.data.type}`,
        icon: 'megaphone',
        color: '#8B5CF6',
        metadata: {
          ...baseEvent.metadata,
          campaignType: entity.data.type,
          status: entity.data.status
        }
      };
    
    case 'form_submission':
      return {
        ...baseEvent,
        title: `Form Submitted: ${entity.data.formName || 'Contact Form'}`,
        description: `Source: ${entity.data.source || 'Website'}`,
        icon: 'clipboard-check',
        color: '#0EA5E9',
        metadata: {
          ...baseEvent.metadata,
          formData: entity.data.fields
        }
      };
    
    // Default handler for unknown/future entity types
    default:
      // Still create an event for unknown types so nothing is missed
      return {
        ...baseEvent,
        title: formatDefaultTitle(entity),
        description: formatDefaultDescription(entity),
        participants: extractDefaultParticipants(entity),
        icon: getDefaultIcon(entity.type),
        color: '#6B7280',
        metadata: {
          ...baseEvent.metadata,
          originalType: entity.type
        }
      };
  }
}

// Helper functions for data extraction
function extractEmailParticipants(entity: any): string[] {
  const participants = [];
  if (entity.data.from) participants.push(entity.data.from);
  if (entity.data.to) {
    if (Array.isArray(entity.data.to)) {
      participants.push(...entity.data.to);
    } else {
      participants.push(entity.data.to);
    }
  }
  if (entity.data.cc) {
    if (Array.isArray(entity.data.cc)) {
      participants.push(...entity.data.cc);
    } else {
      participants.push(entity.data.cc);
    }
  }
  return participants.filter(Boolean);
}

function extractMeetingParticipants(entity: any): string[] {
  const participants = [];
  if (entity.data.attendees) {
    if (Array.isArray(entity.data.attendees)) {
      participants.push(...entity.data.attendees);
    } else {
      participants.push(entity.data.attendees);
    }
  }
  if (entity.data.organizer) participants.push(entity.data.organizer);
  if (entity.data.participants) {
    if (Array.isArray(entity.data.participants)) {
      participants.push(...entity.data.participants);
    } else {
      participants.push(entity.data.participants);
    }
  }
  return participants.filter(Boolean);
}

function extractDefaultParticipants(entity: any): string[] {
  const participants = [];
  // Try common field names
  const fields = ['participants', 'users', 'attendees', 'members', 'contacts', 'people'];
  for (const field of fields) {
    if (entity.data[field]) {
      if (Array.isArray(entity.data[field])) {
        participants.push(...entity.data[field]);
      } else {
        participants.push(entity.data[field]);
      }
    }
  }
  return participants.filter(Boolean);
}

function formatCallDetails(entity: any): string {
  const details = [];
  if (entity.data.duration) details.push(`Duration: ${entity.data.duration}`);
  if (entity.data.outcome) details.push(`Outcome: ${entity.data.outcome}`);
  if (entity.data.notes) details.push(entity.data.notes.slice(0, 100));
  return details.join(' • ') || 'Call logged';
}

function formatDefaultTitle(entity: any): string {
  // Try common title fields
  const titleFields = ['title', 'name', 'subject', 'summary', 'label'];
  for (const field of titleFields) {
    if (entity.data[field]) return entity.data[field];
  }
  // Fallback to type
  return entity.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function formatDefaultDescription(entity: any): string {
  // Try common description fields
  const descFields = ['description', 'content', 'body', 'text', 'message', 'notes'];
  for (const field of descFields) {
    if (entity.data[field]) {
      const desc = entity.data[field];
      return typeof desc === 'string' ? desc.slice(0, 200) : JSON.stringify(desc).slice(0, 200);
    }
  }
  // Show some data fields
  const keys = Object.keys(entity.data).slice(0, 3);
  return keys.map(k => `${k}: ${entity.data[k]}`).join(' • ').slice(0, 200);
}

function getDefaultIcon(type: string): string {
  // Map common patterns to icons
  if (type.includes('email')) return 'mail';
  if (type.includes('message') || type.includes('chat')) return 'message-square';
  if (type.includes('call') || type.includes('phone')) return 'phone';
  if (type.includes('meeting') || type.includes('calendar')) return 'calendar';
  if (type.includes('task')) return 'check-square';
  if (type.includes('note')) return 'file-text';
  if (type.includes('deal') || type.includes('opportunity')) return 'target';
  if (type.includes('invoice') || type.includes('payment')) return 'dollar-sign';
  if (type.includes('document') || type.includes('file')) return 'file';
  if (type.includes('ticket') || type.includes('support')) return 'help-circle';
  return 'activity'; // Generic activity icon
}

/**
 * Check if event should be included based on filters
 */
function shouldIncludeEvent(event: TimelineEvent, filters?: TimelineFilters): boolean {
  if (!filters) return true;
  
  // Type filter
  if (filters.types && filters.types.length > 0) {
    if (!filters.types.includes(event.type)) return false;
  }
  
  // Date range filter
  if (filters.dateRange) {
    if (event.timestamp < filters.dateRange.start || event.timestamp > filters.dateRange.end) {
      return false;
    }
  }
  
  // Participant filter
  if (filters.participants && filters.participants.length > 0) {
    const hasParticipant = event.participants?.some(p => 
      filters.participants!.includes(p)
    );
    if (!hasParticipant) return false;
  }
  
  // Search query filter
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    const searchable = [
      event.title,
      event.description,
      ...(event.participants || [])
    ].join(' ').toLowerCase();
    
    if (!searchable.includes(query)) return false;
  }
  
  return true;
}

/**
 * Get activity summary for a time period
 */
export async function getActivitySummary(
  workspaceId: string,
  entityId: string,
  days: number = 30
): Promise<{
  totalActivities: number;
  byType: Record<string, number>;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastActivity?: Date;
  nextScheduled?: Date;
}> {
  const timeline = await getContactTimeline(workspaceId, entityId, {
    dateRange: {
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });
  
  // Count by type
  const byType: Record<string, number> = {};
  for (const event of timeline) {
    byType[event.type] = (byType[event.type] || 0) + 1;
  }
  
  // Calculate trend
  const midPoint = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000);
  const firstHalf = timeline.filter(e => e.timestamp < midPoint).length;
  const secondHalf = timeline.filter(e => e.timestamp >= midPoint).length;
  
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (secondHalf > firstHalf * 1.2) trend = 'increasing';
  else if (secondHalf < firstHalf * 0.8) trend = 'decreasing';
  
  // Find next scheduled activity
  const futureActivities = await entityService.find({
    workspaceId,
    type: 'calendar_event',
    where: {
      startTime: { $gt: new Date() }
    },
    limit: 1,
    orderBy: 'startTime',
    orderDirection: 'asc'
  });
  
  return {
    totalActivities: timeline.length,
    byType,
    trend,
    lastActivity: timeline[0]?.timestamp,
    nextScheduled: futureActivities[0]?.data.startTime
  };
}

/**
 * Get engagement insights
 */
export async function getEngagementInsights(
  workspaceId: string,
  entityId: string
): Promise<{
  engagementLevel: 'hot' | 'warm' | 'cold' | 'dormant';
  daysSinceLastContact: number;
  preferredChannel: string;
  bestTimeToContact: string;
  responseRate: number;
  averageResponseTime: number; // in hours
}> {
  const timeline = await getContactTimeline(workspaceId, entityId, {
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      end: new Date()
    }
  });
  
  // Calculate days since last contact
  const lastActivity = timeline[0];
  const daysSinceLastContact = lastActivity 
    ? Math.floor((Date.now() - lastActivity.timestamp.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Determine engagement level
  let engagementLevel: 'hot' | 'warm' | 'cold' | 'dormant' = 'dormant';
  if (daysSinceLastContact <= 7) engagementLevel = 'hot';
  else if (daysSinceLastContact <= 30) engagementLevel = 'warm';
  else if (daysSinceLastContact <= 90) engagementLevel = 'cold';
  
  // Find preferred channel
  const channelCounts: Record<string, number> = {};
  for (const event of timeline) {
    channelCounts[event.type] = (channelCounts[event.type] || 0) + 1;
  }
  const preferredChannel = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'email';
  
  // Analyze contact times
  const hourCounts: Record<number, number> = {};
  for (const event of timeline) {
    const hour = event.timestamp.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  const bestHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '9';
  const bestTimeToContact = `${bestHour}:00 - ${parseInt(bestHour) + 1}:00`;
  
  // Calculate response metrics
  const emailEvents = timeline.filter(e => e.type === 'email');
  const sentEmails = emailEvents.filter(e => 
    e.metadata?.contactId === entityId
  );
  const receivedEmails = emailEvents.filter(e => 
    e.metadata?.contactId !== entityId
  );
  const responseRate = sentEmails.length > 0 
    ? (receivedEmails.length / sentEmails.length) * 100
    : 0;
  
  // Calculate average response time
  let totalResponseTime = 0;
  let responseCount = 0;
  
  for (let i = 0; i < emailEvents.length - 1; i++) {
    if (emailEvents[i].metadata?.contactId !== entityId && 
        emailEvents[i + 1].metadata?.contactId === entityId) {
      const responseTime = emailEvents[i].timestamp.getTime() - 
                          emailEvents[i + 1].timestamp.getTime();
      totalResponseTime += responseTime;
      responseCount++;
    }
  }
  
  const averageResponseTime = responseCount > 0
    ? totalResponseTime / responseCount / (1000 * 60 * 60) // Convert to hours
    : 24; // Default to 24 hours
  
  return {
    engagementLevel,
    daysSinceLastContact,
    preferredChannel,
    bestTimeToContact,
    responseRate,
    averageResponseTime
  };
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}