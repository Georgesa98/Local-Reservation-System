import { z } from "zod"
import type { TFunction } from "i18next"

export function createSignupSchema(t: TFunction) {
  return z
    .object({
      name: z.string().min(2, t("validation.nameMin")),
      phonenumber: z
        .string()
        .min(1, t("validation.phoneRequired"))
        .regex(/^\+[1-9]\d{7,14}$/, t("validation.phoneInvalid")),
      email: z
        .string()
        .min(1, t("validation.emailRequired"))
        .email(t("validation.emailInvalid")),
      password: z.string().min(8, t("validation.passwordMin")),
      confirmPassword: z.string().min(1, t("validation.confirmPasswordRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("validation.passwordsMismatch"),
      path: ["confirmPassword"],
    })
}

export type SignupFormValues = z.infer<ReturnType<typeof createSignupSchema>>
