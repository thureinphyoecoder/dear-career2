import Link from "next/link";

import { getAdminDashboardSnapshot } from "@/lib/api-admin";

export default async function AdminDashboardPage() {
  const snapshot = await getAdminDashboardSnapshot();

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div className="stack">
          <div className="eyebrow">Operations overview</div>
          <h1 className="admin-page-title">Editorial control room</h1>
          <p className="admin-page-copy">
            Review what is live, control fetch cadence, manage approval queues, and keep website publishing disciplined.
          </p>
        </div>
        <div className="admin-header-actions">
          <Link href="/admin/sources" className="button secondary">
            Fetch settings
          </Link>
          <Link href="/admin/jobs/new" className="button">
            New job
          </Link>
        </div>
      </header>

      <section className="admin-metric-grid">
        <article className="admin-metric-card">
          <span className="admin-metric-label">Total roles</span>
          <strong className="admin-metric-value">{snapshot.total_jobs}</strong>
          <span className="admin-metric-meta">{snapshot.published_jobs} live on site</span>
        </article>
        <article className="admin-metric-card">
          <span className="admin-metric-label">Sources</span>
          <strong className="admin-metric-value">{snapshot.source_count}</strong>
          <span className="admin-metric-meta">
            {snapshot.sources.filter((source) => source.requires_manual_url).length} manual URL sources
          </span>
        </article>
        <article className="admin-metric-card">
          <span className="admin-metric-label">Pending approvals</span>
          <strong className="admin-metric-value">{snapshot.pending_approvals.length}</strong>
          <span className="admin-metric-meta">Website and Facebook actions waiting</span>
        </article>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-panel-emphasis">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Fetch settings</div>
              <h2 className="admin-panel-title">Acquisition controls</h2>
            </div>
            <Link href="/admin/sources" className="admin-inline-link">
              Open settings
            </Link>
          </div>
          <div className="admin-fetch-list">
            {snapshot.sources.slice(0, 3).map((source) => (
              <div key={source.id} className="admin-fetch-item">
                <span className="admin-fetch-label">{source.label}</span>
                <strong>
                  {source.requires_manual_url
                    ? "Manual URL intake"
                    : `Every ${source.cadence_value} ${source.cadence_unit}`}
                </strong>
                <p>
                  {source.requires_manual_url
                    ? "Paste the job URL, review the metadata, then send it for website approval."
                    : `Fetches from ${source.domain} with ${source.status} runtime status.`}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Realtime notifications</div>
              <h2 className="admin-panel-title">Signal centre</h2>
            </div>
          </div>
          <div className="admin-notification-list">
            {snapshot.notifications.map((item) => (
              <div key={item.id} className={`admin-notification-item is-${item.tone}`}>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel admin-panel-wide">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Approval queue</div>
              <h2 className="admin-panel-title">Website and Facebook approvals</h2>
            </div>
            <Link href="/admin/jobs" className="admin-inline-link">
              Open job CRUD
            </Link>
          </div>
          <div className="admin-activity-list">
            {snapshot.pending_approvals.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No approvals waiting. New fetched roles will appear here before website publish or Facebook upload.
              </p>
            ) : (
              snapshot.pending_approvals.map((item) => (
                <div key={item.id} className="admin-activity-item">
                  <div className="admin-activity-copy">
                    <strong>{item.title}</strong>
                    <span>
                      {item.company} · {item.source_label}
                    </span>
                  </div>
                  <div className="admin-activity-meta">
                    <span>{item.requested_action.replace("-", " ")}</span>
                    <Link href="/admin/jobs">Review</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
