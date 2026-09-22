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
- [x] Verified live after a real restart: `/api/healthz` and `/jobs-api/healthz` both return `{status, database}`; stock create/search with `supplier` and value-range search confirmed; orders `status`/`supplier` filters accepted; old `/jobs-api/jobs/:jobId` 404s, new `/jobs-api/job/:jobId` and `/jobs-api/jobs/summary` work; job search by part number confirmed
- [x] n8n workflows updated: `01-create-job-and-add-part.json`'s two `/jobs-api/jobs/{jobId}` references renamed to `/job/{jobId}`; `04-chat-agent.json`'s `Get Job` tool fixed the same way, plus three new tools added (`Search Jobs` using the `search` param, `Jobs Summary`, `List Low Stock Items` using `maxQuantity`) and the system prompt updated to use them (both JSON files validated: no dangling connections, no duplicate node ids)
- [x] UI search/summary wiring: Stock Control dashboard gets summary stat tiles and supplier/description/quantity-range/value-range filters plus a Supplier column; Ordering list gets summary stat tiles and supplier/status filters; Job Manager list gets summary stat tiles and search now covers part number. All typecheck clean; API layer verified live in the prior step, but the new UI widgets have not been visually checked in a browser (dev servers are live with HMR if you want to eyeball them)

## Next Phase: prove Job Manager end to end
- [x] Job Manager API and UI built (`feat/job-manager`)
- [x] Prerequisites: atomic stock adjust, generated order numbers, add-line endpoint, order `reference`
- [x] Test in the running apps: create a job, add a part with enough stock, add a part with a shortfall (draft order appears in Ordering with the job id as reference), remove a part
- [x] Merge `feat/job-manager` to main after testing
- [x] Same-origin auth bypass removed (`feat/require-api-key-auth`): every request now needs a Bearer key; each UI prompts for it once and stores it client-side. See CONTEXT.md Design Decisions.
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
