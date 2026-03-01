import type { JobStatus } from "@/lib/types";

const toneMap: Record<JobStatus, string> = {
  draft: "#b45309",
  published: "#0f766e",
  archived: "#6b7280",
};

export function StatusPill({ status = "draft" }: { status?: JobStatus }) {
  return (
    <span
      className="pill"
      style={{
        color: toneMap[status],
        border: `1px solid ${toneMap[status]}33`,
      }}
    >
      {status}
    </span>
  );
}
