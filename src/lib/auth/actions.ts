"use server";

import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData): Promise<{ error: string } | undefined> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    return undefined;
  } catch (err) {
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
