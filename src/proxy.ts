import { NextResponse, type NextRequest } from "next/server";
import { createClient as createMiddlewareClient } from "@/lib/supabase/middleware";

const ADMIN_LOGIN = "/admin/login";
const ADMIN = "/admin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname === ADMIN || pathname.startsWith("/admin/");
  if (!isAdminPath) {
    return createMiddlewareClient(request).response;
  }

  const { supabase, response } = createMiddlewareClient(request);

  if (!supabase) {
    return response;
  }

  // getUser() validates the session with the Auth server and refreshes tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  if (!isAuthenticated && pathname !== ADMIN_LOGIN) {
    const loginUrl = new URL(ADMIN_LOGIN, request.url);
    return NextResponse.redirect(loginUrl);
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
