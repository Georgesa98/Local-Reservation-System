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
import { ArrowLeft, Clock, Mail, Send, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { otpSchema, type OTPFormData } from "./schema";
import {
    verifyOTP,
    resendOTP,
    fetchOTPData,
    clearOTPData,
    type OTPChannelInfo,
} from "./api";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { tokenManager } from "@/lib/axios";

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
    const [countdown, setCountdown] = useState<number>(0);

    const [fullPhone, setFullPhone] = useState<string>("");
    const [channelInfo, setChannelInfo] = useState<OTPChannelInfo | null>(null);

    const {
        handleSubmit,
        setValue,
        formState: { errors },
        clearErrors,
    } = useForm<OTPFormData>({
        resolver: zodResolver(otpSchema),
    });

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const phone = localStorage.getItem("otpPhoneFull");
        if (!phone) {
            router.push("/signup");
            return;
        }

        setFullPhone(phone);
        fetchOTPData(phone)
            .then((data) => setChannelInfo(data))
            .catch(() => router.push("/signup"));
    }, [router]);

    useEffect(() => {
        let timer: NodeJS.Timeout;

        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleDigitChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);

        const newDigits = [...otpDigits];
        newDigits[index] = digit;
        setOtpDigits(newDigits);

        const otpCode = newDigits.join("");
        setValue("otp_code", otpCode);

        if (apiError) setApiError("");
        clearErrors();

        if (digit && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        e: KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

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

            inputRefs.current[5]?.focus();
        }
    };

    const onSubmit = async (data: OTPFormData) => {
        if (!fullPhone) {
            setApiError("Session expired. Please sign up again.");
            router.push("/signup");
            return;
        }

        setApiError("");
        setIsLoading(true);

        try {
            const response = await verifyOTP(data, fullPhone);

            if (response.data?.verified) {
                const otpFlow = localStorage.getItem("otpFlow");
                if (otpFlow === "reset") {
                    router.push("/reset-password");
                } else {
                    const refreshed = await tokenManager.refreshTokens();
                    clearOTPData();
                    if (!refreshed) {
                        console.warn(
                            "Failed to refresh tokens after verification",
                        );
                    }

                    router.push("/");
                }
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
        if (!fullPhone) return;

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
            const response = await resendOTP(fullPhone, channel);

            if (response.success) {
                const channelName =
                    channel === "whatsapp"
                        ? "WhatsApp"
                        : channel === "telegram"
                          ? "Telegram"
                          : "Email";
                setSuccessMessage(`New code sent via ${channelName}`);

                setCountdown(300);

                setOtpDigits(["", "", "", "", "", ""]);
                setValue("otp_code", "");

                if (inputRefs.current[0]) {
                    inputRefs.current[0].focus();
                }
            }
        } catch (error: any) {
            setApiError(
                error.message || "Failed to resend code. Please try again.",
            );
        } finally {
            setIsResending(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    if (!channelInfo) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="font-body text-muted-foreground">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="w-full max-w-md px-6 pt-6">
                <Link
                    href="/signup"
                    className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="font-body text-sm">Back to Sign Up</span>
                </Link>
            </header>

            <main className="min-h-screen flex flex-col items-center justify-center px-6 pb-12">
                <div className="w-full max-w-md text-center mb-10">
                    <h1 className="font-headline font-bold text-4xl text-foreground tracking-tight mb-3">
                        Verify Your Phone
                    </h1>
                    <p className="font-body text-lg text-muted-foreground mb-2">
                        We sent a 6-digit code to your phone
                    </p>
                </div>

                <div className="w-full max-w-md space-y-6">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {successMessage && (
                            <div className="bg-tertiary/10 border border-tertiary/20 rounded-lg p-4">
                                <p className="font-body text-sm text-tertiary">
                                    {successMessage}
                                </p>
                            </div>
                        )}

                        {apiError && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <p className="font-body text-sm text-destructive">
                                    {apiError}
                                </p>
                            </div>
                        )}

                        {errors.otp_code && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <p className="font-body text-sm text-destructive">
                                    {errors.otp_code.message}
                                </p>
                            </div>
                        )}

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
                                        onChange={(e) =>
                                            handleDigitChange(
                                                index,
                                                e.target.value,
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyDown(index, e)
                                        }
                                        onPaste={
                                            index === 0
                                                ? handlePaste
                                                : undefined
                                        }
                                        className="w-12 h-14 text-center text-xl font-semibold bg-card border-2 border-border/30 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                                        disabled={isLoading || isResending}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={
                                isLoading || otpDigits.join("").length !== 6
                            }
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

                    <div className="text-center space-y-4">
                        <p className="font-body text-sm text-muted-foreground">
                            Didn&apos;t receive the code?
                        </p>

                        {countdown > 0 && (
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="font-body text-sm">
                                    Resend in {formatTime(countdown)}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center flex-wrap">
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

                            {channelInfo.hasTelegram && (
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
                            )}

                            {channelInfo.hasEmail && (
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
                                <span className="font-body text-sm">
                                    Sending...
                                </span>
                            </div>
                        )}
                    </div>

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
