import { AdminJobsFilterForm } from "@/components/admin/AdminJobsFilterForm";
import Link from "next/link";

import { JobTable } from "@/components/admin/JobTable";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAdminJobs } from "@/lib/api-admin";
import { cn } from "@/lib/utils";

type AdminJobsPageProps = {
  searchParams?: Promise<{
    query?: string;
    status?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

export default async function AdminJobsPage({ searchParams }: AdminJobsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const query = params?.query?.trim() ?? "";
  const status = params?.status?.trim() ?? "all";
  const currentPage = Math.max(1, Number(params?.page ?? "1") || 1);
  const jobs = await getAdminJobs();
  const filteredJobs = jobs.filter((job) => {
    const matchesQuery = query
      ? [job.title, job.company, job.location, job.source]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query.toLowerCase()))
      : true;
    const matchesStatus =
      status === "all"
        ? true
        : status === "published"
          ? (job.status ?? "published") === "published" &&
            job.is_active !== false &&
            job.requires_website_approval !== true
          : (job.status ?? "published") === status;
    return matchesQuery && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedJobs = filteredJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const backendOffline = jobs.length === 0;

  function buildPageHref(page: number) {
    const next = new URLSearchParams();
    if (query) next.set("query", query);
    if (status !== "all") next.set("status", status);
    if (page > 1) next.set("page", String(page));
    const search = next.toString();
    return search ? `/admin/jobs?${search}` : "/admin/jobs";
  }

  return (
    <div className="grid max-w-none gap-5 xl:pr-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          Job list
        </h1>
        <Link href="/admin/jobs/new" className={cn(buttonVariants(), "rounded-xl")}>
          Add job
        </Link>
      </div>
      <Card className="rounded-2xl border-border/70 bg-white shadow-none">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <AdminJobsFilterForm initialQuery={query} initialStatus={status} />
          <div className="text-[0.82rem] uppercase tracking-[0.08em] text-[#727975] lg:text-right">
            {paginatedJobs.length} shown
          </div>
        </CardContent>
      </Card>
      {backendOffline ? (
        <Card className="rounded-2xl border-[rgba(204,165,92,0.22)] bg-[rgba(255,251,240,0.96)] shadow-none">
          <CardContent className="grid gap-1 p-4 text-sm text-[#7a6a45]">
            <strong className="font-medium text-[#6f5f3a]">Jobs could not be loaded right now</strong>
            <p className="m-0">
              Nothing came back from the server. Please refresh in a moment or ask the site administrator to check the server.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <JobTable jobs={paginatedJobs} />
      {filteredJobs.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-none sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-[#727975]">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildPageHref(Math.max(1, safePage - 1))}
              aria-disabled={safePage === 1}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "rounded-xl",
                safePage === 1 && "pointer-events-none opacity-50",
              )}
            >
              Previous
            </Link>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .slice(Math.max(0, safePage - 3), Math.min(totalPages, safePage + 2))
              .map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={buildPageHref(pageNumber)}
                  className={cn(
                    buttonVariants(pageNumber === safePage ? {} : { variant: "secondary" }),
                    "min-w-10 rounded-xl px-0",
                  )}
                >
                  {pageNumber}
                </Link>
              ))}
            <Link
              href={buildPageHref(Math.min(totalPages, safePage + 1))}
              aria-disabled={safePage === totalPages}
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "rounded-xl",
                safePage === totalPages && "pointer-events-none opacity-50",
              )}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
