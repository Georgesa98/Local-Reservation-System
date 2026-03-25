import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../lib/tokenManager";
import type { UserRole } from "../lib/jwtUtils";

export interface CurrentUser {
  id: number;
  phone_number: string;
  role: UserRole;
  first_name: string;
  last_name: string;
}

/**
 * Fetch current user data from the JWT access token.
 * 
 * This decodes the token payload instead of making an API call to /auth/users/me/,
 * providing instant access to user information.
 * 
 * Note: User data in the token is refreshed every 5 minutes when the access token
 * is refreshed. If you need real-time profile updates, consider adding a separate
 * API call for profile data.
 */
async function fetchCurrentUser(): Promise<CurrentUser | null> {
  return await getCurrentUser();
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    // Recheck when window regains focus in case token was refreshed
    refetchOnWindowFocus: true,
    // Keep data fresh - revalidate every minute
    staleTime: 1 * 60 * 1000,
  });
}
