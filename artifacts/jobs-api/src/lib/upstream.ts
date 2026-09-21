import { logger } from "./logger";

// Thrown when the Stock Control or Ordering API fails or cannot be reached.
// status is the upstream HTTP status, or 0 for network errors and timeouts.
export class UpstreamError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

const TIMEOUT_MS = 10_000;

function baseUrl(): string {
  return (process.env.STOCK_API_BASE_URL ?? "http://localhost:8080/api").replace(/\/$/, "");
}

function apiKey(): string {
  return process.env.STOCK_API_KEY ?? process.env.SESSION_SECRET ?? "";
}

interface Parser<T> {
  parse(value: unknown): T;
}

// Calls the Stock/Ordering API server-to-server with the Bearer key and validates the response.
export async function upstream<T>(
  schema: Parser<T>,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    logger.error({ err: error, method, path }, "Upstream request failed");
    throw new UpstreamError(0, "Could not reach the Stock/Ordering API");
  }

  const text = await response.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }

  if (!response.ok) {
    throw new UpstreamError(
      response.status,
      `Stock/Ordering API returned ${response.status} for ${method} ${path}`,
      json,
    );
  }

  try {
    return schema.parse(json);
  } catch (error) {
    logger.error({ err: error, method, path }, "Unexpected upstream response");
    throw new UpstreamError(502, "Unexpected response from the Stock/Ordering API");
  }
}
