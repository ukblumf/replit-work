import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ApiDocs() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-1">Integrate Ordering directly with your systems.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>All API requests must be authenticated using a Bearer token.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">Include the following header in your HTTP requests:</p>
          <div className="bg-muted p-4 rounded-md font-mono text-sm">
            Authorization: Bearer YOUR_API_KEY
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Keep your API key secure and do not expose it in client-side code.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold mt-8 border-b pb-2">Orders Resource</h2>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono text-sm">GET</Badge>
              <CardTitle className="text-lg">/api/orders</CardTitle>
            </div>
            <CardDescription>List all purchase orders, optionally filtered.</CardDescription>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium text-sm mb-2">Query Parameters</h4>
            <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
              <li><code className="text-foreground">orderNumber</code> - Partial match on order number</li>
              <li><code className="text-foreground">partNumber</code> - Returns orders containing this part number in any line</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-500 font-mono text-sm">POST</Badge>
              <CardTitle className="text-lg">/api/orders</CardTitle>
            </div>
            <CardDescription>Create a new purchase order.</CardDescription>
          </CardHeader>
          <CardContent>
            <h4 className="font-medium text-sm mb-2">Request Body</h4>
            <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto">
{`{
  "orderNumber": "PO-12345",
  "orderDate": "2024-03-01T00:00:00Z",
  "supplierName": "Acme Logistics",
  "status": "Draft",
  "lines": [
    {
      "lineNumber": 1,
      "partNumber": "PRT-001",
      "externalPartNumber": "SUP-10A",
      "description": "Widget A",
      "quantity": 50,
      "unitPrice": 12.50
    }
  ]
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="font-mono text-sm">GET</Badge>
              <CardTitle className="text-lg">/api/order/:orderNumber</CardTitle>
            </div>
            <CardDescription>Retrieve full details of a specific purchase order.</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="accent" className="font-mono text-sm bg-amber-500 text-white">PATCH</Badge>
              <CardTitle className="text-lg">/api/order/:orderNumber</CardTitle>
            </div>
            <CardDescription>Update an existing purchase order and its lines.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Supports partial updates. When updating lines, the entire lines array must be provided.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="font-mono text-sm">DELETE</Badge>
              <CardTitle className="text-lg">/api/order/:orderNumber</CardTitle>
            </div>
            <CardDescription>Delete an order permanently.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}