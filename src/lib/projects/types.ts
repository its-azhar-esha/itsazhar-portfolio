import type { DB_PROJECT_STATUSES, SORT_OPTIONS } from "@/constants/projects";

export interface ProjectFilter {
  search?: string;
  industry?: string;
  featured?: boolean;
  status?: (typeof DB_PROJECT_STATUSES)[number];
  category?: string;
  sort?: (typeof SORT_OPTIONS)[number]["value"];
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ProjectListResult<T> {
  items: T[];
  pagination: PaginationMeta;
}
