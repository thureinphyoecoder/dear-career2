import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/public/BrandLogo";

export function AdminShell({
  children,
  title = "Admin",
}: {
  children: ReactNode;
  title?: string;
}) {
  const djangoAdminUrl =
    process.env.NEXT_PUBLIC_DJANGO_ADMIN_URL ?? "http://127.0.0.1:8000/admin/";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="stack">
          <div>
            <div className="eyebrow">Dear Career</div>
            <BrandLogo compact className="admin-brand-logo" />
            <h2 style={{ marginBottom: 0, marginTop: 12 }}>{title}</h2>
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Protected frontend operations workspace. Django admin remains
            available on the backend route when you need the built-in panel.
          </p>
          <nav className="admin-nav">
            <Link className="admin-link" href="/admin">
              Dashboard
            </Link>
            <Link className="admin-link" href="/admin/jobs">
              Jobs
            </Link>
            <Link className="admin-link" href="/admin/sources">
              Sources
            </Link>
          </nav>
          <a
            className="button secondary admin-django-link"
            href={djangoAdminUrl}
            target="_blank"
            rel="noreferrer"
          >
            Django admin login
          </a>
          <form action="/api/admin/session/logout" method="post">
            <input type="hidden" name="redirect" value="/admin/login" />
            <button className="button secondary admin-django-link" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
