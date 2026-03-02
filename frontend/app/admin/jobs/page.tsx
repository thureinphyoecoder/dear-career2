import Link from "next/link";

import { JobTable } from "@/components/admin/JobTable";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminJobs } from "@/lib/api-admin";

export default async function AdminJobsPage() {
  const jobs = await getAdminJobs();

  return (
    <div className="grid max-w-[980px] gap-5">
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
          <Input className="h-11 w-full bg-white sm:w-[240px]" placeholder="Search title or company" />
          <select
            className="h-11 min-w-[180px] rounded-full border border-[rgba(160,183,164,0.18)] bg-white px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8da693]"
            defaultValue="all"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Link href="/admin/jobs/new" className={buttonVariants()}>
            Create job
          </Link>
        </div>
      </div>
      <JobTable jobs={jobs} />
    </div>
  );
}
