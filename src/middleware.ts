import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_TOKEN_COOKIE = "adminToken";
const SUPER_ADMIN_TOKEN_COOKIE = "superAdminToken";

/** Role dashboards that require a JWT cookie. */
const PROTECTED_PREFIXES = [
  "/admin",
  "/master",
  "/master-distributor",
  "/distributor",
  "/retailer",
  "/dashboard",
];

const PUBLIC_AUTH_PREFIXES = [
  "/login",
  "/auth/login",
  "/forgot-password",
  "/reset-password",
  "/super-admin/login",
  "/unauthorized",
];

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/super-admin")) {
    return pathname !== "/super-admin/login";
  }
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const adminToken = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value;
  const superAdminToken = request.cookies.get(SUPER_ADMIN_TOKEN_COOKIE)?.value;
  const hasJwt = Boolean(adminToken || superAdminToken);

  if (isProtectedPath(pathname) && !hasJwt) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = pathname.startsWith("/super-admin")
      ? "/super-admin/login"
      : "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  if (hasJwt && isPublicAuthPath(pathname) && pathname !== "/unauthorized") {
    // Allow OTP page even if somehow a stale cookie exists without session
    if (pathname.startsWith("/auth/login/verify-otp")) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/master/:path*",
    "/master-distributor/:path*",
    "/distributor/:path*",
    "/retailer/:path*",
    "/dashboard/:path*",
    "/super-admin/:path*",
  ],
};
