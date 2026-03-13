import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { toast } from "sonner";
import { requestPasswordReset } from "./api";

function createForgotPasswordSchema(t: (key: string) => string) {
  return z.object({
    email: z
      .string()
      .min(1, t("validation.emailRequired"))
      .email(t("validation.emailInvalid")),
  });
}

type ForgotPasswordValues = { email: string };

export function ForgotPasswordForm({ className }: { className?: string }) {
  const { t } = useTranslation();
  const schema = useMemo(() => createForgotPasswordSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: ForgotPasswordValues) {
    try {
      await requestPasswordReset(data.email);
      toast.success(t("toast.resetLinkSent"));
    } catch {
      toast.error(t("toast.resetLinkFailed"));
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-5", className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center mb-2">
          <h1 className="auth-heading">{t("forgotPassword.title")}</h1>
        </div>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email" className="label-caps">
            {t("forgotPassword.emailLabel")}
          </FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder={t("forgotPassword.emailPlaceholder")}
            aria-invalid={!!errors.email}
            className="bg-card"
            {...register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full uppercase tracking-widest"
          >
            {t("forgotPassword.submit")}
          </Button>
        </Field>
        <div className="text-center pt-1">
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 uppercase tracking-widest"
          >
            {t("forgotPassword.backToLogin")}
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
