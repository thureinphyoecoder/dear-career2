import type { JobStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const toneClassMap: Record<JobStatus, string> = {
  draft: "bg-[rgba(204,165,92,0.14)] text-[#8a6120] border-[rgba(204,165,92,0.22)]",
  published: "bg-[rgba(76,145,118,0.14)] text-[#246245] border-[rgba(76,145,118,0.22)]",
  archived: "bg-[rgba(114,121,117,0.14)] text-[#59605d] border-[rgba(114,121,117,0.22)]",
  "pending-review": "bg-[rgba(204,165,92,0.14)] text-[#8a6120] border-[rgba(204,165,92,0.22)]",
};

export function StatusPill({ status = "draft" }: { status?: JobStatus }) {
  return (
    <Badge
      variant="secondary"
      className={`border px-2.5 py-1 text-[0.72rem] uppercase tracking-[0.1em] ${toneClassMap[status]}`}
    >
      {status}
    </Badge>
  );
}
