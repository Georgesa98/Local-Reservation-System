import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldDescription,
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
  phoneNumber: string
  channel: OtpChannel
  hasEmail: boolean
  hasTelegram: boolean
  onChannelChange: (channel: OtpChannel) => void
  className?: string
}

export function OtpForm({
  phoneNumber,
  channel,
  hasEmail,
  hasTelegram,
  onChannelChange,
  className,
}: OtpFormProps) {
  const { t } = useTranslation()
  const otpSchema = useMemo(() => createOtpSchema(t), [t])
  const [dialogOpen, setDialogOpen] = useState(false)
  const navigate = useNavigate()

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
      const result = await verifyOtp(phoneNumber, data)
      if (result.verified) {
        toast.success(t("toast.verified"))
        navigate("/", { replace: true })
      } else {
        setError("otp", { message: t("validation.otpIncorrect") })
      }
    } catch {
      setError("otp", { message: t("validation.otpFailed") })
    }
  }

  async function handleResend() {
    const toastId = toast.loading(t("toast.sending"))
    try {
      await resendOtp(phoneNumber, channel)
      toast.success(t("toast.codeSent"), { id: toastId })
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("toast.resendFailed")
      toast.error(message, { id: toastId })
    }
  }

  async function handleChannelChange(newChannel: OtpChannel) {
    onChannelChange(newChannel)
    const toastId = toast.loading(t("toast.sending"))
    try {
      await resendOtp(phoneNumber, newChannel)
      toast.success(t("toast.codeSent"), { id: toastId })
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t("toast.sendFailed")
      toast.error(message, { id: toastId })
    }
  }

  return (
    <>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">{t(`otp.channel.${channel}.title`)}</h1>
            <p className="text-muted-foreground text-sm text-balance">
              {t(`otp.channel.${channel}.description`)}{" "}
              {t("otp.enterBelow")}
            </p>
          </div>
          <Field className="items-center" data-invalid={!!errors.otp}>
            <FieldLabel htmlFor="otp">{t("otp.codeLabel")}</FieldLabel>
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
            <FieldDescription className="text-center">
              {t("otp.expires")}
            </FieldDescription>
          </Field>
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {t("otp.submit")}
            </Button>
          </Field>
          <Field>
            <FieldDescription className="text-center">
              {t("otp.didntReceive")}{" "}
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={handleResend}
              >
                {t("otp.resend")}
              </button>
            </FieldDescription>
            <FieldDescription className="text-center">
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={() => setDialogOpen(true)}
              >
                {t("otp.tryDifferent")}
              </button>
              {" "}{t("otp.or")}{" "}
              <Link to="/login" className="underline underline-offset-4">
                {t("otp.goBack")}
              </Link>
            </FieldDescription>
          </Field>
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
