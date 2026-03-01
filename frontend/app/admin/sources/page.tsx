export default function AdminSourcesPage() {
  return (
    <div className="admin-dashboard">
      <header className="admin-page-header">
        <div className="stack">
          <div className="eyebrow">Fetch settings</div>
          <h1 className="admin-page-title">Source intake and sync rules</h1>
          <p className="admin-page-copy">
            Keep fetch behaviour explicit. Manual links stay first-class, while automated sources remain controlled and reviewable.
          </p>
        </div>
      </header>

      <section className="admin-dashboard-grid">
        <article className="admin-panel admin-panel-wide">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Manual intake</div>
              <h2 className="admin-panel-title">Paste source URLs</h2>
            </div>
          </div>
          <div className="admin-settings-form">
            <label className="stack">
              <span className="eyebrow">Source URL</span>
              <input
                className="field"
                placeholder="https://www.linkedin.com/jobs/view/..."
              />
            </label>
            <div className="admin-settings-grid">
              <label className="stack">
                <span className="eyebrow">Category</span>
                <select className="select" defaultValue="white-collar">
                  <option value="ngo">NGO</option>
                  <option value="white-collar">White collar</option>
                  <option value="blue-collar">Blue collar</option>
                </select>
              </label>
              <label className="stack">
                <span className="eyebrow">Review status</span>
                <select className="select" defaultValue="queued">
                  <option value="queued">Queued for review</option>
                  <option value="priority">Priority</option>
                  <option value="hold">Hold</option>
                </select>
              </label>
            </div>
            <div className="admin-settings-actions">
              <button className="button" type="button">
                Queue URL
              </button>
              <button className="button secondary" type="button">
                Test fetch
              </button>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Automation</div>
              <h2 className="admin-panel-title">Fetch policy</h2>
            </div>
          </div>
          <div className="admin-policy-list">
            <div className="admin-policy-item">
              <span className="admin-policy-label">Auto-fetch</span>
              <strong>Enabled for trusted sources only</strong>
            </div>
            <div className="admin-policy-item">
              <span className="admin-policy-label">Deduplication</span>
              <strong>Slug + source URL matching</strong>
            </div>
            <div className="admin-policy-item">
              <span className="admin-policy-label">Publishing</span>
              <strong>Manual approval required</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Schedule</div>
              <h2 className="admin-panel-title">Sync windows</h2>
            </div>
          </div>
          <div className="admin-policy-list">
            <div className="admin-policy-item">
              <span className="admin-policy-label">Morning pass</span>
              <strong>08:00 ICT</strong>
            </div>
            <div className="admin-policy-item">
              <span className="admin-policy-label">Evening pass</span>
              <strong>18:00 ICT</strong>
            </div>
            <div className="admin-policy-item">
              <span className="admin-policy-label">Alerting</span>
              <strong>Manual review queue only</strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
