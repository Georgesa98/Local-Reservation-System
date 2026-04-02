"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { resetPasswordSchema, type ResetPasswordFormData } from "./schema";
import { resetPassword } from "./api";
import { clearOTPData } from "../otp/api";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [apiError, setApiError] = useState<string>("");

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError,
        clearErrors,
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        setApiError("");
        setIsLoading(true);

        const phone = localStorage.getItem("otpPhoneFull");
        if (!phone) {
            setApiError("Session expired. Please start over.");
            router.push("/forgot-password");
            return;
        }

        try {
            await resetPassword(phone, data);
            clearOTPData();
            router.push("/login");
        } catch (error: any) {
            setIsLoading(false);

            if (error.status === 403) {
                setApiError(
                    error.message || "Please verify your phone number first.",
                );
            } else if (error.status === 404) {
                setApiError("No account found with this phone number.");
            } else if (error.status === 400) {
                if (error.errors) {
                    Object.keys(error.errors).forEach((field) => {
                        setError(field as keyof ResetPasswordFormData, {
                            type: "server",
                            message: error.errors[field][0],
                        });
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
                <div className="w-full max-w-md text-center mb-10">
                    <h1 className="font-headline font-bold text-4xl text-foreground tracking-tight mb-3">
                        Set new password
                    </h1>
                    <p className="font-body text-lg text-muted-foreground">
                        Create a strong password to secure your account.
                    </p>
                </div>

                <div className="w-full max-w-md space-y-6">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {apiError && (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                                <p className="font-body text-sm text-destructive">
                                    {apiError}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label
                                htmlFor="newPassword"
                                className="font-body text-xs font-semibold text-primary tracking-widest uppercase block"
                            >
                                NEW PASSWORD
                            </label>
                            <div className="relative">
                                <Input
                                    {...register("newPassword", {
                                        onChange: () =>
                                            clearErrors("newPassword"),
                                    })}
                                    id="newPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    disabled={isLoading}
                                    aria-invalid={!!errors.newPassword}
                                    aria-describedby={
                                        errors.newPassword
                                            ? "new-password-error"
                                            : undefined
                                    }
                                    className="h-14 rounded-xl bg-card text-base pr-12 font-body"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-5" />
                                    ) : (
                                        <Eye className="size-5" />
                                    )}
                                </button>
                            </div>
                            {errors.newPassword && (
                                <p
                                    id="new-password-error"
                                    className="font-body text-sm text-destructive"
                                >
                                    {errors.newPassword.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="confirmPassword"
                                className="font-body text-xs font-semibold text-primary tracking-widest uppercase block"
                            >
                                CONFIRM PASSWORD
                            </label>
                            <div className="relative">
                                <Input
                                    {...register("confirmPassword", {
                                        onChange: () =>
                                            clearErrors("confirmPassword"),
                                    })}
                                    id="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Re-enter your password"
                                    disabled={isLoading}
                                    aria-invalid={!!errors.confirmPassword}
                                    aria-describedby={
                                        errors.confirmPassword
                                            ? "confirm-password-error"
                                            : undefined
                                    }
                                    className="h-14 rounded-xl bg-card text-base pr-12 font-body"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="size-5" />
                                    ) : (
                                        <Eye className="size-5" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p
                                    id="confirm-password-error"
                                    className="font-body text-sm text-destructive"
                                >
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary-gradient w-full h-14 rounded-xl font-headline font-semibold text-lg shadow-lg shadow-primary/20 active:scale-95 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="size-5 animate-spin" />
                                    Resetting...
                                </span>
                            ) : (
                                "Reset Password"
                            )}
                        </button>
                    </form>

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
