import {
  date,
  integer,
  pgSchema,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Job Manager owns only the "jobs" Postgres schema. It never reads or writes the stock or order
// tables; everything about stock and orders goes through their HTTP API.
export const jobsSchema = pgSchema("jobs");

export const jobsTable = jobsSchema.table("jobs", {
  jobId: text("job_id").primaryKey(),
  jobDate: date("job_date", { mode: "string" }).notNull(),
  client: text("client").notNull(),
  clientAddress: text("client_address").notNull().default(""),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const jobPartsTable = jobsSchema.table(
  "job_parts",
  {
    jobId: text("job_id")
      .notNull()
      .references(() => jobsTable.jobId, { onDelete: "cascade" }),
    partNumber: text("part_number").notNull(),
    description: text("description").notNull().default(""),
    quantity: integer("quantity").notNull(),
    quantityAllocated: integer("quantity_allocated").notNull().default(0),
    quantityOrdered: integer("quantity_ordered").notNull().default(0),
    draftOrderNumber: text("draft_order_number"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.jobId, table.partNumber] })],
);
