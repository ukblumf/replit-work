import { Router, type IRouter } from "express";
import {
  AddJobPartBody,
  AddJobPartParams,
  AddJobPartResponse,
  CreateJobBody,
  CreateJobResponse,
  DeleteJobParams,
  GetJobParams,
  GetJobResponse,
  GetJobSummaryResponse,
  ListJobsQueryParams,
  ListJobsResponse,
  RemoveJobPartParams,
  UpdateJobBody,
  UpdateJobParams,
  UpdateJobResponse,
} from "@workspace/jobs-api-zod";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, jobPartsTable, jobsTable, pool } from "../db";
import { adjustStock, listStock } from "../lib/stock-client";
import { PartNotFoundError, addPartToJob } from "../services/add-part";

const router: IRouter = Router();

function toCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toJobPart(row: typeof jobPartsTable.$inferSelect) {
  return {
    partNumber: row.partNumber,
    description: row.description,
    quantity: row.quantity,
    quantityAllocated: row.quantityAllocated,
    quantityOrdered: row.quantityOrdered,
    draftOrderNumber: row.draftOrderNumber,
  };
}

async function loadJob(jobId: string) {
  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.jobId, jobId));
  if (!job) return null;

  const parts = await db
    .select()
    .from(jobPartsTable)
    .where(eq(jobPartsTable.jobId, jobId))
    .orderBy(asc(jobPartsTable.createdAt), asc(jobPartsTable.partNumber));

  return { ...job, parts: parts.map(toJobPart) };
}

router.get("/jobs", async (req, res): Promise<void> => {
  const query = ListJobsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const search = query.data.search;
  const jobs = await db
    .select({
      jobId: jobsTable.jobId,
      jobDate: jobsTable.jobDate,
      client: jobsTable.client,
      description: jobsTable.description,
      partCount: sql<number>`count(${jobPartsTable.partNumber})::int`,
    })
    .from(jobsTable)
    .leftJoin(jobPartsTable, eq(jobsTable.jobId, jobPartsTable.jobId))
    .where(
      search
        ? or(
            ilike(jobsTable.jobId, `%${search}%`),
            ilike(jobsTable.client, `%${search}%`),
            ilike(jobPartsTable.partNumber, `%${search}%`),
          )
        : undefined,
    )
    .groupBy(jobsTable.jobId)
    .orderBy(desc(jobsTable.jobId));

  res.json(ListJobsResponse.parse(jobs));
});

router.post("/jobs", async (req, res): Promise<void> => {
  const body = CreateJobBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  // A sequence gives collision-free ids without a retry loop.
  const { rows } = await pool.query<{ n: string }>(
    "SELECT nextval('jobs.job_number_seq') AS n",
  );
  const jobId = `JOB-${String(rows[0]?.n).padStart(4, "0")}`;

  await db.insert(jobsTable).values({
    jobId,
    jobDate: toCalendarDate(body.data.jobDate),
    client: body.data.client,
    clientAddress: body.data.clientAddress,
    description: body.data.description,
  });

  res.status(201).json(CreateJobResponse.parse(await loadJob(jobId)));
});

// totalValue needs each part's cost, fetched from the Stock Control API (apps integrate over
// HTTP only, never a shared DB); parts no longer in stock contribute 0.
router.get("/jobs/summary", async (_req, res): Promise<void> => {
  const [jobTotals] = await db
    .select({ jobCount: sql<number>`count(*)::int` })
    .from(jobsTable);

  const [partTotals] = await db
    .select({
      partCount: sql<number>`count(*)::int`,
      totalQuantity: sql<number>`coalesce(sum(${jobPartsTable.quantity}), 0)::int`,
    })
    .from(jobPartsTable);

  const quantityByPart = await db
    .select({
      partNumber: jobPartsTable.partNumber,
      quantity: sql<number>`sum(${jobPartsTable.quantity})::int`,
    })
    .from(jobPartsTable)
    .groupBy(jobPartsTable.partNumber);

  const stockItems = await listStock();
  const costByPart = new Map(stockItems.map((item) => [item.partNumber, item.cost]));
  const totalValue = quantityByPart.reduce(
    (total, row) => total + row.quantity * (costByPart.get(row.partNumber) ?? 0),
    0,
  );

  res.json(
    GetJobSummaryResponse.parse({
      jobCount: jobTotals?.jobCount ?? 0,
      partCount: partTotals?.partCount ?? 0,
      totalQuantity: partTotals?.totalQuantity ?? 0,
      totalValue,
    }),
  );
});

router.get("/job/:jobId", async (req, res): Promise<void> => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const job = await loadJob(params.data.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(GetJobResponse.parse(job));
});

router.patch("/job/:jobId", async (req, res): Promise<void> => {
  const params = UpdateJobParams.safeParse(req.params);
  const body = UpdateJobBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error?.message,
    });
    return;
  }

  const { jobDate, ...rest } = body.data;
  const [updated] = await db
    .update(jobsTable)
    .set({ ...rest, ...(jobDate ? { jobDate: toCalendarDate(jobDate) } : {}) })
    .where(eq(jobsTable.jobId, params.data.jobId))
    .returning({ jobId: jobsTable.jobId });

  if (!updated) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(UpdateJobResponse.parse(await loadJob(params.data.jobId)));
});

router.delete("/job/:jobId", async (req, res): Promise<void> => {
  const params = DeleteJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const job = await loadJob(params.data.jobId);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.parts.length > 0) {
    res.status(409).json({
      error: "Remove the job's parts first so their stock is returned",
    });
    return;
  }

  await db.delete(jobsTable).where(eq(jobsTable.jobId, params.data.jobId));
  res.status(204).send();
});

// Take stock for a part (shortfall goes on a Draft order); see services/add-part.ts.
router.post("/job/:jobId/parts", async (req, res): Promise<void> => {
  const params = AddJobPartParams.safeParse(req.params);
  const body = AddJobPartBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: !params.success ? params.error.message : body.error?.message,
    });
    return;
  }

  const [job] = await db
    .select({ jobId: jobsTable.jobId })
    .from(jobsTable)
    .where(eq(jobsTable.jobId, params.data.jobId));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  try {
    const row = await addPartToJob(
      params.data.jobId,
      body.data.partNumber,
      body.data.quantity,
    );
    res.status(201).json(AddJobPartResponse.parse(toJobPart(row)));
  } catch (error) {
    if (error instanceof PartNotFoundError) {
      res.status(404).json({ error: error.message });
      return;
    }
    throw error;
  }
});

// Return the stock this job took, then remove the part. Quantity already on a Draft order is
// left on that order.
router.delete("/job/:jobId/parts/:partNumber", async (req, res): Promise<void> => {
  const params = RemoveJobPartParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const where = and(
    eq(jobPartsTable.jobId, params.data.jobId),
    eq(jobPartsTable.partNumber, params.data.partNumber),
  );
  const [part] = await db.select().from(jobPartsTable).where(where);
  if (!part) {
    res.status(404).json({ error: "Job part not found" });
    return;
  }

  if (part.quantityAllocated > 0) {
    await adjustStock(part.partNumber, part.quantityAllocated);
  }
  await db.delete(jobPartsTable).where(where);
  res.status(204).send();
});

export default router;
