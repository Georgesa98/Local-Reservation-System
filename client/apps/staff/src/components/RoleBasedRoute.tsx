import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { useCurrentUser } from "../hooks/useCurrentUser";
import type { UserRole } from "../lib/jwtUtils";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  /**
   * Where to redirect if user doesn't have required role.
   * Default: '/dashboard/rooms'
   */
  redirectTo?: string;
}

/**
 * Route guard that checks both authentication and user role.
 *
 * Usage:
 * ```tsx
 * <Route path="/admin" element={
 *   <RoleBasedRoute allowedRoles={['ADMIN']}>
 *     <AdminPage />
 *   </RoleBasedRoute>
 * } />
 * ```
 *
 * For routes accessible by both admin and manager:
 * ```tsx
 * <RoleBasedRoute allowedRoles={['ADMIN', 'MANAGER']}>
 *   <RoomsPage />
 * </RoleBasedRoute>
 * ```
 */
export function RoleBasedRoute({
  children,
  allowedRoles,
  redirectTo = "/dashboard/rooms",
}: RoleBasedRouteProps) {
  const { status } = useAuth();
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  // Show loading spinner while checking auth status
  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-foreground" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    // User is authenticated but doesn't have the required role
    // Redirect to default page instead of showing unauthorized
    return <Navigate to={redirectTo} replace />;
  }

  // User is authenticated and has required role
  return <>{children}</>;
}
