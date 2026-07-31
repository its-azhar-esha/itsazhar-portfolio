import { NextResponse, type NextRequest } from "next/server";
import { createClient as createMiddlewareClient } from "@/lib/supabase/middleware";

const ADMIN_LOGIN = "/admin/login";
const ADMIN = "/admin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const { supabase, response } = createMiddlewareClient(request);

  if (!supabase) {
    return response;
  }

  let isAuthenticated = false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // getUser() failed (network, timeout, etc.) — treat as unauthenticated
  }

  if (!isAuthenticated && pathname !== ADMIN_LOGIN) {
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    // Only redirect navigations. Server actions (POST) must never be
    // redirected: every mutation action enforces auth via getUser(), and
    // redirecting an action response breaks it with an RSC error in the
    // browser (especially on transient getUser() failures).
    const isNavigation = request.method === "GET" || request.method === "HEAD";
    if (isNavigation) {
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  if (isAuthenticated && pathname === ADMIN_LOGIN) {
    const adminUrl = new URL(ADMIN, request.url);
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
