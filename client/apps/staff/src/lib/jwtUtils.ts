/**
 * JWT token utilities for decoding and extracting user information.
 * 
 * The backend embeds user data in the JWT payload, allowing us to access
 * user information without additional API calls.
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'AGENT'

export interface JWTPayload {
  user_id: number
  role: UserRole
  first_name: string
  last_name: string
  phone_number: string
  exp: number
  iat: number
  jti: string
  token_type: string
}

export interface UserFromToken {
  id: number
  role: UserRole
  first_name: string
  last_name: string
  phone_number: string
}

/**
 * Safely decode a JWT token payload.
 * 
 * @param token - The JWT access token string
 * @returns Decoded JWT payload or null if invalid
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT structure: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT structure')
      return null
    }

    // Decode the payload (second part)
    const payload = parts[1]
    const decoded = atob(payload)
    const parsed = JSON.parse(decoded) as JWTPayload

    return parsed
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

/**
 * Extract user information from a JWT access token.
 * 
 * @param token - The JWT access token string
 * @returns User data extracted from token, or null if invalid/expired
 */
export function getUserFromToken(token: string): UserFromToken | null {
  const payload = decodeJWT(token)
  
  if (!payload) {
    return null
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) {
    console.warn('JWT token is expired')
    return null
  }

  // Extract user fields
  return {
    id: payload.user_id,
    role: payload.role,
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone_number: payload.phone_number,
  }
}

/**
 * Check if a token is expired or expiring soon.
 * 
 * @param token - The JWT access token string
 * @param bufferSeconds - Number of seconds before expiry to consider "expiring soon" (default: 60)
 * @returns true if token is expired or expiring soon
 */
export function isTokenExpiringSoon(token: string, bufferSeconds: number = 60): boolean {
  const payload = decodeJWT(token)
  
  if (!payload) {
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  const timeUntilExpiry = payload.exp - now
  
  return timeUntilExpiry < bufferSeconds
}

/**
 * Get the user's role from a JWT token.
 * 
 * @param token - The JWT access token string
 * @returns User's role or null if invalid
 */
export function getRoleFromToken(token: string): UserRole | null {
  const payload = decodeJWT(token)
  return payload?.role ?? null
}

/**
 * Check if user has a specific role.
 * 
 * @param token - The JWT access token string
 * @param allowedRoles - Array of allowed roles
 * @returns true if user has one of the allowed roles
 */
export function hasRole(token: string, allowedRoles: UserRole[]): boolean {
  const role = getRoleFromToken(token)
  if (!role) return false
  
  return allowedRoles.includes(role)
}
