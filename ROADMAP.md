# Project Roadmap

## Locked-In Decisions
- Apps integrate through the REST API only, never a shared DB, to demonstrate API-to-API communication and n8n use.
- OpenAPI spec (`lib/api-spec/openapi.yaml`) is the source of truth; run codegen after changing it.

## Next Phase: revisit the API endpoints
Give all three apps the same shape: health, summary, CRUD and search. Update `openapi.yaml` / `jobs-openapi.yaml` first, then run codegen.
- [ ] Health: keep `/healthz` (decided; the `z` is just the Google/Kubernetes convention). Every app reports that it is functioning: `/api/healthz`, `/jobs-api/healthz` exist; check whether they should also confirm DB connectivity
- [ ] Summary per app:
  - Stock: total number of parts held and total value. `GET /stock/summary` has `itemCount`, `totalUnits`, `inventoryCost`, `inventoryRetailValue`, `lowStockCount`; verify it covers this
  - Ordering: total number of orders and total value. `GET /orders/summary` exists; verify it includes total value
  - Jobs: total number of parts and total value. New `GET /jobs-api/summary` (none today); value needs stock cost, fetched through the Stock API (apps integrate over HTTP only)
- [ ] CRUD per app: Stock and Ordering have it, Jobs has it for jobs. Review for gaps and consistency (Ordering uses singular `/order/:orderNumber` for single items; decide whether to keep)
- [ ] Search per app, partial and complete match, case-insensitive:
  - Stock: by part number, supplier, description, quantity held, value held
  - Ordering: by order number, part number, supplier, status
  - Jobs: by job number, part number, client name (this replaces the optional `GET /jobs?partNumber=` item below)
- [ ] Open decisions:
  - `stock_items` has no supplier column: add one, or look suppliers up through orders?
  - Search as a dedicated `/search` endpoint or as query params on the list endpoints (today `GET /stock` and `GET /orders` filter by `partNumber` / `orderNumber` / `reference`, `GET /jobs` by `search`)?
  - Quantity and value search semantics: exact match, or min/max range?
- [ ] Afterwards: update the n8n chat agent tools (`n8n/04-chat-agent.json`) and the CONTEXT.md API sections to use the new endpoints

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
