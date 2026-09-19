import { useState } from 'react';
import { Link } from 'wouter';
import { 
  useListStockItems, 
  useCreateStockItem,
  getListStockItemsQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Modal, Label } from '@/components/ui-elements';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading: isItemsLoading } = useListStockItems(
    debouncedSearch ? { partNumber: debouncedSearch } : undefined
  );

  const createItem = useCreateStockItem();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      partNumber: formData.get('partNumber') as string,
      itemName: formData.get('itemName') as string,
      description: formData.get('description') as string,
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
      <Card className="shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-xl uppercase flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Stock Ledger
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search part number..." 
                className="pl-10 h-10 border-2 uppercase"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
                  <th className="px-6 py-4">Bin</th>
                  <th className="px-6 py-4 text-right">Qty</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-card">
                {isItemsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading inventory...
                    </td>
                  </tr>
                ) : items?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-mono">
                      No matching parts found in ledger.
                    </td>
                  </tr>
                ) : (
                  items?.map((item) => (
                    <tr key={item.partNumber} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-3 font-mono font-bold text-primary">{item.partNumber}</td>
                      <td className="px-6 py-3 font-medium">{item.itemName}</td>
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
            <div className="space-y-2 col-span-2 sm:col-span-1"></div>
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

