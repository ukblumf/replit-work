import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  useListStockItems,
  useCreateStockItem,
  useGetStockSummary,
  getListStockItemsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Package, ArrowRight, Loader2, Boxes, PoundSterling, TriangleAlert } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Modal, Label } from '@/components/ui-elements';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const EMPTY_FILTERS = {
  partNumber: '',
  supplier: '',
  description: '',
  minQuantity: '',
  maxQuantity: '',
  minValue: '',
  maxValue: '',
};

export default function Dashboard() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedFilters = useDebounce(filters, 300);
  const setFilter = (key: keyof typeof EMPTY_FILTERS) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((f) => ({ ...f, [key]: e.target.value }));

  // The New Part modal is driven by the /new route so the top nav can open it.
  const [location, setLocation] = useLocation();
  const isAddModalOpen = location === '/new';
  const setIsAddModalOpen = (open: boolean) => setLocation(open ? '/new' : '/');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary } = useGetStockSummary();

  const { data: items, isLoading: isItemsLoading } = useListStockItems({
    partNumber: debouncedFilters.partNumber || undefined,
    supplier: debouncedFilters.supplier || undefined,
    description: debouncedFilters.description || undefined,
    minQuantity: debouncedFilters.minQuantity ? Number(debouncedFilters.minQuantity) : undefined,
    maxQuantity: debouncedFilters.maxQuantity ? Number(debouncedFilters.maxQuantity) : undefined,
    minValue: debouncedFilters.minValue ? Number(debouncedFilters.minValue) : undefined,
    maxValue: debouncedFilters.maxValue ? Number(debouncedFilters.maxValue) : undefined,
  });

  const createItem = useCreateStockItem();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      partNumber: formData.get('partNumber') as string,
      itemName: formData.get('itemName') as string,
      description: formData.get('description') as string,
      supplier: formData.get('supplier') as string,
      quantity: Number(formData.get('quantity')),
      cost: Number(formData.get('cost')),
      retailPrice: Number(formData.get('retailPrice')),
      binNumber: formData.get('binNumber') as string,
    };

    createItem.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Item created successfully" });
        setIsAddModalOpen(false);
        queryClient.invalidateQueries({ queryKey: getListStockItemsQueryKey() });
      },
      onError: (err) => {
        toast({ 
          title: "Failed to create item", 
          description: err.message || "An error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Inventory Overview</h1>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shrink-0">
          <Plus size={18} strokeWidth={3} />
          <span>NEW PART</span>
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatTile icon={Package} label="Items" value={summary.itemCount} />
          <StatTile icon={Boxes} label="Units Held" value={summary.totalUnits} />
          <StatTile icon={PoundSterling} label="Inventory Cost" value={`£${summary.inventoryCost.toFixed(2)}`} />
          <StatTile icon={PoundSterling} label="Retail Value" value={`£${summary.inventoryRetailValue.toFixed(2)}`} />
          <StatTile
            icon={TriangleAlert}
            label="Low Stock"
            value={summary.lowStockCount}
            className={summary.lowStockCount > 0 ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20" : undefined}
          />
        </div>
      )}

      <Card className="shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-xl uppercase flex items-center gap-2">
                <Package size={20} className="text-primary" />
                Stock Ledger
              </CardTitle>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Part number..."
                  className="pl-9 h-9 border-2 uppercase text-sm"
                  value={filters.partNumber}
                  onChange={setFilter('partNumber')}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Supplier..."
                  className="pl-9 h-9 border-2 text-sm"
                  value={filters.supplier}
                  onChange={setFilter('supplier')}
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Description..."
                  className="pl-9 h-9 border-2 text-sm"
                  value={filters.description}
                  onChange={setFilter('description')}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min qty"
                  className="h-9 border-2 text-sm"
                  value={filters.minQuantity}
                  onChange={setFilter('minQuantity')}
                />
                <Input
                  type="number"
                  placeholder="Max qty"
                  className="h-9 border-2 text-sm"
                  value={filters.maxQuantity}
                  onChange={setFilter('maxQuantity')}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min value £"
                  className="h-9 border-2 text-sm"
                  value={filters.minValue}
                  onChange={setFilter('minValue')}
                />
                <Input
                  type="number"
                  placeholder="Max value £"
                  className="h-9 border-2 text-sm"
                  value={filters.maxValue}
                  onChange={setFilter('maxValue')}
                />
              </div>
              {(filters.partNumber || filters.supplier || filters.description || filters.minQuantity || filters.maxQuantity || filters.minValue || filters.maxValue) && (
                <Button variant="outline" size="sm" className="h-9" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 border-b-2 border-border font-bold">
                <tr>
                  <th className="px-6 py-4">Part #</th>
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Bin</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-card">
                {isItemsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading inventory...
                    </td>
                  </tr>
                ) : items?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-mono">
                      No matching parts found in ledger.
                    </td>
                  </tr>
                ) : (
                  items?.map((item) => (
                    <tr key={item.partNumber} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-3 font-mono font-bold text-primary">{item.partNumber}</td>
                      <td className="px-6 py-3 font-medium">{item.itemName}</td>
                      <td className="px-6 py-3 text-muted-foreground">{item.supplier || '—'}</td>
                      <td className="px-6 py-3">
                        <Badge variant="outline" className="font-mono bg-background">{item.binNumber}</Badge>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className={cn(
                          "font-mono font-bold px-2 py-1 rounded-sm",
                          item.quantity === 0 ? "bg-destructive/10 text-destructive" : (item.quantity < 5 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500" : "text-foreground")
                        )}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono">£{item.cost.toFixed(2)}</td>
                      <td className="px-6 py-3 text-center">
                        <Link href={`/stock/${item.partNumber}`} className="inline-flex items-center justify-center p-2 rounded-sm text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors group-hover:opacity-100 opacity-50 sm:opacity-100">
                          <ArrowRight size={16} strokeWidth={3} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Modal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
        title="Receive New Part"
        description="Enter the details for the new physical stock item. Part numbers must be unique."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="partNumber">Part Number</Label>
              <Input id="partNumber" name="partNumber" required placeholder="e.g. PN-1001" className="uppercase" />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="binNumber">Bin Location</Label>
              <Input id="binNumber" name="binNumber" required placeholder="e.g. A-12-B" className="uppercase" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input id="itemName" name="itemName" required placeholder="e.g. Hex Bolt M8x20" />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input id="description" name="description" placeholder="Technical specs or notes" />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min="0" required defaultValue="0" />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="supplier">Supplier (Optional)</Label>
              <Input id="supplier" name="supplier" placeholder="e.g. Acme Fasteners" />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="cost">Unit Cost (£)</Label>
              <Input id="cost" name="cost" type="number" step="0.01" min="0" required defaultValue="0.00" />
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="retailPrice">Retail Price (£)</Label>
              <Input id="retailPrice" name="retailPrice" type="number" step="0.01" min="0" required defaultValue="0.00" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>CANCEL</Button>
            <Button type="submit" disabled={createItem.isPending}>
              {createItem.isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              SAVE TO LEDGER
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, className }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="p-4 flex items-center gap-3">
        <Icon size={20} className="text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-black font-mono text-foreground truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
