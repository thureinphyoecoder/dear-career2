import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GoogleTagScripts } from "@/components/public/GoogleTagScripts";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dear Career",
    template: "%s | Dear Career",
  },
  description:
    "Discover curated NGO, white-collar, and blue-collar jobs in Thailand with clean, verified listings.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Dear Career",
    title: "Dear Career",
    description:
      "Discover curated NGO, white-collar, and blue-collar jobs in Thailand with clean, verified listings.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dear Career",
    description:
      "Discover curated NGO, white-collar, and blue-collar jobs in Thailand with clean, verified listings.",
  },
  icons: {
    icon: "/logoflat.svg?v=20260308c",
    shortcut: "/logoflat.svg?v=20260308c",
    apple: "/logoflat.svg?v=20260308c",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <GoogleTagScripts />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
