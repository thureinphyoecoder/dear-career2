export default function AdminLoading() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-stack">
          <div className="admin-brand-block">
            <div className="eyebrow">Dear Career</div>
            <h1 className="admin-sidebar-title">Loading workspace</h1>
            <p className="admin-sidebar-copy">Preparing dashboard data.</p>
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-dashboard">
          <header className="admin-page-header">
            <div className="stack">
              <div className="eyebrow">Admin</div>
              <h1 className="admin-page-title">Loading dashboard</h1>
            </div>
          </header>
          <section className="admin-metric-grid">
            <article className="admin-metric-card admin-skeleton-block" />
            <article className="admin-metric-card admin-skeleton-block" />
            <article className="admin-metric-card admin-skeleton-block" />
          </section>
        </div>
      </main>
    </div>
  );
}
