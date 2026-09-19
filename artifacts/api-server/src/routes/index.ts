import { Router, type IRouter } from "express";
import healthRouter from "./health";
import apiDocsRouter from "./api-docs";
import stockRouter from "./stock";

const router: IRouter = Router();

router.use(healthRouter);
router.use(apiDocsRouter);
router.use(stockRouter);

export default router;
