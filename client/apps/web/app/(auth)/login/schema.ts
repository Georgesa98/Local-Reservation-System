import { z } from 'zod';

/**
 * Login Schema
 * Matches Django JWT create endpoint: POST /api/auth/jwt/create/
 * 
 * Field requirements from API_ENDPOINTS.md:
 * - phone_number: E.164 format (international format starting with +)
 * - password: Minimum 8 characters
 */
export const loginSchema = z.object({
  phone_number: z
    .string()
    .min(1, 'Phone number is required')
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Invalid phone number format. Use international format: +1234567890'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * API Error Response Schema
 * Standard envelope for error responses from Django backend
 */
export const apiErrorSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  errors: z.record(z.array(z.string())).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
