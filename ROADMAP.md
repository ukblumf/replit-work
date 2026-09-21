# Project Roadmap

## Locked-In Decisions
- Apps integrate through the REST API only, never a shared DB, to demonstrate API-to-API communication and n8n use.
- OpenAPI spec (`lib/api-spec/openapi.yaml`) is the source of truth; run codegen after changing it.

## Next Phase: prove Job Manager end to end
- [x] Job Manager API and UI built (`feat/job-manager`)
- [x] Prerequisites: atomic stock adjust, generated order numbers, add-line endpoint, order `reference`
- [x] Test in the running apps: create a job, add a part with enough stock, add a part with a shortfall (draft order appears in Ordering with the job id as reference), remove a part
- [x] Merge `feat/job-manager` to main after testing
- [-] Same-origin auth bypass: deliberately left as-is for the POC (UIs depend on it). Job Manager and n8n should still send a Bearer key. Revisit before any client demo (options: server-side key injection/proxy, or a key in the UIs)
- [x] Serve the real OpenAPI documents from `/api/openapi.json` and `/jobs-api/openapi.json` for n8n import

## Future Phases
- [x] n8n example workflows in `n8n/` (written, not yet run in a live n8n)
- [ ] Run the n8n workflows against a live instance and fix anything n8n rejects
- [ ] Status dashboard: n8n aggregates health and summaries into one JSON, a small page renders it (under consideration)

## Out of Scope
- Shared database access between apps
- Production hardening beyond what the POC needs
