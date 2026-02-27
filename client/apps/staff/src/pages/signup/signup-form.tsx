import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Link, useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSignupSchema, type SignupFormValues } from "./schema";
import { signup } from "./api";
import { PhoneInput } from "@/components/phone-input";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { toast } from "sonner";

export function SignupForm({ className }: { className?: string }) {
  const { t } = useTranslation();
  const signupSchema = useMemo(() => createSignupSchema(t), [t]);
  const navigate = useNavigate()

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { phonenumber: "+963" },
  });

  async function onSubmit(data: SignupFormValues) {
    try {
      const response = await signup(data)
      toast.success(t("toast.signupSuccess"))
      navigate("/otp", {
        state: {
          phoneNumber: data.phonenumber,
          hasEmail: !!data.email,
          hasTelegram: false,
          otpSent: response.otp_sent,
        },
      })
    } catch (error) {
      console.error("Signup failed:", error)
      toast.error(t("toast.signupFailed"))
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t("signup.title")}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t("signup.subtitle")}
          </p>
        </div>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">{t("signup.nameLabel")}</FieldLabel>
          <Input
            id="name"
            type="text"
            placeholder={t("signup.namePlaceholder")}
            aria-invalid={!!errors.name}
            className="bg-background"
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.phonenumber}>
          <FieldLabel htmlFor="phonenumber">{t("signup.phoneLabel")}</FieldLabel>
          <Controller
            name="phonenumber"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="phonenumber"
                aria-invalid={!!errors.phonenumber}
                className="bg-background"
                {...field}
              />
            )}
          />
          <FieldDescription>
            {t("signup.phoneDescription")}
          </FieldDescription>
          <FieldError errors={[errors.phonenumber]} />
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">{t("signup.emailLabel")}</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder={t("signup.emailPlaceholder")}
            aria-invalid={!!errors.email}
            className="bg-background"
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">{t("signup.passwordLabel")}</FieldLabel>
          <Input
            id="password"
            type="password"
            aria-invalid={!!errors.password}
            className="bg-background"
            {...register("password")}
          />
          <FieldDescription>
            {t("signup.passwordDescription")}
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirm-password">{t("signup.confirmPasswordLabel")}</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            aria-invalid={!!errors.confirmPassword}
            className="bg-background"
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {t("signup.submit")}
          </Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-muted dark:*:data-[slot=field-separator-content]:bg-card">
          {t("signup.orContinueWith")}
        </FieldSeparator>
        <Field>
          <FieldDescription className="px-6 text-center">
            {t("signup.hasAccount")}{" "}
            <Link to="/login">{t("signup.signIn")}</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
