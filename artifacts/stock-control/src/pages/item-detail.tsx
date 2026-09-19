import { useState, useEffect } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { 
  useGetStockItem,
  useUpdateStockItem,
  useDeleteStockItem,
  getGetStockItemQueryKey,
  getListStockItemsQueryKey,
  getGetStockSummaryQueryKey
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit3, Trash2, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Modal, Label } from '@/components/ui-elements';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ItemDetail() {
  const params = useParams();
  const partNumber = params.partNumber || '';
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: item, isLoading, isError } = useGetStockItem(partNumber);
  const updateItem = useUpdateStockItem();
  const deleteItem = useDeleteStockItem();

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    quantity: 0,
    cost: 0,
    retailPrice: 0,
    binNumber: ''
  });

  useEffect(() => {
    if (item && !isEditing) {
      setFormData({
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        cost: item.cost,
        retailPrice: item.retailPrice,
        binNumber: item.binNumber
      });
    }
  }, [item, isEditing]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  if (isError || !item) {
    return (
      <div className="text-center p-12 space-y-4">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-black uppercase">Part Not Found</h2>
        <p className="text-muted-foreground font-mono">Part #{partNumber} does not exist in the ledger.</p>
        <Button onClick={() => setLocation('/')} className="mt-4">RETURN TO INVENTORY</Button>
      </div>
    );
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateItem.mutate({
      partNumber,
      data: formData
    }, {
      onSuccess: (updatedData) => {
        toast({ title: "Item updated successfully" });
        setIsEditing(false);
        queryClient.setQueryData(getGetStockItemQueryKey(partNumber), updatedData);
        queryClient.invalidateQueries({ queryKey: getListStockItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStockSummaryQueryKey() });
      },
      onError: (err) => {
        toast({ 
          title: "Update failed", 
          description: err.message || "An error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  const handleDelete = () => {
    deleteItem.mutate({ partNumber }, {
      onSuccess: () => {
        toast({ title: "Item deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getListStockItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStockSummaryQueryKey() });
        setLocation('/');
      },
      onError: (err) => {
        toast({ 
          title: "Delete failed", 
          description: err.message || "An error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Ledger
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge className="text-lg px-3 py-1 bg-primary/10 text-primary border-2 border-primary/20">{item.partNumber}</Badge>
            <Badge variant="outline" className="font-mono bg-background text-base border-2">{item.binNumber}</Badge>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">{item.itemName}</h1>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 size={16} strokeWidth={2.5} /> EDIT RECORD
              </Button>
              <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} className="gap-2">
                <Trash2 size={16} strokeWidth={2.5} /> DELETE
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>CANCEL</Button>
              <Button onClick={handleUpdate} disabled={updateItem.isPending} className="gap-2">
                {updateItem.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} strokeWidth={2.5} />}
                SAVE CHANGES
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-muted/30">
              <CardTitle className="uppercase text-lg">Part Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Item Name</Label>
                    <Input value={formData.itemName} onChange={e => setFormData(f => ({...f, itemName: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={formData.description} onChange={e => setFormData(f => ({...f, description: e.target.value}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Bin Location</Label>
                    <Input className="uppercase" value={formData.binNumber} onChange={e => setFormData(f => ({...f, binNumber: e.target.value}))} />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 text-base font-medium">{item.description || <span className="text-muted-foreground italic font-normal">No description provided.</span>}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-sm border-2 border-border/50">
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p className="mt-1 font-mono text-sm font-bold">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Updated</Label>
                      <p className="mt-1 font-mono text-sm font-bold">{new Date(item.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={cn("border-2 shadow-sm transition-colors", item.quantity === 0 ? "border-destructive bg-destructive/5" : "")}>
            <CardHeader className={cn(item.quantity === 0 ? "bg-destructive/10" : "bg-muted/30")}>
              <CardTitle className="uppercase text-lg">Stock Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quantity on Hand</Label>
                    <Input type="number" min="0" value={formData.quantity} onChange={e => setFormData(f => ({...f, quantity: Number(e.target.value)}))} />
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className={cn(
                    "text-6xl font-black font-mono mb-2",
                    item.quantity === 0 ? "text-destructive" : "text-primary"
                  )}>
                    {item.quantity}
                  </div>
                  <Label className="text-muted-foreground">Units Available</Label>
                  {item.quantity === 0 && (
                    <Badge variant="destructive" className="mt-4 w-full justify-center py-2 text-sm">OUT OF STOCK</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm">
            <CardHeader className="bg-muted/30">
              <CardTitle className="uppercase text-lg">Valuation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Unit Cost ($)</Label>
                    <Input type="number" step="0.01" min="0" value={formData.cost} onChange={e => setFormData(f => ({...f, cost: Number(e.target.value)}))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Retail Price ($)</Label>
                    <Input type="number" step="0.01" min="0" value={formData.retailPrice} onChange={e => setFormData(f => ({...f, retailPrice: Number(e.target.value)}))} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-border/50 pb-3">
                    <Label className="text-muted-foreground">Unit Cost</Label>
                    <span className="font-mono font-bold text-lg">${item.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b-2 border-border/50 pb-3">
                    <Label className="text-muted-foreground">Retail Price</Label>
                    <span className="font-mono font-bold text-lg">${item.retailPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <Label className="text-muted-foreground">Margin</Label>
                    <span className="font-mono font-bold text-lg text-secondary">
                      {item.retailPrice > 0 ? (((item.retailPrice - item.cost) / item.retailPrice) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        title="Confirm Deletion"
        description={`Are you absolutely sure you want to delete part ${item.partNumber}? This action cannot be undone and will remove it from the ledger permanently.`}
      >
        <div className="flex justify-end gap-3 pt-4 border-t-2 border-border mt-6">
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>CANCEL</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteItem.isPending}>
            {deleteItem.isPending ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            PERMANENTLY DELETE
          </Button>
        </div>
      </Modal>
    </div>
  );
}
