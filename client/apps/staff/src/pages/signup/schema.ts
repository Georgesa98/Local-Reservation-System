import { z } from "zod"

export const signupSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    phonenumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+[1-9]\d{7,14}$/, "Enter a valid phone number"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignupFormValues = z.infer<typeof signupSchema>
