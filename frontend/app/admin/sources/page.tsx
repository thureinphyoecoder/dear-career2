export default function AdminSourcesPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Sources</div>
        <h1 style={{ marginBottom: 0 }}>Ingestion sources</h1>
      </div>
      <section className="card card-pad stack">
        <div className="toolbar">
          <strong>JobThai</strong>
          <span className="pill">Connected</span>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Use this page to manage scraper credentials, schedules, and sync
          status once the backend services are connected.
        </p>
      </section>
    </div>
  );
}
