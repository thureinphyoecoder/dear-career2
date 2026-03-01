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
    <div className="stack">
      <div>
        <div className="eyebrow">Edit or view</div>
        <h1 style={{ marginBottom: 0 }}>
          {job ? job.title : `Job #${id}`}
        </h1>
      </div>
      <JobEditor initialJob={job ?? { title: `Job #${id}` }} />
    </div>
  );
}
