import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/projects-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://azhar.dev";

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1.0 },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
  ];

  const slugs = await getProjectSlugs();

  const projectPages = slugs.map((slug: string) => ({
    url: `${baseUrl}/projects/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...projectPages];
}
