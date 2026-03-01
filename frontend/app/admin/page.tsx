import Link from "next/link";

import { getAdminJobs } from "@/lib/api-admin";

export default async function AdminDashboardPage() {
  const jobs = await getAdminJobs();
  const publishedJobs = jobs.filter((job) => job.is_active !== false).length;
  const draftJobs = Math.max(jobs.length - publishedJobs, 0);
  const sourceCount = new Set(jobs.map((job) => job.source).filter(Boolean)).size;
  const manualSourceCount = jobs.filter((job) => job.source === "manual").length;
  const ngoCount = jobs.filter((job) => job.category === "ngo").length;
  const whiteCollarCount = jobs.filter((job) => job.category === "white-collar").length;
  const blueCollarCount = jobs.filter((job) => job.category === "blue-collar").length;
  const recentJobs = [...jobs]
    .sort((left, right) => {
      const leftTime = new Date(left.updated_at ?? left.created_at ?? 0).getTime();
      const rightTime = new Date(right.updated_at ?? right.created_at ?? 0).getTime();
      return rightTime - leftTime;
    })
    .slice(0, 5);

  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div className="stack">
          <div className="eyebrow">Operations overview</div>
          <h1 className="admin-page-title">Editorial control room</h1>
          <p className="admin-page-copy">
            Review what is live, control source intake, and keep fetch behaviour explicit.
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
          <strong className="admin-metric-value">{jobs.length}</strong>
          <span className="admin-metric-meta">{publishedJobs} live on site</span>
        </article>
        <article className="admin-metric-card">
          <span className="admin-metric-label">Sources</span>
          <strong className="admin-metric-value">{sourceCount}</strong>
          <span className="admin-metric-meta">{manualSourceCount} manual entries</span>
        </article>
        <article className="admin-metric-card">
          <span className="admin-metric-label">In review</span>
          <strong className="admin-metric-value">{draftJobs}</strong>
          <span className="admin-metric-meta">Awaiting editorial pass</span>
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
            <div className="admin-fetch-item">
              <span className="admin-fetch-label">Primary mode</span>
              <strong>Manual URL intake</strong>
              <p>Paste source links from LinkedIn or direct employer pages for controlled review.</p>
            </div>
            <div className="admin-fetch-item">
              <span className="admin-fetch-label">Sync cadence</span>
              <strong>Twice daily</strong>
              <p>Morning and evening review windows for Thailand market updates.</p>
            </div>
            <div className="admin-fetch-item">
              <span className="admin-fetch-label">Publishing rule</span>
              <strong>Manual approval</strong>
              <p>Nothing publishes automatically without editorial confirmation.</p>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Category mix</div>
              <h2 className="admin-panel-title">Current spread</h2>
            </div>
          </div>
          <div className="admin-category-stats">
            <div className="admin-category-row">
              <span>NGO</span>
              <strong>{ngoCount}</strong>
            </div>
            <div className="admin-category-row">
              <span>White collar</span>
              <strong>{whiteCollarCount}</strong>
            </div>
            <div className="admin-category-row">
              <span>Blue collar</span>
              <strong>{blueCollarCount}</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel admin-panel-wide">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Recent jobs</div>
              <h2 className="admin-panel-title">Latest activity</h2>
            </div>
            <Link href="/admin/jobs" className="admin-inline-link">
              View all
            </Link>
          </div>
          <div className="admin-activity-list">
            {recentJobs.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>
                No jobs yet. Start by creating a listing or adding a fetch source.
              </p>
            ) : (
              recentJobs.map((job) => (
                <div key={job.id} className="admin-activity-item">
                  <div className="admin-activity-copy">
                    <strong>{job.title}</strong>
                    <span>
                      {job.company} · {job.location || "Thailand"}
                    </span>
                  </div>
                  <div className="admin-activity-meta">
                    <span>{job.category.replace("-", " ")}</span>
                    <Link href={`/admin/jobs/${job.id}`}>Open</Link>
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
