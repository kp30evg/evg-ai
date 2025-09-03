import { pgTable, index, unique, uuid, varchar, jsonb, timestamp, foreignKey, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const workspaces = pgTable("workspaces", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_workspace_clerk_org").using("btree", table.clerkOrgId.asc().nullsLast().op("text_ops")),
	unique("workspaces_clerk_org_id_key").on(table.clerkOrgId),
	unique("workspaces_slug_key").on(table.slug),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	workspaceId: uuid("workspace_id"),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	imageUrl: text("image_url"),
	role: varchar({ length: 50 }).default('member'),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_user_clerk").using("btree", table.clerkUserId.asc().nullsLast().op("text_ops")),
	index("idx_user_workspace").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "users_workspace_id_fkey"
		}),
	unique("users_clerk_user_id_key").on(table.clerkUserId),
]);

export const entities = pgTable("entities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	data: jsonb().notNull(),
	relationships: jsonb().default({}),
	metadata: jsonb().default({}),
	searchVector: text("search_vector"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_entities_created").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_entities_data").using("gin", table.data.asc().nullsLast().op("jsonb_ops")),
	index("idx_entities_relationships").using("gin", table.relationships.asc().nullsLast().op("jsonb_ops")),
	index("idx_entities_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_entities_workspace").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops")),
	index("idx_entities_workspace_type").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.type.asc().nullsLast().op("uuid_ops")),
]);
