"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/database.types";

const BUCKET = "project-media";

async function getServerClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return createServerClient<Database>(url || "", key || "", {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          /* ignore */
        }
      },
    },
  });
}

export interface MediaFile {
  name: string;
  url: string;
  updatedAt: string;
}

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];
const MAX_SIZE = 20 * 1024 * 1024;

export async function uploadFileAction(
  formData: FormData,
): Promise<{ url: string; error?: string }> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { url: "", error: "Authentication required." };

    const file = formData.get("file") as File;
    if (!file) return { url: "", error: "No file provided." };

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { url: "", error: `File type ${file.type} is not supported.` };
    }
    if (file.size > MAX_SIZE) {
      return { url: "", error: "File exceeds the 20 MB limit." };
    }

    const folder = (formData.get("folder") as string) || "temp";
    const ext = file.name.split(".").pop() || "bin";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${folder}/${filename}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) return { url: "", error: error.message };

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);
    revalidatePath("/admin/media");
    return { url: publicUrl };
  } catch (err) {
    return { url: "", error: err instanceof Error ? err.message : "Upload failed." };
  }
}

export async function listFilesAction(
  folder?: string,
): Promise<{ files: MediaFile[]; error?: string }> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { files: [], error: "Authentication required." };

    const prefix = folder ? `${folder}/` : "";
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { sortBy: { column: "created_at", order: "desc" } });
    if (error) return { files: [], error: error.message };

    const files: MediaFile[] = (data ?? []).map((f) => {
      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(`${prefix}${f.name}`);
      return { name: f.name, url: publicUrl, updatedAt: f.updated_at || "" };
    });
    return { files };
  } catch (err) {
    return { files: [], error: err instanceof Error ? err.message : "Failed to list files." };
  }
}

export async function deleteFileAction(path: string): Promise<{ error?: string }> {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Authentication required." };

    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) return { error: error.message };
    revalidatePath("/admin/media");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete file." };
  }
}
