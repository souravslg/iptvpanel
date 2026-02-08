import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode('your-secret-key-change-this');

export async function middleware(request) {
    try {
        const session = request.cookies.get('session')?.value;
        const path = request.nextUrl.pathname;

        // Protect dashboard routes
        // Protected Routes: /, /users, /playlist, /settings, /xtream
        // Public Routes: /login, /api/auth/*, /player_api.php, /get.php
        const isProtected = path === '/' ||
            path.startsWith('/users') ||
            path.startsWith('/playlist') ||
            path.startsWith('/settings') ||
            path.startsWith('/xtream');

        if (isProtected) {
            if (!session) {
                return NextResponse.redirect(new URL('/login', request.url));
            }

            try {
                await jwtVerify(session, SECRET_KEY, {
                    algorithms: ['HS256'],
                });
                return NextResponse.next();
            } catch (error) {
                // Invalid token
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }

        // Redirect to dashboard if logged in and trying to access login page
        if (path === '/login' && session) {
            try {
                await jwtVerify(session, SECRET_KEY);
                return NextResponse.redirect(new URL('/', request.url));
            } catch (error) {
                // Token expired/invalid, allow access to login
            }
        }

        return NextResponse.next();
    } catch (error) {
        console.error('Middleware Error:', error);
        return NextResponse.next();
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
