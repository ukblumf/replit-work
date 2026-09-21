import cors from "cors";
import express, { type ErrorRequestHandler, type Express } from "express";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import { UpstreamError } from "./lib/upstream";
import router from "./routes";

const app: Express = express();

app.disable("etag");
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

// Base path matches artifact.toml (`/jobs-api`), so /jobs-api/healthz is the health check.
app.use("/jobs-api", router);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof UpstreamError) {
    req.log.error({ err, upstreamStatus: err.status }, "Upstream API error");
    res.status(502).json({ error: err.message });
    return;
  }
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);

export default app;
