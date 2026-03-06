import type { Metadata } from "next";

import { AdCard } from "@/components/public/AdCard";
import { HomeExploreJobsButton } from "@/components/public/HomeExploreJobsButton";
import { HeroParallaxScene } from "@/components/public/HeroParallaxScene";
import { HeroSearchForm } from "@/components/public/HeroSearchForm";
import { HeroPlants } from "@/components/public/HeroPlants";
import { JobCard } from "@/components/public/JobCard";
import { JobsParallaxScene } from "@/components/public/JobsParallaxScene";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPublicJobs } from "@/lib/api-public";
import { absoluteUrl } from "@/lib/seo";
import type { Job } from "@/lib/types";

type AdSlot = {
  id: number;
  type: "ad";
};

export const metadata: Metadata = {
  title: "Thailand Jobs Home",
  description:
    "Explore curated Thailand job listings across NGO, white-collar, and blue-collar categories.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    title: "Dear Career | Curated Thailand Jobs",
    description:
      "Explore curated Thailand job listings across NGO, white-collar, and blue-collar categories.",
  },
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
    <div className="grid">
      <HeroParallaxScene id="home-hero-section">
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
              <HomeExploreJobsButton
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "hero-explore-button h-[62px] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.12)] px-7 text-base hover:bg-[rgba(255,255,255,0.22)]",
                )}
              >
                Explore jobs
              </HomeExploreJobsButton>
            </div>

            <div className="hero-card-row">
              <AdCard
                compact
                title="Seasonal hiring campaign spotlight"
                description="A premium placement for employers who want one refined, high-visibility story at the top of the page."
                ctaLabel="Book featured ad"
                href="/jobs"
                className="border border-[rgba(160,183,164,0.1)] bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(247,243,238,0.04))] shadow-none backdrop-blur-[1px]"
                contentClassName="gap-2 p-4"
                titleClassName="text-[1.18rem] leading-[1.05]"
                descriptionClassName="text-[0.82rem] leading-5"
                ctaClassName="h-9 px-4 py-0 text-xs"
              />
            </div>
          </main>
        </div>
      </HeroParallaxScene>

      <JobsParallaxScene fromHome>
        <section id="home-jobs-section" className="mx-auto max-w-6xl px-4 py-5 pb-20">
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
      </JobsParallaxScene>
    </div>
  );
}
