"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  validateFetchSettingsFields,
  type FetchSettingsFieldErrors,
} from "@/lib/admin-form-validation";
import { normalizeServerError } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FetchSettings } from "@/lib/types";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FetchSettingsFieldErrors>({});
  const fieldLabelClass = "grid gap-2";
  const eyebrowClass = "text-xs uppercase tracking-[0.16em] text-[#8da693]";
  const selectClass =
    "h-14 w-full appearance-none rounded-[1.5rem] border border-[rgba(160,183,164,0.18)] bg-[rgba(255,255,255,0.88)] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14'%3E%3Cpath d='M3 5l4 4 4-4' fill='none' stroke='%235d6f61' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")] bg-[position:right_1rem_center] bg-no-repeat px-4 pr-10 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-[#8da693] focus:ring-2 focus:ring-[rgba(141,166,147,0.26)]";

  async function saveSettings() {
    const nextErrors = validateFetchSettingsFields({
      cadenceValue,
      maxJobsPerRun,
    });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted settings.");
      setMessage("");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const enabledSources = initialSettings.sources.filter((source) => source.enabled);
      if (enabledSources.length === 0) {
        throw new Error("No enabled sources are available to update.");
      }

      const responses = await Promise.all(
        enabledSources.map((source) =>
          fetch(`/api/admin/proxy/jobs/admin/sources/${source.id}`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              cadence_value: cadenceValue,
              cadence_unit: cadenceUnit,
              max_jobs_per_run: maxJobsPerRun,
              approval_required_for_website: approveWebsite,
              approval_required_for_facebook: approveFacebook,
              auto_publish_facebook: facebookAutoUpload,
            }),
          }),
        ),
      );

      const failed = responses.find((response) => !response.ok);
      if (failed) {
        throw new Error(
          normalizeServerError(await failed.text(), "Unable to save fetch settings."),
        );
      }

      setMessage("Fetch settings updated across enabled sources.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save fetch settings.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runFetchNow() {
    setIsRunning(true);
    setMessage("");
    setError("");

    try {
      const firstRunnableSource = initialSettings.sources.find(
        (source) =>
          source.enabled &&
          !source.requires_manual_url &&
          source.mode !== "manual" &&
          Boolean(source.feed_url?.trim()),
      );
      if (!firstRunnableSource) {
        throw new Error("No auto-fetch source is enabled right now. Configure at least one HTML/RSS source.");
      }

      const response = await fetch(
        `/api/admin/proxy/jobs/admin/sources/${firstRunnableSource.id}/run`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error(
          normalizeServerError(await response.text(), "Unable to run fetch right now."),
        );
      }

      const result = (await response.json()) as { fetched_count?: number; created_count?: number };
      setMessage(
        `Fetch complete. ${result.fetched_count ?? 0} fetched, ${result.created_count ?? 0} created.`,
      );
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unable to run fetch right now.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="grid gap-4 lg:max-w-[880px]">
      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={eyebrowClass}>Cadence</div>
              <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">Fetch schedule</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={buttonVariants({ variant: "secondary" })} type="button" disabled={isSaving} onClick={() => void saveSettings()}>
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {isSaving ? "Saving..." : "Save settings"}
              </button>
              <button className={buttonVariants()} type="button" disabled={isRunning} onClick={() => void runFetchNow()}>
                {isRunning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {isRunning ? "Running..." : "Run fetch now"}
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
              {fieldErrors.cadenceValue ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.cadenceValue}</span> : null}
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Unit</span>
              <select
                className={selectClass}
                value={cadenceUnit}
                onChange={(event) => setCadenceUnit(event.target.value as FetchSettings["cadence_unit"])}
              >
                <option className="bg-[#f7faf7] text-[#334039]" value="minutes">Minutes</option>
                <option className="bg-[#f7faf7] text-[#334039]" value="hours">Hours</option>
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
              {fieldErrors.maxJobsPerRun ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.maxJobsPerRun}</span> : null}
            </label>
            <label className={fieldLabelClass}>
              <span className={eyebrowClass}>Realtime notifications</span>
              <select
                className={selectClass}
                value={realtimeNotifications ? "enabled" : "disabled"}
                onChange={(event) => setRealtimeNotifications(event.target.value === "enabled")}
              >
                <option className="bg-[#f7faf7] text-[#334039]" value="enabled">Enabled</option>
                <option className="bg-[#f7faf7] text-[#334039]" value="disabled">Disabled</option>
              </select>
            </label>
          </div>
        </CardContent>
      </Card>
      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div>
            <div className={eyebrowClass}>Publishing</div>
            <h2 className="mt-1 text-[1.02rem] font-semibold tracking-[-0.02em] text-foreground">
              Approval flow
            </h2>
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
      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {message ? (
        <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      ) : null}
    </div>
  );
}
