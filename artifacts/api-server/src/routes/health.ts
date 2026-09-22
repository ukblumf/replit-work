import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json(HealthCheckResponse.parse({ status: "ok", database: "ok" }));
  } catch {
    res
      .status(503)
      .json(HealthCheckResponse.parse({ status: "error", database: "error" }));
  }
});

export default router;
