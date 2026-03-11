import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for using Dear Career.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/terms"),
    title: "Terms of Service | Dear Career",
    description: "Terms of service for using Dear Career.",
  },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-32">
      <header className="grid gap-3 border-b border-[rgba(160,183,164,0.2)] pb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Legal</div>
        <h1 className="m-0 font-serif text-[clamp(2rem,3.2vw,3.2rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
          Terms of Service
        </h1>
        <p className="m-0 text-sm leading-7 text-[#727975]">Last updated: March 11, 2026</p>
      </header>

      <section className="mt-8 grid gap-5 text-sm leading-7 text-[#5e6662]">
        <p className="m-0">
          Dear Career provides curated links and job information for convenience. We do not guarantee hiring outcomes,
          employer responses, or continuous listing availability.
        </p>
        <p className="m-0">
          You are responsible for verifying employer identity, role details, and application channels before sharing
          personal information.
        </p>
        <p className="m-0">
          You agree not to misuse this website, scrape data aggressively, disrupt service, or submit misleading
          information through any public form.
        </p>
        <p className="m-0">
          By continuing to use Dear Career, you agree to these terms and to our{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
