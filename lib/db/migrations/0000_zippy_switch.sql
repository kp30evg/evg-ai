CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"entity_id" uuid,
	"activity_type" varchar(50) NOT NULL,
	"source_module" varchar(50),
	"content" jsonb DEFAULT '{}'::jsonb,
	"participants" uuid[],
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid,
	"type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"relationships" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"search_vector" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_entity_id" uuid,
	"target_entity_id" uuid,
	"relationship_type" varchar(50) NOT NULL,
	"strength_score" integer DEFAULT 50,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"workspace_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"image_url" text,
	"role" varchar(50) DEFAULT 'member',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_source_entity_id_entities_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_target_entity_id_entities_id_fk" FOREIGN KEY ("target_entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_activities_workspace" ON "activities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_activities_entity" ON "activities" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "idx_activities_timestamp" ON "activities" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_activities_type" ON "activities" USING btree ("activity_type");--> statement-breakpoint
CREATE INDEX "idx_activities_user" ON "activities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_entities_workspace" ON "entities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_entities_user" ON "entities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_entities_type" ON "entities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_entities_workspace_type" ON "entities" USING btree ("workspace_id","type");--> statement-breakpoint
CREATE INDEX "idx_entities_workspace_user" ON "entities" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_entities_data" ON "entities" USING gin ("data");--> statement-breakpoint
CREATE INDEX "idx_entities_relationships" ON "entities" USING gin ("relationships");--> statement-breakpoint
CREATE INDEX "idx_entities_created" ON "entities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_relationships_workspace" ON "relationships" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_source" ON "relationships" USING btree ("source_entity_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_target" ON "relationships" USING btree ("target_entity_id");--> statement-breakpoint
CREATE INDEX "idx_relationships_type" ON "relationships" USING btree ("relationship_type");--> statement-breakpoint
CREATE INDEX "idx_user_clerk" ON "users" USING btree ("clerk_user_id");--> statement-breakpoint
CREATE INDEX "idx_user_workspace" ON "users" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "idx_workspace_clerk_org" ON "workspaces" USING btree ("clerk_org_id");