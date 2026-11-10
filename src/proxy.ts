import { NextResponse, type NextRequest } from "next/server";

// Early, optimistic redirect for /admin/* (Next 16's proxy, formerly middleware). It only looks for a session cookie.
// It is NOT the security boundary: every page, Server Action and route handler checks the real session on the server.

const SESSION_COOKIE = /^(__Secure-)?authjs\.session-token/;

export function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const hasSession = request.cookies.getAll().some((c) => SESSION_COOKIE.test(c.name));

  const response =
    isLogin || hasSession ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: "/admin/:path*" };
