"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { recordLoginAttempt } from "@/lib/security";
import { notify } from "@/lib/notifications/sender";

async function clientMeta(): Promise<{ ip: string; userAgent: string }> {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "";
    return { ip, userAgent: h.get("user-agent") ?? "" };
  } catch {
    return { ip: "", userAgent: "" };
  }
}

export async function signIn(formData: FormData): Promise<{ error: string } | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const meta = await clientMeta();

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await recordLoginAttempt({
        email,
        success: false,
        ip: meta.ip,
        userAgent: meta.userAgent,
      });
      return { error: error.message };
    }

    await recordLoginAttempt({
      email,
      success: true,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    await notify("auth.signed_in", {
      fields: { Email: email, Ip: meta.ip || "unknown" },
    });
    return undefined;
  } catch (err) {
    await recordLoginAttempt({
      email,
      success: false,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });
    return {
      error: err instanceof Error ? err.message : "Sign-in failed. Please try again.",
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Session cleanup is best-effort; redirect regardless.
  }
  const { redirect } = await import("next/navigation");
  redirect("/admin/login");
}
