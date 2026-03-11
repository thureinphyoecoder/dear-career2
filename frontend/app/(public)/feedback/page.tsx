import type { Metadata } from "next";

import { FeedbackForm } from "@/components/public/FeedbackForm";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Feedback",
  description:
    "Report broken links, listing quality issues, or feature requests for Dear Career.",
  alternates: {
    canonical: "/feedback",
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/feedback"),
    title: "Dear Career Feedback",
    description:
      "Report broken links, listing quality issues, or feature requests for Dear Career.",
  },
};

export default function PublicFeedbackPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-32">
      <header className="grid gap-3 border-b border-[rgba(160,183,164,0.16)] pb-6">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Feedback</div>
        <h1 className="m-0 font-serif text-[clamp(2.4rem,4vw,4.5rem)] font-medium leading-[0.94] tracking-[-0.04em] text-foreground">
          Send critique and suggestions without leaving the site.
        </h1>
        <p className="m-0 max-w-[60ch] text-sm leading-7 text-[#727975]">
          Public layout, broken links, bad listings, and feature ideas အတွက် internal feedback form ပါ။
        </p>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-8">
        <div className="grid content-start gap-4">
          <div className="grid gap-2 rounded-[1.8rem] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.76)] p-5 sm:p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Use this for</div>
            <p className="m-0 text-sm leading-7 text-[#727975]">
              UI critique, content quality issues, duplicate jobs, source mistakes, and feature requests.
            </p>
          </div>
          <div className="grid gap-2 rounded-[1.8rem] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,247,240,0.74)] p-5 sm:p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Keep it clear</div>
            <p className="m-0 text-sm leading-7 text-[#727975]">
              Page URL, company name, and what feels broken or confusing ဆိုတာထည့်ပေးရင် review လုပ်ရတာပိုမြန်ပါတယ်။
            </p>
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.8)] p-5 sm:p-6">
          <FeedbackForm />
        </div>
      </section>
    </main>
  );
}
