import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useCreateJob, getListJobsQueryKey } from "@workspace/jobs-api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/utils";

export default function JobForm() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createJob = useCreateJob();

  const [jobDate, setJobDate] = useState(new Date().toISOString().split("T")[0]);
  const [client, setClient] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.trim() || !jobDate) {
      toast.error("Please fill in the date and client.");
      return;
    }

    createJob.mutate(
      {
        data: {
          jobDate,
          client: client.trim(),
          clientAddress,
          description,
        },
      },
      {
        onSuccess: (job) => {
          toast.success(`Job ${job.jobId} created.`);
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          setLocation(`/${job.jobId}`);
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Failed to create job.")),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Job</h1>
            <p className="text-muted-foreground mt-1">The Job Id is assigned when you save. Add parts afterwards.</p>
          </div>
        </div>
        <Button type="submit" disabled={createJob.isPending}>
          {createJob.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Create Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Who the work is for and what needs doing.</CardDescription>
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
  );
}
