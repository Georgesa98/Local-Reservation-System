"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "@icons-pack/react-simple-icons";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { loginSchema, type LoginFormData } from "./schema";
import { login } from "./api";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError("");
    setIsLoading(true);

    try {
      const response = await login(data);

      // Login successful - redirect to home
      router.push("/");
    } catch (error: any) {
      setIsLoading(false);

      // Handle different error types
      if (error.status === 401) {
        setApiError("Invalid phone number or password");
      } else if (error.status === 400) {
        // Map backend validation errors to form fields
        if (error.errors) {
          Object.keys(error.errors).forEach((field) => {
            setError(field as keyof LoginFormData, {
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
      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="w-full max-w-md text-center mb-10">
          <h1 className="font-headline font-bold text-4xl text-foreground tracking-tight mb-3">
            Welcome back
          </h1>
          <p className="font-body text-lg text-muted-foreground">
            Your next luxury escape is just a few steps away.
          </p>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-md space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* API Error Message */}
            {apiError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="font-body text-sm text-destructive">{apiError}</p>
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
                    onChange: () => clearErrors("phone_number"),
                  })}
                  id="phone_number"
                  type="tel"
                  placeholder="+963 XXX XXX XXX"
                  disabled={isLoading}
                  aria-invalid={!!errors.phone_number}
                  aria-describedby={
                    errors.phone_number ? "phone-error" : undefined
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

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="font-body text-xs font-semibold text-primary tracking-widest uppercase block"
              >
                PASSWORD
              </label>
              <div className="relative">
                <Input
                  {...register("password", {
                    onChange: () => clearErrors("password"),
                  })}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className="h-14 rounded-xl bg-card text-base pr-12 font-body"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="font-body text-sm text-destructive"
                >
                  {errors.password.message}
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
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Forgot Password Link - Placeholder for now */}
          <div className="flex justify-center">
            <span className="font-body text-sm text-muted-foreground cursor-not-allowed">
              Forgot password?
            </span>
          </div>

          {/* Divider */}
          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-surface-container-high"></div>
            <span className="flex-shrink mx-4 font-body text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
              OR CONTINUE WITH
            </span>
            <div className="flex-grow border-t border-surface-container-high"></div>
          </div>

          {/* Social Logins - Placeholders */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-3 h-14 bg-card rounded-xl border border-outline-variant/15 opacity-50 cursor-not-allowed"
            >
              <SiGoogle className="size-5 text-foreground" />
              <span className="font-headline font-semibold text-foreground text-sm">
                Google
              </span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center justify-center gap-3 h-14 bg-card rounded-xl border border-outline-variant/15 opacity-50 cursor-not-allowed"
            >
              <SiApple className="size-5 text-foreground" />
              <span className="font-headline font-semibold text-foreground text-sm">
                Apple
              </span>
            </button>
          </div>

          {/* Sign Up CTA */}
          <div className="pt-8 text-center">
            <p className="font-body text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary font-bold hover:underline ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative Asymmetric Blur Elements */}
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
