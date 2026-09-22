import {
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockItemsTable = pgTable("stock_items", {
  partNumber: text("part_number").primaryKey(),
  itemName: text("item_name").notNull(),
  description: text("description").notNull().default(""),
  supplier: text("supplier").notNull().default(""),
  quantity: integer("quantity").notNull().default(0),
  cost: doublePrecision("cost").notNull().default(0),
  retailPrice: doublePrecision("retail_price").notNull().default(0),
  binNumber: text("bin_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertStockItemSchema = createInsertSchema(stockItemsTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
export type StockItem = typeof stockItemsTable.$inferSelect;