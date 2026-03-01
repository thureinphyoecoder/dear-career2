import type { JobStatus } from "@/lib/types";

const toneClassMap: Record<JobStatus, string> = {
  draft: "is-draft",
  published: "is-published",
  archived: "is-archived",
};

export function StatusPill({ status = "draft" }: { status?: JobStatus }) {
  return <span className={`admin-status-pill ${toneClassMap[status]}`}>{status}</span>;
}
