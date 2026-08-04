/**
 * Admin AI planner.
 *
 * Turns the latest conversation into a structured change plan (JSON): a list
 * of tool actions the owner can review. The planner NEVER applies anything —
 * previews are computed from live data here, and the plan only becomes real
 * after explicit approval (see plans/service.ts).
 */

import { routeJsonToAI } from "./router";
import { TOOLS, getTool, describeTools } from "./tools/registry";
import type { PlanAction, PlanActionPreview } from "./tools/types";
import { getProjects } from "@/lib/projects";
import { getServices } from "@/lib/services";
import { getBlogPosts } from "@/lib/blog/repository";
import { getAllSeo } from "@/lib/seo";
import { getLeads } from "@/lib/leads/repository";
import { getAdminHeroContent } from "@/lib/hero";
import { getAdminAboutContent } from "@/lib/about";
import { getSettings } from "@/lib/settings/repository";
import { getIntegrationsAction } from "@/lib/integrations/actions";
import { getKeepAliveReportAction } from "@/lib/keepalive/actions";
import { getAnalyticsSummaryAction } from "@/lib/analytics/actions";
import { createAdminClient } from "@/lib/supabase/admin";

/* ─── live system state summary for the planner ───────────────────────── */

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function buildPlannerState(): Promise<string> {
  const sections: string[] = [];

  const projects = await safe(() => getProjects({ page: 1, pageSize: 100, sort: "order_asc" }));
  if (projects?.success) {
    const items = projects.data.items;
    sections.push(
      `## PROJECTS (${items.length}, display order)\n` +
        items
          .map(
            (p, i) =>
              `${i + 1}. ${p.title} — slug: ${p.slug} | status: ${p.status} | featured: ${p.featured} | category: ${p.category}`,
          )
          .join("\n") || "- (no projects)",
    );
  }

  const services = await safe(() => getServices());
  if (services?.success) {
    const items = services.data;
    sections.push(
      `## SERVICES (${items.length})\n` +
        items
          .map((s) => `- ${s.title} — status: ${s.status} | featured: ${s.featured}`)
          .join("\n") || "- (no services)",
    );
  }

  const blog = await safe(() => getBlogPosts({}));
  if (blog?.success) {
    const items = blog.data;
    sections.push(
      `## BLOG POSTS (${items.length})\n` +
        items
          .map((p) => `- ${p.title} — status: ${p.status} | featured: ${p.featured}`)
          .join("\n") || "- (no posts)",
    );
  }

  const seo = await safe(() => getAllSeo());
  if (seo?.success) {
    sections.push(
      `## SEO METADATA (${seo.data.length})\n` +
        seo.data
          .map((s) => `- ${s.page_key}: "${s.title}" — ${s.description ?? "no description"}`)
          .join("\n") || "- (none)",
    );
  }

  const leads = await safe(() => getLeads({ page: 1, pageSize: 100 }));
  if (leads?.success) {
    const items = leads.data.items;
    const byStatus = new Map<string, number>();
    for (const l of items) byStatus.set(l.status, (byStatus.get(l.status) ?? 0) + 1);
    const statusSummary = [...byStatus.entries()].map(([s, n]) => `${s}: ${n}`).join(", ");
    sections.push(
      `## LEADS (${leads.data.count} total)\n` +
        (items.length
          ? items
              .slice(0, 15)
              .map((l) => `- ${l.name} <${l.email}> — ${l.status} (${l.created_at.slice(0, 10)})`)
              .join("\n")
          : "- (no leads)") +
        `\nStatus counts: ${statusSummary || "(none)"}`,
    );
  }

  const hero = await safe(() => getAdminHeroContent());
  if (hero) {
    sections.push(
      `## HERO SECTION\n- headline: ${hero.basic.headline}\n- highlight: ${hero.basic.highlight}\n- subheadline: ${hero.basic.subheadline}\n- availability: ${hero.basic.availability}`,
    );
  }

  const about = await safe(() => getAdminAboutContent());
  if (about) {
    const bio = Array.isArray(about.biography?.paragraphs)
      ? (about.biography.paragraphs[0]?.slice(0, 160) ?? "")
      : "";
    sections.push(
      `## ABOUT SECTION\n- name: ${about.basic?.name ?? "n/a"}\n- title: ${about.basic?.title ?? "n/a"}\n- tagline: ${about.basic?.tagline ?? "n/a"}\n- first paragraph: ${bio}`,
    );
  }

  const settings = await safe(() => getSettings());
  if (settings?.success && settings.data) {
    const s = settings.data;
    sections.push(
      `## SITE SETTINGS\n- site_name: ${s.site_name}\n- site_title: ${s.site_title}\n- tagline: ${s.tagline}\n- location: ${s.location}\n- contact_email: ${s.contact_email}\n- maintenance_mode: ${s.maintenance_mode}\n- section toggles: hero=${s.show_hero} showcase=${s.show_showcase} services=${s.show_services} case_studies=${s.show_case_studies} about=${s.show_about} testimonials=${s.show_testimonials} contact=${s.show_contact} blog=${s.show_blog} hub=${s.show_hub} playground=${s.show_playground}`,
    );
  }

  const integrations = await safe(() => getIntegrationsAction());
  if (integrations?.success) {
    const configured = integrations.data.filter((i) => i.hasStoredKey || i.envConfigured);
    sections.push(
      `## INTEGRATIONS\n` +
        (configured.length
          ? configured
              .map((i) => `- ${i.label} (${i.id}): ${i.hasStoredKey ? "stored key" : "env key"}`)
              .join("\n")
          : "- none configured"),
    );
  }

  const keepalive = await safe(() => getKeepAliveReportAction());
  if (keepalive?.success) {
    const r = keepalive.data;
    sections.push(
      `## KEEP-ALIVE (operational: ${r.operational})\n` +
        r.components
          .map(
            (c) =>
              `- ${c.name}: ${c.status ?? "?"} — ${c.detail ?? ""}${c.lastHealthCheckAt ? ` (checked ${c.lastHealthCheckAt.slice(0, 10)})` : ""}`,
          )
          .join("\n"),
    );
  }

  const analytics = await safe(() => getAnalyticsSummaryAction());
  if (analytics?.success) {
    const a = analytics.data as unknown as Record<string, unknown>;
    const entries = Object.entries(a)
      .filter(
        ([k, v]) =>
          (typeof v === "number" || typeof v === "string") &&
          !k.toLowerCase().includes("config") &&
          !k.toLowerCase().includes("list") &&
          !k.toLowerCase().includes("series"),
      )
      .slice(0, 12)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");
    sections.push(`## ANALYTICS (summary)\n${entries || "- (no data)"}`);
  }

  const scans = await safe(async () => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("cleanup_scans")
      .select("category,status,total,size_bytes,scanned_at");
    return data as unknown as {
      category: string;
      status: string;
      total: number;
      size_bytes: number;
      scanned_at: string;
    }[];
  });
  if (scans && scans.length) {
    sections.push(
      `## STORAGE CLEANUP (latest scans)\n` +
        scans
          .map(
            (s) =>
              `- ${s.category}: ${s.status} (${s.total} items, ${Math.round((s.size_bytes ?? 0) / 1024)} KB) — ${s.scanned_at.slice(0, 10)}`,
          )
          .join("\n"),
    );
  }

  return sections.join("\n\n");
}

/* ─── planner prompt + JSON parsing ───────────────────────────────────── */

export interface PlannerOutput {
  explanation: string;
  actions: PlanAction[];
}

function buildPlannerSystemPrompt(state: string, pendingPlan?: string): string {
  const tools = describeTools();
  const pending =
    pendingPlan && pendingPlan.trim().length > 0
      ? `\n\n## PENDING PLAN (the owner asked to adjust this — return the REVISED full plan replacing it)\n${pendingPlan}`
      : "";

  return `You are the Admin AI for Azhar's portfolio CMS. You act as a careful administrative assistant: you plan changes, you NEVER execute them.

## PROTOCOL
The owner may ask you to create, edit, update, delete, reorganize, or clean up content. For ANY request that changes data, output a plan as JSON. Nothing is applied automatically — the owner reviews a preview of every action and approves explicitly.

## OUTPUT FORMAT (strict JSON, no markdown fences, no other text)
{
  "explanation": "One short paragraph, first person, telling the owner exactly what will change and that nothing is applied until they confirm.",
  "actions": [
    { "tool": "projects.update", "params": { ... } }
  ]
}

Rules:
- Use ONLY the tool ids and params listed below. Never invent tools.
- Params must match the tool's param contract exactly (types + enums).
- Identify existing items with the EXACT titles/emails/page_keys from the CURRENT STATE below (case-insensitive lookup is done server-side, but use the exact spelling).
- For update tools, include ONLY the fields that change.
- For projects.reorder, orderedTitles must list EVERY project (full list from the state) in the desired order.
- For delete tools, verify the item exists in the state first; if unsure, set actions: [] and ask the owner to confirm the exact name.
- If the request is purely informational (summarize, suggest, report, status), set actions: [] and answer in the explanation.
- If part of the request is possible and part is not, do what you can and explain the rest.
- NEVER include secrets, API keys, or anything not in the params contracts.
- Keep explanation concise (under 120 words).
- If no state section exists below for a module, you may still create new items (create tools) but cannot reference existing ones.

## AVAILABLE TOOLS
${JSON.stringify(tools)}
${pending}

## CURRENT STATE OF THE SYSTEM
${state}`;
}

export function parsePlannerOutput(content: string): PlannerOutput {
  let text = content.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Planner did not return a JSON object.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new Error("Planner returned invalid JSON.");
  }
  const obj = (parsed ?? {}) as { explanation?: unknown; actions?: unknown };
  const explanation = typeof obj.explanation === "string" ? obj.explanation : "";
  const actions: PlanAction[] = [];
  if (Array.isArray(obj.actions)) {
    for (const raw of obj.actions) {
      const item = (raw ?? {}) as { tool?: unknown; params?: unknown };
      if (typeof item.tool !== "string") continue;
      if (!getTool(item.tool)) continue;
      actions.push({
        toolId: item.tool,
        params:
          item.params && typeof item.params === "object" && !Array.isArray(item.params)
            ? (item.params as Record<string, unknown>)
            : {},
      });
    }
  }
  return { explanation, actions };
}

/** Calls the planner with the conversation and returns the parsed plan. */
export async function planRequest(
  messages: { role: string; content: string }[],
  state: string,
  pendingPlan?: string,
): Promise<PlannerOutput> {
  const system = buildPlannerSystemPrompt(state, pendingPlan);
  const { content } = await routeJsonToAI([{ role: "system", content: system }, ...messages]);
  return parsePlannerOutput(content);
}

/* ─── preview computation (server-side, from live data) ───────────────── */

export async function computePlanPreviews(actions: PlanAction[]): Promise<PlanActionPreview[]> {
  const previews: PlanActionPreview[] = [];
  for (const action of actions) {
    const tool = getTool(action.toolId);
    if (!tool) {
      previews.push({
        toolId: action.toolId,
        module: "?",
        label: "Unknown action",
        mutates: true,
        before: ["(unknown tool)"],
        after: [],
        error: `Unknown tool "${action.toolId}".`,
      });
      continue;
    }
    try {
      const current = await tool.loadCurrent(action.params);
      const proposed =
        current && typeof current === "object" && !Array.isArray(current) && "error" in current
          ? { error: (current as { error: string }).error }
          : tool.computeProposed
            ? await tool.computeProposed(action.params)
            : { ...action.params };
      const lines = tool.previewText(current, proposed);
      previews.push({
        toolId: tool.id,
        module: tool.module,
        label: tool.label,
        mutates: true,
        before: lines.before,
        after: lines.after,
        error: null,
      });
    } catch (err) {
      previews.push({
        toolId: tool.id,
        module: tool.module,
        label: tool.label,
        mutates: true,
        before: ["(could not load current state)"],
        after: [],
        error: err instanceof Error ? err.message : "Preview failed.",
      });
    }
  }
  return previews;
}

/** All available tool ids (used by the plan validation). */
export const TOOL_IDS = TOOLS.map((t) => t.id);
