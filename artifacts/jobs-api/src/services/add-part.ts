import { sql } from "drizzle-orm";
import { db, jobPartsTable } from "../db";
import { logger } from "../lib/logger";
import { addShortfallToDraftOrder } from "../lib/orders-client";
import {
  InsufficientStockError,
  adjustStock,
  getStockItem,
} from "../lib/stock-client";

export class PartNotFoundError extends Error {
  constructor() {
    super("Part not found in stock");
    this.name = "PartNotFoundError";
  }
}

// Takes up to `wanted` from stock via the atomic adjust endpoint. If another caller takes stock
// between our read and our adjust (409), re-read and try once more. Returns how much was taken.
async function takeFromStock(
  partNumber: string,
  wanted: number,
  firstRead: { quantity: number },
): Promise<number> {
  let item: { quantity: number } | null = firstRead;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      item = await getStockItem(partNumber);
      if (!item) throw new PartNotFoundError();
    }
    const take = Math.min(wanted, item!.quantity);
    if (take <= 0) return 0;
    try {
      await adjustStock(partNumber, -take);
      return take;
    } catch (error) {
      if (!(error instanceof InsufficientStockError)) throw error;
    }
  }
  return 0;
}

// Adds `wanted` of a part to a job: takes what is in stock and puts any shortfall on a Draft
// order (reference = job id) in the Ordering API. Adding a part already on the job accumulates.
export async function addPartToJob(jobId: string, partNumber: string, wanted: number) {
  const stock = await getStockItem(partNumber);
  if (!stock) throw new PartNotFoundError();

  const allocated = await takeFromStock(partNumber, wanted, stock);
  const shortfall = wanted - allocated;

  let draftOrderNumber: string | null = null;
  if (shortfall > 0) {
    try {
      draftOrderNumber = await addShortfallToDraftOrder(jobId, {
        partNumber,
        description: stock.itemName,
        quantity: shortfall,
        unitPrice: stock.cost,
      });
    } catch (error) {
      // Do not leave stock taken for a job part we could not record: put it back.
      if (allocated > 0) {
        try {
          await adjustStock(partNumber, allocated);
        } catch (rollbackError) {
          logger.error(
            { err: rollbackError, jobId, partNumber, allocated },
            "Failed to return stock after draft order failure; stock needs manual correction",
          );
        }
      }
      throw error;
    }
  }

  try {
    const [row] = await db
      .insert(jobPartsTable)
      .values({
        jobId,
        partNumber,
        description: stock.itemName,
        quantity: wanted,
        quantityAllocated: allocated,
        quantityOrdered: shortfall,
        draftOrderNumber,
      })
      .onConflictDoUpdate({
        target: [jobPartsTable.jobId, jobPartsTable.partNumber],
        set: {
          quantity: sql`${jobPartsTable.quantity} + ${wanted}`,
          quantityAllocated: sql`${jobPartsTable.quantityAllocated} + ${allocated}`,
          quantityOrdered: sql`${jobPartsTable.quantityOrdered} + ${shortfall}`,
          draftOrderNumber: sql`coalesce(${draftOrderNumber}::text, ${jobPartsTable.draftOrderNumber})`,
        },
      })
      .returning();
    return row!;
  } catch (error) {
    logger.error(
      { err: error, jobId, partNumber, allocated, shortfall, draftOrderNumber },
      "Stock/order updated but the job part could not be saved; needs manual correction",
    );
    throw error;
  }
}
