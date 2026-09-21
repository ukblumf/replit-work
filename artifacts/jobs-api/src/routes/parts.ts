import { Router, type IRouter } from "express";
import { ListPartsQueryParams, ListPartsResponse } from "@workspace/jobs-api-zod";
import { listStock } from "../lib/stock-client";

const router: IRouter = Router();

// Stock parts for the picker, fetched from the Stock Control API on the server.
router.get("/parts", async (req, res): Promise<void> => {
  const query = ListPartsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const items = await listStock(query.data.search);
  res.json(
    ListPartsResponse.parse(
      items.map(({ partNumber, itemName, description, quantity, binNumber }) => ({
        partNumber,
        itemName,
        description,
        quantity,
        binNumber,
      })),
    ),
  );
});

export default router;
