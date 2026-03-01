import { JobCard } from "@/components/public/JobCard";
import { getPublicJobs } from "@/lib/api-public";
import type { JobCategory } from "@/lib/types";

const categorySections: Array<{
  key: JobCategory;
  title: string;
  description: string;
}> = [
  {
    key: "ngo",
    title: "NGO Jobs",
    description: "Development, humanitarian, education, and community roles.",
  },
  {
    key: "white-collar",
    title: "White Collar Jobs",
    description: "Office, management, operations, finance, and digital roles.",
  },
  {
    key: "blue-collar",
    title: "Blue Collar Jobs",
    description: "Field, warehouse, driver, technician, and hands-on roles.",
  },
];

type PublicJobsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function PublicJobsPage({
  searchParams,
}: PublicJobsPageProps) {
  const jobs = await getPublicJobs();
  const params = (await searchParams) ?? {};
  const query = params.q?.trim().toLowerCase() ?? "";
  const filteredJobs = query
    ? jobs.filter((job) =>
        [
          job.title,
          job.company,
          job.location,
          job.category,
          job.description_en ?? "",
          job.description_mm ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
    : jobs;
  const jobsByCategory = categorySections.map((section) => ({
    ...section,
    jobs: filteredJobs.filter((job) => job.category === section.key),
  }));

  return (
    <main className="page-shell stack public-jobs-page">
      <div className="toolbar public-list-header">
        <div>
          <h1 className="section-title" style={{ marginBottom: 0 }}>
            Jobs
          </h1>
          {query ? (
            <p className="public-summary-copy">
              Showing results for "{params.q}"
            </p>
          ) : null}
        </div>
        <span className="muted public-list-count">{filteredJobs.length} results</span>
      </div>
      <div className="public-category-strip">
        {jobsByCategory.map((section) => (
          <div key={section.key} className="public-category-pill">
            <span>{section.title}</span>
            <strong>{section.jobs.length}</strong>
          </div>
        ))}
      </div>
      {jobsByCategory.map((section) =>
        section.jobs.length > 0 ? (
          <section key={section.key} className="public-category-section stack">
            <div className="public-category-header">
              <div>
                <div className="eyebrow">{section.key}</div>
                <h2 className="public-category-title">{section.title}</h2>
                <p className="public-footer-copy">{section.description}</p>
              </div>
              <span className="muted">{section.jobs.length} jobs</span>
            </div>
            <div className="grid job-grid">
              {section.jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        ) : null,
      )}
      {filteredJobs.length === 0 ? (
        <div className="card public-empty-state">
          <div className="eyebrow">No results</div>
          <p className="public-footer-copy">
            No jobs matched "{params.q}". Try another keyword, company, or
            location.
          </p>
        </div>
      ) : null}
    </main>
  );
}
