import { Router, type IRouter } from "express";
import healthRouter from "./health";
import apiDocsRouter from "./api-docs";
import stockRouter from "./stock";
import ordersRouter from "./orders";

const router: IRouter = Router();

router.use(healthRouter);
router.use(apiDocsRouter);
router.use(stockRouter);
router.use(ordersRouter);

export default router;
