export type JobStatus = "draft" | "published" | "archived" | "pending-review";
export type JobCategory = "ngo" | "white-collar" | "blue-collar";
export type FetchIntervalUnit = "minutes" | "hours";
export type FetchSiteMode = "html" | "rss" | "manual";
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
  requires_website_approval?: boolean;
  requires_facebook_approval?: boolean;
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
  id: number;
  key: string;
  label: string;
  domain: string;
  feed_url?: string;
  mode: FetchSiteMode;
  enabled: boolean;
  requires_manual_url: boolean;
  auto_publish_website?: boolean;
  auto_publish_facebook?: boolean;
  approval_required_for_website?: boolean;
  approval_required_for_facebook?: boolean;
  default_category: JobCategory;
  cadence_value: number;
  cadence_unit: FetchIntervalUnit;
  max_jobs_per_run?: number;
  last_run_at?: string;
  last_error?: string;
  status: FetchRunState;
  selectors?: Record<string, string>;
  headers?: Record<string, string>;
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

export type FacebookPageCredential = {
  platform: "facebook";
  account_name: string;
  page_id: string;
  access_token: string;
  updated_at?: string;
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
  facebook: FacebookPageCredential;
};
