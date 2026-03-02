import Link from "next/link";
import { ExternalLink, Mail, MapPin, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/public/BrandLogo";

export function PublicFooter() {
  const facebookPageUrl =
    process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? "https://facebook.com/dearcareer";

  return (
    <footer className="mt-auto px-4 pb-5 pt-12">
      <div className="w-full">
        <div className="grid w-full gap-4 rounded-[2.2rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.76)] p-5 shadow-soft backdrop-blur-xl">
          <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,0.88fr)_minmax(0,0.95fr)_minmax(0,0.92fr)] items-start gap-4">
            <section className="grid min-h-[220px] content-start gap-4 self-start p-6">
              <BrandLogo compact />
              <div className="grid gap-4">
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">
                  Curated Thailand Jobs
                </div>
                <p className="mb-0 max-w-[34rem] text-[0.98rem] leading-7 text-[#727975]">
                  <span className="font-semibold text-foreground">Thailand jobs</span> ကို
                  တစ်နေရာထဲမှာ <span className="font-serif italic text-foreground">cleaner way</span> နဲ့ကြည့်နိုင်ဖို့
                  <span className="font-semibold text-foreground"> curated links</span> နဲ့စုထားတဲ့ website ပါ။
                </p>
              </div>
            </section>

            <section className="grid min-h-[220px] content-start gap-4 self-start p-6">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Connect</div>
                <div className="mt-4 grid gap-3">
                  <a
                    className="inline-flex items-center gap-3 text-sm text-foreground transition-colors hover:text-[#8da693]"
                    href={facebookPageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)]">
                      <ExternalLink size={16} strokeWidth={1.9} />
                    </span>
                    <span className="grid gap-0.5">
                      <strong className="font-semibold">Facebook Page</strong>
                      <span className="text-[#727975]">Updates and new job drops</span>
                    </span>
                  </a>
                  <div className="inline-flex items-center gap-3 text-sm text-[#727975]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)] text-foreground">
                      <MapPin size={16} strokeWidth={1.9} />
                    </span>
                    <span className="grid gap-0.5">
                      <strong className="font-semibold text-foreground">Coverage</strong>
                      <span>Thailand</span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid min-h-[220px] content-start gap-4 self-start p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.82)] text-foreground">
                  <ShieldCheck size={18} strokeWidth={1.9} />
                </span>
                <div className="grid gap-2">
                  <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Safety</div>
                  <strong className="text-[1.02rem] text-foreground">Apply carefully</strong>
                  <p className="mb-0 text-sm leading-6 text-[#727975]">
                    <span className="font-semibold text-foreground">CV ကလွဲလို့</span> အရေးကြီးစာရွက်စာတမ်းတွေမပေးပါနဲ့။
                    <span className="font-semibold text-foreground"> Contact channels</span> ကနေလျှောက်ရင်
                    <span className="font-semibold text-foreground"> scammer</span> နဲ့
                    <span className="font-semibold text-foreground"> fake jobs</span> ကိုသတိထားပါ။
                  </p>
                </div>
              </div>
            </section>

            <section className="grid min-h-[220px] content-start gap-5 self-start p-6">
              <div className="grid gap-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Feedback</div>
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)] text-foreground">
                    <Mail size={18} strokeWidth={1.9} />
                  </div>
                  <div className="grid gap-2">
                    <strong className="text-[1.02rem] text-foreground">
                      Critique and suggestions
                    </strong>
                    <p className="mb-0 text-sm leading-6 text-[#727975]">
                      <span className="font-semibold text-foreground">Layout</span>,
                      <span className="font-semibold text-foreground"> job quality</span>,
                      <span className="font-semibold text-foreground"> broken links</span>, or
                      <span className="font-semibold text-foreground"> feature requests</span> ရှိရင်
                      site ထဲကနေတိုက်ရိုက်ပို့လို့ရပါတယ်။
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/feedback"
                className="inline-flex min-h-12 items-center justify-center self-start rounded-full border border-[#748d7a]/30 bg-gradient-to-br from-[#8da693] to-[#748d7a] px-5 py-3 text-sm font-semibold text-[#fffaf3] transition-all hover:-translate-y-0.5 hover:from-[#7d9883] hover:to-[#6d8572]"
              >
                Send feedback or report
              </Link>
            </section>
          </div>
          <div className="flex justify-center border-t border-[rgba(160,183,164,0.14)] px-2 pt-4 text-sm text-[#727975]">
            <span>
              Copyright {new Date().getFullYear()}{" "}
              <span className="font-semibold tracking-[0.04em] text-foreground">Dear Career</span>. Developed by{" "}
              <span className="font-serif text-[1.02rem] italic text-foreground">Thurein Phyoe</span>.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
