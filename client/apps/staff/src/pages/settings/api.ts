import { axiosClient } from "../../lib/axiosClient";
import type { UserProfileFormState, TelegramRegistrationPayload } from "./schema";

/**
 * User profile response shape from GET /api/auth/users/me/
 */
export interface UserProfile {
  id: number;
  phone_number: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "MANAGER" | "USER" | "AGENT";
  telegram_chat_id: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * GET /api/auth/users/me/ — fetch current user's profile.
 */
export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await axiosClient.get<UserProfile>("/api/auth/users/me/");
  return data;
}

/**
 * PATCH /api/auth/users/me/ — update current user's profile.
 * Only sends the fields that are being updated.
 */
export async function updateUserProfile(
  payload: Partial<UserProfileFormState>
): Promise<UserProfile> {
  const { data } = await axiosClient.patch<UserProfile>(
    "/api/auth/users/me/",
    payload
  );
  return data;
}

/**
 * POST /api/notifications/telegram/register/ — register Telegram chat_id.
 * Staff only (ADMIN | MANAGER).
 */
export async function registerTelegram(
  payload: TelegramRegistrationPayload
): Promise<{ success: boolean; message: string }> {
  const { data } = await axiosClient.post<{ success: boolean; message: string }>(
    "/api/notifications/telegram/register/",
    payload
  );
  return data;
}

/**
 * DELETE /api/notifications/telegram/register/ — disconnect Telegram.
 * Staff only (ADMIN | MANAGER).
 */
export async function disconnectTelegram(): Promise<{ success: boolean; message: string }> {
  const { data } = await axiosClient.delete<{ success: boolean; message: string }>(
    "/api/notifications/telegram/register/"
  );
  return data;
}
