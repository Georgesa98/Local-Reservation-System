import { useState, useEffect } from "react";
import { axiosClient } from "../lib/axiosClient";

export interface CurrentUser {
  id: number;
  phone_number: string;
  email: string | null;
  telegram_chat_id: string | null;
  role: "ADMIN" | "MANAGER" | "AGENT" | "USER";
  first_name: string;
  last_name: string;
}

interface UseCurrentUserResult {
  user: CurrentUser | null;
  isLoading: boolean;
  error: string | null;
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    axiosClient
      .get<CurrentUser>("/api/auth/users/me/")
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load user");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, isLoading, error };
}
