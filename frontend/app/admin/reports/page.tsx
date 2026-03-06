import { ReportsQueue } from "@/components/admin/ReportsQueue";
import { getAdminJobReports } from "@/lib/api-admin";

export default async function AdminReportsPage() {
  const reports = await getAdminJobReports();

  return (
    <div className="grid max-w-none gap-6 xl:pr-6">
      <header className="grid gap-2">
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Moderation</div>
        <h1 className="text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          Job Reports
        </h1>
        <p className="max-w-[54ch] text-[0.92rem] leading-6 text-[#727975]">
          Review user-submitted reports from job detail pages and mark each item as reviewed or resolved.
        </p>
      </header>
      <ReportsQueue initialReports={reports} />
    </div>
  );
}
