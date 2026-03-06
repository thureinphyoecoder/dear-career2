import type { Job, JobsResponse, ManagedAd, ManagedAdPlacement } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

function resolveAssetUrl(value?: string) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  if (value.startsWith("/")) {
    return `${API_ORIGIN}${value}`;
  }
  return value;
}

function normalizeJob(job: Job): Job {
  const image_file_url = resolveAssetUrl(job.image_file_url);
  const image_url = resolveAssetUrl(job.image_url);
  const display_image_url =
    resolveAssetUrl(job.display_image_url) || image_file_url || image_url;

  return {
    ...job,
    image_url,
    image_file_url,
    display_image_url,
  };
}

export async function getPublicJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as JobsResponse;
    return data.results.map(normalizeJob);
  } catch {
    return [];
  }
}

export async function getJobBySlug(slug: string): Promise<Job | null> {
  const jobs = await getPublicJobs();
  return jobs.find((job) => job.slug === slug) ?? null;
}

export async function getPublicAds(
  placements?: ManagedAdPlacement[],
): Promise<ManagedAd[]> {
  try {
    const placementQuery =
      placements && placements.length > 0
        ? `?placements=${placements.join(",")}`
        : "";
    const response = await fetch(`${API_BASE_URL}/jobs/ads/${placementQuery}`, {
      next: { revalidate: 120 },
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { results: ManagedAd[] };
    return data.results;
  } catch {
    return [];
  }
}
