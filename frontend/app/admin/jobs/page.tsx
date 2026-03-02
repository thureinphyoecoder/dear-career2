import Link from "next/link";

import { JobTable } from "@/components/admin/JobTable";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminJobs } from "@/lib/api-admin";
import { cn } from "@/lib/utils";

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();
  const backendOffline = jobs.length === 0;

  return (
    <div className="grid max-w-[1120px] gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-2">
          <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Job CRUD</div>
          <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
            Jobs
          </h1>
          <p className="max-w-[48ch] text-[0.92rem] leading-6 text-[#727975]">
            Review listings, update metadata, and control publish readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            className="h-11 w-full rounded-xl border-border/70 bg-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-[240px]"
            placeholder="Search title or company"
          />
          <select
            className="h-11 min-w-[180px] rounded-xl border border-border/70 bg-white px-4 text-sm text-foreground shadow-none outline-none focus:border-[#8da693]"
            defaultValue="all"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Link href="/admin/jobs/new" className={cn(buttonVariants(), "rounded-xl")}>
            Create job
          </Link>
        </div>
      </div>
      {backendOffline ? (
        <Card className="rounded-2xl border-[rgba(204,165,92,0.22)] bg-[rgba(255,251,240,0.96)] shadow-none">
          <CardContent className="grid gap-1 p-4 text-sm text-[#7a6a45]">
            <strong className="font-medium text-[#6f5f3a]">Backend may be offline</strong>
            <p className="m-0">
              No jobs were returned. If your database already has data, start the Django server on
              port `8000` and refresh this page.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <JobTable jobs={jobs} />
    </div>
  );
}
