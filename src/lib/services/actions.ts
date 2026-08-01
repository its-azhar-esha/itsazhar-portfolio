"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";
import { createServiceSchema, updateServiceSchema } from "@/lib/validation";
import { createService, updateService, deleteService } from "./repository";
import type { Database } from "@/database.types";
import type {
  DbService,
  CreateServiceInput,
  UpdateServiceInput,
  PublicService,
} from "@/types/service";
import type { Result } from "@/lib/result";
import { fail } from "@/lib/result";
import { error as logError } from "@/lib/logger";
import { MOCK_SERVICES } from "./mock-data";

const TABLE = "services" as const;

function rowToDbService(row: Database["public"]["Tables"]["services"]["Row"]): DbService {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    short_description: row.short_description,
    content: (row.content as Record<string, unknown>) ?? {},
    icon: row.icon as DbService["icon"],
    featured: row.featured,
    display_order: row.display_order,
    status: row.status as DbService["status"],
    scheduled_for: row.scheduled_for,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    seo_keywords: (row.seo_keywords as string[]) ?? [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toPublicService(service: DbService): PublicService {
  return {
    slug: service.slug,
    title: service.title,
    short_description: service.short_description,
    content: {
      highlights: Array.isArray(service.content?.highlights)
        ? (service.content.highlights as string[])
        : [],
    },
    icon: service.icon,
    featured: service.featured,
    display_order: service.display_order,
    seo_title: service.seo_title,
    seo_description: service.seo_description,
    seo_keywords: service.seo_keywords,
  };
}

function mockPublicServices(): PublicService[] {
  return MOCK_SERVICES.filter((s) => s.status === "published").map(toPublicService);
}

function revalidateServicePaths(slug?: string): void {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/");
  if (slug) revalidatePath(`/services/${slug}`);
}

export async function createServiceAction(
  input: Record<string, unknown>,
): Promise<Result<DbService>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = createServiceSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await createService(parsed.data as CreateServiceInput, user.id);
    if (result.success) {
      revalidateServicePaths(parsed.data.slug);
      await logAudit({
        action: "service.created",
        entity: "services",
        entityId: result.data.id,
        detail: { slug: result.data.slug },
      });
    }
    return result;
  } catch (err) {
    logError("createServiceAction failed", {
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to create service");
  }
}

export async function updateServiceAction(
  id: string,
  input: Record<string, unknown>,
): Promise<Result<DbService>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const parsed = updateServiceSchema.safeParse(input);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return fail(messages);
    }

    const result = await updateService(id, parsed.data as UpdateServiceInput, user.id);
    if (result.success) {
      revalidateServicePaths(parsed.data.slug);
      await logAudit({
        action: "service.updated",
        entity: "services",
        entityId: id,
        detail: { slug: result.data.slug },
      });
    }
    return result;
  } catch (err) {
    logError("updateServiceAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to update service");
  }
}

export async function deleteServiceAction(id: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return fail("Authentication required.");

    const result = await deleteService(id, user.id);
    if (result.success) {
      revalidateServicePaths();
      await logAudit({ action: "service.deleted", entity: "services", entityId: id });
    }
    return result;
  } catch (err) {
    logError("deleteServiceAction failed", {
      id,
      message: err instanceof Error ? err.message : err,
    });
    return fail(err instanceof Error ? err.message : "Failed to delete service");
  }
}

export async function publishServiceAction(id: string): Promise<Result<DbService>> {
  return updateServiceAction(id, { status: "published" });
}

export async function draftServiceAction(id: string): Promise<Result<DbService>> {
  return updateServiceAction(id, { status: "draft" });
}

export async function featureServiceAction(
  id: string,
  featured: boolean,
): Promise<Result<DbService>> {
  return updateServiceAction(id, { featured });
}

/* ─── Public read server actions ─── */

export async function getPublicServicesAction(): Promise<PublicService[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("status", ["published"])
      .or("scheduled_for.is.null,scheduled_for.lte.now")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return mockPublicServices();
    return data.map(rowToDbService).map(toPublicService);
  } catch {
    return mockPublicServices();
  }
}

export async function getPublicFeaturedServicesAction(): Promise<PublicService[]> {
  const services = await getPublicServicesAction();
  return services.filter((s) => s.featured);
}

export async function getPublicServiceAction(slug: string): Promise<PublicService | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("status", ["published"])
      .eq("slug", slug)
      .or("scheduled_for.is.null,scheduled_for.lte.now")
      .maybeSingle();
    if (error || !data) {
      const mock = MOCK_SERVICES.find((s) => s.slug === slug && s.status === "published");
      return mock ? toPublicService(mock) : null;
    }
    return toPublicService(rowToDbService(data));
  } catch {
    const mock = MOCK_SERVICES.find((s) => s.slug === slug && s.status === "published");
    return mock ? toPublicService(mock) : null;
  }
}

export async function getPublicServiceSlugsAction(): Promise<string[]> {
  const services = await getPublicServicesAction();
  return services.map((s) => s.slug);
}
