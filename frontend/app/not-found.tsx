import Link from "next/link";

import { BrandLogo } from "@/components/public/BrandLogo";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <BrandLogo compact className="not-found-logo" />
        <div className="eyebrow">Error 404</div>
        <h1 className="not-found-title">This page could not be found.</h1>
        <p className="not-found-copy">
          The link may be outdated, removed, or typed incorrectly.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="button">
            Back home
          </Link>
          <Link href="/jobs" className="button secondary">
            Browse jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
