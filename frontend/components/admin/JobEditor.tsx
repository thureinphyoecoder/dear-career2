"use client";

import { useState } from "react";

import type { Job } from "@/lib/types";

const categoryOptions = [
  { value: "ngo", label: "NGO" },
  { value: "white-collar", label: "White collar" },
  { value: "blue-collar", label: "Blue collar" },
];

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export function JobEditor({ initialJob }: { initialJob?: Partial<Job> }) {
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [company, setCompany] = useState(initialJob?.company ?? "");
  const [location, setLocation] = useState(initialJob?.location ?? "");
  const [employmentType, setEmploymentType] = useState(initialJob?.employment_type ?? "Full-time");
  const [salary, setSalary] = useState(initialJob?.salary ?? "");
  const [status, setStatus] = useState(initialJob?.status ?? "draft");
  const [category, setCategory] = useState(initialJob?.category ?? "white-collar");
  const [source, setSource] = useState(initialJob?.source ?? "manual");
  const [sourceUrl, setSourceUrl] = useState(initialJob?.source_url ?? "");
  const [descriptionMm, setDescriptionMm] = useState(initialJob?.description_mm ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialJob?.description_en ?? "");

  return (
    <form className="admin-editor">
      <section className="admin-panel admin-panel-wide">
        <div className="admin-panel-header">
          <div>
            <div className="eyebrow">Job CRUD</div>
            <h2 className="admin-panel-title">Listing details</h2>
          </div>
        </div>
        <div className="admin-settings-grid">
          <label className="stack">
            <span className="eyebrow">Job title</span>
            <input
              className="field"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Senior Operations Manager"
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Company</span>
            <input
              className="field"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Dear Career"
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Location</span>
            <input
              className="field"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Bangkok"
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Employment type</span>
            <input
              className="field"
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value)}
              placeholder="Full-time"
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Category</span>
            <select
              className="select"
              value={category}
              onChange={(event) => setCategory(event.target.value as Job["category"])}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span className="eyebrow">Status</span>
            <select
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value as NonNullable<Job["status"]>)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span className="eyebrow">Salary</span>
            <input
              className="field"
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              placeholder="THB 60,000 - 80,000"
            />
          </label>
          <label className="stack">
            <span className="eyebrow">Source</span>
            <input
              className="field"
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder="manual / linkedin / jobthai"
            />
          </label>
        </div>
      </section>

      <section className="admin-settings-grid admin-settings-grid-wide">
        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Source intake</div>
              <h2 className="admin-panel-title">Manual URL and approvals</h2>
            </div>
          </div>
          <div className="admin-settings-form">
            <label className="stack">
              <span className="eyebrow">Manual source URL</span>
              <input
                className="field"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
              />
            </label>
            <div className="editor-note card-pad">
              <strong>Approval workflow</strong>
              <p className="muted" style={{ margin: "8px 0 0" }}>
                Queue fetched jobs for website approval first, then request Facebook publication approval as a separate step.
              </p>
            </div>
          </div>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <div className="eyebrow">Publishing</div>
              <h2 className="admin-panel-title">Destinations</h2>
            </div>
          </div>
          <div className="admin-toggle-list">
            <label className="admin-toggle-row">
              <span>
                <strong>Publish to website</strong>
                <small>Send approved role to the public jobs page.</small>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="admin-toggle-row">
              <span>
                <strong>Request Facebook upload</strong>
                <small>Prepare this listing for Facebook publishing after approval.</small>
              </span>
              <input type="checkbox" />
            </label>
          </div>
        </article>
      </section>

      <section className="admin-panel admin-panel-wide">
        <div className="admin-panel-header">
          <div>
            <div className="eyebrow">Descriptions</div>
            <h2 className="admin-panel-title">Job content</h2>
          </div>
        </div>
        <div className="admin-settings-grid admin-settings-grid-wide">
          <label className="stack">
            <span className="eyebrow">Myanmar description</span>
            <textarea
              className="textarea"
              value={descriptionMm}
              onChange={(event) => setDescriptionMm(event.target.value)}
              placeholder="Myanmar copy..."
            />
          </label>
          <label className="stack">
            <span className="eyebrow">English description</span>
            <textarea
              className="textarea"
              value={descriptionEn}
              onChange={(event) => setDescriptionEn(event.target.value)}
              placeholder="English copy..."
            />
          </label>
        </div>
        <div className="admin-editor-actions">
          <button className="button secondary" type="button">
            Save draft
          </button>
          <button className="button" type="button">
            Send for approval
          </button>
        </div>
      </section>
    </form>
  );
}
