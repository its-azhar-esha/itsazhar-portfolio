import type { ContentEntry } from "@/types/content";
import { DEFAULT_ABOUT_CONTENT } from "@/lib/about/defaults";
import { DEFAULT_HERO_CONTENT } from "@/lib/hero/defaults";

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
];
