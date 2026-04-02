"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "./schema";
import { forgotPassword } from "./api";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string>("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            phone_number: "",
        },
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setApiError("");
        setIsLoading(true);

        try {
            await forgotPassword(data);
            localStorage.setItem("otpPhoneFull", data.phone_number);
            router.push("/otp?flow=reset");
        } catch (error: any) {
            setIsLoading(false);

            if (error.status === 400) {
                if (error.errors) {
                    Object.keys(error.errors).forEach((field) => {
                        setError(
                            "phone_number" as keyof ForgotPasswordFormData,
                            {
                                type: "server",
                                message: error.errors[field][0],
                            },
                        );
                    });
                } else {
                    setApiError(error.message || "Invalid input");
                }
            } else if (error.status === 0) {
                setApiError("Network error. Please check your connection.");
            } else {
                setApiError(error.message || "An unexpected error occurred");
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12">
                {/* Header Section */}
                <div className="w-full max-w-md text-center mb-10">
                    <h1 className="font-headline font-bold text-4xl text-foreground tracking-tight mb-3">
                        Reset password
                    </h1>
                    <p className="font-body text-lg text-muted-foreground">
                        Enter the email address associated with your account to
                        receive a secure reset link.
                    </p>
                </div>

                {/* Form Container */}
                <div className="w-full max-w-md space-y-6">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* API Error Message */}
                        {apiError && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <p className="font-body text-sm text-destructive">
                                    {apiError}
                                </p>
                            </div>
                        )}

                        {/* Phone Number Input */}
                        <div className="space-y-2">
                            <label
                                htmlFor="phone_number"
                                className="font-body text-xs font-semibold text-primary tracking-widest uppercase block"
                            >
                                PHONE NUMBER
                            </label>
                            <div className="relative">
                                <Input
                                    {...register("phone_number", {
                                        onChange: () =>
                                            clearErrors("phone_number"),
                                    })}
                                    id="phone_number"
                                    type="tel"
                                    placeholder="+963 XXX XXX XXX"
                                    disabled={isLoading}
                                    aria-invalid={!!errors.phone_number}
                                    aria-describedby={
                                        errors.phone_number
                                            ? "phone-error"
                                            : undefined
                                    }
                                    className="h-14 rounded-xl bg-card text-base font-body"
                                />
                            </div>
                            {errors.phone_number && (
                                <p
                                    id="phone-error"
                                    className="font-body text-sm text-destructive"
                                >
                                    {errors.phone_number.message}
                                </p>
                            )}
                        </div>

                        {/* Primary Action Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary-gradient w-full h-14 rounded-xl font-headline font-semibold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="size-5 animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                "Send Reset Link"
                            )}
                        </button>
                    </form>

                    {/* Back to Login Link */}
                    <div className="pt-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-body text-sm font-semibold">
                                Back to Log in
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Decorative Blur Elements */}
                <div
                    className="fixed -bottom-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none"
                    aria-hidden="true"
                />
                <div
                    className="fixed -top-12 -left-12 w-48 h-48 rounded-full bg-secondary/5 blur-3xl pointer-events-none"
                    aria-hidden="true"
                />
            </main>
        </div>
    );
}
