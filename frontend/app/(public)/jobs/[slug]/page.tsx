import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { AdCard } from "@/components/public/AdCard";
import { JobReportModalTrigger } from "@/components/public/JobReportModalTrigger";
import { RouteTransitionReset } from "@/components/public/RouteTransitionReset";
import { Badge } from "@/components/ui/badge";
import { getJobBySlug, getPublicAds } from "@/lib/api-public";
import { extractJobSummary, getJobDescription, parseJobDescription } from "@/lib/job-content";
import { absoluteUrl, truncateForMeta } from "@/lib/seo";

const categoryLabelMap: Record<string, string> = {
  ngo: "NGO",
  "white-collar": "White Collar",
  "blue-collar": "Blue Collar",
};

const fallbackDetailAd = {
  eyebrow: "Sponsored",
  title: "Promote your brand to active job seekers",
  description:
    "Run a featured placement on Dear Career and reach candidates across Thailand.",
  cta_label: "Advertise with us",
  href: "/contact",
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

function parseFactBullet(raw: string) {
  const cleaned = raw.replace(/^- /, "").trim();
  const match = cleaned.match(/^([^:]{2,40}):\s*(.+)$/);
  if (!match) return null;
  return { label: match[1].trim(), value: match[2].trim() };
}

function factIcon(label: string) {
  const key = label.toLowerCase();
  if (key.includes("location")) return MapPin;
  if (key.includes("hour") || key.includes("time")) return Clock3;
  if (key.includes("salary") || key.includes("compensation")) return Banknote;
  if (key.includes("date") || key.includes("start")) return CalendarDays;
  if (key.includes("website")) return Globe;
  if (key.includes("instagram")) return Instagram;
  return CheckCircle2;
}

function extractContactEmail(description: string, fallback?: string) {
  const fromField = (fallback || "").trim();
  if (fromField) return fromField;
  const match = description.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  return match?.[1]?.trim() || "";
}

function extractContactPhone(description: string, fallback?: string) {
  const fromField = (fallback || "").trim();
  if (fromField) return fromField;
  const match = description.match(/(\+?\d[\d\s().-]{7,}\d)/);
  return match?.[1]?.trim() || "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) {
    return {
      title: "Job not found",
      description: "This job listing is not available anymore.",
      robots: { index: false, follow: false },
    };
  }

  const summary = truncateForMeta(extractJobSummary(job, 180) || `${job.title} at ${job.company} in ${job.location}.`);
  const canonicalPath = `/jobs/${job.slug}`;
  const image = job.display_image_url || job.image_file_url || job.image_url || undefined;

  return {
    title: `${job.title} in ${job.location}`,
    description: summary,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      url: absoluteUrl(canonicalPath),
      title: `${job.title} | ${job.company}`,
      description: summary,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${job.title} | ${job.company}`,
      description: summary,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [job, ads] = await Promise.all([getJobBySlug(slug), getPublicAds(["jobs-detail"])]);
  const detailAd = ads.find((ad) => ad.placement === "jobs-detail") ?? fallbackDetailAd;

  if (!job) {
    notFound();
  }

  const description = getJobDescription(job);
  const descriptionSections = parseJobDescription(description);
  const descriptionSummary = extractJobSummary(job, 320);
  const displayImageUrl = job.display_image_url || job.image_file_url || job.image_url || "";
  const contactEmail = extractContactEmail(description, job.contact_email);
  const contactPhone = extractContactPhone(description, job.contact_phone);
  const canonicalUrl = absoluteUrl(`/jobs/${job.slug}`);
  const jobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: truncateForMeta(description, 5000),
    datePosted: job.created_at || undefined,
    validThrough: undefined,
    employmentType: job.employment_type || undefined,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: job.source_url || undefined,
      logo: displayImageUrl || undefined,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "TH",
      },
    },
    directApply: false,
    applicantLocationRequirements: {
      "@type": "Country",
      name: "Thailand",
    },
    url: canonicalUrl,
    identifier: {
      "@type": "PropertyValue",
      name: "Dear Career",
      value: String(job.id),
    },
  };

  return (
    <main className="job-detail-page mx-auto max-w-4xl px-4 pb-20 pt-28 md:pt-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />
      <RouteTransitionReset />
      <Link
        href="/jobs"
        className="inline-flex items-center gap-2 rounded-full border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.65)] px-4 py-2 text-sm text-[#6f8574] transition-colors hover:border-[rgba(160,183,164,0.28)] hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to jobs
      </Link>
      <section className="job-detail-grid mt-4 grid gap-6">
        <article className="job-detail-main grid gap-6 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[linear-gradient(160deg,rgba(255,255,255,0.9),rgba(247,243,236,0.58))] p-5 shadow-[0_24px_70px_rgba(148,166,152,0.08)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{categoryLabelMap[job.category]}</Badge>
                <Badge>{job.employment_type}</Badge>
              </div>
              <h1 className="font-serif text-[clamp(2.1rem,4vw,3.6rem)] font-medium leading-[0.98] tracking-[-0.03em] text-foreground">
                {job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-[0.95rem] text-[#4b5a52]">
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
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.2)] bg-[rgba(255,255,255,0.78)] px-3 py-1.5 text-[0.72rem] text-[#75817b]">
              <Clock3 className="h-3.5 w-3.5" />
              {formatRelativeTime(job.created_at)}
            </span>
          </div>

          {displayImageUrl ? (
            <div className="overflow-hidden rounded-[1.6rem] border border-[rgba(160,183,164,0.14)] bg-[rgba(247,243,236,0.46)] shadow-[0_14px_30px_rgba(132,151,138,0.12)]">
              <img src={displayImageUrl} alt={job.title} className="aspect-[16/9] w-full object-cover" />
            </div>
          ) : null}

          {contactEmail || contactPhone ? (
            <div className="grid gap-2 rounded-2xl border border-[rgba(160,183,164,0.16)] bg-[rgba(247,243,236,0.56)] p-4">
              <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#7f9685]">
                <CheckCircle2 className="h-4 w-4" />
                Contact
              </div>
              <div className="grid gap-2 text-[0.95rem] text-[#4f5b55]">
                {contactEmail ? (
                  <a href={`mailto:${contactEmail}`} className="inline-flex items-center gap-2 hover:text-foreground">
                    <Mail className="h-4 w-4 text-[#7a8d7f]" />
                    {contactEmail}
                  </a>
                ) : null}
                {contactPhone ? (
                  <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-2 hover:text-foreground">
                    <Phone className="h-4 w-4 text-[#7a8d7f]" />
                    {contactPhone}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 border-t border-[rgba(160,183,164,0.14)] pt-6">
            <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#7f9685]">
              <BriefcaseBusiness className="h-4 w-4" />
              Job Details
            </div>
            {descriptionSummary ? (
              <p className="m-0 text-[1rem] leading-8 text-[#4e5a54]">{descriptionSummary}</p>
            ) : null}
            <div className="grid gap-5 text-[0.98rem] leading-8 text-[#505a56]">
              {descriptionSections.length > 0 ? (
                descriptionSections.map((section, index) => {
                  const isApplySection = section.heading?.toLowerCase().includes("apply");
                  return (
                  <section key={`${section.heading || "section"}-${index}`} className="grid gap-3">
                    {section.heading ? (
                      <h2 className="m-0 inline-flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.15em] text-[#4f6354]">
                        <CheckCircle2 className="h-4 w-4 text-[#7f9685]" />
                        {section.heading}
                      </h2>
                    ) : null}
                    {section.paragraphs.map((paragraph, paragraphIndex) =>
                      isApplySection ? (
                        <p
                          key={`paragraph-${index}-${paragraphIndex}`}
                          className="m-0 rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.62)] px-3 py-2"
                        >
                          {paragraph}
                        </p>
                      ) : (
                        <p key={`paragraph-${index}-${paragraphIndex}`} className="m-0">
                          {paragraph}
                        </p>
                      ),
                    )}
                    {section.bullets.length > 0 ? (
                      section.heading?.toLowerCase() === "details" ? (
                        <div className="grid gap-2">
                          {section.bullets.map((bullet, bulletIndex) => {
                            const fact = parseFactBullet(bullet);
                            if (!fact) {
                              return (
                                <p key={`details-bullet-${index}-${bulletIndex}`} className="m-0">
                                  {bullet.replace(/^- /, "")}
                                </p>
                              );
                            }
                            const Icon = factIcon(fact.label);
                            return (
                              <div
                                key={`details-bullet-${index}-${bulletIndex}`}
                                className="inline-flex items-start gap-2 rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.62)] px-3 py-2"
                              >
                                <Icon className="mt-1 h-4 w-4 shrink-0 text-[#7a8d7f]" />
                                <span>
                                  <strong className="font-medium text-[#3f4b45]">{fact.label}:</strong>{" "}
                                  <span>{fact.value}</span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : isApplySection ? (
                        <div className="grid gap-2">
                          {section.bullets.map((bullet, bulletIndex) => (
                            <p
                              key={`apply-bullet-${index}-${bulletIndex}`}
                              className="m-0 rounded-xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.62)] px-3 py-2"
                            >
                              {bullet.replace(/^- /, "")}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <ul className="m-0 grid gap-2 pl-5">
                          {section.bullets.map((bullet, bulletIndex) => (
                            <li key={`bullet-${index}-${bulletIndex}`}>{bullet.replace(/^- /, "")}</li>
                          ))}
                        </ul>
                      )
                    ) : null}
                  </section>
                )})
              ) : (
                <p className="m-0 whitespace-pre-line">{description}</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(160,183,164,0.16)] bg-[linear-gradient(155deg,rgba(247,243,236,0.72),rgba(241,245,239,0.58))] p-4">
            <div className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#7f9685]">
              <ShieldCheck className="h-4 w-4" />
              Before you apply
            </div>
            <div className="mt-3 grid gap-2 text-sm leading-7 text-[#5e6662]">
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
                Apply with caution and verify job details before submitting.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[rgba(160,183,164,0.12)] pt-5">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(160,183,164,0.14)] px-5 py-2.5 text-sm text-[#5e6662] transition-colors hover:bg-[rgba(255,255,255,0.58)]"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Browse more jobs
            </Link>
          </div>
        </article>

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

        <JobReportModalTrigger jobId={job.id} />
      </section>
    </main>
  );
}
