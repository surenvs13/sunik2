CREATE TABLE "calendar_events" (
	"id" text PRIMARY KEY,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_metadata" (
	"id" text PRIMARY KEY,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
