# n8n example workflows

Four importable workflows that drive the Stock Control, Ordering and Job Manager APIs over HTTP.

| File | What it shows |
| --- | --- |
| `01-create-job-and-add-part.json` | Create a job, add a part (stock is taken; any shortfall lands on a Draft order), read the job back, and find the shortfall order in Ordering by its `reference` (the job id). |
| `02-low-stock-alert.json` | Manual or daily 08:00 run: reads `/stock/summary` and `/stock`, finds parts at or below a threshold, and builds an alert message. |
| `03-receive-order.json` | Sets an order to `Received` and compares stock units before and after to show stock was booked in. |
| `04-chat-agent.json` | An n8n Chat Trigger + AI Agent (OpenAI) that answers natural-language questions by calling read-only tools mapped to the API: part status (on stock, on order, used in jobs), stock summary, order status. See below. |

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

## Workflow 4: chat agent
Ask in plain English: "What is the status of part ABC-123?", "Give me a summary of current stock", "What is the status of order PO-0003?". The LLM picks which tools to call; each tool is an **HTTP Request Tool** node wired to one endpoint (Search Stock, Get Stock Item, Stock Summary, List Orders For Part, Get Order, Orders Summary, List Jobs, Get Job). All are GET, so the agent cannot change data.

Setup: import, set `baseUrl` and `apiKey` in **Config**, pick your OpenAI credential on **OpenAI Chat Model**, then use **Open chat** on the canvas. Needs a recent n8n (AI Agent v1.7 / HTTP Request Tool v1.1); if a node shows as unknown, update n8n.

Notes:
- "Used in jobs" has no single endpoint, so the agent calls List Jobs then Get Job for each job. Fine for a handful of jobs; slow and token-heavy for many. A `GET /jobs?partNumber=` filter would fix that.
- Tools read `baseUrl`/`apiKey` from the Config node via `$('Config')`. If n8n reports the reference cannot be resolved, replace it with literal values in each tool.
- MCP option: the same tools can be exposed with an **MCP Server Trigger** node and consumed by the agent (or Claude Desktop) through an **MCP Client Tool**. Direct tools were used here because it is one workflow with nothing extra to wire up.
- Not yet run in a live n8n; expect to fix minor node-parameter issues on first import.
