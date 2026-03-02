"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const fieldLabelClass = "grid gap-2";
  const eyebrowClass = "text-xs uppercase tracking-[0.16em] text-[#8da693]";
  const selectClass =
    "h-14 w-full rounded-[1.5rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.88)] px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8da693]";

  return (
    <form className="grid gap-4">
      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div>
            <div className={eyebrowClass}>Job CRUD</div>
            <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Listing details</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Job title</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Senior Operations Manager"
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Company</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Dear Career"
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Location</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Bangkok"
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Employment type</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value)}
                placeholder="Full-time"
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Category</span>
              <select
                className={selectClass}
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
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Status</span>
              <select
                className={selectClass}
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
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Salary</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                value={salary}
                onChange={(event) => setSalary(event.target.value)}
                placeholder="THB 60,000 - 80,000"
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Source</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="manual / linkedin / jobthai"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-4 p-5">
            <div>
              <div className={eyebrowClass}>Source intake</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Manual URL and approvals</h2>
            </div>
            <div className="grid gap-4">
              <label className={fieldLabelClass}>
                <span className={eyebrowClass}>Manual source URL</span>
                <Input
                  className="bg-[rgba(255,255,255,0.88)]"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://www.linkedin.com/jobs/view/..."
                />
              </label>
              <div className="rounded-2xl border border-dashed border-[rgba(74,115,80,0.28)] bg-[rgba(184,206,186,0.12)] px-6 py-4">
                <strong>Approval workflow</strong>
                <p className="mt-2 text-[0.92rem] leading-6 text-[#727975]">
                  Queue fetched jobs for website approval first, then request Facebook publication approval as a separate step.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-4 p-5">
            <div>
              <div className={eyebrowClass}>Publishing</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Destinations</h2>
            </div>
            <div className="grid gap-1">
              <label className="flex items-start justify-between gap-4 py-0">
                <span className="grid gap-1">
                  <strong>Publish to website</strong>
                  <small className="text-[0.92rem] leading-6 text-[#727975]">Send approved role to the public jobs page.</small>
                </span>
                <input type="checkbox" className="mt-1 h-[18px] w-[18px] accent-[#8da693]" defaultChecked />
              </label>
              <label className="flex items-start justify-between gap-4 border-t border-[rgba(160,183,164,0.16)] py-3">
                <span className="grid gap-1">
                  <strong>Request Facebook upload</strong>
                  <small className="text-[0.92rem] leading-6 text-[#727975]">Prepare this listing for Facebook publishing after approval.</small>
                </span>
                <input type="checkbox" className="mt-1 h-[18px] w-[18px] accent-[#8da693]" />
              </label>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div>
            <div className={eyebrowClass}>Descriptions</div>
            <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Job content</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Myanmar description</span>
              <Textarea
                value={descriptionMm}
                onChange={(event) => setDescriptionMm(event.target.value)}
                placeholder="Myanmar copy..."
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>English description</span>
              <Textarea
                value={descriptionEn}
                onChange={(event) => setDescriptionEn(event.target.value)}
                placeholder="English copy..."
              />
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button className={buttonVariants({ variant: "secondary" })} type="button">
              Save draft
            </button>
            <button className={buttonVariants()} type="button">
              Send for approval
            </button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
