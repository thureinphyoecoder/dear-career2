"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  validateAdFields,
  type AdFieldErrors,
} from "@/lib/admin-form-validation";
import { normalizeServerError } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { ManagedAd, ManagedAdPlacement, ManagedAdStatus } from "@/lib/types";

const placementOptions: Array<{ value: ManagedAdPlacement; label: string }> = [
  { value: "jobs-search", label: "Jobs search" },
  { value: "jobs-inline", label: "Jobs inline" },
  { value: "jobs-detail", label: "Job detail" },
];

const statusOptions: Array<{ value: ManagedAdStatus; label: string }> = [
  { value: "draft", label: "Not live yet" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

const emptyAd: Omit<ManagedAd, "id"> = {
  title: "",
  eyebrow: "Sponsored",
  description: "",
  cta_label: "",
  href: "",
  placement: "jobs-inline",
  status: "draft",
  sort_order: 100,
};

export function AdsManager({ initialAds }: { initialAds: ManagedAd[] }) {
  const [ads, setAds] = useState<Record<number, ManagedAd>>(
    Object.fromEntries(initialAds.map((ad) => [ad.id, ad])),
  );
  const [newAd, setNewAd] = useState<Omit<ManagedAd, "id">>(emptyAd);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [openAdId, setOpenAdId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createErrors, setCreateErrors] = useState<AdFieldErrors>({});
  const [editErrors, setEditErrors] = useState<Record<number, AdFieldErrors>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [placementFilter, setPlacementFilter] = useState<"all" | ManagedAdPlacement>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ManagedAdStatus>("all");

  const orderedAds = useMemo(
    () => Object.values(ads).sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [ads],
  );
  const visibleAds = useMemo(
    () =>
      orderedAds.filter((ad) => {
        if (placementFilter !== "all" && ad.placement !== placementFilter) return false;
        if (statusFilter !== "all" && ad.status !== statusFilter) return false;
        return true;
      }),
    [orderedAds, placementFilter, statusFilter],
  );

  function updateAd(adId: number, patch: Partial<ManagedAd>) {
    setAds((current) => ({
      ...current,
      [adId]: {
        ...current[adId],
        ...patch,
      },
    }));
  }

  async function createAd() {
    const nextErrors = validateAdFields({
      title: newAd.title,
      cta_label: newAd.cta_label,
      description: newAd.description,
      href: newAd.href,
      sort_order: newAd.sort_order,
    });
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the new ad details.");
      setMessage("");
      return;
    }

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/proxy/jobs/admin/ads/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newAd),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Could not create this ad."));
      }

      const created = (await response.json()) as ManagedAd;
      setAds((current) => ({ ...current, [created.id]: created }));
      setNewAd(emptyAd);
      setCreateErrors({});
      setMessage("Ad added.");
      setOpenAdId(created.id);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create ad.");
    } finally {
      setCreating(false);
    }
  }

  async function refreshAds() {
    setRefreshing(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/proxy/jobs/admin/ads/");
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to load ads."));
      }
      const payload = (await response.json()) as { results: ManagedAd[] };
      setAds(Object.fromEntries(payload.results.map((ad) => [ad.id, ad])));
      setMessage("Ads reloaded.");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load ads.");
    } finally {
      setRefreshing(false);
    }
  }

  async function saveAd(adId: number) {
    const ad = ads[adId];
    if (!ad) return;
    const nextErrors = validateAdFields({
      title: ad.title,
      cta_label: ad.cta_label,
      description: ad.description,
      href: ad.href,
      sort_order: ad.sort_order,
    });
    setEditErrors((current) => ({ ...current, [adId]: nextErrors }));
    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted ad fields.");
      setMessage("");
      return;
    }

    setSavingId(adId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/ads/${adId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ad),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to update ad."));
      }

      const updated = (await response.json()) as ManagedAd;
      setAds((current) => ({ ...current, [adId]: updated }));
      setEditErrors((current) => ({ ...current, [adId]: {} }));
      setMessage("Ad updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update ad.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteAd() {
    if (!targetDeleteId) return;

    setDeletingId(targetDeleteId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/ads/${targetDeleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to delete ad."));
      }

      setAds((current) => {
        const next = { ...current };
        delete next[targetDeleteId];
        return next;
      });
      setMessage("Ad deleted.");
      setOpenAdId((current) => (current === targetDeleteId ? null : current));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete ad.");
    } finally {
      setDeletingId(null);
      setTargetDeleteId(null);
      setConfirmDeleteOpen(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4 rounded-2xl border border-border/70 bg-white p-5">
        <div className="flex items-center gap-2 text-[#334039]">
          <Megaphone className="h-4 w-4" />
          <strong className="font-medium">New ad</strong>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Title</span>
            <Input value={newAd.title} onChange={(event) => setNewAd((current) => ({ ...current, title: event.target.value }))} />
            {createErrors.title ? <span className="text-sm text-[#8e4a4a]">{createErrors.title}</span> : null}
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">CTA label</span>
            <Input value={newAd.cta_label} onChange={(event) => setNewAd((current) => ({ ...current, cta_label: event.target.value }))} />
            {createErrors.cta_label ? <span className="text-sm text-[#8e4a4a]">{createErrors.cta_label}</span> : null}
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Description</span>
            <Textarea value={newAd.description} onChange={(event) => setNewAd((current) => ({ ...current, description: event.target.value }))} className="min-h-[110px]" />
            {createErrors.description ? <span className="text-sm text-[#8e4a4a]">{createErrors.description}</span> : null}
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Target URL</span>
            <Input value={newAd.href} onChange={(event) => setNewAd((current) => ({ ...current, href: event.target.value }))} placeholder="https://..." />
            {createErrors.href ? <span className="text-sm text-[#8e4a4a]">{createErrors.href}</span> : null}
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Eyebrow</span>
            <Input value={newAd.eyebrow} onChange={(event) => setNewAd((current) => ({ ...current, eyebrow: event.target.value }))} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Placement</span>
            <select
              className="h-11 rounded-md border border-border/70 bg-white px-3 text-sm outline-none"
              value={newAd.placement}
              onChange={(event) =>
                setNewAd((current) => ({ ...current, placement: event.target.value as ManagedAdPlacement }))
              }
            >
              {placementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Status</span>
            <select
              className="h-11 rounded-md border border-border/70 bg-white px-3 text-sm outline-none"
              value={newAd.status}
              onChange={(event) =>
                setNewAd((current) => ({ ...current, status: event.target.value as ManagedAdStatus }))
              }
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Sort order</span>
            <Input
              type="number"
              value={String(newAd.sort_order)}
              onChange={(event) =>
                setNewAd((current) => ({ ...current, sort_order: Number(event.target.value || 0) }))
              }
            />
            {createErrors.sort_order ? <span className="text-sm text-[#8e4a4a]">{createErrors.sort_order}</span> : null}
          </label>
        </div>
        <div className="flex justify-end">
          <button className={cn(buttonVariants(), "rounded-md")} type="button" onClick={() => void createAd()} disabled={creating}>
            {creating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {creating ? "Creating..." : "Create ad"}
          </button>
        </div>
      </section>

      {(error || message) && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border px-4 py-3 text-sm",
            error
              ? "border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] text-[#8e4a4a]"
              : "border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] text-[#4f6354]",
          )}
        >
          {error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{error || message}</span>
        </div>
      )}

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-md border border-border/70 bg-white px-3 text-sm outline-none"
              value={placementFilter}
              onChange={(event) => setPlacementFilter(event.target.value as "all" | ManagedAdPlacement)}
            >
              <option value="all">All placements</option>
              {placementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-border/70 bg-white px-3 text-sm outline-none"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | ManagedAdStatus)}
            >
              <option value="all">All status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
            type="button"
            onClick={() => void refreshAds()}
            disabled={refreshing}
          >
            {refreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {refreshing ? "Refreshing..." : "Reload ads"}
          </button>
        </div>

        {visibleAds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-white p-6 text-sm text-[#727975]">
            No ads found for current filters. Create a new ad or change filters.
          </div>
        ) : null}

        {visibleAds.map((ad) => {
          const isOpen = openAdId === ad.id;
          const isSaving = savingId === ad.id;
          const fieldErrors = editErrors[ad.id] ?? {};

          return (
            <article key={ad.id} className="grid gap-4 rounded-2xl border border-border/70 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <strong className="font-medium text-[#334039]">{ad.title}</strong>
                  <span className="text-sm text-[#727975]">{ad.placement} · {ad.status}</span>
                </div>
                <div className="flex gap-2">
                  <button className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")} type="button" onClick={() => setOpenAdId(isOpen ? null : ad.id)}>
                    <Pencil className="h-4 w-4" />
                    {isOpen ? "Close" : "Edit"}
                  </button>
                  <button
                    className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
                    type="button"
                    onClick={() => {
                      setTargetDeleteId(ad.id);
                      setConfirmDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              {isOpen ? (
                <div className="grid gap-4 border-t border-border/60 pt-4 xl:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Title</span>
                    <Input value={ad.title} onChange={(event) => updateAd(ad.id, { title: event.target.value })} />
                    {fieldErrors.title ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.title}</span> : null}
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">CTA label</span>
                    <Input value={ad.cta_label} onChange={(event) => updateAd(ad.id, { cta_label: event.target.value })} />
                    {fieldErrors.cta_label ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.cta_label}</span> : null}
                  </label>
                  <label className="grid gap-2 xl:col-span-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Description</span>
                    <Textarea className="min-h-[110px]" value={ad.description} onChange={(event) => updateAd(ad.id, { description: event.target.value })} />
                    {fieldErrors.description ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.description}</span> : null}
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Target URL</span>
                    <Input value={ad.href} onChange={(event) => updateAd(ad.id, { href: event.target.value })} />
                    {fieldErrors.href ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.href}</span> : null}
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Eyebrow</span>
                    <Input value={ad.eyebrow ?? ""} onChange={(event) => updateAd(ad.id, { eyebrow: event.target.value })} />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Placement</span>
                    <select className="h-11 rounded-md border border-border/70 bg-white px-3 text-sm outline-none" value={ad.placement} onChange={(event) => updateAd(ad.id, { placement: event.target.value as ManagedAdPlacement })}>
                      {placementOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Status</span>
                    <select className="h-11 rounded-md border border-border/70 bg-white px-3 text-sm outline-none" value={ad.status} onChange={(event) => updateAd(ad.id, { status: event.target.value as ManagedAdStatus })}>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Sort order</span>
                    <Input type="number" value={String(ad.sort_order)} onChange={(event) => updateAd(ad.id, { sort_order: Number(event.target.value || 0) })} />
                    {fieldErrors.sort_order ? <span className="text-sm text-[#8e4a4a]">{fieldErrors.sort_order}</span> : null}
                  </label>
                  <div className="xl:col-span-2 flex justify-end">
                    <button className={cn(buttonVariants(), "rounded-md")} type="button" onClick={() => void saveAd(ad.id)} disabled={isSaving}>
                      {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                      {isSaving ? "Saving..." : "Save ad"}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Delete ad"
        description="This will permanently remove the selected ad."
        confirmLabel="Delete"
        isLoading={deletingId !== null}
        onConfirm={() => void deleteAd()}
        onCancel={() => {
          if (deletingId !== null) return;
          setConfirmDeleteOpen(false);
          setTargetDeleteId(null);
        }}
      />
    </div>
  );
}
