import { z } from "zod"
import type { TFunction } from "i18next"

export function createOtpSchema(t: TFunction) {
  return z.object({
    otp: z
      .string()
      .length(6, t("validation.otpLength"))
      .regex(/^\d+$/, t("validation.otpDigits")),
  })
}

export type OtpFormValues = z.infer<ReturnType<typeof createOtpSchema>>
