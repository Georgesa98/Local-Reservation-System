import { axiosClient } from "@/lib/axiosClient";

export async function requestPasswordReset(email: string): Promise<void> {
  await axiosClient.post("/api/auth/users/reset_password/", { email });
}
