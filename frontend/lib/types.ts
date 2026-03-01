export type JobStatus = "draft" | "published" | "archived";
export type JobCategory = "ngo" | "white-collar" | "blue-collar";
export type FetchIntervalUnit = "minutes" | "hours";
export type FetchSiteMode = "crawler" | "manual";
export type FetchRunState = "healthy" | "warning" | "paused";
export type NotificationTone = "info" | "success" | "warning";
export type PublishChannel = "website" | "facebook";

export type Job = {
  id: number;
  title: string;
  slug: string;
  company: string;
  location: string;
  category: JobCategory;
  employment_type: string;
  salary?: string;
  source?: string;
  source_url?: string;
  is_active?: boolean;
  status?: JobStatus;
  description_mm?: string;
  description_en?: string;
  created_at?: string;
  updated_at?: string;
};

export type JobsResponse = {
  count: number;
  results: Job[];
};

export type FetchSource = {
  id: string;
  label: string;
  domain: string;
  mode: FetchSiteMode;
  enabled: boolean;
  requires_manual_url: boolean;
  default_category: JobCategory;
  cadence_value: number;
  cadence_unit: FetchIntervalUnit;
  last_run_at?: string;
  status: FetchRunState;
};

export type ApprovalItem = {
  id: string;
  title: string;
  company: string;
  source_label: string;
  requested_action: "publish" | "facebook-upload" | "manual-review";
  requested_at: string;
};

export type AdminNotification = {
  id: string;
  title: string;
  detail: string;
  created_at: string;
  tone: NotificationTone;
};

export type AdminDashboardSnapshot = {
  total_jobs: number;
  published_jobs: number;
  draft_jobs: number;
  source_count: number;
  pending_approvals: ApprovalItem[];
  notifications: AdminNotification[];
  sources: FetchSource[];
};

export type FetchSettings = {
  cadence_value: number;
  cadence_unit: FetchIntervalUnit;
  max_jobs_per_run: number;
  approval_required_for_website: boolean;
  approval_required_for_facebook: boolean;
  facebook_auto_upload: boolean;
  realtime_notifications: boolean;
  sources: FetchSource[];
};
