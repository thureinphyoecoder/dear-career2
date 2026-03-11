import type { Metadata } from "next";
import Link from "next/link";

import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Dear Career website and contact forms.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/privacy"),
    title: "Privacy Policy | Dear Career",
    description: "Privacy policy for Dear Career website and contact forms.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-32">
      <header className="grid gap-3 border-b border-[rgba(160,183,164,0.2)] pb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Legal</div>
        <h1 className="m-0 font-serif text-[clamp(2rem,3.2vw,3.2rem)] leading-[0.95] tracking-[-0.03em] text-foreground">
          Privacy Policy
        </h1>
        <p className="m-0 text-sm leading-7 text-[#727975]">Last updated: March 11, 2026</p>
      </header>

      <section className="mt-8 grid gap-5 text-sm leading-7 text-[#5e6662]">
        <p className="m-0">
          Dear Career collects limited information you provide through forms such as feedback and advertising requests,
          including your name, email address, and message content.
        </p>
        <p className="m-0">
          We use this information to respond to inquiries, improve listing quality, and operate the website.
          We do not sell your personal information to third parties.
        </p>
        <p className="m-0">
          Job listings on this website may link to third-party websites. Their privacy practices are governed by their
          own policies.
        </p>
        <p className="m-0">
          If you want your submitted information deleted or corrected, contact us via the{" "}
          <Link href="/feedback" className="underline underline-offset-4 hover:text-foreground">
            feedback form
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
