# Project Roadmap

## Locked-In Decisions
- Apps integrate through the REST API only, never a shared DB, to demonstrate API-to-API communication and n8n use.
- OpenAPI spec (`lib/api-spec/openapi.yaml`) is the source of truth; run codegen after changing it.

## Next Phase: Job Manager app
- [ ] Job model: Job Id, date, Client, Client Address, Job description, list of parts (partNumber, qty)
- [ ] Add part to job: `GET /api/stock` to list parts, then `PATCH /api/stock/:partNumber` to reduce quantity by the qty added
- [ ] If stock is insufficient, create a Draft order via `POST /api/orders` for the shortfall
- [ ] Prerequisites in the API (see below)

### Suggested API prerequisites
- [-] Same-origin auth bypass: deliberately left as-is for the POC (UIs depend on it). Job Manager and n8n should still send a Bearer key. Revisit before any client demo (options: server-side key injection/proxy, or a key in the UIs)
- [x] Atomic stock adjustment: `POST /stock/:partNumber/adjust` (branch `feat/stock-adjust`) rejects going below zero, avoiding read-modify-write races
- [x] Server-generated order numbers (`PO-nnnn` when `orderNumber` is omitted)
- [x] `POST /order/:orderNumber/lines` for Draft orders, and an order `reference` field (filter with `?reference=`)
- [ ] Idempotency (e.g. job id + part as a key) so retries do not create duplicate draft orders
- [ ] Serve the real `openapi.yaml` from `/api/openapi.json` for n8n import

## Future Phases
- [ ] n8n example workflows against the three apps

## Out of Scope
- Shared database access between apps
- Production hardening beyond what the POC needs
