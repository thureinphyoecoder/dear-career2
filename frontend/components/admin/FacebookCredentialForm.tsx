"use client";

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Heart,
  Link2,
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
  oauthConnected = false,
  oauthError,
  missingConfig = [],
}: {
  initialCredential: FacebookPageCredential;
  jobs: Job[];
  posts: FacebookPagePost[];
  oauthConnected?: boolean;
  oauthError?: string;
  missingConfig?: string[];
}) {
  const hasConnectedPage = Boolean(initialCredential.page_id && initialCredential.access_token);
  const oauthReady = missingConfig.length === 0;
  const buttonLabel = hasConnectedPage ? "Reconnect page" : "Connect page";

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

  function formatPostDate(value?: string) {
    if (!value) return "";

    try {
      return new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return "";
    }
  }

  return (
    <div className="grid gap-6">
      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {initialCredential.profile_image_url ? (
                <img
                  src={initialCredential.profile_image_url}
                  alt={initialCredential.profile_name || initialCredential.account_name || "Facebook profile"}
                  className="h-12 w-12 rounded-full object-cover"
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
          </div>

          {!oauthReady ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Facebook connect is not ready yet. Add these vars to `frontend/.env.local`:{" "}
                <strong>{missingConfig.join(", ")}</strong>
              </span>
            </div>
          ) : null}

          {oauthConnected ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(116,141,122,0.2)] bg-[rgba(144,168,147,0.1)] px-3 py-2 text-sm text-[#4f6354]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Facebook page connected.</span>
            </div>
          ) : null}

          {oauthError ? (
            <div className="flex items-start gap-2 rounded-md border border-[rgba(169,97,111,0.22)] bg-[rgba(169,97,111,0.08)] px-3 py-2 text-sm text-[#8e4a4a]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formatOauthError(oauthError)}</span>
            </div>
          ) : null}

          {hasConnectedPage ? (
            <div className="rounded-md border border-[rgba(116,141,122,0.18)] bg-[rgba(144,168,147,0.08)] px-3 py-3 text-sm text-[#4f6354]">
              Connected page: <strong>{initialCredential.account_name || "Unnamed page"}</strong>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <FacebookPublishPanel jobs={jobs} />

      <Card className="border-[rgba(160,183,164,0.16)] bg-[rgba(255,255,255,0.92)] shadow-none">
        <CardContent className="grid gap-0 p-0">
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
                {post.full_picture ? (
                  <img
                    src={post.full_picture}
                    alt="Facebook post"
                    className="max-h-[320px] w-full rounded-xl border border-[rgba(160,183,164,0.16)] object-cover"
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
          ) : (
            <div className="px-5 py-4 text-sm text-[#727975]">
              No page posts found yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
