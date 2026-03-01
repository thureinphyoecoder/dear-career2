import type { Job, JobsResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

const fallbackJobs: Job[] = [
  {
    id: 1,
    title: "Backend Developer",
    slug: "backend-developer",
    company: "Dear Career",
    location: "Bangkok",
    category: "white-collar",
    employment_type: "full-time",
    salary: "Competitive",
    source: "manual",
    source_url: "https://www.linkedin.com/jobs/view/backend-developer",
    description_mm: "Backend service development and API integration.",
  },
  {
    id: 2,
    title: "Content Operations Lead",
    slug: "content-operations-lead",
    company: "Dear Career",
    location: "Remote",
    category: "ngo",
    employment_type: "full-time",
    salary: "Negotiable",
    source: "jobthai",
    source_url: "https://example.org/jobs/content-operations-lead",
    description_mm: "Manage ingestion quality and publishing flow.",
  },
  {
    id: 3,
    title: "Warehouse Assistant",
    slug: "warehouse-assistant",
    company: "Summit Facilities",
    location: "Bago",
    category: "blue-collar",
    employment_type: "full-time",
    salary: "650,000 MMK",
    source: "manual",
    source_url: "https://www.linkedin.com/jobs/view/warehouse-assistant",
    description_mm: "Manage ingestion quality and publishing flow.",
  },
];

export async function getPublicJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      return fallbackJobs;
    }

    const data = (await response.json()) as JobsResponse;
    return data.results;
  } catch {
    return fallbackJobs;
  }
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const jobs = await getPublicJobs();
  return jobs.find((job) => job.slug === slug) ?? null;
}
