import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  useAddJobPart,
  useDeleteJob,
  useGetJob,
  useListParts,
  useRemoveJobPart,
  useUpdateJob,
  getGetJobQueryKey,
  getListJobsQueryKey,
  getListPartsQueryKey,
} from "@workspace/jobs-api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrorMessage } from "@/lib/utils";

export default function JobDetail() {
  const params = useParams();
  const jobId = params.jobId as string;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: job, isLoading } = useGetJob(jobId, {
    query: { enabled: !!jobId, queryKey: getGetJobQueryKey(jobId) },
  });
  const { data: parts = [], isLoading: isLoadingParts } = useListParts();

  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const addPart = useAddJobPart();
  const removePart = useRemoveJobPart();

  const [jobDate, setJobDate] = useState("");
  const [client, setClient] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [description, setDescription] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [partNumber, setPartNumber] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (job) {
      setJobDate(String(job.jobDate).split("T")[0]);
      setClient(job.client);
      setClientAddress(job.clientAddress);
      setDescription(job.description);
    }
  }, [job]);

  // Stock changes whenever a part is added or removed, so refresh the part list as well.
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(jobId) });
    queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPartsQueryKey() });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !jobDate) {
      toast.error("Please fill in the date and client.");
      return;
    }
    updateJob.mutate(
      { jobId, data: { jobDate, client: client.trim(), clientAddress, description } },
      {
        onSuccess: () => {
          toast.success(`Job ${jobId} updated.`);
          refresh();
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Failed to update job.")),
      },
    );
  };

  const handleDelete = () => {
    deleteJob.mutate(
      { jobId },
      {
        onSuccess: () => {
          toast.success(`Job ${jobId} deleted.`);
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          setLocation("/");
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Failed to delete job.")),
      },
    );
  };

  const selectedPart = parts.find((p) => p.partNumber === partNumber);
  const shortfall = selectedPart ? Math.max(0, quantity - selectedPart.quantity) : 0;

  const handleAddPart = () => {
    if (!partNumber || quantity < 1) {
      toast.error("Choose a part and a quantity of at least 1.");
      return;
    }
    addPart.mutate(
      { jobId, data: { partNumber, quantity } },
      {
        onSuccess: (part) => {
          const fromStock = `${part.quantityAllocated} taken from stock`;
          toast.success(
            part.draftOrderNumber
              ? `${partNumber}: ${fromStock}, ${shortfall || part.quantityOrdered} on draft order ${part.draftOrderNumber}.`
              : `${partNumber}: ${fromStock}.`,
          );
          setAddOpen(false);
          setPartNumber("");
          setQuantity(1);
          refresh();
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Failed to add part.")),
      },
    );
  };

  const handleRemovePart = (part: string) => {
    removePart.mutate(
      { jobId, partNumber: part },
      {
        onSuccess: () => {
          toast.success(`${part} removed; allocated stock returned.`);
          refresh();
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Failed to remove part.")),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Job Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/">Return to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-mono">{jobId}</h1>
              <p className="text-muted-foreground mt-1">Manage job details and parts.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="destructive">Delete</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Job {jobId}?</DialogTitle>
                  <DialogDescription>
                    This cannot be undone. A job that still has parts cannot be deleted; remove its parts first so stock is returned.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteJob.isPending}>
                    {deleteJob.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Confirm Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button type="submit" disabled={updateJob.isPending}>
              {updateJob.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobDate">Job Date *</Label>
              <Input id="jobDate" type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Input id="client" value={client} onChange={(e) => setClient(e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="clientAddress">Client Address</Label>
              <Textarea id="clientAddress" rows={3} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Parts</CardTitle>
            <CardDescription>
              Adding a part takes stock from Stock Control. Any shortfall goes on a draft order in Ordering.
            </CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button type="button">
                <Plus className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Part to {jobId}</DialogTitle>
                <DialogDescription>Choose a part and how many the job needs.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Part</Label>
                  <Select value={partNumber} onValueChange={setPartNumber} disabled={isLoadingParts}>
                    <SelectTrigger className="w-full font-normal">
                      <SelectValue placeholder="Select part number..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parts.map((p) => (
                        <SelectItem key={p.partNumber} value={p.partNumber}>
                          <span className="font-mono text-xs">{p.partNumber}</span>
                          <span className="ml-2">{p.itemName}</span>
                          <span className="ml-2 text-muted-foreground">({p.quantity} in stock)</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity || ""}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
                {selectedPart && (
                  <p className="text-sm text-muted-foreground">
                    {shortfall > 0
                      ? `${Math.min(quantity, selectedPart.quantity)} will be taken from stock and ${shortfall} added to a draft order.`
                      : `All ${quantity} will be taken from stock (${selectedPart.quantity} available).`}
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="button" onClick={handleAddPart} disabled={addPart.isPending}>
                  {addPart.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add to Job
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Needed</TableHead>
                <TableHead className="text-right">From Stock</TableHead>
                <TableHead className="text-right">On Order</TableHead>
                <TableHead>Draft Order</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No parts on this job yet.
                  </TableCell>
                </TableRow>
              ) : (
                job.parts.map((part) => (
                  <TableRow key={part.partNumber}>
                    <TableCell className="font-mono font-medium">{part.partNumber}</TableCell>
                    <TableCell>{part.description}</TableCell>
                    <TableCell className="text-right">{part.quantity}</TableCell>
                    <TableCell className="text-right">{part.quantityAllocated}</TableCell>
                    <TableCell className="text-right">{part.quantityOrdered}</TableCell>
                    <TableCell>
                      {part.draftOrderNumber ? (
                        // Ordering is a separate app served under /ordering/, so use a plain link.
                        <a href={`/ordering/orders/${part.draftOrderNumber}`} className="hover:underline text-primary font-mono">
                          <Badge variant="secondary">{part.draftOrderNumber}</Badge>
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePart(part.partNumber)}
                        disabled={removePart.isPending}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
