import type { ContentEntry } from "@/types/content";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/about/defaults";
import { DEFAULT_HERO_CONTENT } from "@/lib/hero/defaults";
import { DEFAULT_HOME_CONTENT } from "./defaults/home";
import { DEFAULT_PROJECTS_CONTENT } from "./defaults/projects";
import { DEFAULT_SERVICES_CONTENT } from "./defaults/services";
import { DEFAULT_CONTACT_CONTENT } from "./defaults/contact";
import { DEFAULT_BLOG_CONTENT } from "./defaults/blog";
import { DEFAULT_HUB_CONTENT } from "./defaults/hub";
import { DEFAULT_PLAYGROUND_CONTENT } from "./defaults/playground";
import { DEFAULT_SHARED_CONTENT } from "./defaults/shared";
import { DEFAULT_TERMS_CONTENT } from "./defaults/terms";

export const MOCK_CONTENT: ContentEntry[] = [
  {
    id: "c1",
    key: "hero",
    title: "Hero Section",
    content: DEFAULT_HERO_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c2",
    key: "about",
    title: "About Page",
    content: DEFAULT_ABOUT_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c3",
    key: "home",
    title: "Home Page",
    content: DEFAULT_HOME_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c4",
    key: "projects",
    title: "Projects Page",
    content: DEFAULT_PROJECTS_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c5",
    key: "services",
    title: "Services Page",
    content: DEFAULT_SERVICES_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c6",
    key: "contact",
    title: "Contact Page",
    content: DEFAULT_CONTACT_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c7",
    key: "blog",
    title: "Blog Page",
    content: DEFAULT_BLOG_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c8",
    key: "hub",
    title: "Hub Page",
    content: DEFAULT_HUB_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c9",
    key: "playground",
    title: "Playground Page",
    content: DEFAULT_PLAYGROUND_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c10",
    key: "shared",
    title: "Shared Site",
    content: DEFAULT_SHARED_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c11",
    key: "terms",
    title: "Terms & Conditions",
    content: DEFAULT_TERMS_CONTENT as unknown as Record<string, unknown>,
    status: "published",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];
