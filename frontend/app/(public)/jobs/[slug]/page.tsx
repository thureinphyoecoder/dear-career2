import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  Instagram,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { AdCard } from "@/components/public/AdCard";
import { JobReportForm } from "@/components/public/JobReportForm";
import { RouteTransitionReset } from "@/components/public/RouteTransitionReset";
import { Badge } from "@/components/ui/badge";
import { getJobBySlug, getPublicAds } from "@/lib/api-public";
import { extractJobFacts, extractJobSummary, getJobDescription, parseJobDescription } from "@/lib/job-content";

const categoryLabelMap = {
  ngo: "NGO",
  "white-collar": "White Collar",
  "blue-collar": "Blue Collar",
};

function pickFactIcon(label: string): ReactNode {
  const normalized = label.toLowerCase();
  if (normalized.includes("location")) return <MapPin className="h-4 w-4 text-[#7a8d7f]" />;
  if (normalized.includes("salary")) return <Wallet className="h-4 w-4 text-[#7a8d7f]" />;
  if (normalized.includes("hour") || normalized.includes("date")) return <Clock3 className="h-4 w-4 text-[#7a8d7f]" />;
  if (normalized.includes("website")) return <Globe2 className="h-4 w-4 text-[#7a8d7f]" />;
  if (normalized.includes("instagram")) return <Instagram className="h-4 w-4 text-[#7a8d7f]" />;
  return <FileText className="h-4 w-4 text-[#7a8d7f]" />;
}

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
  const [job, ads] = await Promise.all([getJobBySlug(slug), getPublicAds(["jobs-detail"])]);
  const detailAd = ads.find((ad) => ad.placement === "jobs-detail");

  if (!job) {
    notFound();
  }

  const description = getJobDescription(job);
  const descriptionSections = parseJobDescription(description);
  const descriptionSummary = extractJobSummary(job, 320);
  const descriptionFacts = extractJobFacts(job);
  const displayImageUrl = job.display_image_url || job.image_file_url || job.image_url || "";

  return (
    <main className="job-detail-page mx-auto max-w-6xl px-4 pb-20 pt-28 md:pt-32">
      <RouteTransitionReset />
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.65)] px-4 py-2 text-sm text-[#6f8574] transition-colors hover:border-[rgba(160,183,164,0.28)] hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>
      <section className="job-detail-grid mt-4 grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_320px] lg:items-start">
        <div className="job-detail-main grid gap-5 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(247,243,236,0.58))] p-5 shadow-[0_24px_70px_rgba(148,166,152,0.08)]">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categoryLabelMap[job.category]}</Badge>
            <Badge>{job.employment_type}</Badge>
            {job.source_url ? <Badge variant="secondary">Direct source</Badge> : null}
          </div>

          <div className="grid gap-4 border-b border-[rgba(160,183,164,0.14)] pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <h1 className="font-serif text-[clamp(2.2rem,4vw,4rem)] font-medium leading-[0.96] tracking-[-0.04em] text-foreground">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-[0.98rem] text-[#4b5a52]">
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-[#7a8d7f]" />
                    {job.company}
                  </span>
                  <span className="text-[#b7b1a6]">/</span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-[#7a8d7f]" />
                    {job.location}
                  </span>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-[rgba(160,183,164,0.14)] bg-[rgba(255,255,255,0.78)] px-2 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-[#879089]">
                <Clock3 className="h-3.5 w-3.5" />
                {formatRelativeTime(job.created_at)}
              </div>
            </div>
            {descriptionSummary ? (
              <p className="mb-0 max-w-[68ch] rounded-2xl border border-[rgba(160,183,164,0.12)] bg-[rgba(255,255,255,0.62)] px-4 py-3 text-[0.98rem] leading-7 text-[#5f6763]">
                {descriptionSummary}
              </p>
            ) : null}
            {displayImageUrl ? (
              <div className="overflow-hidden rounded-[1.6rem] border border-[rgba(160,183,164,0.14)] bg-[rgba(247,243,236,0.46)] shadow-[0_14px_30px_rgba(132,151,138,0.12)]">
                <img
                  src={displayImageUrl}
                  alt={job.title}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-4">
              <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#7f9685]">
                <BriefcaseBusiness className="h-4 w-4" />
                Description
              </div>
              <div className="grid gap-5 text-sm leading-7 text-[#5e6662]">
                {descriptionSections.length > 0 ? (
                  descriptionSections.map((section, index) => (
                    <section key={`${section.heading || "section"}-${index}`} className="grid gap-3">
                      {section.heading ? (
                        <h2 className="m-0 inline-flex items-center gap-2 text-[0.82rem] uppercase tracking-[0.14em] text-[#4f6354]">
                          <CheckCircle2 className="h-4 w-4 text-[#7f9685]" />
                          {section.heading}
                        </h2>
                      ) : null}
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph} className="mb-0">
                          {paragraph}
                        </p>
                      ))}
                      {section.bullets.length > 0 ? (
                        <ul className="m-0 grid gap-2 pl-5">
                          {section.bullets.map((bullet) => (
                            <li key={bullet}>{bullet.replace(/^- /, "")}</li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))
                ) : null}
                <p className="mb-0 text-[#727975]">
                  Review the source posting carefully and confirm responsibilities,
                  eligibility, and application steps before applying.
                </p>
                <p className="mb-0 text-[#727975]">
                  Dear Career restructures the posting for readability, but the original
                  source should still be treated as the final reference.
                </p>
              </div>
            </div>

            <div className="job-detail-facts grid gap-3 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-[linear-gradient(155deg,rgba(247,243,236,0.78),rgba(241,245,239,0.58))] p-4">
              <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#7f9685]">
                <ShieldCheck className="h-4 w-4" />
                Quick facts
              </div>
              <div className="grid gap-2 text-sm leading-6 text-[#454c49]">
                <div className="inline-flex items-start gap-2">
                  <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-[#7a8d7f]" />
                  <span><span className="text-[#8a928d]">Type:</span> {job.employment_type}</span>
                </div>
                <div className="inline-flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#7a8d7f]" />
                  <span><span className="text-[#8a928d]">Location:</span> {job.location}</span>
                </div>
                <div className="inline-flex items-start gap-2">
                  <FileText className="mt-0.5 h-4 w-4 text-[#7a8d7f]" />
                  <span><span className="text-[#8a928d]">Category:</span> {categoryLabelMap[job.category]}</span>
                </div>
                {job.salary ? (
                  <div className="inline-flex items-start gap-2">
                    <Wallet className="mt-0.5 h-4 w-4 text-[#7a8d7f]" />
                    <span><span className="text-[#8a928d]">Salary:</span> {job.salary}</span>
                  </div>
                ) : null}
                {descriptionFacts
                  .filter((fact) => {
                    const normalized = fact.label.toLowerCase();
                    if (normalized === "salary" && job.salary) return false;
                    if (normalized === "location") return false;
                    return true;
                  })
                  .map((fact) => (
                    <div key={`${fact.label}-${fact.value}`} className="inline-flex items-start gap-2">
                      <span className="mt-0.5">{pickFactIcon(fact.label)}</span>
                      <span><span className="text-[#8a928d]">{fact.label}:</span> {fact.value}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(160,183,164,0.12)] pt-5">
            {job.source_url ? (
              <a
                href={job.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(160,183,164,0.18)] bg-[rgba(160,183,164,0.08)] px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-[rgba(160,183,164,0.14)]"
              >
                <ExternalLink className="h-4 w-4" />
                Open original source
              </a>
            ) : null}
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(160,183,164,0.14)] px-5 py-2.5 text-sm text-[#5e6662] transition-colors hover:bg-[rgba(255,255,255,0.58)]"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Browse more jobs
            </Link>
          </div>
        </div>

        <aside className="job-detail-aside grid gap-4">
          <div className="grid gap-3 rounded-[1.75rem] border border-[rgba(160,183,164,0.16)] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(246,248,244,0.72))] p-5 shadow-[0_18px_44px_rgba(132,151,138,0.1)]">
            <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#7f9685]">
              <ShieldCheck className="h-4 w-4" />
              Before you apply
            </div>
            <div className="grid gap-2 text-sm leading-7 text-[#5e6662]">
              <p className="mb-0 inline-flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#7f9685]" />
                Check employer identity and contact details.
              </p>
              <p className="mb-0 inline-flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#7f9685]" />
                Confirm salary, visa, and language requirements.
              </p>
              <p className="mb-0 inline-flex items-start gap-2">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#7f9685]" />
                Use the original source for the final application step.
              </p>
            </div>
          </div>

          {detailAd?.title && detailAd?.description && detailAd?.href && detailAd?.cta_label ? (
            <AdCard
              compact
              eyebrow={detailAd.eyebrow || undefined}
              title={detailAd.title}
              description={detailAd.description}
              ctaLabel={detailAd.cta_label}
              href={detailAd.href}
              showFooterBadges={false}
              className="rounded-[1.75rem] border border-[rgba(160,183,164,0.14)] bg-[linear-gradient(150deg,rgba(247,243,236,0.8),rgba(237,242,236,0.72))] shadow-[0_16px_36px_rgba(132,151,138,0.08)]"
              contentClassName="gap-3 p-5"
              titleClassName="text-[1rem] font-semibold leading-6 text-foreground"
              descriptionClassName="text-sm leading-6 text-[#727975]"
              ctaClassName="px-4 py-2 text-sm"
            />
          ) : null}

          <JobReportForm jobId={job.id} />
        </aside>
      </section>
    </main>
  );
}
