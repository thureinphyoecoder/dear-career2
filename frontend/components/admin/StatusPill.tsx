import type { JobStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const toneClassMap: Record<JobStatus, string> = {
  draft: "bg-[rgba(204,165,92,0.14)] text-[#8a6120] border-[rgba(204,165,92,0.22)]",
  published: "bg-[rgba(76,145,118,0.14)] text-[#246245] border-[rgba(76,145,118,0.22)]",
  "pending-review": "bg-[rgba(204,165,92,0.14)] text-[#8a6120] border-[rgba(204,165,92,0.22)]",
};

const statusLabelMap: Record<JobStatus, string> = {
  draft: "Draft",
  published: "Published",
  "pending-review": "Pending",
};

export function StatusPill({ status = "draft" }: { status?: JobStatus }) {
  const resolvedStatus: JobStatus =
    status === "draft" || status === "published" || status === "pending-review"
      ? status
      : "draft";

  return (
    <Badge
      variant="secondary"
      className={`border px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.1em] ${toneClassMap[resolvedStatus]}`}
    >
      {statusLabelMap[resolvedStatus]}
    </Badge>
  );
}
