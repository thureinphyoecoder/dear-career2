import type { Job, JobsResponse, ManagedAd, ManagedAdPlacement } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

const fallbackJobs: Job[] = [
  {
    id: 1,
    title: "Programme Coordinator",
    slug: "programme-coordinator",
    company: "Thai Humanitarian Network",
    location: "Bangkok",
    category: "ngo",
    employment_type: "full-time",
    source: "manual",
    source_url: "https://example.org/programme-coordinator",
    description_mm: "Coordinate NGO field programmes and partner reporting in Thailand.",
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 2,
    title: "Community Outreach Officer",
    slug: "community-outreach-officer",
    company: "Migrant Support Alliance",
    location: "Mae Sot",
    category: "ngo",
    employment_type: "full-time",
    source: "manual",
    source_url: "https://example.org/community-outreach-officer",
    description_mm: "Support migrant communities through outreach, case coordination, and referral work.",
    created_at: new Date(Date.now() - 1000 * 60 * 56).toISOString(),
  },
  {
    id: 3,
    title: "Monitoring and Evaluation Assistant",
    slug: "monitoring-and-evaluation-assistant",
    company: "Inclusive Futures Foundation",
    location: "Chiang Mai",
    category: "ngo",
    employment_type: "full-time",
    source: "manual",
    source_url: "https://example.org/monitoring-evaluation-assistant",
    description_mm: "Track programme metrics, compile field updates, and assist evaluation reporting.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 4,
    title: "Backend Developer",
    slug: "backend-developer",
    company: "Dear Career",
    location: "Bangkok",
    category: "white-collar",
    employment_type: "full-time",
    source: "manual",
    source_url: "https://www.linkedin.com/jobs/view/backend-developer",
    description_mm: "Backend service development and API integration.",
    created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
  {
    id: 5,
    title: "Warehouse Assistant",
    slug: "warehouse-assistant",
    company: "Summit Facilities",
    location: "Bago",
    category: "blue-collar",
    employment_type: "full-time",
    source: "manual",
    source_url: "https://www.linkedin.com/jobs/view/warehouse-assistant",
    description_mm: "Manage ingestion quality and publishing flow.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
];

const fallbackAds: ManagedAd[] = [
  {
    id: 1,
    title: "Promote an opportunity",
    eyebrow: "Sponsored",
    description: "A single sponsored slot appears inside the listings without interrupting browsing.",
    cta_label: "Book slot",
    href: "/feedback",
    placement: "jobs-inline",
    status: "active",
    sort_order: 10,
  },
  {
    id: 2,
    title: "Promote a vacancy here",
    eyebrow: "Sponsored",
    description: "A quiet sponsored slot can appear on job detail pages without overwhelming the listing.",
    cta_label: "Advertise",
    href: "/feedback",
    placement: "jobs-detail",
    status: "active",
    sort_order: 20,
  },
  {
    id: 3,
    title: "Advertise with us",
    eyebrow: "Sponsored",
    description: "Feature urgent roles, announcements, or employer campaigns near the jobs search flow.",
    cta_label: "Open feedback",
    href: "/feedback",
    placement: "jobs-search",
    status: "active",
    sort_order: 5,
  },
];

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

    if (!response.ok) {
      return fallbackJobs;
    }

    const data = (await response.json()) as JobsResponse;
    return data.results.map(normalizeJob);
  } catch {
    return fallbackJobs;
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

    if (!response.ok) {
      return fallbackAds.filter((ad) =>
        placements && placements.length > 0 ? placements.includes(ad.placement) : true,
      );
    }

    const data = (await response.json()) as { results: ManagedAd[] };
    return data.results;
  } catch {
    return fallbackAds.filter((ad) =>
      placements && placements.length > 0 ? placements.includes(ad.placement) : true,
    );
  }
}
