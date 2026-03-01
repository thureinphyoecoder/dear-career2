import type {
  AdminDashboardSnapshot,
  AdminNotification,
  ApprovalItem,
  FetchSettings,
  FetchSource,
  Job,
  JobsResponse,
} from "@/lib/types";

const ADMIN_API_BASE_URL =
  process.env.DJANGO_ADMIN_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const ADMIN_FETCH_TIMEOUT_MS = 2500;

function getAdminFetchOptions(): RequestInit {
  return {
    cache: "no-store",
    signal: AbortSignal.timeout(ADMIN_FETCH_TIMEOUT_MS),
  };
}

function createFallbackSources(): FetchSource[] {
  return [
    {
      id: "jobthai",
      label: "JobThai",
      domain: "jobthai.com",
      mode: "crawler",
      enabled: true,
      requires_manual_url: false,
      default_category: "white-collar",
      cadence_value: 30,
      cadence_unit: "minutes",
      last_run_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      status: "healthy",
    },
    {
      id: "jobsdb-th",
      label: "JobsDB Thailand",
      domain: "th.jobsdb.com",
      mode: "crawler",
      enabled: true,
      requires_manual_url: false,
      default_category: "white-collar",
      cadence_value: 2,
      cadence_unit: "hours",
      last_run_at: new Date(Date.now() - 62 * 60 * 1000).toISOString(),
      status: "healthy",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      domain: "linkedin.com",
      mode: "manual",
      enabled: true,
      requires_manual_url: true,
      default_category: "white-collar",
      cadence_value: 0,
      cadence_unit: "hours",
      status: "warning",
    },
    {
      id: "ngo-board",
      label: "NGO Board",
      domain: "ngoboard.org",
      mode: "manual",
      enabled: true,
      requires_manual_url: true,
      default_category: "ngo",
      cadence_value: 12,
      cadence_unit: "hours",
      last_run_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      status: "paused",
    },
  ];
}

function createFallbackApprovals(jobs: Job[]): ApprovalItem[] {
  const jobsForReview = jobs.slice(0, 3);

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

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  const jobs = await getAdminJobs();
  const publishedJobs = jobs.filter((job) => job.is_active !== false).length;
  const sourceCount = new Set(jobs.map((job) => job.source).filter(Boolean)).size;
  const sources = createFallbackSources();

  return {
    total_jobs: jobs.length,
    published_jobs: publishedJobs,
    draft_jobs: Math.max(jobs.length - publishedJobs, 0),
    source_count: sourceCount || sources.length,
    pending_approvals: createFallbackApprovals(jobs),
    notifications: createFallbackNotifications(jobs),
    sources,
  };
}

export async function getFetchSettings(): Promise<FetchSettings> {
  const sources = createFallbackSources();

  return {
    cadence_value: 30,
    cadence_unit: "minutes",
    max_jobs_per_run: 40,
    approval_required_for_website: true,
    approval_required_for_facebook: true,
    facebook_auto_upload: false,
    realtime_notifications: true,
    sources,
  };
}
