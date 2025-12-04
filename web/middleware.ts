import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "geniy.io";
  const hostname = req.headers
    .get("host")!
    .replace(".localhost:3000", `.${rootDomain}`);

  // Get the pathname of the request (e.g. /, /about, /blog/first-post)
  const searchParams = req.nextUrl.searchParams.toString();
  // Get the path (e.g. /about, /blog/first-post)
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ""
  }`;

  // rewrites for app pages
  if (hostname == `app.${rootDomain}`) {
    // If it's the main app domain, let it pass through normally
    // or rewrite to /app if you have a specific app folder structure
    // For Geniy, it seems everything is in the root app folder, so we might just return
    return NextResponse.next();
  }

  // special case for localhost during development
  if (hostname === "localhost:3000" || hostname === "localhost") {
      return NextResponse.next();
  }

  // rewrite everything else to `/_sites/[site] dynamic route
  return NextResponse.rewrite(
    new URL(`/_sites/${hostname}${path}`, req.url)
  );
}
