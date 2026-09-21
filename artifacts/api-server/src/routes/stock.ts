import { Router, type IRouter } from "express";
import {
  AdjustStockQuantityBody,
  AdjustStockQuantityParams,
  AdjustStockQuantityResponse,
  CreateStockItemBody,
  CreateStockItemResponse,
  DeleteStockItemParams,
  GetStockItemParams,
  GetStockItemResponse,
  GetStockSummaryResponse,
  ListStockItemsQueryParams,
  ListStockItemsResponse,
  UpdateStockItemBody,
  UpdateStockItemParams,
  UpdateStockItemResponse,
} from "@workspace/api-zod";
import { db, stockItemsTable } from "@workspace/db";
import { and, asc, eq, ilike, sql } from "drizzle-orm";
import { stockApiAuth } from "../middlewares/stock-api-auth";

const router: IRouter = Router();

router.use("/stock", stockApiAuth, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/stock", async (req, res): Promise<void> => {
  const query = ListStockItemsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const items = await db
    .select()
    .from(stockItemsTable)
    .where(
      query.data.partNumber
        ? ilike(stockItemsTable.partNumber, `%${query.data.partNumber}%`)
        : undefined,
    )
    .orderBy(asc(stockItemsTable.partNumber));

  res.json(ListStockItemsResponse.parse(items));
});

router.post("/stock", async (req, res): Promise<void> => {
  const body = CreateStockItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  try {
    const [created] = await db
      .insert(stockItemsTable)
      .values(body.data)
      .returning();
    res.status(201).json(CreateStockItemResponse.parse(created));
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ error: "Part Number already exists" });
      return;
    }
    throw error;
  }
});

router.get("/stock/summary", async (_req, res): Promise<void> => {
  const [summary] = await db
    .select({
      itemCount: sql<number>`count(*)::int`,
      totalUnits: sql<number>`coalesce(sum(${stockItemsTable.quantity}), 0)::int`,
      inventoryCost: sql<number>`coalesce(sum(${stockItemsTable.quantity} * ${stockItemsTable.cost}), 0)::float8`,
      inventoryRetailValue: sql<number>`coalesce(sum(${stockItemsTable.quantity} * ${stockItemsTable.retailPrice}), 0)::float8`,
      lowStockCount: sql<number>`count(*) filter (where ${stockItemsTable.quantity} <= 5)::int`,
    })
    .from(stockItemsTable);

  res.json(GetStockSummaryResponse.parse(summary));
});

router.get("/stock/:partNumber", async (req, res): Promise<void> => {
  const params = GetStockItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [item] = await db
    .select()
    .from(stockItemsTable)
    .where(eq(stockItemsTable.partNumber, params.data.partNumber));

  if (!item) {
    res.status(404).json({ error: "Stock item not found" });
    return;
  }

  res.json(GetStockItemResponse.parse(item));
});

router.patch("/stock/:partNumber", async (req, res): Promise<void> => {
  const params = UpdateStockItemParams.safeParse(req.params);
  const body = UpdateStockItemBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error?.message,
    });
    return;
  }

  const [updated] = await db
    .update(stockItemsTable)
    .set(body.data)
    .where(eq(stockItemsTable.partNumber, params.data.partNumber))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Stock item not found" });
    return;
  }

  res.json(UpdateStockItemResponse.parse(updated));
});

// Atomic quantity change: a single UPDATE applies the delta and refuses to go below zero,
// so concurrent callers (e.g. several jobs taking the same part) cannot overwrite each other.
router.post("/stock/:partNumber/adjust", async (req, res): Promise<void> => {
  const params = AdjustStockQuantityParams.safeParse(req.params);
  const body = AdjustStockQuantityBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error?.message,
    });
    return;
  }

  const { quantityDelta } = body.data;
  if (quantityDelta === 0) {
    res.status(400).json({ error: "quantityDelta must not be 0" });
    return;
  }

  const [updated] = await db
    .update(stockItemsTable)
    .set({ quantity: sql`${stockItemsTable.quantity} + ${quantityDelta}` })
    .where(
      and(
        eq(stockItemsTable.partNumber, params.data.partNumber),
        sql`${stockItemsTable.quantity} + ${quantityDelta} >= 0`,
      ),
    )
    .returning();

  if (updated) {
    res.json(AdjustStockQuantityResponse.parse(updated));
    return;
  }

  // No row updated: either the part does not exist or there is not enough stock.
  const [existing] = await db
    .select({ quantity: stockItemsTable.quantity })
    .from(stockItemsTable)
    .where(eq(stockItemsTable.partNumber, params.data.partNumber));

  if (!existing) {
    res.status(404).json({ error: "Stock item not found" });
    return;
  }

  res.status(409).json({
    error: "Insufficient stock",
    available: existing.quantity,
  });
});

router.delete("/stock/:partNumber", async (req, res): Promise<void> => {
  const params = DeleteStockItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(stockItemsTable)
    .where(eq(stockItemsTable.partNumber, params.data.partNumber))
    .returning({ partNumber: stockItemsTable.partNumber });

  if (!deleted) {
    res.status(404).json({ error: "Stock item not found" });
    return;
  }

  res.status(204).send();
});

export default router;