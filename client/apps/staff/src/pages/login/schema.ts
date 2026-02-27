import { z } from "zod"
import type { TFunction } from "i18next"

export function createLoginSchema(t: TFunction) {
  return z.object({
    phonenumber: z
      .string()
      .min(1, t("validation.phoneRequired"))
      .regex(/^\+[1-9]\d{7,14}$/, t("validation.phoneInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  })
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>
