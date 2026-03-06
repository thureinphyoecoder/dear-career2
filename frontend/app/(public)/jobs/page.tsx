import Link from "next/link";
 
import { JobsInfiniteResults } from "@/components/public/JobsInfiniteResults";

import { JobsParallaxScene } from "@/components/public/JobsParallaxScene";
import { JobsSearchForm } from "@/components/public/JobsSearchForm";
import { RouteTransitionReset } from "@/components/public/RouteTransitionReset";
import { buttonVariants } from "@/components/ui/button";
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

type PublicJobsPageProps = {
  searchParams?: Promise<{
    q?: string;
    category?: JobCategory;
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
  const createJobsHref = (overrides: {
    category?: JobCategory | null;
  }) => {
    const resolvedCategory =
      "category" in overrides ? overrides.category : activeCategory;

    return {
      pathname: "/jobs",
      query: {
        ...(displayQuery ? { q: displayQuery } : {}),
        ...(resolvedCategory ? { category: resolvedCategory } : {}),
      },
    };
  };

  return (
    <JobsParallaxScene fromHome={shouldPlayEntryScroll}>
      <main
        className={cn(
          "jobs-page mx-auto max-w-6xl px-3 pb-16 pt-24 sm:px-4 sm:pb-20 sm:pt-32",
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
          shellClassName="rounded-2xl border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.52)] p-2 sm:rounded-full"
          inputClassName="h-[50px] border-0 bg-transparent pr-3 text-sm shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-[52px] sm:pr-5"
          buttonClassName={cn(buttonVariants({ variant: "secondary" }), "h-[50px] px-4 sm:h-[52px] sm:px-5")}
        />

      {query ? (
        <div className="mt-4 text-sm leading-7 text-[#727975]">
          Showing results for "<span className="font-medium text-foreground">{displayQuery}</span>"
        </div>
      ) : null}

        {hasAnyJobs ? (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-[rgba(160,183,164,0.12)] pb-4 text-sm sm:gap-3">
            {jobsByCategory.map((section) => (
              <Link
                key={section.key}
                href={createJobsHref({ category: section.key })}
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
                href={createJobsHref({ category: null })}
                className="inline-flex items-center px-2 text-[0.72rem] uppercase tracking-[0.16em] text-[#8da693] transition-colors hover:text-foreground"
              >
                Clear
              </Link>
            ) : null}
          </div>
        ) : null}

        <JobsInfiniteResults
          jobs={filteredJobs}
          hasAnyJobs={hasAnyJobs}
          activeCategory={activeCategory}
          inlineAd={inlineAd}
          displayQuery={displayQuery}
        />
      </main>
    </JobsParallaxScene>
  );
}
