"use client";

import {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ClipboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Clock,
  MessageCircle,
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { otpSchema, type OTPFormData } from "./schema";
import { verifyOTP, resendOTP, getOTPData, clearOTPData } from "./api";
import { isAuthenticated } from "../login/api";
import { SiTelegram, SiWhatsapp } from "@icons-pack/react-simple-icons";

type Channel = "whatsapp" | "telegram" | "email";

export default function OTPVerificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  // Refs for OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP data from localStorage
  const [otpData, setOtpData] = useState<{
    maskedPhone: string;
    fullPhone: string;
    maskedEmail: string | null;
    hasEmail: boolean;
  } | null>(null);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
    clearErrors,
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Initialize OTP data and redirect checks
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated()) {
      router.push("/");
      return;
    }

    // Get OTP data from localStorage
    const { isValid, data } = getOTPData();

    if (!isValid || !data) {
      // No valid OTP data - redirect back to signup
      router.push("/signup");
      return;
    }

    setOtpData(data);
  }, [router]);

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Update form value
    const otpCode = newDigits.join("");
    setValue("otp_code", otpCode);

    // Clear any previous errors
    if (apiError) setApiError("");
    clearErrors();

    // Auto-focus next input
    if (digit && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace - focus previous input if current is empty
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (paste.length === 6) {
      const newDigits = paste.split("");
      setOtpDigits(newDigits);
      setValue("otp_code", paste);

      // Focus last input
      inputRefs.current[5]?.focus();
    }
  };

  const onSubmit = async (data: OTPFormData) => {
    if (!otpData) {
      setApiError("Session expired. Please sign up again.");
      router.push("/signup");
      return;
    }

    setApiError("");
    setIsLoading(true);

    try {
      const response = await verifyOTP(data, otpData.fullPhone);

      if (response.data?.verified) {
        // Clear OTP data from localStorage
        clearOTPData();

        // Redirect to home (user is now verified and will be auto-logged in)
        router.push("/");
      } else {
        setApiError("Invalid OTP code. Please try again.");
      }
    } catch (error: any) {
      setApiError(error.message || "Invalid OTP code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (channel: Channel) => {
    if (!otpData) return;

    if (countdown > 0) {
      setApiError(
        `Please wait ${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, "0")} before requesting another code.`,
      );
      return;
    }

    setApiError("");
    setSuccessMessage("");
    setIsResending(true);

    try {
      const response = await resendOTP(otpData.fullPhone, channel);

      if (response.success) {
        const channelName =
          channel === "whatsapp"
            ? "WhatsApp"
            : channel === "telegram"
              ? "Telegram"
              : "Email";
        setSuccessMessage(`New code sent via ${channelName}`);

        // Set 5-minute countdown (300 seconds)
        setLastResendTime(Date.now());
        setCountdown(300);

        // Clear OTP inputs
        setOtpDigits(["", "", "", "", "", ""]);
        setValue("otp_code", "");

        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (error: any) {
      setApiError(error.message || "Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!otpData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="font-body text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back Button - at top, outside centered container */}
      <header className="w-full max-w-md px-6 pt-6">
        <Link
          href="/signup"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-body text-sm">Back to Sign Up</span>
        </Link>
      </header>

      {/* Main Content - centered */}
      <main className="min-h-screen flex flex-col items-center justify-center px-6 pb-12">
        {/* Header Section */}
        <div className="w-full max-w-md text-center mb-10">
          <h1 className="font-headline font-bold text-4xl text-foreground tracking-tight mb-3">
            Verify Your Phone
          </h1>
          <p className="font-body text-lg text-muted-foreground mb-2">
            We sent a 6-digit code to
          </p>
          <p className="font-body text-lg font-semibold text-foreground">
            {otpData.maskedPhone}
          </p>
        </div>

        {/* OTP Form Container */}
        <div className="w-full max-w-md space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Success Message */}
            {successMessage && (
              <div className="bg-tertiary/10 border border-tertiary/20 rounded-lg p-4">
                <p className="font-body text-sm text-tertiary">
                  {successMessage}
                </p>
              </div>
            )}

            {/* API Error Message */}
            {apiError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="font-body text-sm text-destructive">{apiError}</p>
              </div>
            )}

            {/* Form Error */}
            {errors.otp_code && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="font-body text-sm text-destructive">
                  {errors.otp_code.message}
                </p>
              </div>
            )}

            {/* OTP Input */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-4 block text-center">
                Enter 6-Digit Code
              </label>
              <div className="flex gap-3 justify-center">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-14 text-center text-xl font-semibold bg-card border-2 border-border/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    disabled={isLoading || isResending}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              disabled={isLoading || otpDigits.join("").length !== 6}
              className="w-full h-14 btn-primary-gradient font-headline font-semibold text-base mt-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </form>

          {/* Resend Section */}
          <div className="text-center space-y-4">
            <p className="font-body text-sm text-muted-foreground">
              Didn't receive the code?
            </p>

            {countdown > 0 && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-body text-sm">
                  Resend in {formatTime(countdown)}
                </span>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {/* WhatsApp */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isResending || countdown > 0}
                onClick={() => handleResend("whatsapp")}
                className="flex items-center gap-2 bg-card border-border/30 font-body text-xs px-4 py-2"
              >
                <SiWhatsapp className="w-4 h-4" />
                WhatsApp
              </Button>

              {/* Telegram */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isResending || countdown > 0}
                onClick={() => handleResend("telegram")}
                className="flex items-center gap-2 bg-card border-border/30 font-body text-xs px-4 py-2"
              >
                <Send className="w-4 h-4" />
                Telegram
              </Button>

              {/* Email (only if user provided email) */}
              {otpData.hasEmail && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isResending || countdown > 0}
                  onClick={() => handleResend("email")}
                  className="flex items-center gap-2 bg-card border-border/30 font-body text-xs px-4 py-2"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              )}
            </div>

            {isResending && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-body text-sm">Sending...</span>
              </div>
            )}
          </div>

          {/* Branding */}
          <div className="text-center mt-12">
            <p className="font-headline text-2xl font-bold text-primary">
              LuxeStay
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              Your gateway to luxury accommodations
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
