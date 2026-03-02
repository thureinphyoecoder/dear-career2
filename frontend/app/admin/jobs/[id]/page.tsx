import { JobEditor } from "@/components/admin/JobEditor";
import { getAdminJob } from "@/lib/api-admin";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getAdminJob(id);

  return (
    <div className="grid max-w-[1360px] gap-5">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Edit or view</div>
        <h1 className="mt-1 text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          {job ? job.title : `Job #${id}`}
        </h1>
      </div>
      <JobEditor initialJob={job ?? { title: `Job #${id}` }} />
    </div>
  );
}
