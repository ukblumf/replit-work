import { Router, type IRouter } from "express";
import spec from "../generated/openapi.json";
import { jobsApiAuth } from "../middlewares/auth";
import jobsRouter from "./jobs";
import partsRouter from "./parts";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// Real OpenAPI contract (generated from lib/api-spec/jobs-openapi.yaml by codegen); public like /healthz.
router.get("/openapi.json", (req, res) => {
  // Behind the Replit proxy the public scheme arrives in X-Forwarded-Proto.
  const proto = req.get("x-forwarded-proto")?.split(",")[0] ?? req.protocol;
  const base = `${proto}://${req.get("host")}${req.baseUrl}`;
  // The YAML title stays "Api" for codegen; give importers a readable name.
  res.json({
    ...spec,
    info: { ...spec.info, title: "Job Manager API" },
    servers: [{ url: base, description: "This server" }],
  });
});

router.use(jobsApiAuth, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.use(partsRouter);
router.use(jobsRouter);

export default router;
