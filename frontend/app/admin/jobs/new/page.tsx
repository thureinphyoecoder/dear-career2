import { JobEditor } from "@/components/admin/JobEditor";

export default function AdminNewJobPage() {
  return (
    <div className="stack">
      <div>
        <div className="eyebrow">Create</div>
        <h1 style={{ marginBottom: 0 }}>New job</h1>
      </div>
      <JobEditor />
    </div>
  );
}
