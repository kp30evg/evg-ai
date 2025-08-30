import { pgTable, uuid, varchar, jsonb, text, timestamp, integer, boolean, index, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Core unified entities table - the heart of evergreenOS
export const entities = pgTable('entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'contact', 'deal', 'task', 'email', etc.
  data: jsonb('data').notNull(),
  metadata: jsonb('metadata').default({}),
  relationships: jsonb('relationships').default([]),
  searchVector: text('search_vector'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
  version: integer('version').default(1)
}, (table) => ({
  companyIdx: index('idx_entities_company').on(table.companyId),
  typeIdx: index('idx_entities_type').on(table.companyId, table.type),
  dataIdx: index('idx_entities_data').using('gin', table.data),
  relationshipsIdx: index('idx_entities_relationships').using('gin', table.relationships)
}));

// Audit logs for compliance
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  entityId: uuid('entity_id'),
  action: varchar('action', { length: 100 }).notNull(),
  changes: jsonb('changes'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Command history for ML training
export const commandHistory = pgTable('command_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  input: text('input').notNull(),
  intent: jsonb('intent'),
  entitiesReferenced: uuid('entities_referenced').array(),
  result: jsonb('result'),
  success: boolean('success'),
  errorMessage: text('error_message'),
  executionTimeMs: integer('execution_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Companies table
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  settings: jsonb('settings').default({}),
  subscription: jsonb('subscription'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  role: varchar('role', { length: 50 }).default('member'),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Module registry
export const modules = pgTable('modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  enabled: boolean('enabled').default(true),
  config: jsonb('config').default({}),
  installedAt: timestamp('installed_at').defaultNow().notNull()
});

// Types for TypeScript
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type CommandHistory = typeof commandHistory.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Module = typeof modules.$inferSelect;