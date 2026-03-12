import { cache } from "react";

import type {
  AdminDashboardSnapshot,
  AdminNotification,
  ApprovalItem,
  FacebookPageCredential,
  FacebookPagePost,
  FetchSettings,
  FetchSource,
  Job,
  JobsResponse,
  ManagedAd,
  JobReport,
  VisitorSummary,
  CvGuideContent,
} from "@/lib/types";
import { getAdminApiHeaders } from "@/lib/admin-api-auth";

const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const ADMIN_FETCH_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 10000 : 1200;
const ADMIN_DASHBOARD_FETCH_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 8000 : 1200;
const ADMIN_JOBS_FETCH_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 10000 : 1200;
const ADMIN_REVALIDATE_SECONDS = process.env.NODE_ENV === "production" ? 15 : 5;

function getAdminFetchOptions(timeoutMs: number = ADMIN_FETCH_TIMEOUT_MS): RequestInit {
  return {
    signal: AbortSignal.timeout(timeoutMs),
    headers: getAdminApiHeaders(),
    cache: "no-store",
    next: { revalidate: ADMIN_REVALIDATE_SECONDS },
  };
}

async function fetchAdmin(url: string, timeoutMs?: number) {
  return fetch(url, {
    ...getAdminFetchOptions(timeoutMs),
  });
}

function emptyVisitorSummary(): VisitorSummary {
  return {
    total_visitors: 0,
    today_visitors: 0,
    last_7_days_visitors: 0,
    top_paths: [],
  };
}

function buildApprovalsFromJobs(jobs: Job[]): ApprovalItem[] {
  const isPublished = (job: Job) =>
    (job.status ?? "published") === "published" &&
    job.is_active !== false &&
    job.requires_website_approval !== true &&
    job.requires_facebook_approval !== true;
  const isDraft = (job: Job) => (job.status ?? "published") === "draft";

  return jobs
    .filter((job) => !isPublished(job) && !isDraft(job))
    .slice(0, 20)
    .map((job) => {
      let requestedAction: ApprovalItem["requested_action"] = "manual-review";
      if (job.requires_website_approval || job.status === "pending-review") {
        requestedAction = "publish";
      } else if (job.requires_facebook_approval) {
        requestedAction = "facebook-upload";
      }

      return {
        id: `approval-${job.id}`,
        title: job.title,
        company: job.company,
        source_label: job.source || "Manual source",
        requested_action: requestedAction,
        requested_at: job.updated_at || job.created_at || new Date(0).toISOString(),
      };
    });
}

type GetAdminJobsOptions = {
  compact?: boolean;
};

export async function getAdminJobs(options: GetAdminJobsOptions = {}): Promise<Job[]> {
  try {
    const compact = options.compact ?? true;
    const response = await fetchAdmin(
      `${ADMIN_API_BASE_URL}/jobs/?include_inactive=1${compact ? "&compact=1" : ""}`,
      ADMIN_JOBS_FETCH_TIMEOUT_MS,
    );

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
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/jobs/${id}/`);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Job;
  } catch {
    return null;
  }
}

async function getAdminSources(): Promise<FetchSource[]> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/sources/`);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { results: FetchSource[] };
    return data.results;
  } catch {
    return [];
  }
}

const getFacebookCredentialRaw = async (): Promise<FacebookPageCredential> => {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/`);

    if (!response.ok) {
      return {
        platform: "facebook",
        account_name: "",
        app_id: "",
        app_secret_configured: false,
        page_id: "",
        connected: false,
      };
    }

    return (await response.json()) as FacebookPageCredential;
  } catch {
    return {
      platform: "facebook",
      account_name: "",
      app_id: "",
      app_secret_configured: false,
      page_id: "",
      connected: false,
    };
  }
};

export const getFacebookCredential = cache(getFacebookCredentialRaw);

export async function getFacebookPagePosts(): Promise<FacebookPagePost[]> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/posts/`);

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Unable to load Facebook posts.");
    }

    const data = (await response.json()) as { results: FacebookPagePost[] };
    return data.results;
  } catch {
    return [];
  }
}

export async function getFacebookPagePostsState(): Promise<{
  posts: FacebookPagePost[];
  error: string;
}> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/posts/`);

    if (!response.ok) {
      const detail = await response.text();
      return {
        posts: [],
        error: detail || "Unable to load Facebook posts.",
      };
    }

    const data = (await response.json()) as { results: FacebookPagePost[] };
    return {
      posts: data.results,
      error: "",
    };
  } catch (error) {
    return {
      posts: [],
      error: error instanceof Error ? error.message : "Unable to load Facebook posts.",
    };
  }
}

export async function getVisitorSummary(): Promise<VisitorSummary> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/analytics/visitors/`);

    if (!response.ok) {
      return emptyVisitorSummary();
    }

    return (await response.json()) as VisitorSummary;
  } catch {
    return emptyVisitorSummary();
  }
}

export async function getManagedAds(): Promise<ManagedAd[]> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/ads/`);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { results: ManagedAd[] };
    return data.results;
  } catch {
    return [];
  }
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/notifications/`);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { results: AdminNotification[] };
    return data.results;
  } catch {
    return [];
  }
}

const getAdminDashboardSnapshotRaw = async (): Promise<AdminDashboardSnapshot> => {
  try {
    const response = await fetchAdmin(
      `${ADMIN_API_BASE_URL}/jobs/admin/dashboard/`,
      ADMIN_DASHBOARD_FETCH_TIMEOUT_MS,
    );

    if (response.ok) {
      const snapshot = (await response.json()) as AdminDashboardSnapshot;
      return {
        total_jobs: snapshot.total_jobs,
        published_jobs: snapshot.published_jobs,
        draft_jobs: snapshot.draft_jobs,
        pending_count: snapshot.pending_count,
        source_count: snapshot.source_count,
        total_visitors: snapshot.total_visitors,
        active_ads: snapshot.active_ads,
        pending_approvals: snapshot.pending_approvals,
        notifications: snapshot.notifications,
        sources: snapshot.sources,
        visitor_summary: snapshot.visitor_summary ?? emptyVisitorSummary(),
      };
    }
  } catch {
    // Fall back to the composed snapshot below.
  }

  const [jobs, sources, visitors, ads, notifications] = await Promise.all([
    getAdminJobs(),
    getAdminSources(),
    getVisitorSummary(),
    getManagedAds(),
    getAdminNotifications(),
  ]);

  const pendingApprovals = buildApprovalsFromJobs(jobs);
  const publishedJobs = jobs.filter(
    (job) =>
      (job.status ?? "published") === "published" &&
      job.is_active !== false &&
      job.requires_website_approval !== true,
  ).length;
  const draftJobs = jobs.filter((job) => (job.status ?? "published") === "draft").length;
  const pendingCount = Math.max(0, jobs.length - publishedJobs - draftJobs);

  return {
    total_jobs: jobs.length,
    published_jobs: publishedJobs,
    draft_jobs: draftJobs,
    pending_count: pendingCount,
    source_count: sources.length,
    total_visitors: visitors.total_visitors,
    active_ads: ads.filter((ad) => ad.status === "active").length,
    pending_approvals: pendingApprovals,
    notifications,
    sources,
    visitor_summary: visitors,
  };
};

export const getAdminDashboardSnapshot = cache(getAdminDashboardSnapshotRaw);

export async function getFetchSettings(): Promise<FetchSettings> {
  const [sources, facebook] = await Promise.all([getAdminSources(), getFacebookCredential()]);
  const firstSource = sources[0];

  return {
    cadence_value: firstSource?.cadence_value ?? 30,
    cadence_unit: firstSource?.cadence_unit ?? "minutes",
    max_jobs_per_run: firstSource?.max_jobs_per_run ?? 40,
    approval_required_for_website:
      firstSource?.approval_required_for_website ?? true,
    approval_required_for_facebook:
      firstSource?.approval_required_for_facebook ?? true,
    facebook_auto_upload: firstSource?.auto_publish_facebook ?? false,
    realtime_notifications: true,
    sources,
    facebook,
  };
}

export async function getAdminJobReports(): Promise<JobReport[]> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/reports/`);
    if (!response.ok) {
      return [];
    }
    const data = (await response.json()) as { results: JobReport[] };
    return data.results;
  } catch {
    return [];
  }
}

export async function getAdminCvGuideContent(): Promise<CvGuideContent | null> {
  try {
    const response = await fetchAdmin(`${ADMIN_API_BASE_URL}/jobs/admin/cv-guide/`);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CvGuideContent;
  } catch {
    return null;
  }
}
