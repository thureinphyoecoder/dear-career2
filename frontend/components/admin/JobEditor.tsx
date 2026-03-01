"use client";

import { useState } from "react";

import type { Job } from "@/lib/types";

const categoryOptions = [
  { value: "ngo", label: "NGO" },
  { value: "white-collar", label: "White Collar" },
  { value: "blue-collar", label: "Blue Collar" },
];

export function JobEditor({ initialJob }: { initialJob?: Partial<Job> }) {
  const [title, setTitle] = useState(initialJob?.title ?? "");
  const [company, setCompany] = useState(initialJob?.company ?? "");
  const [location, setLocation] = useState(initialJob?.location ?? "");
  const [category, setCategory] = useState(initialJob?.category ?? "white-collar");
  const [sourceUrl, setSourceUrl] = useState(initialJob?.source_url ?? "");
  const [description, setDescription] = useState(
    initialJob?.description_mm ?? "",
  );

  return (
    <form className="card card-pad stack">
      <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <label className="stack">
          <span>Job title</span>
          <input
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Backend Developer"
          />
        </label>
        <label className="stack">
          <span>Company</span>
          <input
            className="field"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Dear Career"
          />
        </label>
      </div>
      <label className="stack">
        <span>Location</span>
        <input
          className="field"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Bangkok"
        />
      </label>
      <div className="grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
        <label className="stack">
          <span>Category</span>
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
          <span>Manual Source URL</span>
          <input
            className="field"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://www.linkedin.com/jobs/view/..."
          />
        </label>
      </div>
      <div className="card-pad editor-note">
        <strong>Manual URL workflow</strong>
        <p className="muted" style={{ margin: "8px 0 0" }}>
          LinkedIn လို scrape မလွယ်တဲ့ source တွေအတွက် admin dashboard ကနေ URL
          paste လုပ်ပြီး manual entry အနေနဲ့သုံးပါ။ Scrapeable source တွေကိုပဲ
          automated fetch workflow ထဲထည့်မယ်။
        </p>
      </div>
      <label className="stack">
        <span>Description</span>
        <textarea
          className="textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Write the job description here..."
        />
      </label>
      <div className="toolbar">
        <span className="muted">Rich text editor wrapper placeholder</span>
        <button className="button" type="button">
          Save draft
        </button>
      </div>
    </form>
  );
}
