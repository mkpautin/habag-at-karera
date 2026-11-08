CREATE TYPE "public"."game_phase" AS ENUM('LANDING', 'STATION_1', 'STATION_2', 'STATION_3', 'FINISHED');--> statement-breakpoint
CREATE TYPE "public"."account_role" AS ENUM('GROUP', 'ADMIN');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(80) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "account_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"phase" "game_phase" DEFAULT 'LANDING' NOT NULL,
	"current_round" smallint DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"finished_at" timestamp with time zone,
	CONSTRAINT "groups_account_id_unique" UNIQUE("account_id"),
	CONSTRAINT "groups_round_check" CHECK ("groups"."current_round" between 0 and 5)
);
--> statement-breakpoint
CREATE TABLE "round_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"station_number" smallint NOT NULL,
	"round_number" smallint NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "station_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"station_number" smallint NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"elapsed_ms" bigint,
	CONSTRAINT "station_number_check" CHECK ("station_runs"."station_number" between 1 and 3)
);
--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round_runs" ADD CONSTRAINT "round_runs_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "station_runs" ADD CONSTRAINT "station_runs_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "round_group_station_number" ON "round_runs" USING btree ("group_id","station_number","round_number");--> statement-breakpoint
CREATE UNIQUE INDEX "station_group_number" ON "station_runs" USING btree ("group_id","station_number");