import Link from "next/link";
import { BriefcaseBusiness, Clock3, Sparkles } from "lucide-react";

import { AdCard } from "@/components/public/AdCard";
import { JobsParallaxScene } from "@/components/public/JobsParallaxScene";
import { JobsSearchForm } from "@/components/public/JobsSearchForm";
import { RouteTransitionReset } from "@/components/public/RouteTransitionReset";
import { buttonVariants } from "@/components/ui/button";
import { JobCard } from "@/components/public/JobCard";
import { cn } from "@/lib/utils";
import { getPublicAds, getPublicJobs } from "@/lib/api-public";
import type { JobCategory } from "@/lib/types";

function normalizeSearchQuery(value?: string) {
  if (!value) return "";
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

const categorySections: Array<{
  key: JobCategory;
  title: string;
  description: string;
}> = [
  {
    key: "ngo",
    title: "NGO Jobs",
    description: "Development, humanitarian, education, and community roles.",
  },
  {
    key: "white-collar",
    title: "White Collar Jobs",
    description: "Office, management, operations, finance, and digital roles.",
  },
  {
    key: "blue-collar",
    title: "Blue Collar Jobs",
    description: "Field, warehouse, driver, technician, and hands-on roles.",
  },
];

const PAGE_SIZE = 6;

type PublicJobsPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: JobCategory;
    page?: string;
    from?: string;
  }>;
};

export default async function PublicJobsPage({
  searchParams,
}: PublicJobsPageProps) {
  const [jobs, ads] = await Promise.all([
    getPublicJobs(),
    getPublicAds(["jobs-search", "jobs-inline"]),
  ]);
  const searchAd = ads.find((ad) => ad.placement === "jobs-search");
  const inlineAd = ads.find((ad) => ad.placement === "jobs-inline");
  const params = (await searchParams) ?? {};
  const shouldPlayEntryScroll = params.from === "home";
  const displayQuery = normalizeSearchQuery(params.q);
  const query = displayQuery.toLowerCase();
  const requestedPage = Number(params.page ?? "1");
  const activeCategory = categorySections.some(
    (section) => section.key === params.category,
  )
    ? params.category
    : undefined;
  const filteredJobs = query
    ? jobs.filter((job) =>
        [
          job.title,
          job.company,
          job.location,
          job.category,
          job.description_en ?? "",
          job.description_mm ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : jobs;
  const hasAnyJobs = jobs.length > 0;
  const jobsByCategory = categorySections.map((section) => ({
    ...section,
    jobs: filteredJobs.filter((job) => job.category === section.key),
  }));
  const scopedSections = activeCategory
    ? jobsByCategory.filter((section) => section.key === activeCategory)
    : jobsByCategory;
  const scopedJobs = scopedSections.flatMap((section) => section.jobs);
  const totalPages = Math.max(1, Math.ceil(scopedJobs.length / PAGE_SIZE));
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1;
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedJobs = scopedJobs.slice(pageStart, pageStart + PAGE_SIZE);
  const visibleSections = scopedSections.map((section) => ({
    ...section,
    jobs: paginatedJobs.filter((job) => job.category === section.key),
  }));
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  let hasInsertedInlineAd = false;
  const createJobsHref = (overrides: {
    category?: JobCategory | null;
    page?: number;
  }) => {
    const resolvedCategory =
      "category" in overrides ? overrides.category : activeCategory;
    const resolvedPage = overrides.page ?? currentPage;

    return {
      pathname: "/jobs",
      query: {
        ...(displayQuery ? { q: displayQuery } : {}),
        ...(resolvedCategory ? { category: resolvedCategory } : {}),
        ...(resolvedPage > 1 ? { page: String(resolvedPage) } : {}),
      },
    };
  };

  return (
    <JobsParallaxScene fromHome={shouldPlayEntryScroll}>
      <main
        className={cn(
          "jobs-page mx-auto max-w-6xl px-4 pb-20 pt-32",
          shouldPlayEntryScroll ? "jobs-page-scroll-enter" : "",
        )}
      >
        <RouteTransitionReset />
        {searchAd?.title && searchAd?.href ? (
          <div className="mb-4 flex justify-center">
            <a
              href={searchAd.href}
              className="jobs-advertise-pill inline-flex items-center rounded-full border border-[rgba(160,183,164,0.18)] bg-[rgba(247,243,236,0.82)] px-4 py-2 text-[0.76rem] uppercase tracking-[0.16em] text-[#6f8574] transition-colors hover:border-[rgba(160,183,164,0.3)] hover:text-foreground"
            >
              {searchAd.title}
            </a>
          </div>
        ) : null}

      <JobsSearchForm
        initialQuery={displayQuery}
        category={activeCategory}
        buttonLabel="Search"
        shellClassName="rounded-full border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.52)] p-2"
        inputClassName="h-[52px] border-0 bg-transparent pr-5 text-sm shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        buttonClassName={cn(buttonVariants({ variant: "secondary" }), "h-[52px] px-5")}
      />

      {query ? (
        <div className="mt-4 text-sm leading-7 text-[#727975]">
          Showing results for "<span className="font-medium text-foreground">{displayQuery}</span>"
        </div>
      ) : null}

        {hasAnyJobs ? (
          <div className="mt-5 flex items-center gap-3 border-b border-[rgba(160,183,164,0.12)] pb-4 text-sm">
            {jobsByCategory.map((section) => (
              <Link
                key={section.key}
                href={createJobsHref({ category: section.key, page: 1 })}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 transition-colors",
                  activeCategory === section.key
                    ? "border-[rgba(160,183,164,0.3)] bg-[rgba(160,183,164,0.08)]"
                    : "border-transparent hover:border-[rgba(160,183,164,0.14)] hover:bg-[rgba(255,255,255,0.52)]",
                )}
              >
                <span
                  className={cn(
                    "text-[0.72rem] uppercase tracking-[0.16em]",
                    activeCategory === section.key
                      ? "text-foreground"
                      : "text-[#8da693]",
                  )}
                >
                  {section.title}
                </span>
                <span
                  className={cn(
                    "inline-flex min-w-8 items-center justify-center rounded-full border px-2.5 py-1 text-[0.72rem] font-medium uppercase tracking-[0.12em]",
                    activeCategory === section.key
                      ? "border-[rgba(160,183,164,0.22)] bg-white text-[#454c49]"
                      : "border-[rgba(160,183,164,0.16)] text-[#454c49]",
                  )}
                >
                  {section.jobs.length}
                </span>
              </Link>
            ))}
            {activeCategory ? (
              <Link
                href={createJobsHref({ category: null, page: 1 })}
                className="inline-flex items-center px-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693] transition-colors hover:text-foreground"
              >
                Clear
              </Link>
            ) : null}
          </div>
        ) : null}

        {!hasAnyJobs ? (
          <section className="mt-10">
            <div className="grid gap-5 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[linear-gradient(150deg,rgba(255,255,255,0.92),rgba(246,248,244,0.78))] p-7 text-center shadow-[0_20px_60px_rgba(128,150,136,0.08)]">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(160,183,164,0.2)] bg-[rgba(247,243,236,0.7)] text-[#7f9685]">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>
              <div className="grid gap-2">
                <h2 className="m-0 text-[1.4rem] font-semibold tracking-[-0.02em] text-foreground">
                  No job posts yet
                </h2>
                <p className="mx-auto mb-0 max-w-[56ch] text-sm leading-7 text-[#65706a]">
                  We are preparing new opportunities. Please check back soon for the latest listings.
                </p>
              </div>
              <div className="mx-auto flex flex-wrap items-center justify-center gap-2 text-[0.74rem] uppercase tracking-[0.14em] text-[#819486]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.18)] bg-white px-3 py-1.5">
                  <Clock3 className="h-3.5 w-3.5" />
                  Updated daily
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.18)] bg-white px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Quality checked
                </span>
              </div>
            </div>
          </section>
        ) : (
          <>
            {visibleSections.map((section) =>
              section.jobs.length > 0 ? (
                <section key={section.key} className="mt-10 grid gap-5">
                  <div className="grid gap-4 xl:grid-cols-2">
                    {section.jobs.flatMap((job, index) => {
                      const items = [
                        <div key={job.id}>
                          <JobCard job={job} />
                        </div>,
                      ];

                      if (!hasInsertedInlineAd && index === 0 && inlineAd?.title && inlineAd?.description && inlineAd?.href && inlineAd?.cta_label) {
                        hasInsertedInlineAd = true;
                        items.push(
                          <div key={`inline-ad-${section.key}`}>
                            <AdCard
                              compact
                              eyebrow={inlineAd.eyebrow || undefined}
                              title={inlineAd.title}
                              description={inlineAd.description}
                              ctaLabel={inlineAd.cta_label}
                              href={inlineAd.href}
                              showHeaderBadges={false}
                              showFooterBadges={false}
                              className="h-full rounded-[1.5rem] border border-[rgba(160,183,164,0.14)] bg-[rgba(247,243,236,0.72)] shadow-none"
                              contentClassName="gap-3 p-5"
                              titleClassName="text-[1rem] font-semibold leading-6 text-foreground"
                              descriptionClassName="text-sm leading-6 text-[#727975]"
                              ctaClassName="px-4 py-2 text-sm"
                            />
                          </div>,
                        );
                      }

                      return items;
                    })}
                  </div>
                </section>
              ) : null,
            )}
          </>
        )}
      {hasAnyJobs && filteredJobs.length === 0 ? (
        <div className="mt-6 border-t border-[rgba(160,183,164,0.16)] pt-6">
          <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">No results</div>
          <p className="mb-0 mt-2 text-sm leading-7 text-[#727975]">
            No jobs matched "{displayQuery}". Try another keyword, company, or
            location.
          </p>
        </div>
      ) : null}

      {hasAnyJobs && filteredJobs.length > 0 && totalPages > 1 ? (
        <nav className="mt-10 flex items-center justify-between gap-4 border-t border-[rgba(160,183,164,0.12)] pt-6">
          <Link
            href={createJobsHref({ page: Math.max(1, currentPage - 1) })}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors",
              currentPage === 1
                ? "pointer-events-none border-[rgba(160,183,164,0.1)] text-[#b4bbb6]"
                : "border-[rgba(160,183,164,0.18)] text-foreground hover:bg-[rgba(255,255,255,0.52)]",
            )}
          >
            Previous
          </Link>
          <div className="flex items-center gap-2">
            {pageNumbers.map((pageNumber) => (
              <Link
                key={pageNumber}
                href={createJobsHref({ page: pageNumber })}
                className={cn(
                  "inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm transition-colors",
                  pageNumber === currentPage
                    ? "border-[rgba(160,183,164,0.3)] bg-[rgba(160,183,164,0.08)] text-foreground"
                    : "border-[rgba(160,183,164,0.14)] text-[#727975] hover:bg-[rgba(255,255,255,0.52)]",
                )}
              >
                {pageNumber}
              </Link>
            ))}
          </div>
          <Link
            href={createJobsHref({ page: Math.min(totalPages, currentPage + 1) })}
            className={cn(
              "inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors",
              currentPage === totalPages
                ? "pointer-events-none border-[rgba(160,183,164,0.1)] text-[#b4bbb6]"
                : "border-[rgba(160,183,164,0.18)] text-foreground hover:bg-[rgba(255,255,255,0.52)]",
            )}
          >
            Next
          </Link>
        </nav>
      ) : null}
      </main>
    </JobsParallaxScene>
  );
}
