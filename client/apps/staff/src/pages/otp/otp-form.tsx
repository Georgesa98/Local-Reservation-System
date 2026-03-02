import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@workspace/ui/components/input-otp";
import { Link, useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOtpSchema, type OtpFormValues } from "./schema";
import { verifyOtp, resendOtp, type OtpChannel } from "./api";
import { OtpMethodDialog } from "./otp-method-dialog";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface OtpFormProps {
  phoneNumber: string;
  channel: OtpChannel;
  hasEmail: boolean;
  hasTelegram: boolean;
  onChannelChange: (channel: OtpChannel) => void;
  className?: string;
}

/** Masks all but the last 4 digits: +963 •••• 4422 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return phone;
  const prefix = phone.startsWith("+") ? "+" + digits.slice(0, digits.length - 10) : "";
  const visible = digits.slice(-4);
  return `${prefix} •••• ${visible}`.trim();
}

export function OtpForm({
  phoneNumber,
  channel,
  hasEmail,
  hasTelegram,
  onChannelChange,
  className,
}: OtpFormProps) {
  const { t } = useTranslation();
  const otpSchema = useMemo(() => createOtpSchema(t), [t]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmit(data: OtpFormValues) {
    try {
      const result = await verifyOtp(phoneNumber, data);
      if (result.verified) {
        toast.success(t("toast.verified"));
        navigate("/", { replace: true });
      } else {
        setError("otp", { message: t("validation.otpIncorrect") });
      }
    } catch {
      setError("otp", { message: t("validation.otpFailed") });
    }
  }

  async function handleResend() {
    const toastId = toast.loading(t("toast.sending"));
    try {
      await resendOtp(phoneNumber, channel);
      toast.success(t("toast.codeSent"), { id: toastId });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("toast.resendFailed");
      toast.error(message, { id: toastId });
    }
  }

  async function handleChannelChange(newChannel: OtpChannel) {
    onChannelChange(newChannel);
    const toastId = toast.loading(t("toast.sending"));
    try {
      await resendOtp(phoneNumber, newChannel);
      toast.success(t("toast.codeSent"), { id: toastId });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("toast.sendFailed");
      toast.error(message, { id: toastId });
    }
  }

  return (
    <>
      <form
        className={cn("flex flex-col gap-5", className)}
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center mb-2">
            <h1 className="auth-heading">{t("otp.title")}</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
              {t("otp.sentTo")} {maskPhone(phoneNumber)}
            </p>
          </div>
          <Field className="items-center" data-invalid={!!errors.otp}>
            <FieldLabel htmlFor="otp" className="label-caps">
              {t("otp.codeLabel")}
            </FieldLabel>
            <Controller
              name="otp"
              control={control}
              render={({ field }) => (
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            <FieldError errors={[errors.otp]} />
          </Field>
          <Field>
            <Button type="submit" disabled={isSubmitting} className="w-full uppercase tracking-widest">
              {t("otp.submit")}
            </Button>
          </Field>
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleResend}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 uppercase tracking-widest"
            >
              {t("otp.resend")}
            </button>
            <Link
              to="/login"
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 uppercase tracking-widest"
            >
              {t("otp.goBack")}
            </Link>
          </div>
        </FieldGroup>
      </form>

      <OtpMethodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentChannel={channel}
        hasEmail={hasEmail}
        hasTelegram={hasTelegram}
        onSelectChannel={handleChannelChange}
      />
    </>
  );
}
