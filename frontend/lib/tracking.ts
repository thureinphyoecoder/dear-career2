type ConversionType = "job_alert_subscribe" | "feedback_submit" | "advertising_request_submit";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getGoogleAdsId() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() ?? "";
}

function getConversionLabel(type: ConversionType) {
  if (type === "job_alert_subscribe") {
    return process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_JOB_ALERT?.trim() ?? "";
  }
  if (type === "feedback_submit") {
    return process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_FEEDBACK?.trim() ?? "";
  }
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL_AD_REQUEST?.trim() ?? "";
}

function gtagEvent(eventName: string, params: Record<string, unknown>) {
  if (!isBrowser() || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
}

export function trackLeadConversion(type: ConversionType) {
  gtagEvent("generate_lead", {
    event_category: "engagement",
    event_label: type,
    form_type: type,
  });

  const adsId = getGoogleAdsId();
  const label = getConversionLabel(type);

  if (!adsId || !label) return;

  gtagEvent("conversion", {
    send_to: `${adsId}/${label}`,
  });
}
