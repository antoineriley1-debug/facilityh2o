import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/', '/pricing', '/login', '/signup'];
const PUBLIC_API = ['/api/auth', '/api/signup', '/api/logout'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
  if (PUBLIC_API.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Allow static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get('facilityh2o_session');
  if (!session?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
