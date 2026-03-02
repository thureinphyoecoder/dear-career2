"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FetchSettings, FetchSource } from "@/lib/types";

function formatSourceMode(source: FetchSource) {
  if (source.requires_manual_url) {
    return "Manual URL";
  }

  if (source.mode === "rss") {
    return "RSS";
  }

  return source.mode === "html" ? "HTML scraper" : "Manual";
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
  const fieldLabelClass = "grid gap-2";
  const eyebrowClass = "text-xs uppercase tracking-[0.16em] text-[#8da693]";
  const selectClass =
    "h-14 w-full rounded-[1.5rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.88)] px-4 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8da693]";

  return (
    <div className="grid gap-4">
      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={eyebrowClass}>Cadence</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Fetch schedule</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={buttonVariants({ variant: "secondary" })} type="button">
                Save draft
              </button>
              <button className={buttonVariants()} type="button">
                Run fetch now
              </button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Run every</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                type="number"
                min={1}
                value={cadenceValue}
                onChange={(event) => setCadenceValue(Number(event.target.value))}
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Unit</span>
              <select
                className={selectClass}
                value={cadenceUnit}
                onChange={(event) => setCadenceUnit(event.target.value as FetchSettings["cadence_unit"])}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Max jobs per run</span>
              <Input
                className="bg-[rgba(255,255,255,0.88)]"
                type="number"
                min={1}
                value={maxJobsPerRun}
                onChange={(event) => setMaxJobsPerRun(Number(event.target.value))}
              />
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Realtime notifications</span>
              <select
                className={selectClass}
                value={realtimeNotifications ? "enabled" : "disabled"}
                onChange={(event) => setRealtimeNotifications(event.target.value === "enabled")}
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-4 p-5">
            <div>
              <div className={eyebrowClass}>Publishing</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Approval flow</h2>
            </div>
            <div className="grid gap-1">
              <label
                className={cn(
                  "flex items-start justify-between gap-4 border-t border-[rgba(160,183,164,0.16)] py-3",
                  "border-t-0 pt-0",
                )}
              >
                <span className="grid gap-1">
                  <strong>Website publish approval</strong>
                  <small className="text-[0.92rem] leading-6 text-[#727975]">
                    Require approval before a fetched job goes live on the site.
                  </small>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                  checked={approveWebsite}
                  onChange={(event) => setApproveWebsite(event.target.checked)}
                />
              </label>
              <label className="flex items-start justify-between gap-4 border-t border-[rgba(160,183,164,0.16)] py-3">
                <span className="grid gap-1">
                  <strong>Facebook approval</strong>
                  <small className="text-[0.92rem] leading-6 text-[#727975]">
                    Ask for approval before sending a job to the Facebook page.
                  </small>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                  checked={approveFacebook}
                  onChange={(event) => setApproveFacebook(event.target.checked)}
                />
              </label>
              <label className="flex items-start justify-between gap-4 border-t border-[rgba(160,183,164,0.16)] py-3">
                <span className="grid gap-1">
                  <strong>Facebook auto upload</strong>
                  <small className="text-[0.92rem] leading-6 text-[#727975]">
                    Publish approved jobs to Facebook automatically after website approval.
                  </small>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-[18px] w-[18px] accent-[#8da693]"
                  checked={facebookAutoUpload}
                  onChange={(event) => setFacebookAutoUpload(event.target.checked)}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
          <CardContent className="grid gap-4 p-5">
            <div>
              <div className={eyebrowClass}>Manual intake</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">URL paste workflow</h2>
            </div>
            <div className="grid gap-4">
              <label className={fieldLabelClass}>
                <span className={eyebrowClass}>Paste source URL</span>
                <Input className="bg-[rgba(255,255,255,0.88)]" placeholder="https://www.linkedin.com/jobs/view/..." />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={fieldLabelClass}>
                  <span className={eyebrowClass}>Category</span>
                  <select className={selectClass} defaultValue="white-collar">
                    <option value="ngo">NGO</option>
                    <option value="white-collar">White collar</option>
                    <option value="blue-collar">Blue collar</option>
                  </select>
                </label>
                <label className={fieldLabelClass}>
                  <span className={eyebrowClass}>Publish destination</span>
                  <select className={selectClass} defaultValue="website">
                    <option value="website">Website only</option>
                    <option value="website-facebook">Website + Facebook</option>
                    <option value="review">Review queue</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className={buttonVariants()} type="button">
                  Queue for fetch
                </button>
                <button className={buttonVariants({ variant: "secondary" })} type="button">
                  Preview metadata
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div>
            <div className={eyebrowClass}>Source registry</div>
            <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Connected sources</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {initialSettings.sources.map((source) => (
              <article
                key={source.id}
                className="grid gap-4 rounded-[20px] border border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.74)] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong>{source.label}</strong>
                    <span className="block text-[0.92rem] text-[#727975]">{source.domain}</span>
                  </div>
                  <span
                    className={cn(
                      "inline-flex min-w-[84px] items-center justify-center rounded-full px-3 py-1 text-[0.72rem] uppercase tracking-[0.1em]",
                      source.status === "healthy" && "bg-[rgba(76,145,118,0.14)] text-[#246245]",
                      source.status === "warning" && "bg-[rgba(204,165,92,0.16)] text-[#8a6120]",
                      source.status === "paused" && "bg-[rgba(114,121,117,0.16)] text-[#59605d]",
                    )}
                  >
                    {source.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-[0.92rem] text-[#727975]">
                  <span>{formatSourceMode(source)}</span>
                  <span>
                    {source.requires_manual_url
                      ? "Manual URL required"
                      : `Every ${source.cadence_value} ${source.cadence_unit}`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={buttonVariants({ variant: "secondary" })} type="button">
                    Configure
                  </button>
                  <button className={buttonVariants({ variant: "secondary" })} type="button">
                    Run now
                  </button>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
