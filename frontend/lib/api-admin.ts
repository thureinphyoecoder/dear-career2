import type { Job, JobsResponse } from "@/lib/types";

const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const ADMIN_FETCH_TIMEOUT_MS = 2500;

function getAdminFetchOptions(): RequestInit {
  return {
    cache: "no-store",
    signal: AbortSignal.timeout(ADMIN_FETCH_TIMEOUT_MS),
  };
}

export async function getAdminJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as JobsResponse;
    return data.results;
  } catch {
    return [];
  }
}

export async function getAdminJob(id: string): Promise<Job | null> {
  const jobs = await getAdminJobs();
  return jobs.find((job) => String(job.id) === id) ?? null;
}
