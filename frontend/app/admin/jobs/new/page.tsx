import { JobEditor } from "@/components/admin/JobEditor";

export default function AdminNewJobPage() {
  return (
    <div className="grid max-w-[980px] gap-5">
      <div>
        <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Create</div>
        <h1 className="mt-1 text-[clamp(1.7rem,2.4vw,2.2rem)] font-semibold leading-none text-foreground">
          New job
        </h1>
      </div>
      <JobEditor />
    </div>
  );
}
