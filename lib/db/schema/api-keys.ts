import { pgTable, uuid, varchar, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull(),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  key: varchar('key', { length: 64 }).notNull().unique(),
  hashedKey: varchar('hashed_key', { length: 255 }).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  scopes: jsonb('scopes').default([]).notNull(), // Array of permitted scopes
  metadata: jsonb('metadata').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const apiKeyLogs = pgTable('api_key_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyId: uuid('api_key_id').notNull().references(() => apiKeys.id, { onDelete: 'cascade' }),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: varchar('status_code', { length: 3 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  requestBody: jsonb('request_body'),
  responseTime: varchar('response_time', { length: 10 }),
  error: varchar('error', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});