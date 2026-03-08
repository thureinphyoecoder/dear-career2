import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, BriefcaseBusiness, CalendarDays, Megaphone } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Advertise With Us",
  description: "Promote your brand on Dear Career and reach active job seekers in Thailand.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/contact"),
    title: "Advertise With Us | Dear Career",
    description: "Promote your brand on Dear Career and reach active job seekers in Thailand.",
  },
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-32">
      <header className="grid gap-4 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[linear-gradient(160deg,rgba(255,255,255,0.94),rgba(247,243,236,0.74))] p-6 sm:p-10">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Partnership</div>
        <h1 className="m-0 font-serif text-[clamp(2rem,3.2vw,3.4rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
          Advertise With Dear Career
        </h1>
        <p className="m-0 max-w-[62ch] text-sm leading-7 text-[#727975]">
          Reach active job seekers in Thailand with featured placements that fit your hiring timeline and brand goals.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.24)] bg-white/80 px-3 py-1.5 text-xs uppercase tracking-[0.13em] text-[#5f6d65]">
            <Megaphone className="h-3.5 w-3.5" />
            Sponsored spots
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(160,183,164,0.24)] bg-white/80 px-3 py-1.5 text-xs uppercase tracking-[0.13em] text-[#5f6d65]">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            Employer branding
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/88 p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-[#8da693]">Home Hero</div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Premium spotlight on the homepage for top visibility.
          </p>
        </article>
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/88 p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-[#8da693]">Jobs Inline</div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Native ad cards placed within job browsing results.
          </p>
        </article>
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/88 p-5">
          <div className="text-xs uppercase tracking-[0.14em] text-[#8da693]">Job Detail</div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Targeted placement inside job detail pages.
          </p>
        </article>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(247,243,236,0.62)] p-6 sm:p-8">
        <div className="grid gap-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8da693]">
            <CalendarDays className="h-4 w-4" />
            What to send
          </div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Brand name, target audience, preferred placement, budget range, and campaign dates.
          </p>
          <p className="m-0 inline-flex items-center gap-2 text-sm text-[#4f6354]">
            <BadgeCheck className="h-4 w-4" />
            We normally respond within 1 business day.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/feedback" className={cn(buttonVariants(), "rounded-xl px-5")}>
            Start Advertising Request
          </Link>
          <Link
            href="/feedback?subject=Advertising%20Inquiry"
            className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl px-5")}
          >
            Contact Sales by Email
          </Link>
        </div>
      </section>
    </main>
  );
}
