function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-[rgba(141,166,147,0.2)]" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-[rgba(141,166,147,0.18)]" />
      <div className="mt-2 h-3 w-20 animate-pulse rounded bg-[rgba(141,166,147,0.16)]" />
    </div>
  );
}

export default function AdminLoading() {
  return (
    <div className="grid max-w-none gap-5 xl:pr-6">
      <header className="flex justify-end">
        <div className="h-10 w-24 animate-pulse rounded-xl bg-[rgba(141,166,147,0.18)]" />
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <div className="rounded-2xl border border-border/70 bg-white p-6">
          <div className="h-5 w-40 animate-pulse rounded bg-[rgba(141,166,147,0.2)]" />
          <div className="mt-5 grid gap-4">
            <div className="h-14 animate-pulse rounded-xl bg-[rgba(141,166,147,0.14)]" />
            <div className="h-14 animate-pulse rounded-xl bg-[rgba(141,166,147,0.14)]" />
            <div className="h-14 animate-pulse rounded-xl bg-[rgba(141,166,147,0.14)]" />
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-white p-6">
          <div className="h-5 w-32 animate-pulse rounded bg-[rgba(141,166,147,0.2)]" />
          <div className="mt-5 grid gap-3">
            <div className="h-20 animate-pulse rounded-xl bg-[rgba(141,166,147,0.14)]" />
            <div className="h-20 animate-pulse rounded-xl bg-[rgba(141,166,147,0.14)]" />
            <div className="h-20 animate-pulse rounded-xl bg-[rgba(141,166,147,0.14)]" />
          </div>
        </div>
      </section>
    </div>
  );
}
