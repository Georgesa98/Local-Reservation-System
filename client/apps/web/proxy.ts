import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import {
    getCookie,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
} from "./lib/cookies";

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
    email: string | null;
    exp: number;
    iat: number;
    jti: string;
}

/**
 * Routes that require authentication and verification
 * Add any protected routes to this array
 */
const PROTECTED_ROUTES = [
    "/dashboard",
    "/bookings",
    "/profile",
    "/settings",
    // Add more protected routes here
];

/**
 * Auth routes (login, signup, OTP)
 * Authenticated users will be redirected away from these
 */
const AUTH_ROUTES = ["/login", "/signup", "/otp"];

/**
 * Public routes (accessible without authentication)
 */
const PUBLIC_ROUTES = ["/"];

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
 * Main proxy function
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if current route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route),
    );
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // Get access token from cookies
    let accessToken = getCookie(
        ACCESS_TOKEN_COOKIE,
        request.headers.get("cookie") || "",
    );
    const refreshToken = getCookie(
        REFRESH_TOKEN_COOKIE,
        request.headers.get("cookie") || "",
    );
    let response = NextResponse.next();

    // --- HANDLE PROTECTED ROUTES ---
    if (isProtectedRoute) {
        // If neither token exists, redirect to login.
        if (!accessToken && !refreshToken) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // If access token is still valid, keep enforcing verification.
        if (accessToken && !isTokenExpired(accessToken)) {
            const decoded = decodeToken(accessToken);
            if (decoded && !decoded.is_verified) {
                return NextResponse.redirect(new URL("/otp", request.url));
            }
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
                return NextResponse.redirect(new URL("/", request.url));
            }

            // If on /otp and not verified, allow access
            if (
                pathname.startsWith("/otp") &&
                decoded &&
                !decoded.is_verified
            ) {
                return NextResponse.next();
            }

            // If verified but on /login or /signup, redirect home
            if (
                (pathname.startsWith("/login") ||
                    pathname.startsWith("/signup")) &&
                decoded?.is_verified
            ) {
                return NextResponse.redirect(new URL("/", request.url));
            }
        }

        return NextResponse.next();
    }

    // --- PUBLIC ROUTES ---
    // Check if user has token but is not verified
    if (accessToken && !isTokenExpired(accessToken)) {
        const decoded = decodeToken(accessToken);

        // If user is authenticated but not verified, redirect to OTP
        if (decoded && !decoded.is_verified) {
            return NextResponse.redirect(new URL("/otp", request.url));
        }
    }

    // Allow access to public routes
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
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)",
    ],
};
