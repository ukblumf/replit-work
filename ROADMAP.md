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
- [ ] Fix or replace the same-origin auth bypass so Job Manager and n8n must send a Bearer key
- [ ] Atomic stock adjustment (e.g. `quantityDelta` on PATCH, or `POST /stock/:partNumber/adjust`) that rejects going below zero, to avoid read-modify-write races
- [ ] Server-generated order numbers, or a documented scheme, to avoid 409 collisions
- [ ] Way to add lines to an existing Draft order, and a job reference on orders for traceability
- [ ] Idempotency (e.g. job id + part as a key) so retries do not create duplicate draft orders
- [ ] Serve the real `openapi.yaml` from `/api/openapi.json` for n8n import

## Future Phases
- [ ] n8n example workflows against the three apps

## Out of Scope
- Shared database access between apps
- Production hardening beyond what the POC needs
