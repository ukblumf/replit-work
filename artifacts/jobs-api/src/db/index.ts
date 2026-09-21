import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Creates the jobs schema on startup so there is no separate migration step for this POC.
// Keep in step with schema.ts.
export async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS jobs;
    CREATE SEQUENCE IF NOT EXISTS jobs.job_number_seq;
    CREATE TABLE IF NOT EXISTS jobs.jobs (
      job_id text PRIMARY KEY,
      job_date date NOT NULL,
      client text NOT NULL,
      client_address text NOT NULL DEFAULT '',
      description text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS jobs.job_parts (
      job_id text NOT NULL REFERENCES jobs.jobs(job_id) ON DELETE CASCADE,
      part_number text NOT NULL,
      description text NOT NULL DEFAULT '',
      quantity integer NOT NULL,
      quantity_allocated integer NOT NULL DEFAULT 0,
      quantity_ordered integer NOT NULL DEFAULT 0,
      draft_order_number text,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (job_id, part_number)
    );
  `);
}

export * from "./schema";
