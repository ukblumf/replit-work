import { Terminal, Key, Database, Shield, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui-elements';
import { cn } from '@/lib/utils';

export default function ApiReference() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">API Reference</h1>
        <p className="text-muted-foreground mt-2 font-mono text-sm max-w-2xl border-l-2 border-primary pl-3 ml-1">
          Integrate your physical scanners, automated warehouse systems, and third-party tools directly with the Stock Control ledger.
        </p>
      </div>

      <Card className="border-2 border-secondary bg-secondary/5 shadow-md">
        <CardHeader className="bg-secondary/10 pb-4 border-b-2 border-secondary/20">
          <CardTitle className="uppercase text-xl flex items-center gap-2 text-secondary-foreground">
            <Shield size={20} strokeWidth={2.5} />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <p className="text-sm font-medium">All API endpoints require an API Key to be sent via the <code className="bg-secondary/20 px-1.5 py-0.5 rounded-sm font-mono font-bold text-secondary">Authorization</code> header as a Bearer token.</p>
          <div className="bg-foreground text-background p-4 rounded-sm font-mono text-sm overflow-x-auto border-2 border-border shadow-inner">
            Authorization: Bearer YOUR_API_KEY
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground bg-background p-4 rounded-sm border-2 border-border">
            <Lock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <p><strong>Security Notice:</strong> Keep your API key secure. Do not expose it in client-side code or public repositories. If compromised, rotate it immediately.</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight border-b-2 border-border pb-2">Endpoints</h2>
        
        <EndpointCard 
          method="GET" 
          path="/api/stock/summary" 
          description="Retrieve high-level inventory totals for the workspace."
          response={`{
  "itemCount": 142,
  "totalUnits": 5230,
  "inventoryCost": 12450.50,
  "inventoryRetailValue": 28900.00,
  "lowStockCount": 12
}`}
        />

        <EndpointCard 
          method="GET" 
          path="/api/stock" 
          description="List all stock items. Use query parameters for filtering."
          params={[{ name: "partNumber", type: "string", desc: "Case-insensitive partial match on Part Number" }]}
          response={`[
  {
    "partNumber": "PN-1001",
    "itemName": "Hex Bolt M8x20",
    "description": "Grade 8.8 steel",
    "quantity": 500,
    "cost": 0.15,
    "retailPrice": 0.45,
    "binNumber": "A-12-B",
    "createdAt": "2023-10-01T12:00:00Z",
    "updatedAt": "2023-10-01T12:00:00Z"
  }
]`}
        />

        <EndpointCard 
          method="POST" 
          path="/api/stock" 
          description="Create a new stock item in the ledger."
          body={`{
  "partNumber": "PN-1001",
  "itemName": "Hex Bolt M8x20",
  "quantity": 500,
  "cost": 0.15,
  "retailPrice": 0.45,
  "binNumber": "A-12-B"
}`}
        />

        <EndpointCard 
          method="GET" 
          path="/api/stock/:partNumber" 
          description="Retrieve a single stock item by exact part number."
        />

        <EndpointCard 
          method="PATCH" 
          path="/api/stock/:partNumber" 
          description="Update an existing stock item. Only provided fields will be modified."
          body={`{
  "quantity": 450,
  "binNumber": "A-12-C"
}`}
        />

        <EndpointCard 
          method="DELETE" 
          path="/api/stock/:partNumber" 
          description="Permanently remove a stock item from the ledger."
        />
      </div>

      <div className="flex justify-center pt-8">
        <a href="/api/openapi.json" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary hover:text-primary/80 transition-colors border-2 border-primary px-6 py-4 rounded-sm hover:bg-primary/10 shadow-sm">
          <Database size={18} strokeWidth={2.5} />
          Download OpenAPI Spec (JSON)
        </a>
      </div>
    </div>
  );
}

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
type EndpointParam = { name: string; type: string; desc: string };

function EndpointCard({ method, path, description, params, body, response }: { method: HttpMethod; path: string; description: string; params?: EndpointParam[]; body?: string; response?: string }) {
  const methodColor = {
    GET: "bg-secondary text-secondary-foreground",
    POST: "bg-primary text-primary-foreground",
    PATCH: "bg-amber-600 text-white",
    DELETE: "bg-destructive text-destructive-foreground",
  }[method] || "bg-muted text-muted-foreground";

  return (
    <Card className="border-2 border-border shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/30 p-4 border-b-2 border-border">
        <div className={cn("px-3 py-1 rounded-sm font-black font-mono text-sm tracking-wider", methodColor)}>
          {method}
        </div>
        <code className="font-mono font-bold text-base text-foreground">{path}</code>
      </div>
      <CardContent className="p-4 md:p-6 space-y-6">
        <p className="text-sm font-medium">{description}</p>
        
        {params && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Query Parameters</h4>
            <div className="bg-background rounded-sm border-2 border-border overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b-2 border-border">
                  <tr>
                    <th className="px-4 py-2 font-black uppercase text-xs">Parameter</th>
                    <th className="px-4 py-2 font-black uppercase text-xs">Type</th>
                    <th className="px-4 py-2 font-black uppercase text-xs">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {params.map((p: any) => (
                    <tr key={p.name}>
                      <td className="px-4 py-3 font-mono font-bold text-primary">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{p.type}</td>
                      <td className="px-4 py-3 font-medium">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {body && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Request Body (JSON)</h4>
            <pre className="bg-foreground text-background p-4 rounded-sm font-mono text-sm overflow-x-auto shadow-inner border-2 border-border">
              {body}
            </pre>
          </div>
        )}

        {response && (
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Example Response</h4>
            <pre className="bg-muted/50 border-2 border-border text-foreground p-4 rounded-sm font-mono text-sm overflow-x-auto shadow-inner">
              {response}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
