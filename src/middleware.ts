/** Supabase session refresh and customer workspace gate. */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
const SUPABASE_ANON_KEY = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Keep public auth pages reachable while a fresh deployment is waiting for
  // its Supabase credentials/DNS. Protected pages still redirect to login.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password';
  const isWorkspaceRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/automations') ||
    pathname.startsWith('/analytics') || pathname.startsWith('/settings') || pathname.startsWith('/account') ||
    pathname.startsWith('/admin');

  if (isWorkspaceRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if ((pathname === '/' || isAuthRoute) && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|logo.svg|auth/).*)'],
};
