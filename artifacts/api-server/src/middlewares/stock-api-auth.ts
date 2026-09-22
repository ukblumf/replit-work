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

// Every caller — browser or server-to-server — must present a valid Bearer key.
// The UIs prompt for it once and store it client-side (see src/lib/api-key.ts
// in each app), then attach it to every request via setAuthTokenGetter.
export function stockApiAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expectedKey = process.env.STOCK_API_KEY ?? process.env.SESSION_SECRET;
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