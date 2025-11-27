import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = ['/', '/login', '/register', '/api/auth/login', '/api/auth/register', '/api/db/test'];

// Check if path is public
function isPublicPath(path: string): boolean {
    return publicPaths.some(p => path === p || path.startsWith('/api/db'));
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // Allow static files and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Check for authentication token
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
        request.cookies.get('token')?.value;

    // If no token and trying to access protected route, redirect to login
    if (!token && !pathname.startsWith('/api')) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
