import { FacebookCredentialForm } from "@/components/admin/FacebookCredentialForm";
import { cookies } from "next/headers";
import { getAdminJobs, getFacebookCredential, getFacebookPagePostsState } from "@/lib/api-admin";
import { ADMIN_SESSION_COOKIE, parseAdminSessionToken } from "@/lib/admin-auth";
import type { FacebookConnectPageOption } from "@/lib/types";

const FACEBOOK_PAGES_COOKIE = "dear_career_fb_oauth_pages";

type PendingFacebookPageSelection = {
  pages?: Array<{ id?: string; name?: string }>;
};

export default async function AdminFacebookPage({
  searchParams,
}: {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
    warning?: string;
    select_page?: string;
  }>;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const rawPendingPages = cookieStore.get(FACEBOOK_PAGES_COOKIE)?.value ?? "";
  const adminSession = parseAdminSessionToken(sessionToken);
  const sessionSnapshotAt = Date.now();
  const [credential, postsState, jobs] = await Promise.all([
    getFacebookCredential(),
    getFacebookPagePostsState(),
    getAdminJobs(),
  ]);
  const params = await searchParams;
  const missingConfig: string[] = [];
  let pendingPages: FacebookConnectPageOption[] = [];
  const effectiveAppId = (credential.app_id || process.env.FACEBOOK_APP_ID || "").trim();
  const hasAppSecret =
    Boolean(credential.app_secret_configured) ||
    Boolean((process.env.FACEBOOK_APP_SECRET || "").trim());

  if (rawPendingPages) {
    try {
      const parsed = JSON.parse(decodeURIComponent(rawPendingPages)) as PendingFacebookPageSelection;
      pendingPages = (parsed.pages ?? [])
        .map((page) => ({
          id: String(page.id ?? "").trim(),
          name: String(page.name ?? "").trim(),
        }))
        .filter((page) => page.id && page.name);
    } catch {
      pendingPages = [];
    }
  }

  if (!effectiveAppId) {
    missingConfig.push("FACEBOOK_APP_ID");
  }
  if (!hasAppSecret) {
    missingConfig.push("FACEBOOK_APP_SECRET");
  }

  return (
    <div className="grid max-w-none gap-6 xl:pr-6">
      <FacebookCredentialForm
        initialCredential={credential}
        jobs={jobs.filter((job) => (job.status ?? "published") === "published")}
        posts={postsState.posts}
        postsError={postsState.error}
        oauthConnected={params.connected === "1"}
        disconnected={params.disconnected === "1"}
        oauthError={params.error}
        oauthWarning={params.warning}
        missingConfig={missingConfig}
        sessionExpiresAt={adminSession?.expiresAt}
        sessionSnapshotAt={sessionSnapshotAt}
        pendingPages={params.select_page === "1" ? pendingPages : []}
      />
    </div>
  );
}
