# n8n example workflows

Three importable workflows that drive the Stock Control, Ordering and Job Manager APIs over HTTP.

| File | What it shows |
| --- | --- |
| `01-create-job-and-add-part.json` | Create a job, add a part (stock is taken; any shortfall lands on a Draft order), read the job back, and find the shortfall order in Ordering by its `reference` (the job id). |
| `02-low-stock-alert.json` | Manual or daily 08:00 run: reads `/stock/summary` and `/stock`, finds parts at or below a threshold, and builds an alert message. |
| `03-receive-order.json` | Sets an order to `Received` and compares stock units before and after to show stock was booked in. |

## Import
1. In n8n: **Workflows -> Import from File** (or paste the JSON onto the canvas).
2. Open the **Config** node and set:
   - `baseUrl`: the public URL of the app, with no trailing slash (for example `https://your-app.replit.app`).
   - `apiKey`: `STOCK_API_KEY` (or `SESSION_SECRET` if that is what the API uses). Use `JOBS_API_KEY` for Job Manager if you set one.
   - The other fields (part number, quantity, order number, threshold) are the test inputs.
3. Click **Execute workflow**.

Your n8n instance must be able to reach `baseUrl`. If you use the Replit development URL it only responds while the Repl is running, and the URL can change between sessions; update `baseUrl` when it does.

## Notes
- The API key sits in the Config node for simplicity. For anything shared, move it to a Header Auth credential (`Authorization: Bearer <key>`) on each HTTP Request node.
- Workflow 2 ends with an **Alert Message** node. Add a Slack, Email or Telegram node after it to deliver the message.
- Workflow 3 changes real data: an order set to `Received` adds its quantities to stock. Use an order that is not yet Received.
- The API contracts are served at `/api/openapi.json` and `/jobs-api/openapi.json`.
