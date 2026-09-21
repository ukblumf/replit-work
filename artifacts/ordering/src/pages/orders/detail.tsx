import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Trash2, Plus, ArrowLeft, Loader2, Save } from "lucide-react";
import { 
  useGetOrder, 
  useUpdateOrder, 
  useDeleteOrder,
  useListStockItems, 
  getListOrdersQueryKey,
  getGetOrderQueryKey,
  OrderUpdateStatus, 
  OrderLineInput 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StockPicker } from "@/components/stock-picker";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function OrderDetail() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: order, isLoading: isLoadingOrder } = useGetOrder(orderNumber, {
    query: {
      enabled: !!orderNumber,
      queryKey: getGetOrderQueryKey(orderNumber)
    }
  });

  const { data: stockItems = [], isLoading: isLoadingStock } = useListStockItems();
  
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder();

  const [orderDate, setOrderDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [status, setStatus] = useState<OrderUpdateStatus>("Draft");
  const [lines, setLines] = useState<OrderLineInput[]>([]);

  // Initialize form when order loads
  useEffect(() => {
    if (order) {
      setOrderDate(order.orderDate.split("T")[0]);
      setSupplierName(order.supplierName);
      setStatus((order.status as OrderUpdateStatus) || "Draft");
      setLines(order.lines.map(l => ({
        lineNumber: l.lineNumber,
        partNumber: l.partNumber,
        externalPartNumber: l.externalPartNumber || "",
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice
      })));
    }
  }, [order]);

  const addLine = () => {
    setLines([...lines, { 
      lineNumber: lines.length + 1, 
      partNumber: "", 
      externalPartNumber: "", 
      description: "", 
      quantity: 1, 
      unitPrice: 0 
    }]);
  };

  const removeLine = (index: number) => {
    if (lines.length === 1) return;
    const newLines = [...lines];
    newLines.splice(index, 1);
    newLines.forEach((line, i) => { line.lineNumber = i + 1; });
    setLines(newLines);
  };

  const updateLine = (index: number, updates: Partial<OrderLineInput>) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], ...updates };
    setLines(newLines);
  };

  const totalValue = useMemo(() => {
    return lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
  }, [lines]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !orderDate) {
      toast.error("Please fill in all required header fields.");
      return;
    }

    const validLines = lines.filter(l => l.partNumber && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Please add at least one valid line item.");
      return;
    }

    const savedStatus =
      status || (order?.status as OrderUpdateStatus) || "Draft";

    updateOrder.mutate({
      orderNumber,
      data: {
        orderDate: new Date(orderDate).toISOString(),
        supplierName,
        status: savedStatus,
        lines: validLines
      }
    }, {
      onSuccess: () => {
        toast.success(`Order ${orderNumber} updated.`);
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderNumber) });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError: (err: any) => {
        toast.error(err.error || "Failed to update order.");
      }
    });
  };

  const handleDelete = () => {
    deleteOrder.mutate({ orderNumber }, {
      onSuccess: () => {
        toast.success(`Order ${orderNumber} deleted.`);
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setLocation("/");
      },
      onError: (err: any) => {
        toast.error(err.error || "Failed to delete order.");
      }
    });
  };

  if (isLoadingOrder) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/">Return to Orders</Link>
        </Button>
      </div>
    );
  }

  const isReadOnly = status === "Received" || status === "Cancelled";

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono">{orderNumber}</h1>
            <p className="text-muted-foreground mt-1">Manage purchase order details.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive" disabled={isReadOnly}>Delete</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Order {orderNumber}?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the order and its lines.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" className="mt-2 sm:mt-0">Cancel</Button>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteOrder.isPending}>
                  {deleteOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Confirm Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button type="submit" disabled={isReadOnly || updateOrder.isPending}>
            {updateOrder.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Header</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                disabled={isReadOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
                disabled={isReadOnly}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status || (order?.status as OrderUpdateStatus) || "Draft"}
                onValueChange={(v) => setStatus(v as OrderUpdateStatus)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Lines</span>
                <span className="font-medium">{lines.length}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-muted-foreground text-sm">Total Value</span>
                <span className="text-2xl font-bold tracking-tight text-primary">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Order Lines</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="col-span-1">Line</div>
              <div className="col-span-4">Internal Part</div>
              <div className="col-span-3">Supplier Part / Desc</div>
              <div className="col-span-1 text-right">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-1 text-right">Total</div>
            </div>

            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start border rounded-md p-4 sm:p-2 sm:border-none sm:rounded-none relative group transition-colors hover:bg-muted/10">
                
                <div className="hidden sm:flex col-span-1 h-10 items-center justify-center font-mono text-sm text-muted-foreground">
                  {line.lineNumber}
                </div>
                
                <div className="sm:col-span-4 space-y-1">
                  <div className="sm:hidden text-xs font-medium text-muted-foreground mb-1">Part Number</div>
                  <StockPicker
                    items={stockItems}
                    value={line.partNumber}
                    onChange={(partNumber, item) => {
                      updateLine(index, { 
                        partNumber, 
                        description: item.itemName,
                        unitPrice: item.cost 
                      });
                    }}
                    disabled={isLoadingStock || isReadOnly}
                  />
                </div>
                
                <div className="sm:col-span-3 space-y-2">
                  <div className="sm:hidden text-xs font-medium text-muted-foreground">Details</div>
                  <Input
                    placeholder="Supplier Part #"
                    value={line.externalPartNumber}
                    onChange={(e) => updateLine(index, { externalPartNumber: e.target.value })}
                    className="h-8 text-sm"
                    disabled={isReadOnly}
                  />
                  <Input
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    className="h-8 text-sm"
                    disabled={isReadOnly}
                  />
                </div>
                
                <div className="sm:col-span-1">
                  <div className="sm:hidden text-xs font-medium text-muted-foreground mb-1">Qty</div>
                  <Input
                    type="number"
                    min="1"
                    value={line.quantity || ""}
                    onChange={(e) => updateLine(index, { quantity: parseInt(e.target.value) || 0 })}
                    className="h-10 text-right font-mono"
                    disabled={isReadOnly}
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <div className="sm:hidden text-xs font-medium text-muted-foreground mb-1">Unit Price</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unitPrice === 0 && !line.partNumber ? "" : line.unitPrice}
                      onChange={(e) => updateLine(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="h-10 pl-7 text-right font-mono"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-1 flex items-center justify-between sm:justify-end h-10">
                  <div className="sm:hidden text-sm font-medium">Line Total:</div>
                  <div className="font-mono text-sm font-medium tracking-tight">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </div>
                </div>

                {lines.length > 1 && !isReadOnly && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLine(index)}
                    className="absolute -right-2 -top-2 sm:static sm:h-10 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-background border sm:border-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {!isReadOnly && (
            <Button
              type="button"
              variant="outline"
              onClick={addLine}
              className="mt-6 w-full border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Order Line
            </Button>
          )}
        </CardContent>
      </Card>
    </form>
  );
}