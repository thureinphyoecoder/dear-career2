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
    <main className="mx-auto max-w-6xl px-4 pb-20 pt-32">
      <header className="grid gap-4 border-b border-[rgba(160,183,164,0.16)] pb-6">
        <div className="flex items-end justify-between gap-6">
          <div className="grid gap-2">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Jobs Directory</div>
            <h1 className="m-0 font-serif text-[clamp(2.4rem,4vw,4.5rem)] font-medium leading-[0.94] tracking-[-0.04em] text-foreground">
              Thailand job listings, arranged with less noise.
            </h1>
            {query ? (
              <p className="m-0 text-sm leading-7 text-[#727975]">Showing results for "{params.q}"</p>
            ) : (
              <p className="m-0 max-w-[58ch] text-sm leading-7 text-[#727975]">
                Browse by category and read the essentials first. Only the actual listings use cards.
              </p>
            )}
          </div>
          <div className="min-w-[140px] text-right">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">Results</div>
            <div className="mt-2 text-[2rem] font-semibold leading-none text-foreground">
              {filteredJobs.length}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-3 gap-6 border-b border-[rgba(160,183,164,0.14)] pb-6">
        {jobsByCategory.map((section) => (
          <div key={section.key} className="grid gap-2">
            <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">{section.key}</div>
            <div className="flex items-end justify-between gap-4 border-b border-[rgba(160,183,164,0.12)] pb-3">
              <strong className="text-[1.02rem] font-semibold text-foreground">{section.title}</strong>
              <span className="text-sm text-[#727975]">{section.jobs.length}</span>
            </div>
            <p className="m-0 text-sm leading-6 text-[#727975]">{section.description}</p>
          </div>
        ))}
      </div>

      {jobsByCategory.map((section) =>
        section.jobs.length > 0 ? (
          <section key={section.key} className="mt-10 grid gap-5">
            <div className="flex items-end justify-between gap-6 border-b border-[rgba(160,183,164,0.14)] pb-4">
              <div className="grid gap-2">
                <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">{section.key}</div>
                <h2 className="m-0 font-serif text-[clamp(1.7rem,3vw,2.5rem)] font-medium leading-[1.02] tracking-[-0.03em] text-foreground">
                  {section.title}
                </h2>
                <p className="m-0 text-sm leading-6 text-[#727975]">{section.description}</p>
              </div>
              <span className="text-sm text-[#727975]">{section.jobs.length} jobs</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {section.jobs.map((job) => (
                <div key={job.id}>
                  <JobCard job={job} />
                </div>
              ))}
            </div>
          </section>
        ) : null,
      )}
      {filteredJobs.length === 0 ? (
        <div className="mt-6 border-t border-[rgba(160,183,164,0.16)] pt-6">
          <div className="text-xs uppercase tracking-[0.16em] text-[#8da693]">No results</div>
          <p className="mb-0 mt-2 text-sm leading-7 text-[#727975]">
            No jobs matched "{params.q}". Try another keyword, company, or
            location.
          </p>
        </div>
      ) : null}
    </main>
  );
}
