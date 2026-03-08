import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Link, useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createLoginSchema, type LoginFormValues } from "./schema";
import { login } from "./api";
import { PhoneInput } from "@/components/phone-input";
import { Input } from "@workspace/ui/components/input";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { toast } from "sonner";

export function LoginForm({ className }: { className?: string }) {
  const { t } = useTranslation();
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const navigate = useNavigate();

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
      await login(data);
      toast.success(t("toast.loginSuccess"));
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error(t("toast.loginFailed"));
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-5", className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-2 text-center mb-2">
          <h1 className="auth-heading">{t("login.title")}</h1>
        </div>
        <Field data-invalid={!!errors.phonenumber}>
          <FieldLabel htmlFor="phonenumber" className="label-caps">
            {t("login.phoneLabel")}
          </FieldLabel>
          <Controller
            name="phonenumber"
            control={control}
            render={({ field }) => (
              <PhoneInput
                id="phonenumber"
                aria-invalid={!!errors.phonenumber}
                className="bg-card"
                {...field}
              />
            )}
          />
          <FieldError errors={[errors.phonenumber]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password" className="label-caps">
            {t("login.passwordLabel")}
          </FieldLabel>
          <Input
            id="password"
            type="password"
            aria-invalid={!!errors.password}
            className="bg-card"
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
        <Field>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full uppercase tracking-widest"
          >
            {t("login.submit")}
          </Button>
        </Field>
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 uppercase tracking-widest"
          >
            {t("login.forgotPassword")}
          </Link>
          <Link
            to="/signup"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 uppercase tracking-widest"
          >
            {t("login.signUp")}
          </Link>
        </div>
      </FieldGroup>
    </form>
  );
}
