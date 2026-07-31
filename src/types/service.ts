import type { LucideIcon } from "lucide-react";
import type { ServiceIconName, ServiceStatus } from "@/constants/services";

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  order: number;
  cta?: string;
}

export interface DbService {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  content: Record<string, unknown>;
  icon: ServiceIconName;
  featured: boolean;
  display_order: number;
  status: ServiceStatus;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  created_at: string;
  updated_at: string;
}

export type CreateServiceInput = Omit<DbService, "id" | "created_at" | "updated_at">;
export type UpdateServiceInput = Partial<Omit<DbService, "id" | "created_at" | "updated_at">>;

export interface PublicService {
  slug: string;
  title: string;
  short_description: string;
  content: { highlights: string[] };
  icon: ServiceIconName;
  featured: boolean;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
}
