import { relations } from "drizzle-orm/relations";
import { workspaces, users } from "./schema";

export const usersRelations = relations(users, ({one}) => ({
	workspace: one(workspaces, {
		fields: [users.workspaceId],
		references: [workspaces.id]
	}),
}));

export const workspacesRelations = relations(workspaces, ({many}) => ({
	users: many(users),
}));