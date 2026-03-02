import Link from "next/link";

import { AdCard } from "@/components/public/AdCard";
import { HeroSearchForm } from "@/components/public/HeroSearchForm";
import { HeroPlants } from "@/components/public/HeroPlants";
import { JobCard } from "@/components/public/JobCard";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPublicJobs } from "@/lib/api-public";
import type { Job } from "@/lib/types";

type AdSlot = {
  id: number;
  type: "ad";
};

export default async function PublicHomePage() {
  const jobs = await getPublicJobs();
  const jobItems: Array<Job | AdSlot> = [...jobs];
  jobItems.splice(
    Math.min(3, jobItems.length),
    0,
    {
      id: -1,
      type: "ad" as const,
    },
  );

  return (
    <div className="grid h-screen snap-y snap-mandatory overflow-y-auto md:snap-proximity">
      <section className="hero-scene">
        <div className="hero-backdrop" />
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="hero-curve hero-curve-left" />
        <div className="hero-curve hero-curve-right" />
        <div className="hero-grain" />
        <HeroPlants />

        <div className="hero-content">
          <main className="hero-body mx-auto max-w-6xl">
            <div className="hero-copy grid gap-3">
              <div className="hero-eyebrow text-xs uppercase tracking-[0.16em]">
                a considered curation of roles across thailand
              </div>
              <h1 className="hero-title mb-0">
                FIND THE CAREER YOU FULLY <em>DESERVE</em>
              </h1>
            </div>

            <HeroSearchForm />

            <div className="hero-actions flex flex-wrap gap-3">
              <Link
                href="/jobs"
                className={cn(buttonVariants({ variant: "secondary" }), "hero-explore-button")}
              >
                Explore jobs
              </Link>
            </div>

            <div className="hero-card-row">
              <AdCard
                compact
                title="Seasonal hiring campaign spotlight"
                description="A premium placement for employers who want one refined, high-visibility story at the top of the page."
                ctaLabel="Book featured ad"
                href="/jobs"
              />
            </div>
          </main>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-5 pb-20">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobItems.map((item) => {
            if ("type" in item) {
              return (
                <div key="jobs-ad-slot">
                  <AdCard
                    compact
                    title="Featured employer campaign"
                    description="Mix sponsored placements into the listings feed without breaking the visual rhythm."
                    ctaLabel="See rates"
                    href="/jobs"
                  />
                </div>
              );
            }

            return (
              <div key={item.id}>
                <JobCard job={item} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
