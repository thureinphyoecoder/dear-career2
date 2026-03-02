"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell, BellDot, CheckCircle2, AlertCircle, Info, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAdminNotificationsQuery } from "@/lib/admin-queries";
import { adminQueryKeys } from "@/lib/admin-query-keys";
import type { AdminNotification } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatRelativeTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function NotificationToneIcon({ tone }: { tone: AdminNotification["tone"] }) {
  if (tone === "success") {
    return <CheckCircle2 className="h-4 w-4 text-[#4e8a63]" />;
  }
  if (tone === "warning") {
    return <AlertCircle className="h-4 w-4 text-[#a05a52]" />;
  }
  return <Info className="h-4 w-4 text-[#6c7b72]" />;
}

export function AdminNotificationBell({
  initialNotifications = [],
}: {
  initialNotifications?: AdminNotification[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificationsQuery = useAdminNotificationsQuery(initialNotifications);
  const items = notificationsQuery.data ?? [];
  const unreadCount = items.filter((item) => !item.is_read).length;
  const [isOpen, setIsOpen] = useState(false);
  const [streamError, setStreamError] = useState("");
  const [hasFreshItem, setHasFreshItem] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const eventSource = new EventSource("/api/admin/proxy/jobs/admin/notifications/stream");
    eventSource.addEventListener("notification", (event) => {
      const message = event as MessageEvent<string>;
      try {
        const parsed = JSON.parse(message.data) as AdminNotification;
        queryClient.setQueryData(
          adminQueryKeys.notifications,
          (current: AdminNotification[] | undefined) =>
            [parsed, ...(current ?? []).filter((item) => item.id !== parsed.id)].slice(0, 12),
        );
        setHasFreshItem(true);
        setStreamError("");
      } catch {
        setStreamError("A notification update could not be read.");
      }
    });
    eventSource.onerror = () => {
      setStreamError("Live updates paused. Reconnecting...");
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!shellRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasFreshItem(false);
    }
  }, [isOpen]);

  async function openNotification(item: AdminNotification) {
    setIsOpen(false);

    if (!item.is_read) {
      queryClient.setQueryData<AdminNotification[]>(
        adminQueryKeys.notifications,
        (current) =>
          (current ?? []).map((entry) =>
            entry.id === item.id ? { ...entry, is_read: true } : entry,
          ),
      );

      try {
        await fetch(`/api/admin/proxy/jobs/admin/notifications/${item.id}/read`, {
          method: "PATCH",
        });
      } catch {
        // Keep the optimistic UI state; the next poll will reconcile if needed.
      }
    }

    router.push(item.target_url || "/admin");
  }

  return (
    <div ref={shellRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-[#fafbfa] text-[#6f7b73] transition-colors hover:bg-[#f0f4f1] hover:text-[#465049]"
        onClick={() => setIsOpen((current) => !current)}
      >
        {hasFreshItem ? <BellDot size={17} strokeWidth={1.9} /> : <Bell size={17} strokeWidth={1.9} />}
        {unreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-[#8da693] px-1.5 py-[1px] text-[0.62rem] font-semibold leading-none text-white">
            {Math.min(unreadCount, 9)}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 grid w-[360px] gap-3 rounded-2xl border border-border/70 bg-white p-3 shadow-[0_20px_50px_rgba(44,56,48,0.08)]">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-medium text-[#334039]">Notifications</div>
            {notificationsQuery.isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin text-[#7f9582]" />
            ) : (
              <span className="text-xs text-[#7f9582]">Live</span>
            )}
          </div>

          {streamError || notificationsQuery.error ? (
            <div className="rounded-xl border border-[rgba(169,97,111,0.2)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              {streamError ||
                (notificationsQuery.error instanceof Error
                  ? notificationsQuery.error.message
                  : "Notifications are temporarily unavailable.")}
            </div>
          ) : null}

          <div className="grid max-h-[420px] gap-2 overflow-y-auto pr-1">
            {items.length === 0 && !notificationsQuery.isLoading ? (
              <div className="rounded-xl border border-border/70 bg-[#fafbfa] px-3 py-4 text-sm text-[#727975]">
                No scrape notifications yet.
              </div>
            ) : null}

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void openNotification(item)}
                className={cn(
                  "grid w-full gap-2 rounded-xl border px-3 py-3 text-left transition-colors hover:border-[rgba(116,141,122,0.24)] hover:bg-[rgba(144,168,147,0.08)]",
                  item.tone === "success" && "border-[rgba(116,141,122,0.16)] bg-[rgba(144,168,147,0.08)]",
                  item.tone === "warning" && "border-[rgba(169,97,111,0.16)] bg-[rgba(169,97,111,0.06)]",
                  item.tone === "info" && "border-border/70 bg-[#fafbfa]",
                  item.is_read && "opacity-70",
                )}
              >
                <div className="flex items-start gap-2">
                  <NotificationToneIcon tone={item.tone} />
                  <div className="grid gap-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-medium text-[#334039]">{item.title}</strong>
                      {!item.is_read ? (
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#8da693]" />
                      ) : null}
                    </div>
                    <p className="text-sm text-[#66726b]">{item.detail}</p>
                  </div>
                </div>
                <div className="pl-6 text-xs uppercase tracking-[0.14em] text-[#8da693]">
                  {formatRelativeTime(item.created_at)}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
