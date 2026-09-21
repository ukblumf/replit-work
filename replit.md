# Stock Control, Ordering and Job Manager (POC)

Three small apps that show automation services (e.g. n8n) driving business apps over HTTP. Job Manager talks to Stock Control and Ordering only through their API.

## Run & Operate

- Workflows (managed by Replit): `api-server` (`/api`, port 8080), `jobs-api` (`/jobs-api`, port 21146), and the web artifacts `stock-control` (`/`), `ordering` (`/ordering/`), `job-manager` (`/jobs/`)
- `pnpm run typecheck` - full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` - regenerate all API clients and Zod schemas from both OpenAPI specs
- `pnpm --filter @workspace/db run push` - push Stock/Ordering DB schema changes (dev only)
- Required env: `DATABASE_URL`; `STOCK_API_KEY` (or `SESSION_SECRET`) for API auth and for jobs-api calls to the stock API
- API servers are bundled once at start: restart their workflow after changing server code

## Where things live

- See `CONTEXT.md` for the architecture, endpoints, data model and known issues, and `ROADMAP.md` for what is next
- API contracts: `lib/api-spec/openapi.yaml` (stock/orders), `lib/api-spec/jobs-openapi.yaml` (jobs)
- Stock/Ordering DB schema: `lib/db/src/schema/`; Job Manager schema: `artifacts/jobs-api/src/db/schema.ts`
