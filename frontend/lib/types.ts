export type JobStatus = "draft" | "published" | "archived";
export type JobCategory = "ngo" | "white-collar" | "blue-collar";

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
