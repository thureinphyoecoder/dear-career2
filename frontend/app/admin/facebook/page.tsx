import { FacebookCredentialForm } from "@/components/admin/FacebookCredentialForm";
import { cookies } from "next/headers";
import { getAdminJobs, getFacebookCredential, getFacebookPagePostsState } from "@/lib/api-admin";
import { ADMIN_SESSION_COOKIE, parseAdminSessionToken } from "@/lib/admin-auth";

export default async function AdminFacebookPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; disconnected?: string; error?: string; warning?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const adminSession = parseAdminSessionToken(sessionToken);
  const sessionSnapshotAt = Date.now();
  const [credential, postsState, jobs] = await Promise.all([
    getFacebookCredential(),
    getFacebookPagePostsState(),
    getAdminJobs(),
  ]);
  const params = await searchParams;
  const missingConfig: string[] = [];

  if (!process.env.FACEBOOK_APP_ID) {
    missingConfig.push("FACEBOOK_APP_ID");
  }
  if (!process.env.FACEBOOK_APP_SECRET) {
    missingConfig.push("FACEBOOK_APP_SECRET");
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    missingConfig.push("NEXT_PUBLIC_APP_URL");
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
      />
    </div>
  );
}
