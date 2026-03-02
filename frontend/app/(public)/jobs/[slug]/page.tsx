import Link from "next/link";
import { notFound } from "next/navigation";

import { AdCard } from "@/components/public/AdCard";
import { Badge } from "@/components/ui/badge";
import { getJobBySlug } from "@/lib/api-public";

const categoryLabelMap = {
  ngo: "NGO",
  "white-collar": "White Collar",
  "blue-collar": "Blue Collar",
};

function formatRelativeTime(value?: string) {
  if (!value) return "Recently added";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently added";

  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

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
      <section className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_320px] lg:items-start">
        <div className="grid gap-5 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.74)] p-5 shadow-none">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categoryLabelMap[job.category]}</Badge>
            <Badge>{job.employment_type}</Badge>
            {job.source_url ? <Badge variant="secondary">Direct source</Badge> : null}
          </div>

          <div className="grid gap-3 border-b border-[rgba(160,183,164,0.12)] pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <h1 className="font-serif text-[clamp(2.2rem,4vw,4rem)] font-medium leading-[0.96] tracking-[-0.04em] text-foreground">
                  {job.title}
                </h1>
                <p className="mb-0 text-[1rem] text-[#454c49]">
                  {job.company} <span className="text-[#b7b1a6]">/</span> {job.location}
                </p>
              </div>
              <span className="pt-1 text-[0.76rem] uppercase tracking-[0.12em] text-[#8a928d]">
                {formatRelativeTime(job.created_at)}
              </span>
            </div>
            <p className="mb-0 max-w-[68ch] text-[0.98rem] leading-7 text-[#727975]">
              {job.description_mm ||
                job.description_en ||
                "Detailed job content will appear here once connected to Django."}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-3">
              <div className="text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693]">
                Description
              </div>
              <div className="grid gap-3 text-sm leading-7 text-[#5e6662]">
                <p className="mb-0">
                  Review the source posting carefully and confirm responsibilities,
                  eligibility, and application steps before applying.
                </p>
                <p className="mb-0">
                  Dear Career lists the role in a cleaner format so you can scan
                  the essentials first, then move to the original source for final
                  verification.
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-[rgba(160,183,164,0.14)] bg-[rgba(247,243,236,0.62)] p-4">
              <div className="text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693]">
                Quick facts
              </div>
              <div className="grid gap-2 text-sm leading-6 text-[#454c49]">
                <div>
                  <span className="text-[#8a928d]">Type:</span> {job.employment_type}
                </div>
                <div>
                  <span className="text-[#8a928d]">Location:</span> {job.location}
                </div>
                <div>
                  <span className="text-[#8a928d]">Category:</span> {categoryLabelMap[job.category]}
                </div>
                {job.salary ? (
                  <div>
                    <span className="text-[#8a928d]">Salary:</span> {job.salary}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(160,183,164,0.12)] pt-5">
            {job.source_url ? (
              <a
                href={job.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-[rgba(160,183,164,0.18)] bg-[rgba(160,183,164,0.08)] px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[rgba(160,183,164,0.14)]"
              >
                Open original source
              </a>
            ) : null}
            <Link
              href="/jobs"
              className="inline-flex items-center rounded-full border border-[rgba(160,183,164,0.14)] px-5 py-2.5 text-sm text-[#5e6662] transition-colors hover:bg-[rgba(255,255,255,0.58)]"
            >
              Browse more jobs
            </Link>
          </div>
        </div>

        <aside className="grid gap-4">
          <div className="grid gap-3 rounded-[1.75rem] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.68)] p-5">
            <div className="text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693]">
              Before you apply
            </div>
            <div className="grid gap-2 text-sm leading-7 text-[#5e6662]">
              <p className="mb-0">Check employer identity and contact details.</p>
              <p className="mb-0">Confirm salary, visa, and language requirements.</p>
              <p className="mb-0">Use the original source for the final application step.</p>
            </div>
          </div>

          <AdCard
            compact
            eyebrow="Sponsored"
            title="Promote a vacancy here"
            description="A quiet sponsored slot can appear on job detail pages without overwhelming the listing."
            ctaLabel="Advertise"
            href="/feedback"
            showFooterBadges={false}
            className="rounded-[1.75rem] border border-[rgba(160,183,164,0.14)] bg-[rgba(247,243,236,0.74)] shadow-none"
            contentClassName="gap-3 p-5"
            titleClassName="text-[1rem] font-semibold leading-6 text-foreground"
            descriptionClassName="text-sm leading-6 text-[#727975]"
            ctaClassName="px-4 py-2 text-sm"
          />
        </aside>
      </section>
    </main>
  );
}
