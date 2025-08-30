CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"entity_id" uuid,
	"action" varchar(100) NOT NULL,
	"changes" jsonb,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "command_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"input" text NOT NULL,
	"intent" jsonb,
	"entities_referenced" uuid[],
	"result" jsonb,
	"success" boolean,
	"error_message" text,
	"execution_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"subscription" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"data" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"relationships" jsonb DEFAULT '[]'::jsonb,
	"search_vector" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"version" varchar(20) NOT NULL,
	"enabled" boolean DEFAULT true,
	"config" jsonb DEFAULT '{}'::jsonb,
	"installed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company_id" uuid,
	"role" varchar(50) DEFAULT 'member',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_entities_company" ON "entities" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_entities_type" ON "entities" USING btree ("company_id","type");--> statement-breakpoint
CREATE INDEX "idx_entities_data" ON "entities" USING gin ("data");--> statement-breakpoint
CREATE INDEX "idx_entities_relationships" ON "entities" USING gin ("relationships");