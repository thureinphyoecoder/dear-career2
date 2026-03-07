"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Heart,
  KeyRound,
  Link2,
  LoaderCircle,
  LogOut,
  MessageCircle,
  Share2,
} from "lucide-react";

import { FacebookPublishPanel } from "@/components/admin/FacebookPublishPanel";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  FacebookConnectPageOption,
  FacebookPageCredential,
  FacebookPagePost,
  Job,
} from "@/lib/types";

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
  pendingPages = [],
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
  pendingPages?: FacebookConnectPageOption[];
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
  const [selectedPendingPageId, setSelectedPendingPageId] = useState(pendingPages[0]?.id ?? "");
  const [facebookAppId, setFacebookAppId] = useState(initialCredential.app_id ?? "");
  const [facebookAppSecret, setFacebookAppSecret] = useState("");
  const [configMessage, setConfigMessage] = useState("");
  const [configError, setConfigError] = useState("");
  const [isSavingConfig, startSavingConfig] = useTransition();

  useEffect(() => {
    setSelectedPendingPageId(pendingPages[0]?.id ?? "");
  }, [pendingPages]);

  useEffect(() => {
    setFacebookAppId(initialCredential.app_id ?? "");
  }, [initialCredential.app_id]);

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
    if (value === "facebook-page-selection-expired") {
      return "Facebook page selection expired. Connect the page again and choose the page you want to use.";
    }
    if (value === "facebook-page-selection-invalid") {
      return "The selected Facebook page is no longer available. Connect again and choose a page.";
    }
    if (value === "facebook-page-save-failed") {
      return "The selected Facebook page could not be saved. Try connecting again.";
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

  function formatConfigLabel(value: string) {
    if (value === "FACEBOOK_APP_ID") return "Facebook App ID";
    if (value === "FACEBOOK_APP_SECRET") return "Facebook App Secret";
    if (value === "NEXT_PUBLIC_APP_URL") return "App URL";
    return value.replace(/_/g, " ");
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

  function handleSaveFacebookConfig() {
    setConfigMessage("");
    setConfigError("");
    startSavingConfig(async () => {
      try {
        const response = await fetch("/api/admin/proxy/jobs/admin/channels/facebook/", {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            app_id: facebookAppId.trim(),
            ...(facebookAppSecret.trim() ? { app_secret: facebookAppSecret.trim() } : {}),
          }),
        });
        const text = await response.text();
        if (!response.ok) {
          setConfigError(text || "Unable to save Facebook app settings.");
          return;
        }
        setFacebookAppSecret("");
        setConfigMessage("Facebook app settings saved.");
        router.refresh();
      } catch {
        setConfigError("Unable to save Facebook app settings.");
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

          {hasConnectedPage && typeof sessionExpiresAt === "number" ? (
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
                Facebook connection is not available yet because required server settings are missing:
                {" "}
                <strong>{missingConfig.map(formatConfigLabel).join(", ")}</strong>
              </span>
            </div>
          ) : null}

          <div className="grid gap-3 rounded-md border border-[rgba(116,141,122,0.18)] bg-[rgba(144,168,147,0.08)] px-4 py-4">
            <div className="grid gap-0.5">
              <div className="inline-flex items-center gap-2 text-[0.76rem] uppercase tracking-[0.14em] text-[#6d7871]">
                <KeyRound className="h-3.5 w-3.5" />
                Facebook app
              </div>
              <span className="text-sm text-[#5f6d65]">
                Save the client&apos;s Facebook App ID and App Secret here, then connect any allowed account or page.
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm text-[#334039]">
                <span className="text-[0.76rem] uppercase tracking-[0.14em] text-[#7a847e]">App ID</span>
                <input
                  type="text"
                  value={facebookAppId}
                  onChange={(event) => setFacebookAppId(event.target.value)}
                  className="h-11 rounded-xl border border-[rgba(160,183,164,0.24)] bg-white px-3 text-[0.95rem] text-[#334039] outline-none"
                  placeholder="Enter Facebook App ID"
                />
              </label>
              <label className="grid gap-1 text-sm text-[#334039]">
                <span className="text-[0.76rem] uppercase tracking-[0.14em] text-[#7a847e]">
                  App Secret
                </span>
                <input
                  type="password"
                  value={facebookAppSecret}
                  onChange={(event) => setFacebookAppSecret(event.target.value)}
                  className="h-11 rounded-xl border border-[rgba(160,183,164,0.24)] bg-white px-3 text-[0.95rem] text-[#334039] outline-none"
                  placeholder={
                    initialCredential.app_secret_configured
                      ? "Saved. Enter a new secret only if you want to replace it."
                      : "Enter Facebook App Secret"
                  }
                />
              </label>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-[#5f6d65]">
                {initialCredential.app_secret_configured
                  ? "App secret is already stored securely."
                  : "App secret is not saved yet."}
              </span>
              <button
                type="button"
                onClick={handleSaveFacebookConfig}
                disabled={isSavingConfig || !facebookAppId.trim()}
                className={cn(buttonVariants({ variant: "secondary" }), "rounded-md")}
              >
                {isSavingConfig ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                {isSavingConfig ? "Saving..." : "Save app settings"}
              </button>
            </div>
            {configMessage ? (
              <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{configMessage}</span>
              </div>
            ) : null}
            {configError ? (
              <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{configError}</span>
              </div>
            ) : null}
          </div>

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

          {pendingPages.length > 0 ? (
            <form
              action="/api/admin/facebook/select-page"
              method="post"
              className="grid gap-3 rounded-md border border-[rgba(116,141,122,0.18)] bg-[rgba(144,168,147,0.08)] px-4 py-4"
            >
              <div className="grid gap-0.5">
                <strong className="text-[0.95rem] font-semibold text-[#334039]">
                  Choose a Facebook page
                </strong>
                <span className="text-sm text-[#5f6d65]">
                  Finish the connection by selecting the page you want to manage.
                </span>
              </div>
              <select
                name="page_id"
                value={selectedPendingPageId}
                onChange={(event) => setSelectedPendingPageId(event.target.value)}
                className="h-11 rounded-xl border border-[rgba(160,183,164,0.24)] bg-white px-3 text-[0.95rem] text-[#334039] outline-none"
              >
                {pendingPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end">
                <button type="submit" className={cn(buttonVariants(), "rounded-md")}>
                  Connect selected page
                </button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <FacebookPublishPanel
        jobs={jobs}
        posts={posts}
        canPublish={hasConnectedPage && oauthReady}
        publishDisabledReason={
          !oauthReady
            ? "Complete the Facebook server settings before connecting a page."
            : !hasConnectedPage
              ? "Connect a Facebook page to enable posting."
              : ""
        }
      />

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
