import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { getJobBySlug } from "@/lib/api-public";

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 md:pt-32">
      <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-[#8da693] transition-colors hover:text-foreground">
        Back to jobs
      </Link>
      <section className="mt-3 grid gap-4 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.74)] p-4 shadow-soft backdrop-blur-xl lg:p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{job.employment_type}</Badge>
        </div>
        <div className="grid gap-2">
          <h1 className="font-serif text-[clamp(2.2rem,4vw,4.2rem)] font-medium leading-[0.96] tracking-[-0.04em] text-foreground">
            {job.title}
          </h1>
          <p className="mb-0 text-sm text-[#727975]">
            {job.company} · {job.location}
          </p>
        </div>
        <p className="mb-0 text-[1.05rem] font-semibold text-foreground">{job.salary || "Salary negotiable"}</p>
        <div className="grid gap-2">
          <h2 className="font-serif text-[clamp(1.6rem,3vw,2.4rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
            Description
          </h2>
          <p className="mb-0 max-w-[66ch] text-sm leading-6 text-[#727975]">
            {job.description_mm ||
              job.description_en ||
              "Detailed job content will appear here once connected to Django."}
          </p>
        </div>
      </section>
    </main>
  );
}
