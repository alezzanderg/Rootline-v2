import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

function isAuthSubdomain(host: string): boolean {
  const normalized = host.toLowerCase()
  return normalized === "auth.rootlinenj.com" || normalized.startsWith("auth.rootlinenj.com:")
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const { pathname, search } = request.nextUrl
  const inAuthHost = isAuthSubdomain(host)
  const isAdminPath = pathname === "/auth" || pathname.startsWith("/auth/") || pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  // Force admin routes to auth subdomain only.
  if (!inAuthHost && isAdminPath) {
    return NextResponse.redirect(`https://auth.rootlinenj.com${pathname}${search}`)
  }

  // Keep URL as https://auth.rootlinenj.com/ while rendering /auth.
  if (inAuthHost && pathname === "/") {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = "/auth"
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)"],
}

