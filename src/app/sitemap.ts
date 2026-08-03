import type { MetadataRoute } from "next";
import { getProjectSlugs } from "@/lib/projects-data";
import { getPublicBlogPostsAction } from "@/lib/blog/actions";
import { getPublicResourcesAction, getPublicTemplatesAction } from "@/lib/hub/actions";
import { getPublicServiceSlugsAction } from "@/lib/services/actions";
import { getSiteUrl } from "@/lib/site/urls";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getSiteUrl();

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 1.0 },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
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
    {
      url: `${baseUrl}/hub`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/playground`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/playground/builder`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  const slugs = await getProjectSlugs();

  const projectPages = slugs.map((slug: string) => ({
    url: `${baseUrl}/projects/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const serviceSlugs = await getPublicServiceSlugsAction();
  const servicePages = serviceSlugs.map((slug: string) => ({
    url: `${baseUrl}/services/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const posts = await getPublicBlogPostsAction();
  const blogPages = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const resources = await getPublicResourcesAction();
  const resourcePages = resources.map((resource) => ({
    url: `${baseUrl}/hub/${resource.slug}`,
    lastModified: new Date(resource.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const templates = await getPublicTemplatesAction();
  const templatePages = templates.map((template) => ({
    url: `${baseUrl}/playground/template/${template.slug}`,
    lastModified: new Date(template.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...projectPages,
    ...servicePages,
    ...blogPages,
    ...resourcePages,
    ...templatePages,
  ];
}
