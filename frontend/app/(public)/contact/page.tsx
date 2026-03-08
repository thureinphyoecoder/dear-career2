import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

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
    <main className="mx-auto grid max-w-4xl gap-8 px-4 pb-20 pt-32">
      <header className="grid gap-4 border-b border-[rgba(160,183,164,0.22)] pb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Partnership</div>
        <h1 className="m-0 font-serif text-[clamp(2rem,3.2vw,3.4rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
          Advertise With Dear Career
        </h1>
        <p className="m-0 max-w-[62ch] text-sm leading-7 text-[#727975]">
          Reach active job seekers in Thailand with featured placements that fit your hiring timeline and brand goals.
        </p>
      </header>

      <section className="grid gap-3">
        <h2 className="m-0 text-[1.08rem] font-semibold text-[#334039]">Placement Options</h2>
        <ul className="m-0 grid gap-2 pl-5 text-sm leading-7 text-[#5e6662]">
          <li>Home Hero: Premium spotlight on homepage.</li>
          <li>Jobs Inline: Native placements in jobs listing flow.</li>
          <li>Job Detail: High-intent placement on job detail pages.</li>
        </ul>
      </section>

      <section className="grid gap-4 border-t border-[rgba(160,183,164,0.22)] pt-6">
        <h2 className="m-0 text-[1.08rem] font-semibold text-[#334039]">What To Send</h2>
        <div className="grid gap-2">
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
            Contact Sales by Email (Internal Form)
          </Link>
        </div>
      </section>
    </main>
  );
}
