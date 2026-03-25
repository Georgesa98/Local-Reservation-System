import { z } from "zod";

/**
 * Zod schema for the User Profile form.
 *
 * All fields validated here match the writable fields of UserSerializer
 * (backend/api/accounts/serializers.py).
 */
export const userProfileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(150),
  last_name: z.string().min(1, "Last name is required").max(150),
  phone_number: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+[1-9]\d{7,14}$/, "Phone must be in format +963xxxxxxxx"),  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type UserProfileFormState = z.infer<typeof userProfileSchema>;

/**
 * Zod schema for Telegram registration request
 */
export const telegramRegistrationSchema = z.object({
  chat_id: z.string().min(1, "Chat ID is required"),
});

export type TelegramRegistrationPayload = z.infer<typeof telegramRegistrationSchema>;

/**
 * Generate Telegram bot link with user ID parameter.
 * The bot will use this to identify which user is connecting.
 * 
 * @param botUsername - Telegram bot username (without @)
 * @param userId - User's database ID
 * @returns Complete Telegram bot link with start parameter
 */
export function generateTelegramBotLink(botUsername: string, userId: number): string {
  return `https://t.me/${botUsername}?start=${userId}`;
}
