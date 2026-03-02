import Link from "next/link";

import { StatusPill } from "@/components/admin/StatusPill";
import { Card, CardContent } from "@/components/ui/card";
import type { Job } from "@/lib/types";

function formatCategory(category: Job["category"]) {
  return category.replace("-", " ");
}

function formatDate(value?: string) {
  if (!value) {
    return "Not synced";
  }

  return new Intl.DateTimeFormat("en-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function JobTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Job CRUD</div>
          <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Listings</h2>
        </div>
        <span className="text-[0.78rem] uppercase tracking-[0.08em] text-[#727975]">{jobs.length} records</span>
      </div>

      <Card className="rounded-2xl border-border/70 bg-white shadow-none">
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full border-collapse text-left">
            <thead className="bg-[#fafbfa]">
              <tr>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Role</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Category</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Source</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Status</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]">Updated</th>
                <th className="border-b border-border/70 px-5 py-3 text-[0.76rem] uppercase tracking-[0.12em] text-[#727975]" />
              </tr>
            </thead>
            <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-[0.92rem] text-[#727975]">
                  No jobs yet. Create a listing or queue a fetch source first.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-[#fafcfb]">
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <div className="grid gap-1">
                      <strong className="font-medium text-[#334039]">{job.title}</strong>
                      <span className="text-[0.92rem] text-[#727975]">
                        {job.company} · {job.location || "Thailand"}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top capitalize">{formatCategory(job.category)}</td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">{job.source || "manual"}</td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <StatusPill status={job.status ?? "published"} />
                  </td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">{formatDate(job.updated_at ?? job.created_at)}</td>
                  <td className="border-b border-border/60 px-5 py-4 align-top">
                    <Link className="text-[#7f9582]" href={`/admin/jobs/${job.id}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
