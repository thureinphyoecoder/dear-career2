import type { Metadata } from "next";
import Link from "next/link";

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
    <main className="mx-auto grid max-w-4xl gap-6 px-4 pb-20 pt-32">
      <header className="grid gap-3 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.86)] p-6 sm:p-8">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Advertising</div>
        <h1 className="m-0 font-serif text-[clamp(2rem,3.2vw,3.4rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
          Advertise with Dear Career
        </h1>
        <p className="m-0 max-w-[62ch] text-sm leading-7 text-[#727975]">
          Feature your campaign in hero, search, or inline placements and reach active candidates.
        </p>
      </header>

      <section className="grid gap-4 rounded-[1.8rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(247,243,236,0.62)] p-6 sm:p-8">
        <p className="m-0 text-sm leading-7 text-[#5e6662]">
          Send your brand name, target role category, budget range, and timeline. Our team will review and respond.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/feedback" className={cn(buttonVariants(), "rounded-xl")}>
            Send advertising request
          </Link>
          <a
            href="mailto:hello@dearcareer.cc?subject=Advertising%20Inquiry"
            className={cn(buttonVariants({ variant: "secondary" }), "rounded-xl")}
          >
            Email sales
          </a>
        </div>
      </section>
    </main>
  );
}
