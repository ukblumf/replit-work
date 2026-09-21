import { Router, type IRouter } from "express";
import { jobsApiAuth } from "../middlewares/auth";
import jobsRouter from "./jobs";
import partsRouter from "./parts";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

router.use(jobsApiAuth, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.use(partsRouter);
router.use(jobsRouter);

export default router;
