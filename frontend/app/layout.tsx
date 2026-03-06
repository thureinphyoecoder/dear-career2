import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dear Career | Curated Thailand Jobs",
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
    title: "Dear Career | Curated Thailand Jobs",
    description:
      "Discover curated NGO, white-collar, and blue-collar jobs in Thailand with clean, verified listings.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dear Career | Curated Thailand Jobs",
    description:
      "Discover curated NGO, white-collar, and blue-collar jobs in Thailand with clean, verified listings.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
