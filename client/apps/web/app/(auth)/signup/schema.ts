import { z } from "zod";

/**
 * Zod schema for signup form validation
 * 
 * Backend expects (POST /api/auth/users/):
 * - phone_number: required, E.164 format
 * - password: required, min 8 chars
 * - first_name: optional
 * - last_name: optional  
 * - email: optional
 */

export const signupSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^\+[1-9]\d{1,14}$/,
        "Please enter a valid phone number with country code (e.g., +963 XXX XXX XXX)"
      ),
    email: z
      .string()
      .email("Please enter a valid email address")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;
