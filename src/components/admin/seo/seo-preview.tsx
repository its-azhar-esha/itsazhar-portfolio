"use client";

import { SITE_URL } from "@/lib/site";

interface SeoPreviewProps {
  title: string;
  description: string;
  url?: string;
  siteUrl?: string;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).trimEnd() + "\u2026";
}

export function SeoPreview({ title, description, url, siteUrl }: SeoPreviewProps) {
  const base = siteUrl ?? SITE_URL;
  const displayUrl = url || base;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 font-sans shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">G</span>
        </div>
        <span className="truncate">{displayUrl}</span>
      </div>
      <p className="mt-1 text-[20px] leading-snug text-blue-700 dark:text-blue-400">
        {title ? truncate(title, 60) : "Page Title"}
      </p>
      <p className="mt-1 text-sm leading-snug text-gray-600 dark:text-gray-400">
        {description ? truncate(description, 155) : "No description available for this page."}
      </p>
    </div>
  );
}
