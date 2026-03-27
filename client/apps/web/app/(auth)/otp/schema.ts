import { z } from "zod";

/**
 * Zod schema for OTP verification
 * 
 * Backend expects (POST /api/auth/verify-otp/):
 * - phone_number: required, E.164 format
 * - otp_code: required, 6-digit string
 */

export const otpSchema = z.object({
  otp_code: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export type OTPFormData = z.infer<typeof otpSchema>;
