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

export function PublicFooter() {
  const facebookPageUrl =
    process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL ?? "https://facebook.com/dearcareer";

  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-bar">
          <div className="public-footer-brand">
            <BrandLogo compact />
            <p className="public-footer-copy">
              Thailand jobs ကို တစ်နေရာထဲမှာ cleaner way နဲ့ကြည့်နိုင်ဖို့
              curated links နဲ့စုထားတဲ့ website ပါ။
            </p>
          </div>

          <div className="public-footer-columns">
            <section className="public-footer-note">
              <div className="eyebrow">Connect</div>
              <a
                className="public-footer-link"
                href={facebookPageUrl}
                target="_blank"
                rel="noreferrer"
              >
                <FacebookIcon />
                <span>Facebook Page</span>
              </a>
              <div className="public-footer-link public-footer-link-static">
                <PinIcon />
                <span>Thailand</span>
              </div>
            </section>

            <section className="public-footer-note public-footer-warning">
              <div className="public-footer-warning-head">
                <span className="public-footer-warning-icon">
                  <ShieldIcon />
                </span>
                <div>
                  <div className="eyebrow">Safety</div>
                  <strong className="public-footer-warning-title">Apply carefully</strong>
                </div>
              </div>
              <p className="public-footer-copy">
                CV ကလွဲလို့ အရေးကြီးစာရွက်စာတမ်းတွေမပေးပါနဲ့။ Contact
                channels ကနေလျှောက်ရင် scammer နဲ့ fake jobs ကိုသတိထားပါ။
              </p>
            </section>
          </div>
        </div>

        <div className="public-footer-bottom">
          <span>Dear Career</span>
          <span>Curated jobs for Thailand</span>
        </div>
      </div>
    </footer>
  );
}
