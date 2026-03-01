import Link from "next/link";

import { getAdminDashboardSnapshot } from "@/lib/api-admin";

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();
  const nextManualSource = snapshot.sources.find((source) => source.requires_manual_url);
  const healthySources = snapshot.sources.filter((source) => source.status === "healthy").length;
  const latestNotification = snapshot.notifications[0];

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div className="stack">
          <div className="eyebrow">Admin dashboard</div>
          <h1 className="admin-page-title">Operations</h1>
          <p className="admin-page-copy">
            Review intake, approve listings, and manage source cadence.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/jobs/new" className="button">
            New job
          </Link>
          <Link href="/admin/sources" className="button secondary">
            Fetch settings
          </Link>
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric-card">
          <span className="admin-metric-label">Live jobs</span>
          <strong className="admin-metric-value">{snapshot.published_jobs}</strong>
          <span className="admin-metric-meta">{snapshot.total_jobs} total listings</span>
        </article>
        <article className="admin-metric-card">
          <span className="admin-metric-label">Pending review</span>
          <strong className="admin-metric-value">{snapshot.pending_approvals.length}</strong>
          <span className="admin-metric-meta">Website and Facebook queue</span>
        </article>
        <article className="admin-metric-card">
          <span className="admin-metric-label">Healthy sources</span>
          <strong className="admin-metric-value">{healthySources}</strong>
          <span className="admin-metric-meta">{snapshot.sources.length} configured sources</span>
        </article>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Review queue</div>
              <h2 className="admin-panel-title">Pending approvals</h2>
            </div>
            <Link href="/admin/jobs" className="admin-inline-link">
              Open jobs
            </Link>
          </div>
          <div className="admin-list-shell">
            {snapshot.pending_approvals.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No approvals waiting.
              </p>
            ) : (
              snapshot.pending_approvals.map((item) => (
                <div key={item.id} className="admin-list-item">
                  <div className="admin-list-copy">
                    <strong>{item.title}</strong>
                    <span>
                      {item.company} · {item.source_label}
                    </span>
                  </div>
                  <div className="admin-list-meta">
                    <span>{item.requested_action.replace("-", " ")}</span>
                    <Link href="/admin/jobs">Review</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Fetch</div>
              <h2 className="admin-panel-title">Source status</h2>
            </div>
            <Link href="/admin/sources" className="admin-inline-link">
              Configure
            </Link>
          </div>
          <div className="admin-list-shell">
            {snapshot.sources.slice(0, 4).map((source) => (
              <div key={source.id} className="admin-list-item">
                <div className="admin-list-copy">
                  <strong>{source.label}</strong>
                  <span>
                    {source.requires_manual_url
                      ? "Manual URL intake"
                      : `Every ${source.cadence_value} ${source.cadence_unit}`}
                  </span>
                </div>
                <div className="admin-list-meta">
                  <span className={`admin-source-status is-${source.status}`}>{source.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-strip-grid">
        <article className="admin-strip-card">
          <span className="admin-metric-label">Manual intake</span>
          <strong>{nextManualSource ? nextManualSource.label : "No manual source"}</strong>
          <p>
            {nextManualSource
              ? "Use fetch settings when a site needs a pasted job URL."
              : "All current sources are crawler-based."}
          </p>
        </article>
        <article className="admin-strip-card">
          <span className="admin-metric-label">Latest signal</span>
          <strong>{latestNotification?.title ?? "No signal"}</strong>
          <p>{latestNotification?.detail ?? "No recent activity."}</p>
        </article>
      </section>
    </div>
  );
}
