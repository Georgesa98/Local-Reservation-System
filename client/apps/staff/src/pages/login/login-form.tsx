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
import { Link } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLoginSchema, type LoginFormValues } from "./schema";
import { login } from "./api";
import { PhoneInput } from "@/components/phone-input";
import { Input } from "@workspace/ui/components/input";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

export function LoginForm({ className }: { className?: string }) {
  const { t } = useTranslation();
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phonenumber: "+963" },
  });

  async function onSubmit(data: LoginFormValues) {
    try {
      await login(data)
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">{t("login.title")}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {t("login.subtitle")}
          </p>
        </div>
        <Field data-invalid={!!errors.phonenumber}>
          <FieldLabel htmlFor="phonenumber">{t("login.phoneLabel")}</FieldLabel>
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
          <FieldError errors={[errors.phonenumber]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">{t("login.passwordLabel")}</FieldLabel>
            <a
              href="#"
              className="ms-auto text-sm underline-offset-4 hover:underline"
            >
              {t("login.forgotPassword")}
            </a>
          </div>
          <Input
            id="password"
            type="password"
            aria-invalid={!!errors.password}
            className="bg-background"
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {t("login.submit")}
          </Button>
        </Field>
        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-muted dark:*:data-[slot=field-separator-content]:bg-card">
          {t("login.orContinueWith")}
        </FieldSeparator>
        <Field>
          <FieldDescription className="text-center">
            {t("login.noAccount")}{" "}
            <Link to="/signup" className="underline underline-offset-4">
              {t("login.signUp")}
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
