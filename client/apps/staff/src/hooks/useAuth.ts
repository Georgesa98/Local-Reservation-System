import { useState, useEffect, useCallback } from 'react'
import { getTokens, clearTokens, refreshTokens } from '../lib/tokenManager'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
export type Role = 'ADMIN' | 'MANAGER';
export interface UseAuthResult {
  status: AuthStatus
  isLoading: boolean
  isAuthenticated: boolean
  logout: () => Promise<void>
}

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function useAuth(): UseAuthResult {
  const [status, setStatus] = useState<AuthStatus>('loading')

  const checkAuth = useCallback(async () => {
    setStatus('loading')
    try {
      const tokens = await getTokens()
      if (!tokens) {
        setStatus('unauthenticated')
        return
      }
      if (isTokenValid(tokens.access)) {
        setStatus('authenticated')
        return
      }
      if (isTokenValid(tokens.refresh)) {
        const refreshed = await refreshTokens(tokens.refresh)
        setStatus(refreshed ? 'authenticated' : 'unauthenticated')
      } else {
        setStatus('unauthenticated')
      }
    } catch {
      setStatus('unauthenticated')
    }
  }, [])

  const logout = useCallback(async () => {
    await clearTokens()
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    const handleLogout = () => setStatus('unauthenticated')
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  return {
    status,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    logout,
  }
}
