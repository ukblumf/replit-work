import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, FileText, Loader2, ArrowRight, ClipboardList, PackageOpen, PoundSterling } from "lucide-react";
import { useListOrders, useGetOrderSummary, ListOrdersStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

const ALL_STATUSES = "all";

function StatTile({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "Submitted":
      return <Badge variant="accent" className="bg-blue-500 text-white">Submitted</Badge>;
    case "Confirmed":
      return <Badge variant="accent" className="bg-indigo-500 text-white">Confirmed</Badge>;
    case "Received":
      return <Badge variant="success">Received</Badge>;
    case "Cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function OrderList() {
  const [searchOrderNumber, setSearchOrderNumber] = useState("");
  const [searchPartNumber, setSearchPartNumber] = useState("");
  const [searchSupplier, setSearchSupplier] = useState("");
  const [status, setStatus] = useState<typeof ALL_STATUSES | ListOrdersStatus>(ALL_STATUSES);

  const { data: summary } = useGetOrderSummary();

  const { data: orders, isLoading, error } = useListOrders({
    orderNumber: searchOrderNumber || undefined,
    partNumber: searchPartNumber || undefined,
    supplier: searchSupplier || undefined,
    status: status === ALL_STATUSES ? undefined : status,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track your supplier orders.</p>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Link>
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatTile icon={ClipboardList} label="Total Orders" value={summary.orderCount} />
          <StatTile icon={PackageOpen} label="Open Orders" value={summary.openOrderCount} />
          <StatTile icon={PoundSterling} label="Total Value" value={formatCurrency(summary.totalValue)} />
        </div>
      )}

      <div className="bg-card rounded-lg border shadow-sm flex flex-col sm:flex-row flex-wrap p-4 gap-4 items-center">
        <div className="relative flex-1 w-full min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order Number..."
            className="pl-9 bg-background"
            value={searchOrderNumber}
            onChange={(e) => setSearchOrderNumber(e.target.value)}
          />
        </div>
        <div className="relative flex-1 w-full min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by containing Part Number..."
            className="pl-9 bg-background"
            value={searchPartNumber}
            onChange={(e) => setSearchPartNumber(e.target.value)}
          />
        </div>
        <div className="relative flex-1 w-full min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Supplier..."
            className="pl-9 bg-background"
            value={searchSupplier}
            onChange={(e) => setSearchSupplier(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={status} onValueChange={(v) => setStatus(v as typeof ALL_STATUSES | ListOrdersStatus)}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Lines</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-destructive">
                  Failed to load orders.
                </TableCell>
              </TableRow>
            ) : !orders?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                    <p>No orders found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.orderNumber} className="group">
                  <TableCell className="font-mono font-medium">
                    <Link href={`/orders/${order.orderNumber}`} className="hover:underline text-primary">
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell className="font-medium">{order.supplierName}</TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{order.lineCount}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(order.totalValue)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/orders/${order.orderNumber}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}