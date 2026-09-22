import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ENDPOINTS = [
  { method: "GET", path: "/jobs-api/jobs", text: "List jobs. Query: search (partial match on Job Id, Client or a Part Number on the job)." },
  { method: "POST", path: "/jobs-api/jobs", text: "Create a job. The Job Id (JOB-0001, ...) is generated.", body: `{
  "jobDate": "2026-09-21",
  "client": "Acme Ltd",
  "clientAddress": "1 High Street, Leeds",
  "description": "Replace boiler pump"
}` },
  { method: "GET", path: "/jobs-api/jobs/summary", text: "Totals across all jobs: job count, part count, total quantity and total value (part cost fetched from Stock Control)." },
  { method: "GET", path: "/jobs-api/job/{jobId}", text: "Retrieve a job with its parts." },
  { method: "PATCH", path: "/jobs-api/job/{jobId}", text: "Update the job header (date, client, address, description)." },
  { method: "DELETE", path: "/jobs-api/job/{jobId}", text: "Delete a job. Returns 409 while the job still has parts." },
  { method: "POST", path: "/jobs-api/job/{jobId}/parts", text: "Add a part. Takes stock from Stock Control (POST /api/stock/{partNumber}/adjust); any shortfall is added to a Draft order in Ordering whose reference is the Job Id. Adding a part already on the job increases its quantity.", body: `{
  "partNumber": "PUMP-001",
  "quantity": 3
}`, response: `{
  "partNumber": "PUMP-001",
  "description": "Circulation pump",
  "quantity": 3,
  "quantityAllocated": 1,
  "quantityOrdered": 2,
  "draftOrderNumber": "PO-0004"
}` },
  { method: "DELETE", path: "/jobs-api/job/{jobId}/parts/{partNumber}", text: "Remove a part and return its allocated stock. Quantity already on a Draft order stays on that order." },
  { method: "GET", path: "/jobs-api/parts", text: "List stock parts (proxied from Stock Control). Query: search." },
  { method: "GET", path: "/jobs-api/healthz", text: "Health check (no authentication). Includes database connectivity." },
];

const methodClass = (method: string) =>
  method === "POST" ? "bg-emerald-500" : method === "PATCH" ? "bg-amber-500" : method === "DELETE" ? "bg-red-500" : "";

export default function ApiDocs() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-1">Integrate Job Manager directly with your systems, e.g. n8n.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Send an API key as a Bearer token.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md font-mono text-sm">Authorization: Bearer YOUR_API_KEY</div>
          <p className="text-sm text-muted-foreground">
            The key is JOBS_API_KEY, falling back to STOCK_API_KEY. Job Manager calls the Stock Control and Ordering
            APIs itself, so callers only ever talk to Job Manager.
          </p>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mt-8 border-b pb-2">Endpoints</h2>
      {ENDPOINTS.map((endpoint) => (
        <Card key={`${endpoint.method} ${endpoint.path}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className={`font-mono text-sm text-white ${methodClass(endpoint.method)}`}>
                {endpoint.method}
              </Badge>
              <CardTitle className="text-lg font-mono">{endpoint.path}</CardTitle>
            </div>
            <CardDescription>{endpoint.text}</CardDescription>
          </CardHeader>
          {(endpoint.body || endpoint.response) && (
            <CardContent className="space-y-3">
              {endpoint.body && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Request Body</h4>
                  <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto">{endpoint.body}</pre>
                </div>
              )}
              {endpoint.response && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Response</h4>
                  <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto">{endpoint.response}</pre>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
