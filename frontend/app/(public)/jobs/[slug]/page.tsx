import Link from "next/link";
import { notFound } from "next/navigation";

import { getJobBySlug } from "@/lib/api-public";

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);

  if (!job) {
    notFound();
  }

  return (
    <main className="page-shell stack public-detail-page">
      <Link href="/jobs" className="muted detail-back-link">
        Back to jobs
      </Link>
      <section className="card card-pad stack detail-card">
        <div className="pill">{job.employment_type}</div>
        <div>
          <h1 className="section-title" style={{ marginBottom: 8 }}>
            {job.title}
          </h1>
          <p className="muted" style={{ margin: 0 }}>
            {job.company} · {job.location}
          </p>
        </div>
        <p style={{ margin: 0 }}>{job.salary || "Salary negotiable"}</p>
        <div className="stack">
          <h2 style={{ marginBottom: 0 }}>Description</h2>
          <p style={{ margin: 0 }}>
            {job.description_mm ||
              job.description_en ||
              "Detailed job content will appear here once connected to Django."}
          </p>
        </div>
      </section>
    </main>
  );
}
