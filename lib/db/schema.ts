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

// Companies table - Extended with onboarding data
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: text('slug'),
  
  // Onboarding data
  onboardingCompleted: boolean('onboarding_completed').default(false),
  onboardingStep: integer('onboarding_step').default(0),
  onboardingStartedAt: timestamp('onboarding_started_at'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  
  // Company profile from onboarding
  companySize: text('company_size'), // '1-10', '11-50', '51-200', '201-500', '500+'
  industry: text('industry'), // 'saas', 'ecommerce', 'finance', 'healthcare', etc.
  primaryUseCase: text('primary_use_case'), // 'sales', 'operations', 'finance', 'hr', 'all'
  
  // Integration settings
  connectedIntegrations: jsonb('connected_integrations').default([]),
  // Stores: ['salesforce', 'gmail', 'slack', 'quickbooks', etc.]
  
  settings: jsonb('settings').default({}),
  subscription: jsonb('subscription'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Users table - Extended with onboarding tracking
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  companyId: uuid('company_id').references(() => companies.id),
  
  // User-specific onboarding
  hasCompletedTour: boolean('has_completed_tour').default(false),
  firstCommandExecuted: boolean('first_command_executed').default(false),
  
  role: varchar('role', { length: 50 }).default('member'), // 'admin', 'member', 'viewer'
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

// Integration credentials - encrypted storage
export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  
  provider: text('provider').notNull(), // 'salesforce', 'gmail', 'slack', etc.
  credentials: jsonb('credentials'), // Encrypted tokens/keys
  
  status: text('status').default('pending'), // 'pending', 'connected', 'error', 'disconnected'
  lastSyncAt: timestamp('last_sync_at'),
  syncError: text('sync_error'),
  
  metadata: jsonb('metadata').default({}), // Provider-specific data
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Team invitations
export const invitations = pgTable('invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  
  email: text('email').notNull(),
  role: text('role').default('member'),
  invitedBy: uuid('invited_by').references(() => users.id),
  
  status: text('status').default('pending'), // 'pending', 'accepted', 'expired'
  acceptedAt: timestamp('accepted_at'),
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Onboarding analytics - track conversion and user journey
export const onboardingEvents = pgTable('onboarding_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').references(() => companies.id),
  userId: varchar('user_id', { length: 255 }), // Clerk user ID
  
  event: text('event').notNull(), // 'step_completed', 'integration_connected', 'data_imported', etc.
  stepName: text('step_name'),
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Types for TypeScript
export type Entity = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type CommandHistory = typeof commandHistory.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Integration = typeof integrations.$inferSelect;
export type Invitation = typeof invitations.$inferSelect;
export type OnboardingEvent = typeof onboardingEvents.$inferSelect;