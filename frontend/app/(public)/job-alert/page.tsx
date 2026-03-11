import type { Metadata } from "next";

import { JobAlertSubscribeForm } from "@/components/public/JobAlertSubscribeForm";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Job Alert",
  description: "Subscribe with email and get new matching jobs from Dear Career.",
  alternates: {
    canonical: "/job-alert",
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/job-alert"),
    title: "Job Alert | Dear Career",
    description: "Subscribe with email and get new matching jobs from Dear Career.",
  },
};

export default function JobAlertPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-5 px-4 pb-20 pt-32">
      <section className="grid gap-5 rounded-[1.5rem] border border-[rgba(160,183,164,0.2)] bg-white p-6">
        <p className="m-0 text-xs uppercase tracking-[0.16em] text-[#8da693]">Job Alert</p>
        <h1 className="m-0 font-serif text-[clamp(1.8rem,3.4vw,2.8rem)] leading-[1.02] tracking-[-0.02em] text-[#334039]">
          Get new jobs by email
        </h1>
        <p className="m-0 text-sm leading-7 text-[#5f6b64]">
          Email တစ်ခုထည့်ပြီး subscribe လုပ်ထားပါ။ Job alert အသစ်ရှိတိုင်း Gmail inbox ကိုတိုက်ရိုက်ပို့ပေးမယ်။
        </p>
        <JobAlertSubscribeForm source="job-alert-page" />
      </section>
    </main>
  );
}
