import Link from "next/link";

import { AdCard } from "@/components/public/AdCard";
import { HeroSearchForm } from "@/components/public/HeroSearchForm";
import { HeroPlants } from "@/components/public/HeroPlants";
import { JobCard } from "@/components/public/JobCard";
import { getPublicJobs } from "@/lib/api-public";
import type { Job } from "@/lib/types";

type AdSlot = {
  id: number;
  type: "ad";
};

export default async function PublicHomePage() {
  const jobs = await getPublicJobs();
  const jobItems: Array<Job | AdSlot> = [...jobs];
  const ngoCount = jobs.filter((job) => job.category === "ngo").length;
  const whiteCollarCount = jobs.filter((job) => job.category === "white-collar").length;
  const blueCollarCount = jobs.filter((job) => job.category === "blue-collar").length;
  jobItems.splice(
    Math.min(3, jobItems.length),
    0,
    {
      id: -1,
      type: "ad" as const,
    },
  );

  return (
    <div className="public-home">
      <section className="hero-scene">
        <div className="hero-backdrop" />
        <div className="hero-orb hero-orb-left" />
        <div className="hero-orb hero-orb-right" />
        <div className="hero-curve hero-curve-left" />
        <div className="hero-curve hero-curve-right" />
        <div className="hero-grain" />
        <HeroPlants />

        <div className="hero-content">
          <main className="hero-body">
            <div className="hero-copy stack">
              <div className="eyebrow hero-eyebrow">
                a considered curation of roles across thailand
              </div>
              <h1 className="hero-title">
                FIND THE CAREER YOU FULLY <em>DESERVE</em>
              </h1>
            </div>

            <HeroSearchForm />

            <div className="hero-actions">
              <Link href="/jobs" className="button hero-explore-button">
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

      <section className="page-shell stack public-summary">
        <div className="grid job-grid">
          {jobItems.map((item) => {
            if ("type" in item) {
              return (
                <AdCard
                  key="jobs-ad-slot"
                  compact
                  title="Featured employer campaign"
                  description="Mix sponsored placements into the listings feed without breaking the visual rhythm."
                  ctaLabel="See rates"
                  href="/jobs"
                />
              );
            }

            return <JobCard key={item.id} job={item} />;
          })}
        </div>
      </section>
    </div>
  );
}
