import { Router, type IRouter } from "express";
import {
  AppendOrderLineBody,
  AppendOrderLineParams,
  AppendOrderLineResponse,
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
import { db, orderLinesTable, ordersTable, stockItemsTable } from "@workspace/db";
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

router.use(["/orders", "/order"], stockApiAuth, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function hasDuplicateLineNumbers(lines: Array<{ lineNumber: number }>): boolean {
  return new Set(lines.map((line) => line.lineNumber)).size !== lines.length;
}

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function isUniqueViolation(error: unknown): boolean {
  const code = (candidate: unknown) =>
    typeof candidate === "object" && candidate !== null && "code" in candidate
      ? candidate.code
      : undefined;
  return (
    code(error) === "23505" ||
    (typeof error === "object" &&
      error !== null &&
      "cause" in error &&
      code(error.cause) === "23505")
  );
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Next PO-nnnn number. Concurrent creates can compute the same number; the caller retries on a
// unique violation.
async function nextOrderNumber(tx: Tx): Promise<string> {
  const [row] = await tx
    .select({
      max: sql<number | null>`max(substring(${ordersTable.orderNumber} from '^PO-([0-9]+)$')::int)`,
    })
    .from(ordersTable);
  return `PO-${String((row?.max ?? 0) + 1).padStart(4, "0")}`;
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
    query.data.reference
      ? eq(ordersTable.reference, query.data.reference)
      : undefined,
  ].filter((filter): filter is NonNullable<typeof filter> => Boolean(filter));

  const orders = await db
    .select({
      orderNumber: ordersTable.orderNumber,
      orderDate: ordersTable.orderDate,
      supplierName: ordersTable.supplierName,
      status: ordersTable.status,
      reference: ordersTable.reference,
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
      ordersTable.reference,
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

  // orderNumber is optional: when omitted the server generates the next PO-nnnn number.
  const generateNumber = !body.data.orderNumber;
  let orderNumber = body.data.orderNumber ?? "";
  for (let attempt = 0; ; attempt++) {
    try {
      await db.transaction(async (tx) => {
        if (generateNumber) {
          orderNumber = await nextOrderNumber(tx);
        }
        await tx.insert(ordersTable).values({
          orderNumber,
          orderDate: toCalendarDate(body.data.orderDate),
          supplierName: body.data.supplierName,
          status: body.data.status,
          reference: body.data.reference ?? "",
        });
        await tx.insert(orderLinesTable).values(
          body.data.lines.map((line) => ({
            orderNumber,
            ...line,
          })),
        );
      });
      break;
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Lost a race for a generated number: try again with the next one.
        if (generateNumber && attempt < 4) continue;
        res.status(409).json({ error: "Order Number already exists" });
        return;
      }
      throw error;
    }
  }

  const created = await loadOrder(orderNumber);
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

router.get("/order/:orderNumber", async (req, res): Promise<void> => {
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

router.patch("/order/:orderNumber", async (req, res): Promise<void> => {
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
    .select({ orderNumber: ordersTable.orderNumber, status: ordersTable.status })
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, params.data.orderNumber));
  if (!existing) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Only the transition into Received books stock in; re-saving a Received order must not double count.
  const isBeingReceived =
    body.data.status === "Received" && existing.status !== "Received";

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
      ...(body.data.reference !== undefined
        ? { reference: body.data.reference }
        : {}),
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

    if (isBeingReceived) {
      // Add each received line quantity to stock in the same transaction as the status change.
      // Lines whose part number is not in stock are skipped.
      const receivedLines = await tx
        .select({
          partNumber: orderLinesTable.partNumber,
          quantity: orderLinesTable.quantity,
        })
        .from(orderLinesTable)
        .where(eq(orderLinesTable.orderNumber, params.data.orderNumber));
      for (const line of receivedLines) {
        await tx
          .update(stockItemsTable)
          .set({
            quantity: sql`${stockItemsTable.quantity} + ${line.quantity}`,
          })
          .where(eq(stockItemsTable.partNumber, line.partNumber));
      }
    }
  });

  const updated = await loadOrder(params.data.orderNumber);
  res.json(UpdateOrderResponse.parse(updated));
});

// Add a line to a Draft order (or increase the quantity if the part is already on it).
router.post("/order/:orderNumber/lines", async (req, res): Promise<void> => {
  const params = AppendOrderLineParams.safeParse(req.params);
  const body = AppendOrderLineBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error?.message,
    });
    return;
  }

  const { orderNumber } = params.data;
  const outcome = await db.transaction(async (tx) => {
    // Lock the header row so concurrent appends cannot pick the same line number.
    const [order] = await tx
      .select({ status: ordersTable.status })
      .from(ordersTable)
      .where(eq(ordersTable.orderNumber, orderNumber))
      .for("update");
    if (!order) return "not-found" as const;
    if (order.status !== "Draft") return "not-draft" as const;

    const [existing] = await tx
      .select({ lineNumber: orderLinesTable.lineNumber })
      .from(orderLinesTable)
      .where(
        and(
          eq(orderLinesTable.orderNumber, orderNumber),
          eq(orderLinesTable.partNumber, body.data.partNumber),
        ),
      );

    if (existing) {
      await tx
        .update(orderLinesTable)
        .set({
          quantity: sql`${orderLinesTable.quantity} + ${body.data.quantity}`,
        })
        .where(
          and(
            eq(orderLinesTable.orderNumber, orderNumber),
            eq(orderLinesTable.lineNumber, existing.lineNumber),
          ),
        );
    } else {
      const [{ nextLine }] = await tx
        .select({
          nextLine: sql<number>`coalesce(max(${orderLinesTable.lineNumber}), 0)::int + 1`,
        })
        .from(orderLinesTable)
        .where(eq(orderLinesTable.orderNumber, orderNumber));
      await tx.insert(orderLinesTable).values({
        orderNumber,
        lineNumber: nextLine,
        partNumber: body.data.partNumber,
        externalPartNumber: body.data.externalPartNumber ?? "",
        description: body.data.description ?? "",
        quantity: body.data.quantity,
        unitPrice: body.data.unitPrice,
      });
    }
    return "ok" as const;
  });

  if (outcome === "not-found") {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  if (outcome === "not-draft") {
    res.status(409).json({ error: "Only Draft orders can be changed" });
    return;
  }

  const updated = await loadOrder(orderNumber);
  res.json(AppendOrderLineResponse.parse(updated));
});

router.delete("/order/:orderNumber", async (req, res): Promise<void> => {
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