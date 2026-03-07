export type JobStatus = "draft" | "published" | "archived" | "pending-review";
export type JobCategory = "ngo" | "white-collar" | "blue-collar";
export type FetchIntervalUnit = "minutes" | "hours";
export type FetchSiteMode = "html" | "rss" | "manual";
export type FetchRunState = "healthy" | "warning" | "paused";
export type NotificationTone = "info" | "success" | "warning";
export type PublishChannel = "website" | "facebook";
export type ManagedAdPlacement = "jobs-inline" | "jobs-detail" | "jobs-search";
export type ManagedAdStatus = "draft" | "active" | "paused";

export type Job = {
  id: number;
  title: string;
  slug: string;
  company: string;
  location: string;
  category: JobCategory;
  employment_type: string;
  salary?: string;
  contact_email?: string;
  contact_phone?: string;
  source?: string;
  source_url?: string;
  image_url?: string;
  image_file_url?: string;
  display_image_url?: string;
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
  target_url?: string;
  is_read: boolean;
};

export type AdminDashboardSnapshot = {
  total_jobs: number;
  published_jobs: number;
  draft_jobs: number;
  source_count: number;
  total_visitors: number;
  active_ads: number;
  pending_approvals: ApprovalItem[];
  notifications: AdminNotification[];
  sources: FetchSource[];
  visitor_summary?: VisitorSummary;
};

export type VisitorPathStat = {
  path: string;
  visitors: number;
  visits: number;
  last_seen_at?: string;
};

export type VisitorSummary = {
  total_visitors: number;
  today_visitors: number;
  last_7_days_visitors: number;
  top_paths: VisitorPathStat[];
};

export type JobReportReason =
  | "scam"
  | "inaccurate"
  | "expired"
  | "duplicate"
  | "other";

export type JobReportStatus = "open" | "reviewed" | "resolved";

export type JobReport = {
  id: number;
  job_id?: number | null;
  job_title: string;
  job_company?: string;
  job_location?: string;
  job_slug?: string;
  reporter_name?: string;
  reporter_email?: string;
  reason: JobReportReason;
  message?: string;
  status: JobReportStatus;
  review_note?: string;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ManagedAd = {
  id: number;
  title: string;
  eyebrow?: string;
  description: string;
  cta_label: string;
  href: string;
  placement: ManagedAdPlacement;
  status: ManagedAdStatus;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type FacebookPageCredential = {
  platform: "facebook";
  account_name: string;
  app_id?: string;
  app_secret_configured?: boolean;
  page_id: string;
  connected?: boolean;
  profile_name?: string;
  profile_image_url?: string;
  updated_at?: string;
};

export type FacebookConnectPageOption = {
  id: string;
  name: string;
};

export type FacebookPagePost = {
  id: string;
  message?: string;
  permalink_url?: string;
  created_time?: string;
  full_picture?: string;
  reactions_count: number;
  comments_count: number;
  shares_count: number;
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
