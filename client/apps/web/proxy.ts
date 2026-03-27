import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { getCookie, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './lib/cookies';

/**
 * JWT Payload interface (matches backend JWT claims)
 */
interface JWTPayload {
  user_id: number;
  role: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_verified: boolean;
  exp: number;
  iat: number;
  jti: string;
}

/**
 * Routes that require authentication and verification
 * Add any protected routes to this array
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/bookings',
  '/profile',
  '/settings',
  // Add more protected routes here
];

/**
 * Auth routes (login, signup, OTP)
 * Authenticated users will be redirected away from these
 */
const AUTH_ROUTES = ['/login', '/signup', '/otp'];

/**
 * Public routes (accessible without authentication)
 */
const PUBLIC_ROUTES = ['/'];

/**
 * Decode JWT token safely
 */
function decodeToken(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<JWTPayload>(token);
    const currentTime = Date.now() / 1000;
    // Add 30 second buffer
    return decoded.exp < currentTime + 30;
  } catch {
    return true;
  }
}

/**
 * Attempt to refresh the access token
 */
async function tryRefreshToken(request: NextRequest): Promise<{ access?: string; refresh?: string } | null> {
  const refreshToken = getCookie(REFRESH_TOKEN_COOKIE, request.headers.get('cookie') || '');

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/jwt/refresh/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return { access: data.access, refresh: data.refresh };
  } catch {
    return null;
  }
}

/**
 * Main proxy function
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if current route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  
  // Get access token from cookies
  let accessToken = getCookie(ACCESS_TOKEN_COOKIE, request.headers.get('cookie') || '');
  let response = NextResponse.next();

  // --- HANDLE PROTECTED ROUTES ---
  if (isProtectedRoute) {
    // No token or expired token
    if (!accessToken || isTokenExpired(accessToken)) {
      // Try to refresh the token
      const tokens = await tryRefreshToken(request);

      if (tokens && tokens.access && tokens.refresh) {
        // Successfully refreshed - update cookies and continue
        accessToken = tokens.access;
        response = NextResponse.next();
        
        // Set new tokens in cookies
        response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.access, {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 5, // 5 minutes
        });
        response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refresh, {
          path: '/',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 1 day
        });
      } else {
        // Refresh failed - redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    // Check if user is verified
    const decoded = decodeToken(accessToken);
    if (decoded && !decoded.is_verified) {
      // Unverified user - redirect to OTP
      return NextResponse.redirect(new URL('/otp', request.url));
    }

    return response;
  }

  // --- HANDLE AUTH ROUTES (reverse protection) ---
  if (isAuthRoute) {
    // If user has valid token, redirect to home
    if (accessToken && !isTokenExpired(accessToken)) {
      const decoded = decodeToken(accessToken);

      // Only redirect if fully verified
      if (decoded && decoded.is_verified) {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // If on /otp and not verified, allow access
      if (pathname.startsWith('/otp') && decoded && !decoded.is_verified) {
        return NextResponse.next();
      }

      // If verified but on /login or /signup, redirect home
      if ((pathname.startsWith('/login') || pathname.startsWith('/signup')) && decoded?.is_verified) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  }

  // --- PUBLIC ROUTES ---
  // Allow access to public routes without any checks
  return NextResponse.next();
}

/**
 * Matcher configuration
 * Runs proxy on all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
};
