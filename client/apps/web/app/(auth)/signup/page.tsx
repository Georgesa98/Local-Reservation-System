"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "@icons-pack/react-simple-icons";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { signupSchema, type SignupFormData } from "./schema";
import { signup } from "./api";

export default function SignupPage() {
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
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    setApiError("");
    setIsLoading(true);

    try {
      const response = await signup(data);

      // Signup successful - OTP sent
      // Redirect to OTP verification page
      router.push("/otp");
    } catch (error: any) {
      setIsLoading(false);

      // Display error message
      setApiError(error.message || "Failed to create account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-12 pb-12">
        {/* Welcome Section */}
        <div className="w-full max-w-md text-center mb-8">
          <h1 className="font-headline font-bold text-4xl text-foreground tracking-tight mb-3">
            Create Account
          </h1>
          <p className="font-body text-lg text-muted-foreground">
            Join LuxeStay and start your journey to luxury accommodations.
          </p>
        </div>

        {/* Signup Form Container */}
        <div className="w-full max-w-md space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* API Error Message */}
            {apiError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="font-body text-sm text-destructive">{apiError}</p>
              </div>
            )}

            {/* First Name Input */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                First Name
              </label>
              <Input
                {...register("firstName")}
                type="text"
                placeholder="John"
                className="w-full h-14 bg-card border-0 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="font-body text-sm text-destructive mt-1.5">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name Input */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                Last Name
              </label>
              <Input
                {...register("lastName")}
                type="text"
                placeholder="Doe"
                className="w-full h-14 bg-card border-0 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="font-body text-sm text-destructive mt-1.5">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                Phone Number
              </label>
              <Input
                {...register("phoneNumber")}
                type="tel"
                placeholder="+963 XXX XXX XXX"
                className="w-full h-14 bg-card border-0 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <p className="font-body text-sm text-destructive mt-1.5">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Email Input (Optional) */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                Email Address{" "}
                <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                {...register("email")}
                type="email"
                placeholder="john.doe@example.com"
                className="w-full h-14 bg-card border-0 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="font-body text-sm text-destructive mt-1.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                Password
              </label>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  className="w-full h-14 bg-card border-0 focus:ring-2 focus:ring-primary/20 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="font-body text-sm text-destructive mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  {...register("confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  className="w-full h-14 bg-card border-0 focus:ring-2 focus:ring-primary/20 pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="font-body text-sm text-destructive mt-1.5">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 btn-primary-gradient font-headline font-semibold text-base mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 font-body text-sm text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Buttons (Placeholders) */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-14 bg-card border-border/30 font-body font-medium"
              disabled
            >
              <SiGoogle className="w-5 h-5 mr-2" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 bg-card border-border/30 font-body font-medium"
              disabled
            >
              <SiApple className="w-5 h-5 mr-2" />
              Apple
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="font-body text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Log In
              </Link>
            </p>
          </div>

          {/* Terms & Privacy */}
          <div className="text-center mt-6">
            <p className="font-body text-xs text-muted-foreground">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>

          {/* Branding */}
          <div className="text-center mt-8">
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
