// middleware.ts
import { IUser } from "@/types/user"
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "./services/auth" // your service

// Routes that don’t need auth
const authRoutes = ["/login", "/register"]

// Role-based private routes
const roleBasedPrivateRoutes: Record<string, RegExp[]> = {
  student: [/^\/studentdashboard/, /^\/tutors/],
  tutor: [/^\/tutor/, /^\/tutors(\/.*)?$/],
  admin: [/^\/admin/],
  super_admin: [/^\/superadmin/],
  accountant: [/^\/accountant/],
}

// Middleware
export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl

  // Get user info
  const jwtUser = await getCurrentUser() // JwtPayload | null

  // Map JWT payload to IUser safely
  const userInfo: IUser | null = jwtUser
    ? {
        id: (jwtUser as any).id,
        name: (jwtUser as any).name || "",
        username: (jwtUser as any).username || "",
        email: (jwtUser as any).email || "",
        role: (jwtUser as any).role || "student",
        image: (jwtUser as any).image || null,
      }
    : null

  // Not logged in
  if (!userInfo) {
    if (authRoutes.includes(pathname)) {
      return NextResponse.next()
    }
    return NextResponse.redirect(
      new URL(`/login?redirectPath=${pathname}`, request.url),
    )
  }

  // Check role-based access
  const role = userInfo.role.toLowerCase()
  const allowedRoutes = roleBasedPrivateRoutes[role]

  if (allowedRoutes) {
    const isAllowed = allowedRoutes.some((route) => pathname.match(route))
    if (isAllowed) {
      return NextResponse.next()
    }
  }

  // If user is logged in but accessing unauthorized route
  return NextResponse.redirect(new URL("/", request.url))
}

// Apply middleware to these routes
export const config = {
  matcher: [
    "/tutors/:path*",
    "/studentdashboard/:path*",
    "/tutor/:path*",
    "/admin/:path*",
    "/superadmin/:path*",
    "/accountant/:path*",
  ],
}
