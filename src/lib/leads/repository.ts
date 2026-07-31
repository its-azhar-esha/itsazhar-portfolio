import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/database.types";
import type { Lead, LeadStats, LeadStatus } from "@/types/lead";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

const TABLE = "leads" as const;

export interface LeadQuery {
  search?: string;
  status?: LeadStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface LeadPage {
  items: Lead[];
  count: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

function rowToLead(row: Database["public"]["Tables"]["leads"]["Row"]): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    source: row.source,
    status: row.status as LeadStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Public lead capture. RLS allows anonymous inserts. */
export async function createLead(input: {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  source?: string;
}): Promise<Result<Lead>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        message: input.message || null,
        source: input.source ?? "contact",
      } as never)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail("Failed to submit lead — no data returned.");
    return ok(rowToLead(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to submit lead");
  }
}

export async function getLeads(query: LeadQuery = {}): Promise<Result<LeadPage>> {
  try {
    const supabase = await createClient();
    const search = query.search?.trim();
    const status = query.status ?? "all";
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let builder = supabase.from(TABLE).select("*", { count: "exact" });
    if (search) {
      const pattern = `%${search}%`;
      builder = builder.or(`name.ilike.${pattern},email.ilike.${pattern},message.ilike.${pattern}`);
    }
    if (status && status !== "all") {
      builder = builder.eq("status", status);
    }

    const { data, error, count } = await builder
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) return fail(error.message);

    const total = count ?? 0;
    return ok({
      items: (data ?? []).map(rowToLead),
      count: total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to list leads");
  }
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Result<Lead>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status } as never)
      .eq("id", id)
      .select()
      .single();
    if (error) return fail(error.message);
    if (!data) return fail(`Lead with id "${id}" not found.`);
    return ok(rowToLead(data));
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to update lead");
  }
}

export async function deleteLead(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) return fail(error.message);
    return ok(undefined);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to delete lead");
  }
}

export async function getLeadStats(): Promise<Result<LeadStats>> {
  try {
    const supabase = await createClient();
    const [totalResult, newResult, contactedResult, closedResult] = await Promise.all([
      supabase.from(TABLE).select("id", { count: "exact", head: true }),
      supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("status", "contacted"),
      supabase.from(TABLE).select("id", { count: "exact", head: true }).eq("status", "closed"),
    ]);
    if (totalResult.error) return fail(totalResult.error.message);
    if (newResult.error) return fail(newResult.error.message);
    if (contactedResult.error) return fail(contactedResult.error.message);
    if (closedResult.error) return fail(closedResult.error.message);
    return ok({
      total: totalResult.count ?? 0,
      new: newResult.count ?? 0,
      contacted: contactedResult.count ?? 0,
      closed: closedResult.count ?? 0,
    });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to load lead stats");
  }
}
