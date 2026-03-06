"use client";

import { ArrowUp, BriefcaseBusiness, Clock3, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AdCard } from "@/components/public/AdCard";
import { JobCard } from "@/components/public/JobCard";
import type { Job, JobCategory, ManagedAd } from "@/lib/types";

const INITIAL_BATCH = 6;
const BATCH_SIZE = 6;
const LOAD_MORE_DELAY_MS = 520;

const categorySections: Array<{ key: JobCategory; title: string }> = [
  { key: "ngo", title: "NGO Jobs" },
  { key: "white-collar", title: "White Collar Jobs" },
  { key: "blue-collar", title: "Blue Collar Jobs" },
];

function JobCardLoadingSkeleton() {
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

export function JobsInfiniteResults({
  jobs,
  hasAnyJobs,
  activeCategory,
  inlineAd,
  displayQuery,
}: {
  jobs: Job[];
  hasAnyJobs: boolean;
  activeCategory?: JobCategory;
  inlineAd?: ManagedAd;
  displayQuery: string;
}) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showToTop, setShowToTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const scopedSections = useMemo(() => {
    const grouped = categorySections.map((section) => ({
      ...section,
      jobs: jobs.filter((job) => job.category === section.key),
    }));
    return activeCategory ? grouped.filter((section) => section.key === activeCategory) : grouped;
  }, [jobs, activeCategory]);

  const scopedJobs = useMemo(
    () => scopedSections.flatMap((section) => section.jobs),
    [scopedSections],
  );

  const visibleJobs = useMemo(
    () => scopedJobs.slice(0, visibleCount),
    [scopedJobs, visibleCount],
  );

  const visibleSections = useMemo(
    () =>
      scopedSections.map((section) => ({
        ...section,
        jobs: visibleJobs.filter((job) => job.category === section.key),
      })),
    [scopedSections, visibleJobs],
  );

  const hasMore = visibleCount < scopedJobs.length;

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
    setIsLoadingMore(false);
  }, [jobs, activeCategory]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + BATCH_SIZE, scopedJobs.length));
      setIsLoadingMore(false);
    }, LOAD_MORE_DELAY_MS);
  }, [hasMore, isLoadingMore, scopedJobs.length]);

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "220px 0px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  useEffect(() => {
    const onScroll = () => {
      setShowToTop(window.scrollY > 560);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!hasAnyJobs) {
    return (
      <section className="mt-10">
        <div className="grid gap-5 rounded-[1.6rem] border border-[rgba(160,183,164,0.18)] bg-[linear-gradient(150deg,rgba(255,255,255,0.92),rgba(246,248,244,0.78))] p-5 text-center shadow-[0_20px_60px_rgba(128,150,136,0.08)] sm:rounded-[1.8rem] sm:p-7">
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
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="mt-6 border-t border-[rgba(160,183,164,0.16)] pt-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">No results</div>
        <p className="mb-0 mt-2 text-sm leading-7 text-[#727975]">
          No jobs matched "{displayQuery}". Try another keyword, company, or location.
        </p>
      </div>
    );
  }

  let hasInsertedInlineAd = false;

  return (
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

                if (
                  !hasInsertedInlineAd &&
                  index === 0 &&
                  inlineAd?.title &&
                  inlineAd?.description &&
                  inlineAd?.href &&
                  inlineAd?.cta_label
                ) {
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

      <div ref={sentinelRef} className="mt-6 flex min-h-12 items-center justify-center">
        {isLoadingMore ? (
          <div className="grid w-full gap-4 pt-2 xl:grid-cols-2">
            <JobCardLoadingSkeleton />
            <JobCardLoadingSkeleton />
          </div>
        ) : hasMore ? (
          <button
            type="button"
            onClick={loadMore}
            className="inline-flex items-center rounded-full border border-[rgba(160,183,164,0.16)] px-4 py-2 text-sm text-[#5f6a64] transition-colors hover:bg-[rgba(255,255,255,0.52)]"
          >
            Load more
          </button>
        ) : (
          <span className="text-sm text-[#8a928d]">You reached the latest jobs.</span>
        )}
      </div>

      {showToTop ? (
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(116,141,122,0.32)] bg-[rgba(255,255,255,0.98)] text-[#3e5345] shadow-[0_14px_34px_rgba(120,140,126,0.24)] transition-colors hover:bg-white sm:bottom-7 sm:right-8"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      ) : null}
    </>
  );
}
