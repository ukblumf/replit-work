import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

function safelyMatches(candidate: string, expected: string): boolean {
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  return (
    candidateBuffer.length === expectedBuffer.length &&
    timingSafeEqual(candidateBuffer, expectedBuffer)
  );
}

// Same rules as the Stock/Ordering API (stockApiAuth): same-origin browser requests are let
// through, everything else needs `Authorization: Bearer <key>`. The same-origin check can be
// forged by non-browser clients; this is the accepted POC trade-off recorded in CONTEXT.md.
export function jobsApiAuth(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get("origin");
  const host = req.get("host");
  const fetchSite = req.get("sec-fetch-site");
  let originMatches = false;
  if (typeof origin === "string" && typeof host === "string") {
    try {
      originMatches = new URL(origin).host === host;
    } catch {
      originMatches = false;
    }
  }
  if (fetchSite === "same-origin" || originMatches) {
    next();
    return;
  }

  const expectedKey =
    process.env.JOBS_API_KEY ?? process.env.STOCK_API_KEY ?? process.env.SESSION_SECRET;
  const authorization = req.get("authorization");
  const candidate = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!expectedKey || !candidate || !safelyMatches(candidate, expectedKey)) {
    res.status(401).json({ error: "A valid Bearer API key is required" });
    return;
  }

  next();
}
