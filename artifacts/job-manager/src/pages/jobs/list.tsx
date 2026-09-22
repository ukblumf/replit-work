import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, ClipboardList, Loader2, ArrowRight, Boxes, PoundSterling, Briefcase } from "lucide-react";
import { useListJobs, useGetJobSummary } from "@workspace/jobs-api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

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

export default function JobList() {
  const [search, setSearch] = useState("");
  const { data: jobs, isLoading, error } = useListJobs({ search: search || undefined });
  const { data: summary } = useGetJobSummary();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
          <p className="text-muted-foreground mt-1">Engineer jobs and the parts allocated to them.</p>
        </div>
        <Button asChild>
          <Link href="/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Job
          </Link>
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile icon={Briefcase} label="Jobs" value={summary.jobCount} />
          <StatTile icon={ClipboardList} label="Part Lines" value={summary.partCount} />
          <StatTile icon={Boxes} label="Total Quantity" value={summary.totalQuantity} />
          <StatTile icon={PoundSterling} label="Total Value" value={formatCurrency(summary.totalValue)} />
        </div>
      )}

      <div className="bg-card rounded-lg border shadow-sm p-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Job Id, Client or Part Number..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Id</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Parts</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  Failed to load jobs.
                </TableCell>
              </TableRow>
            ) : !jobs?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ClipboardList className="h-8 w-8 mb-2 opacity-50" />
                    <p>No jobs found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.jobId} className="group">
                  <TableCell className="font-mono font-medium">
                    <Link href={`/${job.jobId}`} className="hover:underline text-primary">
                      {job.jobId}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(String(job.jobDate))}</TableCell>
                  <TableCell className="font-medium">{job.client}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{job.description}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{job.partCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/${job.jobId}`}>
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
