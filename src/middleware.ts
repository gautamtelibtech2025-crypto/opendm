/** Lightweight Firebase session gate. API routes verify the signed cookie/ID token. */
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === '/login';
  const isWorkspaceRoute = ['/dashboard', '/automations', '/analytics', '/settings', '/account', '/admin'].some(prefix => pathname.startsWith(prefix));
  const hasSession = Boolean(request.cookies.get('opendm_session')?.value);
  if (isWorkspaceRoute && !hasSession) {
    const url = request.nextUrl.clone(); url.pathname = '/login'; url.searchParams.set('next', pathname); return NextResponse.redirect(url);
  }
  if ((pathname === '/' || isAuthRoute) && hasSession) { const url = request.nextUrl.clone(); url.pathname = '/dashboard'; url.search = ''; return NextResponse.redirect(url); }
  if (pathname === '/') { const url = request.nextUrl.clone(); url.pathname = '/login'; return NextResponse.redirect(url); }
  return NextResponse.next();
}
export const config = { matcher: ['/((?!api/|_next/static|_next/image|favicon.ico|icon.svg|logo.svg|auth/).*)'] };
