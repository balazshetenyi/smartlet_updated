import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/landlord/login";
  const isAuthRoute = pathname.startsWith("/auth/");

  if (isLoginPage || isAuthRoute) {
    if (user) {
      return NextResponse.redirect(
        new URL("/landlord/dashboard", request.url),
      );
    }
    return supabaseResponse;
  }

  if (pathname.startsWith("/landlord") && !user) {
    return NextResponse.redirect(new URL("/landlord/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/landlord/:path*", "/auth/:path*"],
};
