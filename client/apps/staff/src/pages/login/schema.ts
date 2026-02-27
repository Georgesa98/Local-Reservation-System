import { z } from "zod"

export const loginSchema = z.object({
  phonenumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export type LoginFormValues = z.infer<typeof loginSchema>
