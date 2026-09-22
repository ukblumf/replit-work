# Project Roadmap

## Locked-In Decisions
- Apps integrate through the REST API only, never a shared DB, to demonstrate API-to-API communication and n8n use.
- OpenAPI spec (`lib/api-spec/openapi.yaml`) is the source of truth; run codegen after changing it.

## Next Phase: revisit the API endpoints
Give all three apps the same shape: health, summary, CRUD and search. Update `openapi.yaml` / `jobs-openapi.yaml` first, then run codegen.

Decisions made: supplier is a new column on `stock_items` (not looked up through orders); search is query params on the existing list endpoints, not a dedicated `/search`; quantity/value search is min/max range; `/healthz` now also confirms DB connectivity; `/order/:orderNumber` stays singular as-is; Jobs' single-item routes were renamed `/jobs/:jobId` → `/job/:jobId` to match the plural-list/singular-item pattern (list/create `GET POST /jobs` unchanged).

- [x] Health: `/api/healthz` and `/jobs-api/healthz` now return `{status, database}` and 503 if the DB check fails
- [x] Summary per app:
  - Stock: `GET /stock/summary` unchanged (`itemCount`, `totalUnits`, `inventoryCost`, `inventoryRetailValue`, `lowStockCount`) — already covered this
  - Ordering: `GET /orders/summary` unchanged (`orderCount`, `openOrderCount`, `totalValue`, `statusCounts`) — already covered this
  - Jobs: new `GET /jobs-api/jobs/summary` (`jobCount`, `partCount`, `totalQuantity`, `totalValue`); totalValue fetches stock cost per part via the Stock API
- [x] CRUD per app: reviewed; Ordering keeps singular `/order/:orderNumber` (decision above), Jobs' single-item routes renamed to `/job/:jobId` for consistency with Stock/Ordering
- [x] Search per app, partial and complete match, case-insensitive:
  - Stock: `GET /stock` now takes `partNumber`, `supplier`, `description` (partial match) and `minQuantity`/`maxQuantity`/`minValue`/`maxValue` (range)
  - Ordering: `GET /orders` now also takes `supplier` (partial match) and `status` (exact match), alongside existing `orderNumber`/`partNumber` (partial) and `reference` (exact)
  - Jobs: `GET /jobs`'s existing `search` param now also matches a Part Number on the job, alongside Job Id and Client (replaces the optional `GET /jobs?partNumber=` item below)
- [ ] Not yet done — verify live: typechecks clean but the Replit workflow needs to restart to pick up the backend route/schema changes; then exercise each new endpoint (curl or the UI) before merging `feat/api-endpoints-revisit`
- [ ] Afterwards: update the n8n workflows (`n8n/01-create-job-and-add-part.json`, `n8n/04-chat-agent.json` reference the old `/jobs-api/jobs/{jobId}` path and need the `/job/{jobId}` rename; the chat agent's read-only tools could also use the new search/summary params) and wire the new search/summary fields into the three UIs

## Next Phase: prove Job Manager end to end
- [x] Job Manager API and UI built (`feat/job-manager`)
- [x] Prerequisites: atomic stock adjust, generated order numbers, add-line endpoint, order `reference`
- [x] Test in the running apps: create a job, add a part with enough stock, add a part with a shortfall (draft order appears in Ordering with the job id as reference), remove a part
- [x] Merge `feat/job-manager` to main after testing
- [-] Same-origin auth bypass: deliberately left as-is for the POC (UIs depend on it). Job Manager and n8n should still send a Bearer key. Revisit before any client demo (options: server-side key injection/proxy, or a key in the UIs)
- [x] Serve the real OpenAPI documents from `/api/openapi.json` and `/jobs-api/openapi.json` for n8n import

## Future Phases
- [x] n8n example workflows in `n8n/` (written, not yet run in a live n8n)
- [x] n8n chat agent workflow (`n8n/04-chat-agent.json`): natural-language questions mapped to read-only API tools (written, not yet run in a live n8n)
- [ ] Optional: `GET /jobs?partNumber=` filter (superseded by the Jobs search in "revisit the API endpoints" above); optional MCP Server variant of the tools
- [ ] Run the n8n workflows against a live instance and fix anything n8n rejects
- [ ] Status dashboard: an n8n workflow (Webhook trigger) calls `/api/healthz`, `/jobs-api/healthz`, `/api/stock/summary`, `/api/orders/summary` and `/jobs-api/jobs`, checks the three UI URLs (`/`, `/ordering/`, `/jobs/`) return 200, and returns one JSON document; a small page renders it. Optional scheduled run that alerts when a health check fails. Job Manager has no summary endpoint, so count the `/jobs` list.

## Out of Scope
- Shared database access between apps
- Production hardening beyond what the POC needs
