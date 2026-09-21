import {
  AdjustStockQuantityResponse,
  GetStockItemResponse,
  ListStockItemsResponse,
} from "@workspace/api-zod";
import { UpstreamError, upstream } from "./upstream";

export class InsufficientStockError extends Error {
  constructor(readonly available: number) {
    super("Insufficient stock");
    this.name = "InsufficientStockError";
  }
}

export function listStock(search?: string) {
  const query = search ? `?partNumber=${encodeURIComponent(search)}` : "";
  return upstream(ListStockItemsResponse, "GET", `/stock${query}`);
}

// Returns null when the part is not in stock control.
export async function getStockItem(partNumber: string) {
  try {
    return await upstream(
      GetStockItemResponse,
      "GET",
      `/stock/${encodeURIComponent(partNumber)}`,
    );
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 404) return null;
    throw error;
  }
}

// Atomic change via POST /stock/:partNumber/adjust. Throws InsufficientStockError on 409.
export async function adjustStock(partNumber: string, quantityDelta: number) {
  try {
    return await upstream(
      AdjustStockQuantityResponse,
      "POST",
      `/stock/${encodeURIComponent(partNumber)}/adjust`,
      { quantityDelta },
    );
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 409) {
      const available =
        typeof error.body === "object" &&
        error.body !== null &&
        "available" in error.body &&
        typeof error.body.available === "number"
          ? error.body.available
          : 0;
      throw new InsufficientStockError(available);
    }
    throw error;
  }
}
