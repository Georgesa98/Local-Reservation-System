import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getTokens, clearTokens, refreshIfNeeded, getCurrentUser } from '../lib/tokenManager'

/**
 * RootRedirect - Smart routing proxy component
 * 
 * This component handles intelligent routing on app launch based on:
 * 1. Authentication status
 * 2. Token validity and refresh
 * 3. User role
 * 
 * Routing logic:
 * - Unauthenticated → /login
 * - MANAGER → /dashboard/rooms
 * - ADMIN → /dashboard (admin dashboard placeholder)
 * - Token expired but refreshable → auto-refresh then route
 * - Token refresh failed → /login
 */
export function RootRedirect() {
  const [isChecking, setIsChecking] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function checkAuthAndRoute() {
      try {
        // 1. Check if we have tokens
        const tokens = await getTokens()
        
        if (!tokens) {
          // No tokens → redirect to login
          navigate('/login', { replace: true })
          return
        }

        // 2. Try to refresh if needed (expired access token but valid refresh)
        const refreshed = await refreshIfNeeded()
        
        if (!refreshed) {
          // Refresh failed → clear tokens and redirect to login
          await clearTokens()
          navigate('/login', { replace: true })
          return
        }

        // 3. Get user data from token
        const user = await getCurrentUser()
        
        if (!user) {
          // Couldn't decode user from token → redirect to login
          await clearTokens()
          navigate('/login', { replace: true })
          return
        }

        // 4. Route based on role
        switch (user.role) {
          case 'ADMIN':
            navigate('/dashboard', { replace: true })
            break
          case 'MANAGER':
            navigate('/dashboard/rooms', { replace: true })
            break
          case 'AGENT':
            // For now, agents also go to manager dashboard
            // Can be changed later when agent features are implemented
            navigate('/dashboard/rooms', { replace: true })
            break
          default:
            // Unknown role → redirect to login
            await clearTokens()
            navigate('/login', { replace: true })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // On any error, clear tokens and redirect to login
        await clearTokens()
        navigate('/login', { replace: true })
      } finally {
        setIsChecking(false)
      }
    }

    checkAuthAndRoute()
  }, [navigate])

  // Show loading spinner while checking authentication
  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // After routing, show nothing (navigation will take over)
  return null
}
