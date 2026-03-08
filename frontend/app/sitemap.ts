import type { MetadataRoute } from "next";

import { getPublicJobs } from "@/lib/api-public";
import { getSiteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      priority: 1,
      changeFrequency: "daily",
    },
    {
      url: `${baseUrl}/jobs`,
      priority: 0.8,
      changeFrequency: "hourly",
    },
    {
      url: `${baseUrl}/about`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/cv-guide`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/contact`,
      priority: 0.5,
      changeFrequency: "monthly",
    },
  ];

  try {
    const jobs = await getPublicJobs();
    return [
      ...staticPages,
      ...jobs.map((job) => ({
        url: `${baseUrl}/jobs/${job.slug}`,
        lastModified: job.updated_at || job.created_at || undefined,
        priority: 0.7,
        changeFrequency: "daily" as const,
      })),
    ];
  } catch {
    return staticPages;
  }
}
