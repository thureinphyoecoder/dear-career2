import Link from "next/link";
import { ExternalLink, Mail, MapPin, Megaphone, ShieldCheck } from "lucide-react";

import { BrandLogo } from "@/components/public/BrandLogo";

export function PublicFooter() {
  const facebookPageUrl =
    process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? "https://facebook.com/dearcareer";

  return (
    <footer className="mt-auto w-full border-t border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.82)] px-3 pb-4 pt-10 sm:px-4 sm:pb-5 sm:pt-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid w-full gap-4 sm:p-2 lg:p-3">
          <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2 lg:gap-3 xl:grid-cols-4">
            <section className="grid content-start gap-4 self-start p-2.5 sm:p-4 lg:p-5">
              <BrandLogo compact />
              <div className="grid gap-4">
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">
                  Curated Thailand Jobs
                </div>
                <p className="mb-0 max-w-[34rem] break-words text-[0.92rem] leading-6 text-[#727975] sm:text-[0.98rem] sm:leading-7">
                  <span className="font-semibold text-foreground">Thailand jobs</span> ကို
                  တစ်နေရာထဲမှာ <span className="font-serif italic text-foreground">သန့်ရှင်းလွယ်ကူတဲ့ပုံစံ</span> နဲ့ကြည့်နိုင်ဖို့
                  <span className="font-semibold text-foreground"> curated links</span> နဲ့စုထားတဲ့ website ပါ။
                </p>
              </div>
            </section>

            <section className="grid content-start gap-4 self-start p-2.5 sm:p-4 lg:p-5">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Connect</div>
                <div className="mt-4 grid gap-3">
                  <Link
                    href="/contact"
                    className="inline-flex min-w-0 items-start gap-3 text-sm text-foreground transition-colors hover:text-[#8da693]"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)]">
                      <Megaphone size={16} strokeWidth={1.9} />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <strong className="font-semibold">Advertise with us</strong>
                      <span className="break-words leading-5 text-[#727975]">Promote your brand on Dear Career</span>
                    </span>
                  </Link>
                  <a
                    className="inline-flex min-w-0 items-start gap-3 text-sm text-foreground transition-colors hover:text-[#8da693]"
                    href={facebookPageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)]">
                      <ExternalLink size={16} strokeWidth={1.9} />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <strong className="font-semibold">Facebook Page</strong>
                      <span className="break-words leading-5 text-[#727975]">Updates and new job drops</span>
                    </span>
                  </a>
                  <div className="inline-flex min-w-0 items-start gap-3 text-sm text-[#727975]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)] text-foreground">
                      <MapPin size={16} strokeWidth={1.9} />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <strong className="font-semibold text-foreground">Coverage</strong>
                      <span>Thailand</span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid content-start gap-4 self-start p-2.5 sm:p-4 lg:p-5">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,255,255,0.82)] text-foreground">
                  <ShieldCheck size={18} strokeWidth={1.9} />
                </span>
                <div className="grid min-w-0 gap-2">
                  <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Safety</div>
                  <strong className="text-[1.02rem] text-foreground">Apply carefully</strong>
                  <p className="mb-0 break-words text-sm leading-6 text-[#727975]">
                    <span className="font-semibold text-foreground">CV ကလွဲလို့</span> အရေးကြီးစာရွက်စာတမ်းတွေမပေးပါနဲ့။
                    <span className="font-semibold text-foreground"> Contact channels</span> ကနေလျှောက်ရင်
                    <span className="font-semibold text-foreground"> scammer</span> နဲ့
                    <span className="font-semibold text-foreground"> fake jobs</span> ကိုသတိထားပါ။
                  </p>
                </div>
              </div>
            </section>

            <section className="grid content-start gap-5 self-start p-2.5 sm:p-4 lg:p-5">
              <div className="grid gap-3">
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Feedback</div>
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)] text-foreground">
                    <Mail size={18} strokeWidth={1.9} />
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <strong className="text-[1.02rem] text-foreground">
                      Critique and suggestions
                    </strong>
                    <p className="mb-0 break-words text-sm leading-6 text-[#727975]">
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
                className="inline-flex min-h-12 w-full items-center justify-center self-start rounded-full border border-[#748d7a]/30 bg-gradient-to-br from-[#8da693] to-[#748d7a] px-5 py-3 text-sm font-semibold text-[#fffaf3] transition-all hover:-translate-y-0.5 hover:from-[#7d9883] hover:to-[#6d8572] sm:w-auto"
              >
                Send feedback
              </Link>
            </section>
          </div>
          <div className="flex justify-center border-t border-[rgba(160,183,164,0.14)] px-1 pt-4 text-center text-xs text-[#727975] sm:px-2 sm:text-sm">
            <span className="leading-6">
              Copyright {new Date().getFullYear()}{" "}
              <span className="font-semibold tracking-[0.04em] text-foreground">Dear Career</span>. Developed by{" "}
              <a
                href="https://thureinphyo.com"
                target="_blank"
                rel="noreferrer"
                className="font-serif text-[1.02rem] italic text-foreground underline-offset-4 transition-colors hover:text-[#6f8574] hover:underline"
              >
                Thurein Phyoe
              </a>
              .{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
                Privacy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
                Terms
              </Link>
              .
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
