import Script from "next/script";

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";

const PRIMARY_TAG_ID = GA4_MEASUREMENT_ID || GOOGLE_ADS_ID;

export function GoogleTagScripts() {
  if (!PRIMARY_TAG_ID) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${PRIMARY_TAG_ID}`} strategy="afterInteractive" />
      <Script id="google-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${GA4_MEASUREMENT_ID ? `gtag('config', '${GA4_MEASUREMENT_ID}');` : ""}
          ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
        `}
      </Script>
    </>
  );
}
