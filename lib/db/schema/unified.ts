/**
 * evergreenOS Unified Schema
 * This is the ONLY schema file needed for the entire system
 * ALL business data lives in the entities table
 */

import { pgTable, uuid, varchar, jsonb, text, timestamp, index, boolean } from 'drizzle-orm/pg-core';

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
  typeIdx: index('idx_entities_type').on(table.type),
  workspaceTypeIdx: index('idx_entities_workspace_type').on(table.workspaceId, table.type),
  dataGinIdx: index('idx_entities_data').using('gin', table.data),
  relationshipsGinIdx: index('idx_entities_relationships').using('gin', table.relationships),
  createdAtIdx: index('idx_entities_created').on(table.createdAt),
}));

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

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