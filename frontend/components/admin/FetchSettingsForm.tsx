"use client";

import { useState } from "react";

import type { FetchSettings, FetchSource } from "@/lib/types";

function formatSourceMode(source: FetchSource) {
  if (source.requires_manual_url) {
    return "Manual URL";
  }

  return source.mode === "crawler" ? "Crawler" : "Manual";
}

export function FetchSettingsForm({
  initialSettings,
}: {
  initialSettings: FetchSettings;
}) {
  const [cadenceValue, setCadenceValue] = useState(initialSettings.cadence_value);
  const [cadenceUnit, setCadenceUnit] = useState(initialSettings.cadence_unit);
  const [maxJobsPerRun, setMaxJobsPerRun] = useState(initialSettings.max_jobs_per_run);
  const [approveWebsite, setApproveWebsite] = useState(
    initialSettings.approval_required_for_website,
  );
  const [approveFacebook, setApproveFacebook] = useState(
    initialSettings.approval_required_for_facebook,
  );
  const [facebookAutoUpload, setFacebookAutoUpload] = useState(
    initialSettings.facebook_auto_upload,
  );
  const [realtimeNotifications, setRealtimeNotifications] = useState(
    initialSettings.realtime_notifications,
  );

  return (
    <div className="admin-settings-stack">
      <section className="admin-panel admin-panel-wide">
        <div className="admin-panel-header">
          <div>
            <div className="eyebrow">Cadence</div>
            <h2 className="admin-panel-title">Fetch schedule</h2>
          </div>
          <div className="admin-settings-actions">
            <button className="button secondary" type="button">
              Save draft
            </button>
            <button className="button" type="button">
              Run fetch now
            </button>
          </div>
        </div>
        <div className="admin-settings-grid">
          <label className="stack">
            <span className="eyebrow">Run every</span>
            <input
              className="field"
              type="number"
              min={1}
              value={cadenceValue}
              onChange={(event) => setCadenceValue(Number(event.target.value))}
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Unit</span>
            <select
              className="select"
              value={cadenceUnit}
              onChange={(event) => setCadenceUnit(event.target.value as FetchSettings["cadence_unit"])}
            >
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </label>
          <label className="stack">
            <span className="eyebrow">Max jobs per run</span>
            <input
              className="field"
              type="number"
              min={1}
              value={maxJobsPerRun}
              onChange={(event) => setMaxJobsPerRun(Number(event.target.value))}
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Realtime notifications</span>
            <select
              className="select"
              value={realtimeNotifications ? "enabled" : "disabled"}
              onChange={(event) => setRealtimeNotifications(event.target.value === "enabled")}
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-settings-grid admin-settings-grid-wide">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Publishing</div>
              <h2 className="admin-panel-title">Approval flow</h2>
            </div>
          </div>
          <div className="admin-toggle-list">
            <label className="admin-toggle-row">
              <span>
                <strong>Website publish approval</strong>
                <small>Require approval before a fetched job goes live on the site.</small>
              </span>
              <input
                type="checkbox"
                checked={approveWebsite}
                onChange={(event) => setApproveWebsite(event.target.checked)}
              />
            </label>
            <label className="admin-toggle-row">
              <span>
                <strong>Facebook approval</strong>
                <small>Ask for approval before sending a job to the Facebook page.</small>
              </span>
              <input
                type="checkbox"
                checked={approveFacebook}
                onChange={(event) => setApproveFacebook(event.target.checked)}
              />
            </label>
            <label className="admin-toggle-row">
              <span>
                <strong>Facebook auto upload</strong>
                <small>Publish approved jobs to Facebook automatically after website approval.</small>
              </span>
              <input
                type="checkbox"
                checked={facebookAutoUpload}
                onChange={(event) => setFacebookAutoUpload(event.target.checked)}
              />
            </label>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Manual intake</div>
              <h2 className="admin-panel-title">URL paste workflow</h2>
            </div>
          </div>
          <div className="admin-settings-form">
            <label className="stack">
              <span className="eyebrow">Paste source URL</span>
              <input className="field" placeholder="https://www.linkedin.com/jobs/view/..." />
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
                <span className="eyebrow">Publish destination</span>
                <select className="select" defaultValue="website">
                  <option value="website">Website only</option>
                  <option value="website-facebook">Website + Facebook</option>
                  <option value="review">Review queue</option>
                </select>
              </label>
            </div>
            <div className="admin-settings-actions">
              <button className="button" type="button">
                Queue for fetch
              </button>
              <button className="button secondary" type="button">
                Preview metadata
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-panel-wide">
        <div className="admin-panel-header">
          <div>
            <div className="eyebrow">Source registry</div>
            <h2 className="admin-panel-title">Connected sources</h2>
          </div>
        </div>
        <div className="admin-source-grid">
          {initialSettings.sources.map((source) => (
            <article key={source.id} className="admin-source-card">
              <div className="admin-source-header">
                <div>
                  <strong>{source.label}</strong>
                  <span>{source.domain}</span>
                </div>
                <span className={`admin-source-status is-${source.status}`}>
                  {source.status}
                </span>
              </div>
              <div className="admin-source-meta">
                <span>{formatSourceMode(source)}</span>
                <span>
                  {source.requires_manual_url
                    ? "Manual URL required"
                    : `Every ${source.cadence_value} ${source.cadence_unit}`}
                </span>
              </div>
              <div className="admin-source-actions">
                <button className="button secondary" type="button">
                  Configure
                </button>
                <button className="button secondary" type="button">
                  Run now
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
