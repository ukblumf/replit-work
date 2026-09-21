import cors from "cors";
import express, { type Express } from "express";
import pinoHttp from "pino-http";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
});

const app: Express = express();

app.disable("etag");
app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

app.get("/jobs-api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

export default app;