"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Heart,
  Link2,
  LogOut,
  MessageCircle,
  Share2,
} from "lucide-react";

import { FacebookPublishPanel } from "@/components/admin/FacebookPublishPanel";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FacebookPageCredential, FacebookPagePost, Job } from "@/lib/types";

export function FacebookCredentialForm({
  initialCredential,
  jobs,
  posts,
  postsError,
  oauthConnected = false,
  disconnected = false,
  oauthError,
  oauthWarning,
  missingConfig = [],
  sessionExpiresAt,
  sessionSnapshotAt,
}: {
  initialCredential: FacebookPageCredential;
  jobs: Job[];
  posts: FacebookPagePost[];
  postsError?: string;
  oauthConnected?: boolean;
  disconnected?: boolean;
  oauthError?: string;
  oauthWarning?: string;
  missingConfig?: string[];
  sessionExpiresAt?: number | null;
  sessionSnapshotAt?: number;
}) {
  const router = useRouter();
  const hasConnectedPage = Boolean(initialCredential.connected || initialCredential.page_id);
  const oauthReady = missingConfig.length === 0;
  const buttonLabel = hasConnectedPage ? "Reconnect page" : "Connect page";
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const [brokenPostImages, setBrokenPostImages] = useState<Record<string, true>>({});
  const [disconnectError, setDisconnectError] = useState("");
  const [isDisconnectPending, startDisconnectTransition] = useTransition();
  const [showConnectedMessage, setShowConnectedMessage] = useState(oauthConnected);
  const [showDisconnectedMessage, setShowDisconnectedMessage] = useState(disconnected);
  const [showOauthError, setShowOauthError] = useState(Boolean(oauthError));
  const [showOauthWarning, setShowOauthWarning] = useState(Boolean(oauthWarning));

  useEffect(() => {
    setShowConnectedMessage(oauthConnected);
  }, [oauthConnected]);

  useEffect(() => {
    if (!oauthConnected) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowConnectedMessage(false);
      router.replace("/admin/facebook", { scroll: false });
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [oauthConnected, router]);

  useEffect(() => {
    setShowDisconnectedMessage(disconnected);
  }, [disconnected]);

  useEffect(() => {
    if (!disconnected) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowDisconnectedMessage(false);
      router.replace("/admin/facebook", { scroll: false });
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [disconnected, router]);

  useEffect(() => {
    setShowOauthError(Boolean(oauthError));
  }, [oauthError]);

  useEffect(() => {
    if (!oauthError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowOauthError(false);
      router.replace("/admin/facebook", { scroll: false });
    }, 7000);

    return () => window.clearTimeout(timeoutId);
  }, [oauthError, router]);

  useEffect(() => {
    setShowOauthWarning(Boolean(oauthWarning));
  }, [oauthWarning]);

  useEffect(() => {
    if (!oauthWarning) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowOauthWarning(false);
      router.replace("/admin/facebook", { scroll: false });
    }, 7000);

    return () => window.clearTimeout(timeoutId);
  }, [oauthWarning, router]);

  function formatOauthError(value?: string) {
    if (!value) return "";
    if (value === "missing-app-config") {
      return "Facebook app ID or app secret is missing in server configuration.";
    }
    if (value === "invalid-state") {
      return "Facebook login state could not be verified. Try connecting again.";
    }
    if (value === "missing-code") {
      return "Facebook did not return an authorization code.";
    }
    if (value === "facebook-denied") {
      return "Facebook login was cancelled before page access was granted.";
    }
    return decodeURIComponent(value.replace(/\+/g, " "));
  }

  function formatOauthWarning(value?: string) {
    if (!value) return "";
    if (value.includes("pages_read_engagement")) {
      return "Connection succeeded, but page posts cannot be loaded yet. Reconnect with pages_read_engagement and make sure this Facebook account is added as an app tester/admin.";
    }
    if (value.includes("pages_manage_posts")) {
      return "Connection succeeded, but posting permission is missing. Reconnect the page and grant pages_manage_posts.";
    }
    if (value.includes("pages_show_list")) {
      return "Connection succeeded, but page list permission is missing. Reconnect the page and grant pages_show_list.";
    }
    if (value.toLowerCase().includes("cannot call api for app")) {
      return "Connection saved, but this token does not match the current Facebook app. Remove the page connection and reconnect using the same app configuration.";
    }
    return decodeURIComponent(value.replace(/\+/g, " "));
  }

  function formatPostDate(value?: string) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(new Date(value));
    } catch {
      return "";
    }
  }

  function formatSessionExpiryDate(value: number) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "full",
        timeZone: "Asia/Bangkok",
      }).format(new Date(value));
    } catch {
      return "";
    }
  }

  function handleDisconnect() {
    setDisconnectError("");
    startDisconnectTransition(async () => {
      try {
        const response = await fetch("/api/admin/facebook/disconnect", {
          method: "POST",
          headers: {
            "x-facebook-disconnect-mode": "json",
          },
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; error?: string }
          | null;

        if (!response.ok || !payload?.ok) {
          setDisconnectError(payload?.error || "facebook-disconnect-failed");
          return;
        }

        router.replace("/admin/facebook?disconnected=1");
        router.refresh();
      } catch {
        setDisconnectError("facebook-disconnect-failed");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {initialCredential.profile_image_url && !profileImageFailed ? (
                <img
                  src={initialCredential.profile_image_url}
                  alt={initialCredential.profile_name || initialCredential.account_name || "Facebook profile"}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={() => setProfileImageFailed(true)}
                />
              ) : (
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(141,166,147,0.12)] text-[#6f7b73]">
                  <Link2 className="h-5 w-5" />
                </span>
              )}
              <div className="grid gap-0.5">
                <strong className="text-[1rem] font-semibold text-[#334039]">
                  {initialCredential.account_name || initialCredential.profile_name || "Facebook page"}
                </strong>
                {hasConnectedPage ? (
                  <span className="text-sm text-[#727975]">
                    {initialCredential.page_id ? `Page ID ${initialCredential.page_id}` : "Connected"}
                  </span>
                ) : (
                  <span className="text-sm text-[#727975]">Not connected</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                className={cn(
                  buttonVariants(),
                  "rounded-md",
                  !oauthReady && "pointer-events-none opacity-50",
                )}
                href={oauthReady ? "/api/admin/facebook/connect" : "#"}
                aria-disabled={!oauthReady}
              >
                <Link2 className="h-4 w-4" />
                {buttonLabel}
              </a>
              {hasConnectedPage ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isDisconnectPending}
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "rounded-md border-[rgba(169,97,111,0.2)] bg-[rgba(169,97,111,0.08)] text-[#8e4a4a] hover:bg-[rgba(169,97,111,0.14)]",
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  {isDisconnectPending ? "Logging out..." : "Logout"}
                </button>
              ) : null}
            </div>
          </div>

          {typeof sessionExpiresAt === "number" ? (
            <div className="rounded-md border border-[rgba(116,141,122,0.18)] bg-[rgba(144,168,147,0.08)] px-3 py-3">
              <div className="grid gap-0.5">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#6d7871]">
                  Session expires on
                </span>
                <span className="text-sm font-semibold text-[#2c3a33]">
                  {formatSessionExpiryDate(sessionExpiresAt)}
                </span>
              </div>
            </div>
          ) : null}

          {!oauthReady ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Facebook connect is not ready yet. Add these vars to `frontend/.env.local`:{" "}
                <strong>{missingConfig.join(", ")}</strong>
              </span>
            </div>
          ) : null}

          {showConnectedMessage ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Facebook page connected.</span>
            </div>
          ) : null}

          {showDisconnectedMessage ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Facebook page disconnected.</span>
            </div>
          ) : null}

          {showOauthError && oauthError ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formatOauthError(oauthError)}</span>
            </div>
          ) : null}

          {showOauthWarning && oauthWarning ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(188,145,74,0.24)] bg-[rgba(188,145,74,0.1)] px-3 py-2 text-sm text-[#7b5d22]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formatOauthWarning(oauthWarning)}</span>
            </div>
          ) : null}

          {disconnectError ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formatOauthError(disconnectError)}</span>
            </div>
          ) : null}

          {hasConnectedPage ? (
            <div className="rounded-md border border-[rgba(116,141,122,0.18)] bg-[rgba(144,168,147,0.08)] px-3 py-3 text-sm text-[#4f6354]">
              Connected page: <strong>{initialCredential.account_name || "Unnamed page"}</strong>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <FacebookPublishPanel jobs={jobs} posts={posts} />

      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-0 p-0">
          {postsError ? (
            <div className="mx-5 mt-5 flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{postsError}</span>
            </div>
          ) : null}
          {posts.length > 0 ? (
            posts.map((post, index) => (
              <article
                key={post.id}
                className={cn(
                  "grid gap-4 px-5 py-4",
                  index > 0 && "border-t border-[rgba(160,183,164,0.16)]",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-2">
                    <p className="max-w-[88ch] whitespace-pre-line text-[0.95rem] leading-7 text-[#334039]">
                      {post.message?.trim() || "This post has no text content."}
                    </p>
                    {post.created_time ? (
                      <span className="text-[0.82rem] text-[#7a847e]">
                        {formatPostDate(post.created_time)}
                      </span>
                    ) : null}
                  </div>
                  {post.permalink_url ? (
                    <a
                      href={post.permalink_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(160,183,164,0.16)] px-3 py-2 text-[0.82rem] font-medium text-[#4f6354] transition-colors hover:bg-[#f7faf7]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </a>
                  ) : null}
                </div>
                {post.full_picture && !brokenPostImages[post.id] ? (
                  <img
                    src={post.full_picture}
                    alt="Facebook post"
                    className="max-h-[320px] w-full rounded-xl border border-[rgba(160,183,164,0.16)] object-cover"
                    onError={() =>
                      setBrokenPostImages((current) => ({
                        ...current,
                        [post.id]: true,
                      }))
                    }
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-3 text-[0.82rem] text-[#66726b]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f7f5] px-3 py-1.5">
                    <Heart className="h-4 w-4" />
                    {post.reactions_count}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f7f5] px-3 py-1.5">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments_count}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f7f5] px-3 py-1.5">
                    <Share2 className="h-4 w-4" />
                    {post.shares_count}
                  </span>
                </div>
              </article>
            ))
          ) : !postsError ? (
            <div className="px-5 py-4 text-sm text-[#727975]">
              No page posts found yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
