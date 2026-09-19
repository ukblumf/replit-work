import { Router, type IRouter } from "express";
import {
  CreateOrderBody,
  CreateOrderResponse,
  DeleteOrderParams,
  GetOrderParams,
  GetOrderResponse,
  GetOrderSummaryResponse,
  ListOrdersQueryParams,
  ListOrdersResponse,
  UpdateOrderBody,
  UpdateOrderParams,
  UpdateOrderResponse,
} from "@workspace/api-zod";
import { db, orderLinesTable, ordersTable } from "@workspace/db";
import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  sql,
} from "drizzle-orm";
import { stockApiAuth } from "../middlewares/stock-api-auth";

const router: IRouter = Router();

router.use("/orders", stockApiAuth, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function hasDuplicateLineNumbers(lines: Array<{ lineNumber: number }>): boolean {
  return new Set(lines.map((line) => line.lineNumber)).size !== lines.length;
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function loadOrder(orderNumber: string) {
  const [header] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, orderNumber));

  if (!header) {
    return null;
  }

  const lines = await db
    .select({
      lineNumber: orderLinesTable.lineNumber,
      partNumber: orderLinesTable.partNumber,
      externalPartNumber: orderLinesTable.externalPartNumber,
      description: orderLinesTable.description,
      quantity: orderLinesTable.quantity,
      unitPrice: orderLinesTable.unitPrice,
    })
    .from(orderLinesTable)
    .where(eq(orderLinesTable.orderNumber, orderNumber))
    .orderBy(asc(orderLinesTable.lineNumber));

  return {
    ...header,
    lines,
    totalValue: lines.reduce(
      (total, line) => total + line.quantity * line.unitPrice,
      0,
    ),
  };
}

router.get("/orders", async (req, res): Promise<void> => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let matchingOrderNumbers: string[] | undefined;
  if (query.data.partNumber) {
    const matches = await db
      .selectDistinct({ orderNumber: orderLinesTable.orderNumber })
      .from(orderLinesTable)
      .where(ilike(orderLinesTable.partNumber, `%${query.data.partNumber}%`));
    matchingOrderNumbers = matches.map((match) => match.orderNumber);

    if (matchingOrderNumbers.length === 0) {
      res.json(ListOrdersResponse.parse([]));
      return;
    }
  }

  const filters = [
    query.data.orderNumber
      ? ilike(ordersTable.orderNumber, `%${query.data.orderNumber}%`)
      : undefined,
    matchingOrderNumbers
      ? inArray(ordersTable.orderNumber, matchingOrderNumbers)
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const orders = await db
    .select({
      orderNumber: ordersTable.orderNumber,
      orderDate: ordersTable.orderDate,
      supplierName: ordersTable.supplierName,
      status: ordersTable.status,
      lineCount: sql<number>`count(${orderLinesTable.lineNumber})::int`,
      totalValue: sql<number>`coalesce(sum(${orderLinesTable.quantity} * ${orderLinesTable.unitPrice}), 0)::float8`,
    })
    .from(ordersTable)
    .leftJoin(
      orderLinesTable,
      eq(ordersTable.orderNumber, orderLinesTable.orderNumber),
    )
    .where(filters.length > 0 ? and(...filters) : undefined)
    .groupBy(
      ordersTable.orderNumber,
      ordersTable.orderDate,
      ordersTable.supplierName,
      ordersTable.status,
    )
    .orderBy(asc(ordersTable.orderNumber));

  res.json(ListOrdersResponse.parse(orders));
});

router.post("/orders", async (req, res): Promise<void> => {
  const body = CreateOrderBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  if (hasDuplicateLineNumbers(body.data.lines)) {
    res.status(400).json({ error: "Line Numbers must be unique within an order" });
    return;
  }

  try {
    await db.transaction(async (tx) => {
      await tx.insert(ordersTable).values({
        orderNumber: body.data.orderNumber,
        orderDate: toCalendarDate(body.data.orderDate),
        supplierName: body.data.supplierName,
        status: body.data.status,
      });
      await tx.insert(orderLinesTable).values(
        body.data.lines.map((line) => ({
          orderNumber: body.data.orderNumber,
          ...line,
        })),
      );
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ error: "Order Number already exists" });
      return;
    }
    throw error;
  }

  const created = await loadOrder(body.data.orderNumber);
  res.status(201).json(CreateOrderResponse.parse(created));
});

router.get("/orders/summary", async (_req, res): Promise<void> => {
  const [orderTotals] = await db
    .select({
      orderCount: sql<number>`count(*)::int`,
      openOrderCount: sql<number>`count(*) filter (where ${ordersTable.status} not in ('Received', 'Cancelled'))::int`,
    })
    .from(ordersTable);

  const [valueTotals] = await db
    .select({
      totalValue: sql<number>`coalesce(sum(${orderLinesTable.quantity} * ${orderLinesTable.unitPrice}), 0)::float8`,
    })
    .from(orderLinesTable);

  const groupedStatuses = await db
    .select({
      status: ordersTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  res.json(
    GetOrderSummaryResponse.parse({
      orderCount: orderTotals?.orderCount ?? 0,
      openOrderCount: orderTotals?.openOrderCount ?? 0,
      totalValue: valueTotals?.totalValue ?? 0,
      statusCounts: Object.fromEntries(
        groupedStatuses.map((row) => [row.status, row.count]),
      ),
    }),
  );
});

router.get("/orders/:orderNumber", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await loadOrder(params.data.orderNumber);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetOrderResponse.parse(order));
});

router.patch("/orders/:orderNumber", async (req, res): Promise<void> => {
  const params = UpdateOrderParams.safeParse(req.params);
  const body = UpdateOrderBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error?.message,
    });
    return;
  }

  if (body.data.lines && hasDuplicateLineNumbers(body.data.lines)) {
    res.status(400).json({ error: "Line Numbers must be unique within an order" });
    return;
  }

  const [existing] = await db
    .select({ orderNumber: ordersTable.orderNumber })
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, params.data.orderNumber));
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db.transaction(async (tx) => {
    const { lines } = body.data;
    const headerUpdate = {
      ...(body.data.orderDate
        ? { orderDate: toCalendarDate(body.data.orderDate) }
        : {}),
      ...(body.data.supplierName
        ? { supplierName: body.data.supplierName }
        : {}),
      ...(body.data.status ? { status: body.data.status } : {}),
    };
    if (Object.keys(headerUpdate).length > 0) {
      await tx
        .update(ordersTable)
        .set(headerUpdate)
        .where(eq(ordersTable.orderNumber, params.data.orderNumber));
    }

    if (lines) {
      await tx
        .delete(orderLinesTable)
        .where(eq(orderLinesTable.orderNumber, params.data.orderNumber));
      await tx.insert(orderLinesTable).values(
        lines.map((line) => ({
          orderNumber: params.data.orderNumber,
          ...line,
        })),
      );
    }
  });

  const updated = await loadOrder(params.data.orderNumber);
  res.json(UpdateOrderResponse.parse(updated));
});

router.delete("/orders/:orderNumber", async (req, res): Promise<void> => {
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(ordersTable)
    .where(eq(ordersTable.orderNumber, params.data.orderNumber))
    .returning({ orderNumber: ordersTable.orderNumber });
  if (!deleted) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.status(204).send();
});

export default router;