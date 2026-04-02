import { z } from "zod";

export const forgotPasswordSchema = z.object({
    phone_number: z
        .string()
        .min(1, "Phone number is required")
        .regex(
            /^\+[1-9]\d{1,14}$/,
            "Invalid phone number format. Use international format: +1234567890",
        ),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
