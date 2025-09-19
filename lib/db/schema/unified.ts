/**
 * evergreenOS Unified Schema
 * This is the ONLY schema file needed for the entire system
 * ALL business data lives in the entities table
 */

import { pgTable, uuid, varchar, jsonb, text, timestamp, index, boolean, integer } from 'drizzle-orm/pg-core';

// Workspaces table - ONLY for authentication/multi-tenancy
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clerkOrgIdx: index('idx_workspace_clerk_org').on(table.clerkOrgId),
}));

// Users table - ONLY for authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  imageUrl: text('image_url'),
  role: varchar('role', { length: 50 }).default('member'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clerkUserIdx: index('idx_user_clerk').on(table.clerkUserId),
  workspaceIdx: index('idx_user_workspace').on(table.workspaceId),
}));

// THE ONE TABLE - All business data lives here
export const entities = pgTable('entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: uuid('user_id'), // User who owns this entity (critical for data isolation)
  type: varchar('type', { length: 50 }).notNull(), // 'customer', 'message', 'task', 'invoice', etc.
  data: jsonb('data').notNull().$type<Record<string, any>>(), // ALL entity data
  relationships: jsonb('relationships').default({}).$type<Record<string, any>>(), // Links between entities
  metadata: jsonb('metadata').default({}).$type<{
    createdBy?: string;
    version?: number;
    tags?: string[];
    [key: string]: any;
  }>(),
  searchVector: text('search_vector'), // Full-text search
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('idx_entities_workspace').on(table.workspaceId),
  userIdx: index('idx_entities_user').on(table.userId),
  typeIdx: index('idx_entities_type').on(table.type),
  workspaceTypeIdx: index('idx_entities_workspace_type').on(table.workspaceId, table.type),
  workspaceUserIdx: index('idx_entities_workspace_user').on(table.workspaceId, table.userId),
  dataGinIdx: index('idx_entities_data').using('gin', table.data),
  relationshipsGinIdx: index('idx_entities_relationships').using('gin', table.relationships),
  createdAtIdx: index('idx_entities_created').on(table.createdAt),
}));

// Activities table for timeline tracking
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: uuid('user_id'), // User who performed the activity
  entityId: uuid('entity_id').references(() => entities.id, { onDelete: 'cascade' }),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  sourceModule: varchar('source_module', { length: 50 }),
  content: jsonb('content').default({}).$type<Record<string, any>>(),
  participants: uuid('participants').array(),
  metadata: jsonb('metadata').default({}).$type<Record<string, any>>(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('idx_activities_workspace').on(table.workspaceId),
  entityIdx: index('idx_activities_entity').on(table.entityId),
  timestampIdx: index('idx_activities_timestamp').on(table.timestamp),
  typeIdx: index('idx_activities_type').on(table.activityType),
  userIdx: index('idx_activities_user').on(table.userId),
}));

// Relationships table for advanced entity linking
export const relationships = pgTable('relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  sourceEntityId: uuid('source_entity_id').references(() => entities.id, { onDelete: 'cascade' }),
  targetEntityId: uuid('target_entity_id').references(() => entities.id, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).notNull(),
  strengthScore: integer('strength_score').default(50),
  metadata: jsonb('metadata').default({}).$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workspaceIdx: index('idx_relationships_workspace').on(table.workspaceId),
  sourceIdx: index('idx_relationships_source').on(table.sourceEntityId),
  targetIdx: index('idx_relationships_target').on(table.targetEntityId),
  typeIdx: index('idx_relationships_type').on(table.relationshipType),
}));

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
export type Relationship = typeof relationships.$inferSelect;
export type NewRelationship = typeof relationships.$inferInsert;

// Common entity type definitions (for TypeScript)
export interface CustomerData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
}

export interface MessageData {
  content: string;
  channel: 'chat' | 'email' | 'sms';
  from?: string;
  to?: string;
  threadId?: string;
}

export interface TaskData {
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignedTo?: string;
}

// Calendar-related entity types
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
  timezone?: string;
}

// New Calendar Account entity type
export interface CalendarAccountData {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date;
  scope?: string;
  calendarCount?: number;
  connected: boolean;
  lastSync?: Date;
  lastSyncCount?: number;
  lastConnected?: Date;
  createdAt?: Date;
  disconnectedAt?: Date;
}

// Enhanced Calendar Event entity type
export interface CalendarEventData {
  googleEventId: string;
  calendarId: string;
  accountId: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendees: Array<{
    email: string;
    name?: string;
    responseStatus?: string;
  }>;
  location?: string;
  meetingLink?: string;
  recurrence?: string[];
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
  status: 'confirmed' | 'cancelled' | 'tentative';
  timeZone?: string;
  created?: Date;
  updated?: Date;
  syncedAt?: Date;
  archived?: boolean;
  archivedAt?: Date;
}

export interface AvailabilityData {
  userId: string;
  dayOfWeek: number; // 0-6, Sunday=0
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  timezone: string;
  isActive: boolean;
  type?: 'working_hours' | 'blocked' | 'available';
}

export interface BookingData {
  eventId: string;
  userId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookedAt: Date;
  notes?: string;
  confirmationCode?: string;
}

// Conversation data for EverChat
export interface ConversationData {
  name: string;
  participants: string[];
  lastMessageAt?: Date;
  messageCount: number;
  type: 'direct' | 'group' | 'channel';
  isArchived?: boolean;
}

export interface InvoiceData {
  invoiceNumber: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate?: Date;
  lineItems?: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
}

export interface ConversationData {
  title: string;
  participants?: string[];
  lastMessageAt?: Date;
  messageCount?: number;
  status?: 'active' | 'archived';
}

export interface EmailData {
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    size: number;
    url: string;
  }>;
}

export interface FileData {
  filename: string;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
}