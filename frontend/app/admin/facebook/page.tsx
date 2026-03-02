import { FacebookCredentialForm } from "@/components/admin/FacebookCredentialForm";
import { getAdminJobs, getFacebookCredential, getFacebookPagePostsState } from "@/lib/api-admin";

export default async function AdminFacebookPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
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
        oauthError={params.error}
        missingConfig={missingConfig}
      />
    </div>
  );
}
