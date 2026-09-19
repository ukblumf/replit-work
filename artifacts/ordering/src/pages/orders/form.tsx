import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, ArrowLeft, Loader2, Save } from "lucide-react";
import { useCreateOrder, useListStockItems, getListOrdersQueryKey, OrderInputStatus, OrderLineInput } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StockPicker } from "@/components/stock-picker";
import { formatCurrency } from "@/lib/utils";

export default function OrderForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const { data: stockItems = [], isLoading: isLoadingStock } = useListStockItems();

  const [orderNumber, setOrderNumber] = useState(`PO-${Math.floor(Math.random() * 100000)}`);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplierName, setSupplierName] = useState("");
  const [status, setStatus] = useState<OrderInputStatus>("Draft");

  const [lines, setLines] = useState<OrderLineInput[]>([
    { lineNumber: 1, partNumber: "", externalPartNumber: "", description: "", quantity: 1, unitPrice: 0 }
  ]);

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
    // Re-number
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !supplierName || !orderDate) {
      toast.error("Please fill in all required header fields.");
      return;
    }

    const validLines = lines.filter(l => l.partNumber && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Please add at least one valid line item.");
      return;
    }

    createOrder.mutate({
      data: {
        orderNumber,
        orderDate: new Date(orderDate).toISOString(),
        supplierName,
        status,
        lines: validLines
      }
    }, {
      onSuccess: (data) => {
        toast.success(`Order ${data.orderNumber} created successfully.`);
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setLocation(`/orders/${data.orderNumber}`);
      },
      onError: (err: any) => {
        toast.error(err.error || "Failed to create order.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
            <p className="text-muted-foreground mt-1">Create a new purchase order.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createOrder.isPending}>
            {createOrder.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Header</CardTitle>
            <CardDescription>Basic details for this purchase order.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order Number *</Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                required
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="supplierName">Supplier Name *</Label>
              <Input
                id="supplierName"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                required
                placeholder="e.g. Acme Logistics Corp"
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
              <Select value={status} onValueChange={(v) => setStatus(v as OrderInputStatus)}>
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
            <CardDescription>Select stock parts and specify quantities.</CardDescription>
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
                    disabled={isLoadingStock}
                  />
                </div>
                
                <div className="sm:col-span-3 space-y-2">
                  <div className="sm:hidden text-xs font-medium text-muted-foreground">Details</div>
                  <Input
                    placeholder="Supplier Part #"
                    value={line.externalPartNumber}
                    onChange={(e) => updateLine(index, { externalPartNumber: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Description"
                    value={line.description}
                    onChange={(e) => updateLine(index, { description: e.target.value })}
                    className="h-8 text-sm"
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
                  />
                </div>
                
                <div className="sm:col-span-2">
                  <div className="sm:hidden text-xs font-medium text-muted-foreground mb-1">Unit Price</div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.unitPrice === 0 && !line.partNumber ? "" : line.unitPrice}
                      onChange={(e) => updateLine(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="h-10 pl-7 text-right font-mono"
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-1 flex items-center justify-between sm:justify-end h-10">
                  <div className="sm:hidden text-sm font-medium">Line Total:</div>
                  <div className="font-mono text-sm font-medium tracking-tight">
                    {formatCurrency(line.quantity * line.unitPrice)}
                  </div>
                </div>

                {lines.length > 1 && (
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
          
          <Button
            type="button"
            variant="outline"
            onClick={addLine}
            className="mt-6 w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Order Line
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}