import {
  AppendOrderLineResponse,
  CreateOrderResponse,
  ListOrdersResponse,
} from "@workspace/api-zod";
import { upstream } from "./upstream";

interface OrderLineDetails {
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Adds a shortfall line to the Draft order carrying this job's reference, creating that order
// (with a server-generated order number) if the job has no Draft order yet.
// Returns the order number.
export async function addShortfallToDraftOrder(
  jobId: string,
  line: OrderLineDetails,
): Promise<string> {
  const orders = await upstream(
    ListOrdersResponse,
    "GET",
    `/orders?reference=${encodeURIComponent(jobId)}`,
  );
  const draft = orders.find((order) => order.status === "Draft");

  if (draft) {
    await upstream(
      AppendOrderLineResponse,
      "POST",
      `/order/${encodeURIComponent(draft.orderNumber)}/lines`,
      { ...line, externalPartNumber: "" },
    );
    return draft.orderNumber;
  }

  const created = await upstream(CreateOrderResponse, "POST", "/orders", {
    orderDate: new Date().toISOString(),
    supplierName: process.env.DEFAULT_SUPPLIER_NAME ?? "Unassigned (job shortfall)",
    status: "Draft",
    reference: jobId,
    lines: [{ lineNumber: 1, externalPartNumber: "", ...line }],
  });
  return created.orderNumber;
}
