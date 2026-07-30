import { type NextRequest, NextResponse } from "next/server";
import { createClient as createMiddlewareClient } from "@/lib/supabase/middleware";

const ADMIN_LOGIN = "/admin/login";
const ADMIN = "/admin";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname === ADMIN || pathname.startsWith("/admin/");
  if (!isAdminPath) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = !!session;

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
