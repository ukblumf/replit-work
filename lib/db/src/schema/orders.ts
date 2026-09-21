import {
  date,
  doublePrecision,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  orderNumber: text("order_number").primaryKey(),
  orderDate: date("order_date", { mode: "string" }).notNull(),
  supplierName: text("supplier_name").notNull(),
  status: text("status").notNull().default("Draft"),
  reference: text("reference").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const orderLinesTable = pgTable(
  "order_lines",
  {
    orderNumber: text("order_number")
      .notNull()
      .references(() => ordersTable.orderNumber, { onDelete: "cascade" }),
    lineNumber: integer("line_number").notNull(),
    partNumber: text("part_number").notNull(),
    externalPartNumber: text("external_part_number").notNull().default(""),
    description: text("description").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitPrice: doublePrecision("unit_price").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderNumber, table.lineNumber] }),
  ],
);

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertOrderLineSchema = createInsertSchema(orderLinesTable);

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertOrderLine = z.infer<typeof insertOrderLineSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderLine = typeof orderLinesTable.$inferSelect;