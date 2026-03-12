import { useQuery } from "@tanstack/react-query";
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

async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await axiosClient.get<CurrentUser>("/api/auth/users/me/");
  return response.data;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}
