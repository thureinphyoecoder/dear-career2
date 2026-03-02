"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ManagedAd, ManagedAdPlacement, ManagedAdStatus } from "@/lib/types";

const placementOptions: Array<{ value: ManagedAdPlacement; label: string }> = [
  { value: "jobs-search", label: "Jobs search" },
  { value: "jobs-inline", label: "Jobs inline" },
  { value: "jobs-detail", label: "Job detail" },
];

const statusOptions: Array<{ value: ManagedAdStatus; label: string }> = [
  { value: "draft", label: "Draft" },
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
  const router = useRouter();
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

  const orderedAds = useMemo(
    () => Object.values(ads).sort((left, right) => left.sort_order - right.sort_order || left.id - right.id),
    [ads],
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
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/proxy/jobs/admin/ads/create/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(newAd),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Unable to create ad.");
      }

      const created = (await response.json()) as ManagedAd;
      setAds((current) => ({ ...current, [created.id]: created }));
      setNewAd(emptyAd);
      setMessage("Ad created.");
      setOpenAdId(created.id);
      router.refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create ad.");
    } finally {
      setCreating(false);
    }
  }

  async function saveAd(adId: number) {
    const ad = ads[adId];
    if (!ad) return;

    setSavingId(adId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/ads/${adId}/`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ad),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Unable to update ad.");
      }

      const updated = (await response.json()) as ManagedAd;
      setAds((current) => ({ ...current, [adId]: updated }));
      setMessage("Ad updated.");
      router.refresh();
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
      const response = await fetch(`/api/admin/proxy/jobs/admin/ads/${targetDeleteId}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Unable to delete ad.");
      }

      setAds((current) => {
        const next = { ...current };
        delete next[targetDeleteId];
        return next;
      });
      setMessage("Ad deleted.");
      setOpenAdId((current) => (current === targetDeleteId ? null : current));
      router.refresh();
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
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">CTA label</span>
            <Input value={newAd.cta_label} onChange={(event) => setNewAd((current) => ({ ...current, cta_label: event.target.value }))} />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Description</span>
            <Textarea value={newAd.description} onChange={(event) => setNewAd((current) => ({ ...current, description: event.target.value }))} className="min-h-[110px]" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Target URL</span>
            <Input value={newAd.href} onChange={(event) => setNewAd((current) => ({ ...current, href: event.target.value }))} placeholder="https://..." />
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
        {orderedAds.map((ad) => {
          const isOpen = openAdId === ad.id;
          const isSaving = savingId === ad.id;

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
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">CTA label</span>
                    <Input value={ad.cta_label} onChange={(event) => updateAd(ad.id, { cta_label: event.target.value })} />
                  </label>
                  <label className="grid gap-2 xl:col-span-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Description</span>
                    <Textarea className="min-h-[110px]" value={ad.description} onChange={(event) => updateAd(ad.id, { description: event.target.value })} />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Target URL</span>
                    <Input value={ad.href} onChange={(event) => updateAd(ad.id, { href: event.target.value })} />
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
