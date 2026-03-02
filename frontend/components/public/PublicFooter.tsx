import Link from "next/link";

import { BrandLogo } from "@/components/public/BrandLogo";

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.5 8H16.5V4.5H13.8C10.9 4.5 9 6.3 9 9.8V12H6.5V15.5H9V22H12.8V15.5H16.1L16.7 12H12.8V10.2C12.8 8.9 13.2 8 14.5 8Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21C12 21 18 14.7 18 10.2C18 6.78 15.31 4 12 4C8.69 4 6 6.78 6 10.2C6 14.7 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.2" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3L18.5 5.5V11.2C18.5 15.55 15.72 19.47 12 21C8.28 19.47 5.5 15.55 5.5 11.2V5.5L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 12.2L11.2 13.9L14.8 10.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5H20V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M5 8L12 13L19 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
                      <FacebookIcon />
                    </span>
                    <span className="grid gap-0.5">
                      <strong className="font-semibold">Facebook Page</strong>
                      <span className="text-[#727975]">Updates and new job drops</span>
                    </span>
                  </a>
                  <div className="inline-flex items-center gap-3 text-sm text-[#727975]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,247,240,0.9)] text-foreground">
                      <PinIcon />
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
                  <ShieldIcon />
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
                    <MailIcon />
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
