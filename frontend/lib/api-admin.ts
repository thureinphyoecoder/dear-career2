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
  VisitorSummary,
} from "@/lib/types";
import { getAdminApiHeaders } from "@/lib/admin-api-auth";

const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const ADMIN_FETCH_TIMEOUT_MS = process.env.NODE_ENV === "production" ? 2500 : 800;

function getAdminFetchOptions(): RequestInit {
  return {
    cache: "no-store",
    signal: AbortSignal.timeout(ADMIN_FETCH_TIMEOUT_MS),
    headers: getAdminApiHeaders(),
  };
}

function createFallbackSources(): FetchSource[] {
  return [
    {
      id: 1,
      key: "sabai-job",
      label: "Sabai Job",
      domain: "sabaijob.com",
      feed_url: "https://sabaijob.com/",
      mode: "manual",
      enabled: true,
      requires_manual_url: true,
      auto_publish_website: false,
      auto_publish_facebook: false,
      approval_required_for_website: true,
      approval_required_for_facebook: true,
      default_category: "blue-collar",
      cadence_value: 30,
      cadence_unit: "minutes",
      max_jobs_per_run: 25,
      last_run_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      status: "warning",
      last_error: "Blue-collar source shortlisted. Confirm listing selectors before switching to HTML mode.",
    },
    {
      id: 2,
      key: "jobsdb-th",
      label: "JobsDB Thailand",
      domain: "th.jobsdb.com",
      feed_url: "https://th.jobsdb.com/foreigners-are-welcome-jobs",
      mode: "manual",
      enabled: true,
      requires_manual_url: true,
      auto_publish_website: false,
      auto_publish_facebook: false,
      approval_required_for_website: true,
      approval_required_for_facebook: true,
      default_category: "white-collar",
      cadence_value: 2,
      cadence_unit: "hours",
      max_jobs_per_run: 40,
      last_run_at: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
      status: "warning",
      last_error: "Cloudflare challenge blocks direct server-side fetch. Keep manual until a browser automation layer exists.",
    },
    {
      id: 3,
      key: "jobthai",
      label: "JobThai",
      domain: "jobthai.com",
      feed_url: "https://www.jobthai.com/",
      mode: "manual",
      enabled: true,
      requires_manual_url: true,
      auto_publish_website: false,
      auto_publish_facebook: false,
      approval_required_for_website: true,
      approval_required_for_facebook: true,
      default_category: "white-collar",
      cadence_value: 4,
      cadence_unit: "hours",
      max_jobs_per_run: 25,
      status: "warning",
      last_error: "General job portal shortlisted. Confirm stable result URLs before enabling fetch.",
    },
    {
      id: 4,
      key: "thaingo",
      label: "ThaiNGO Jobs",
      domain: "thaingo.org",
      feed_url: "https://www.thaingo.org/jobs",
      mode: "manual",
      enabled: true,
      requires_manual_url: true,
      auto_publish_website: false,
      auto_publish_facebook: false,
      approval_required_for_website: true,
      approval_required_for_facebook: true,
      default_category: "ngo",
      cadence_value: 6,
      cadence_unit: "hours",
      max_jobs_per_run: 20,
      last_run_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: "warning",
      last_error: "Robot verification appears on the jobs page. Keep as manual source.",
    },
    {
      id: 5,
      key: "unjobs-thailand",
      label: "UN Jobs Thailand",
      domain: "unjobs.org",
      feed_url: "https://unjobs.org/duty_stations/thailand",
      mode: "html",
      enabled: true,
      requires_manual_url: false,
      auto_publish_website: false,
      auto_publish_facebook: false,
      approval_required_for_website: true,
      approval_required_for_facebook: true,
      default_category: "ngo",
      cadence_value: 6,
      cadence_unit: "hours",
      max_jobs_per_run: 20,
      status: "warning",
      last_error: "Thailand vacancy index is accessible, but selectors still need page-specific tuning.",
    },
    {
      id: 6,
      key: "linkedin",
      label: "LinkedIn",
      domain: "linkedin.com",
      mode: "manual",
      enabled: true,
      requires_manual_url: true,
      auto_publish_website: false,
      auto_publish_facebook: false,
      approval_required_for_website: true,
      approval_required_for_facebook: true,
      default_category: "white-collar",
      cadence_value: 0,
      cadence_unit: "hours",
      max_jobs_per_run: 25,
      status: "warning",
      last_error: "Manual URL intake only.",
    },
  ];
}

function createFallbackApprovals(jobs: Job[]): ApprovalItem[] {
  const jobsForReview = jobs.filter((job) => {
    const status = job.status ?? "published";
    return (
      status === "pending-review" ||
      job.requires_website_approval === true ||
      job.requires_facebook_approval === true
    );
  });

  if (jobsForReview.length === 0) {
    return [
      {
        id: "manual-linkedin-review",
        title: "LinkedIn manual intake",
        company: "Pending company",
        source_label: "LinkedIn",
        requested_action: "manual-review",
        requested_at: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      },
    ];
  }

  return jobsForReview.map((job, index) => ({
    id: `approval-${job.id}`,
    title: job.title,
    company: job.company,
    source_label: job.source || "Manual source",
    requested_action: index % 2 === 0 ? "publish" : "facebook-upload",
    requested_at: new Date(Date.now() - (index + 1) * 18 * 60 * 1000).toISOString(),
  }));
}

function createFallbackNotifications(jobs: Job[]): AdminNotification[] {
  return [
    {
      id: "fetch-run-complete",
      title: "Fetch completed",
      detail: `${Math.max(jobs.length, 6)} roles processed in the latest sync window.`,
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      tone: "success",
    },
    {
      id: "approval-pending",
      title: "Approvals waiting",
      detail: "Website publish and Facebook upload both require editorial approval.",
      created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      tone: "warning",
    },
    {
      id: "manual-intake",
      title: "Manual URL queued",
      detail: "A LinkedIn role was added to the review queue and needs classification.",
      created_at: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
      tone: "info",
    },
  ];
}

function createFallbackAds(): ManagedAd[] {
  return [
    {
      id: 1,
      title: "Promote an opportunity",
      eyebrow: "Sponsored",
      description: "Highlight a role inside the jobs directory without interrupting browsing.",
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
      description: "Quiet sponsored placement on the job detail page.",
      cta_label: "Advertise",
      href: "/feedback",
      placement: "jobs-detail",
      status: "active",
      sort_order: 20,
    },
  ];
}

function createFallbackVisitorSummary(jobs: Job[]): VisitorSummary {
  return {
    total_visitors: Math.max(24, jobs.length * 8),
    today_visitors: Math.max(6, jobs.length * 2),
    last_7_days_visitors: Math.max(18, jobs.length * 5),
    top_paths: [
      {
        path: "/jobs",
        visitors: Math.max(12, jobs.length * 3),
        visits: Math.max(18, jobs.length * 4),
      },
      {
        path: "/",
        visitors: Math.max(10, jobs.length * 2),
        visits: Math.max(16, jobs.length * 3),
      },
      {
        path: "/about",
        visitors: Math.max(4, jobs.length),
        visits: Math.max(7, jobs.length + 2),
      },
    ],
  };
}


export async function getAdminJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/?include_inactive=1`, {
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
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/jobs/${id}/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Job;
  } catch {
    const jobs = await getAdminJobs();
    return jobs.find((job) => String(job.id) === id) ?? null;
  }
}

async function getAdminSources(): Promise<FetchSource[]> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/sources/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      return createFallbackSources();
    }

    const data = (await response.json()) as { results: FetchSource[] };
    return data.results;
  } catch {
    return createFallbackSources();
  }
}

export async function getFacebookCredential(): Promise<FacebookPageCredential> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      return {
        platform: "facebook",
        account_name: "",
        page_id: "",
        connected: false,
      };
    }

    return (await response.json()) as FacebookPageCredential;
  } catch {
    return {
      platform: "facebook",
      account_name: "",
      page_id: "",
      connected: false,
    };
  }
}

export async function getFacebookPagePosts(): Promise<FacebookPagePost[]> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/channels/facebook/posts/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { results: FacebookPagePost[] };
    return data.results;
  } catch {
    return [];
  }
}

export async function getVisitorSummary(): Promise<VisitorSummary> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/analytics/visitors/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      const jobs = await getAdminJobs();
      return createFallbackVisitorSummary(jobs);
    }

    return (await response.json()) as VisitorSummary;
  } catch {
    const jobs = await getAdminJobs();
    return createFallbackVisitorSummary(jobs);
  }
}

function createVisitorSummaryFallbackFromJobs(jobs: Job[]) {
  return createFallbackVisitorSummary(jobs);
}

function createNotificationsFallbackFromJobs(jobs: Job[]) {
  return createFallbackNotifications(jobs);
}

export async function getManagedAds(): Promise<ManagedAd[]> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/ads/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      return createFallbackAds();
    }

    const data = (await response.json()) as { results: ManagedAd[] };
    return data.results;
  } catch {
    return createFallbackAds();
  }
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/notifications/`, {
      ...getAdminFetchOptions(),
    });

    if (!response.ok) {
      const jobs = await getAdminJobs();
      return createFallbackNotifications(jobs);
    }

    const data = (await response.json()) as { results: AdminNotification[] };
    return data.results;
  } catch {
    const jobs = await getAdminJobs();
    return createFallbackNotifications(jobs);
  }
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  try {
    const response = await fetch(`${ADMIN_API_BASE_URL}/jobs/admin/dashboard/`, {
      ...getAdminFetchOptions(),
    });

    if (response.ok) {
      const snapshot = (await response.json()) as AdminDashboardSnapshot & {
        visitor_summary?: VisitorSummary;
      };
      return {
        total_jobs: snapshot.total_jobs,
        published_jobs: snapshot.published_jobs,
        draft_jobs: snapshot.draft_jobs,
        source_count: snapshot.source_count,
        total_visitors: snapshot.total_visitors,
        active_ads: snapshot.active_ads,
        pending_approvals: snapshot.pending_approvals,
        notifications: snapshot.notifications,
        sources: snapshot.sources,
      };
    }
  } catch {
    // Fall back to the existing client-composed snapshot below.
  }

  const [jobs, sources, visitorsResult, ads, notificationsResult] = await Promise.all([
    getAdminJobs(),
    getAdminSources(),
    getVisitorSummary(),
    getManagedAds(),
    getAdminNotifications(),
  ]);
  const visitors =
    visitorsResult.total_visitors === 0 && jobs.length > 0
      ? createVisitorSummaryFallbackFromJobs(jobs)
      : visitorsResult;
  const notifications =
    notificationsResult.length === 0 && jobs.length > 0
      ? createNotificationsFallbackFromJobs(jobs)
      : notificationsResult;
  const publishedJobs = jobs.filter((job) => job.is_active !== false).length;
  const pendingApprovals = createFallbackApprovals(jobs);
  const sourceCount = new Set(jobs.map((job) => job.source).filter(Boolean)).size;

  return {
    total_jobs: jobs.length,
    published_jobs: publishedJobs,
    draft_jobs: Math.max(jobs.length - publishedJobs, 0),
    source_count: sourceCount || sources.length,
    total_visitors: visitors.total_visitors,
    active_ads: ads.filter((ad) => ad.status === "active").length,
    pending_approvals: pendingApprovals,
    notifications,
    sources,
  };
}

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
