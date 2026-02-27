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
import { otpSchema, type OtpFormValues } from "./schema";
import { verifyOtp, resendOtp, type OtpChannel } from "./api";
import { OtpMethodDialog } from "./otp-method-dialog";
import { useState } from "react";
import { toast } from "sonner";

const channelHeadings: Record<OtpChannel, { title: string; description: string }> = {
  whatsapp: {
    title: "Check your WhatsApp",
    description: "We sent a 6-digit verification code to your WhatsApp number.",
  },
  email: {
    title: "Check your email",
    description: "We sent a 6-digit verification code to your email address.",
  },
  telegram: {
    title: "Check your Telegram",
    description: "We sent a 6-digit verification code to your Telegram account.",
  },
}

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
        toast.success("Phone number verified successfully.")
        navigate("/", { replace: true })
      } else {
        setError("otp", { message: "Incorrect code. Please try again." })
      }
    } catch {
      setError("otp", { message: "Verification failed. Please try again." })
    }
  }

  async function handleResend() {
    const toastId = toast.loading("Sending code…")
    try {
      await resendOtp(phoneNumber, channel)
      toast.success("Code sent!", { id: toastId })
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to resend code. Please try again."
      toast.error(message, { id: toastId })
    }
  }

  async function handleChannelChange(newChannel: OtpChannel) {
    onChannelChange(newChannel)
    const toastId = toast.loading("Sending code…")
    try {
      await resendOtp(phoneNumber, newChannel)
      toast.success("Code sent!", { id: toastId })
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to send code via the selected method."
      toast.error(message, { id: toastId })
    }
  }

  const heading = channelHeadings[channel]

  return (
    <>
      <form
        className={cn("flex flex-col gap-6", className)}
        onSubmit={handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">{heading.title}</h1>
            <p className="text-muted-foreground text-sm text-balance">
              {heading.description} Enter it below to continue.
            </p>
          </div>
          <Field className="items-center" data-invalid={!!errors.otp}>
            <FieldLabel htmlFor="otp">Verification Code</FieldLabel>
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
              The code expires in 5 minutes.
            </FieldDescription>
          </Field>
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              Verify
            </Button>
          </Field>
          <Field>
            <FieldDescription className="text-center">
              Didn&apos;t receive a code?{" "}
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={handleResend}
              >
                Resend code
              </button>
            </FieldDescription>
            <FieldDescription className="text-center">
              <button
                type="button"
                className="underline underline-offset-4 hover:text-primary"
                onClick={() => setDialogOpen(true)}
              >
                Try a different method
              </button>
              {" or "}
              <Link to="/login" className="underline underline-offset-4">
                go back
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
