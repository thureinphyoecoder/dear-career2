import { ApprovalQueue } from "@/components/admin/ApprovalQueue";
import { getAdminJobs } from "@/lib/api-admin";

export default async function AdminApprovalsPage() {
  const jobs = await getAdminJobs();
  const pendingJobs = jobs.filter((job) => {
    const status = job.status ?? "published";
    return (
      status === "pending-review" ||
      job.requires_website_approval === true ||
      job.requires_facebook_approval === true
    );
  });

  return (
    <div className="grid max-w-none gap-6 xl:pr-6">
      <header className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Approvals</div>
        <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          Approvals
        </h1>
        <p className="max-w-[48ch] text-[0.92rem] leading-6 text-[#727975]">
          Review items waiting for website or Facebook publishing approval.
        </p>
      </header>

      <ApprovalQueue jobs={pendingJobs} />
    </div>
  );
}
