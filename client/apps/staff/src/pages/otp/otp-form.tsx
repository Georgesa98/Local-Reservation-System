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
import { Link } from "react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, type OtpFormValues } from "./schema";
import { verifyOtp, resendOtp } from "./api";

interface OtpFormProps {
  phoneNumber: string
  className?: string
}

export function OtpForm({ phoneNumber, className }: OtpFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  async function onSubmit(data: OtpFormValues) {
    try {
      const result = await verifyOtp(phoneNumber, data)
      if (!result.verified) {
        console.error("OTP verification failed")
      }
    } catch (error) {
      console.error("OTP verification failed:", error)
    }
  }

  async function handleResend() {
    try {
      await resendOtp(phoneNumber)
    } catch (error) {
      console.error("Resend failed:", error)
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            We sent a 6-digit verification code to your email. Enter it below to
            continue.
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
            The code expires in 10 minutes.
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
            Wrong email?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Go back
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
