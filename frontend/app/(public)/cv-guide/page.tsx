import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, LayoutTemplate, PenSquare } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "CV Guide",
  description: "Professional CV design and CV writing guide for jobs in Thailand.",
  alternates: {
    canonical: "/cv-guide",
  },
  openGraph: {
    type: "article",
    url: absoluteUrl("/cv-guide"),
    title: "CV Guide | Dear Career",
    description: "Professional CV design and CV writing guide for jobs in Thailand.",
  },
};

export default function CvGuidePage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 pt-32">
      <header className="grid gap-3 rounded-[2rem] border border-[rgba(160,183,164,0.18)] bg-[linear-gradient(160deg,rgba(255,255,255,0.94),rgba(247,243,236,0.72))] p-6 sm:p-10">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Career Toolkit</div>
        <h1 className="m-0 font-serif text-[clamp(2rem,3.2vw,3.5rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
          CV Guide: Design Better, Write Clearer
        </h1>
        <p className="m-0 max-w-[70ch] text-sm leading-7 text-[#727975]">
          Use this guide to build a clean CV that recruiters can scan quickly and trust.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/90 p-5">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8da693]">
            <LayoutTemplate className="h-4 w-4" />
            CV Design
          </div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Keep one page, clear spacing, and strong section hierarchy.
          </p>
        </article>
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/90 p-5">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8da693]">
            <PenSquare className="h-4 w-4" />
            CV Writing
          </div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Write action-driven bullets with measurable impact.
          </p>
        </article>
        <article className="grid gap-2 rounded-[1.5rem] border border-[rgba(160,183,164,0.16)] bg-white/90 p-5">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#8da693]">
            <FileText className="h-4 w-4" />
            Final Check
          </div>
          <p className="m-0 text-sm leading-7 text-[#5e6662]">
            Match job keywords, remove errors, and export as PDF.
          </p>
        </article>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.86)] p-6 sm:p-8">
        <h2 className="m-0 text-[1.2rem] font-semibold text-[#334039]">CV Design Guidelines</h2>
        <div className="grid gap-2 text-sm leading-7 text-[#5e6662]">
          <p className="m-0 inline-flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Use a clean font and keep font size between 10.5 to 12.</p>
          <p className="m-0 inline-flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Use clear section headers: Summary, Experience, Education, Skills.</p>
          <p className="m-0 inline-flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Leave enough white space; avoid crowded blocks.</p>
          <p className="m-0 inline-flex items-start gap-2"><CheckCircle2 className="mt-1 h-4 w-4 text-[#7f9685]" />Avoid colorful backgrounds, heavy icons, and profile bars.</p>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(247,243,236,0.64)] p-6 sm:p-8">
        <h2 className="m-0 text-[1.2rem] font-semibold text-[#334039]">How To Write A Strong CV</h2>
        <div className="grid gap-2 text-sm leading-7 text-[#5e6662]">
          <p className="m-0">1. Start with a 2-3 line professional summary tailored to your target role.</p>
          <p className="m-0">2. For each job experience, describe what you achieved, not only what you did.</p>
          <p className="m-0">3. Use numbers when possible: team size, growth %, revenue, users, projects.</p>
          <p className="m-0">4. Keep skills relevant to the role and job description keywords.</p>
          <p className="m-0">5. Proofread for spelling, grammar, and consistent date format.</p>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.88)] p-6">
        <Link href="/jobs" className={cn(buttonVariants(), "rounded-xl px-5")}>
          Browse Jobs
        </Link>
        <Link href="/feedback" className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl px-5")}>
          Request CV Review Feature
        </Link>
      </section>
    </main>
  );
}
