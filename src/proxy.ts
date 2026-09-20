import { type NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const localized = request.nextUrl.pathname.match(/^\/(es|fr|pt)(?:\/|$)/u);
  const isEnglishPublicPage = ["/", "/methodology", "/privacy"].includes(
    request.nextUrl.pathname,
  );

  if (localized?.[1]) {
    requestHeaders.set("x-nv-route-locale", localized[1]);
  } else if (isEnglishPublicPage) {
    requestHeaders.set("x-nv-route-locale", "en");
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/",
    "/methodology",
    "/privacy",
    "/es/:path*",
    "/fr/:path*",
    "/pt/:path*",
  ],
};
