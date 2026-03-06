function JobCardSkeleton() {
  return (
    <div className="rounded-[1.45rem] border border-[rgba(160,183,164,0.16)] bg-white/70 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="h-5 w-16 animate-pulse rounded-full bg-[rgba(160,183,164,0.2)]" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-[rgba(160,183,164,0.16)]" />
      </div>
      <div className="mt-4 h-7 w-3/4 animate-pulse rounded bg-[rgba(160,183,164,0.16)]" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[rgba(160,183,164,0.14)]" />
      <div className="mt-6 h-4 w-full animate-pulse rounded bg-[rgba(160,183,164,0.12)]" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[rgba(160,183,164,0.12)]" />
    </div>
  );
}

export default function PublicJobsLoading() {
  return (
    <main className="jobs-page mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-4 sm:pb-20 sm:pt-32">
      <div className="rounded-2xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.52)] p-2 sm:rounded-full">
        <div className="h-[50px] animate-pulse rounded-xl bg-[rgba(160,183,164,0.14)] sm:h-[52px] sm:rounded-full" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-[rgba(160,183,164,0.12)] pb-4">
        <div className="h-9 w-28 animate-pulse rounded-full bg-[rgba(160,183,164,0.14)]" />
        <div className="h-9 w-36 animate-pulse rounded-full bg-[rgba(160,183,164,0.14)]" />
        <div className="h-9 w-32 animate-pulse rounded-full bg-[rgba(160,183,164,0.14)]" />
      </div>

      <section className="mt-10 grid gap-4 xl:grid-cols-2">
        <JobCardSkeleton />
        <JobCardSkeleton />
        <JobCardSkeleton />
        <JobCardSkeleton />
      </section>
    </main>
  );
}
