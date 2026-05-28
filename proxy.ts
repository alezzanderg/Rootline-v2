import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

function isAuthSubdomain(host: string): boolean {
  const normalized = host.toLowerCase()
  return normalized === "auth.rootlinenj.com" || normalized.startsWith("auth.rootlinenj.com:")
}

/** Local dev: keep admin at http://localhost:3000/auth and /dashboard (no redirect to production). */
function isLocalDevHost(host: string): boolean {
  const hostname = host.toLowerCase().split(":")[0]
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local")
  )
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const { pathname, search } = request.nextUrl
  const inAuthHost = isAuthSubdomain(host)
  const inLocalDev = isLocalDevHost(host)
  const isAdminPath =
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")

  // Production: admin only on auth.rootlinenj.com (not www).
  if (!inAuthHost && !inLocalDev && isAdminPath) {
    return NextResponse.redirect(`https://auth.rootlinenj.com${pathname}${search}`)
  }

  // Production auth host: / shows login at /auth (URL stays /).
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

