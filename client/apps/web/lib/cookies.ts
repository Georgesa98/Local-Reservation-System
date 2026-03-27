/**
 * Cookie utilities for token management
 * Works in both client-side and Edge Runtime (middleware)
 */

// Token cookie names
export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Set a cookie (client-side only)
 */
export function setCookie(name: string, value: string, days: number = 1): void {
  if (typeof document === 'undefined') return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get a cookie value (works in both client and Edge Runtime)
 */
export function getCookie(name: string, cookieString?: string): string | null {
  // If cookieString is provided (from request.headers), use it
  // Otherwise, use document.cookie (client-side)
  const cookies = cookieString || (typeof document !== 'undefined' ? document.cookie : '');

  const nameEQ = name + '=';
  const ca = cookies.split(';');

  for (let i = 0; i < ca.length; i++) {
    const cookie = ca[i];
    if (!cookie) continue;
    
    let c = cookie;
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }

  return null;
}

/**
 * Delete a cookie (client-side only)
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax`;
}

/**
 * Delete all auth cookies
 */
export function clearAuthCookies(): void {
  deleteCookie(ACCESS_TOKEN_COOKIE);
  deleteCookie(REFRESH_TOKEN_COOKIE);
}
