import { z } from "zod"

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must contain only digits"),
})

export type OtpFormValues = z.infer<typeof otpSchema>
