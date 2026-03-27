import axiosInstance from "@/lib/axios";
import type { OTPFormData } from "./schema";

/**
 * API integration for OTP verification and resend
 * 
 * Endpoints:
 * - POST /api/auth/verify-otp/ (PUBLIC)
 * - POST /api/auth/resend-otp/ (PUBLIC)
 */

export interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
}

export interface VerifyOTPResponse {
  verified: boolean;
}

export interface ResendOTPRequest {
  phone_number: string;
  channel: "whatsapp" | "email" | "telegram";
}

export interface ResendOTPResponse {
  success: boolean;
  message: string;
}

export interface OTPErrorResponse {
  phone_number?: string[];
  otp_code?: string[];
  non_field_errors?: string[];
}

/**
 * Verify OTP code
 * 
 * @param data - OTP form data
 * @param phoneNumber - Full phone number from localStorage
 * @returns Promise with verification response
 * @throws Error with user-friendly message
 */
export async function verifyOTP(data: OTPFormData, phoneNumber: string): Promise<VerifyOTPResponse> {
  try {
    const payload: VerifyOTPRequest = {
      phone_number: phoneNumber,
      otp_code: data.otp_code,
    };

    const response = await axiosInstance.post<VerifyOTPResponse>(
      "/auth/verify-otp/",
      payload
    );

    return response.data;
  } catch (error: any) {
    // Handle DRF validation errors
    if (error.response?.data) {
      const errorData = error.response.data as OTPErrorResponse;

      // Extract first error message from any field
      if (errorData.otp_code) {
        throw new Error(errorData.otp_code[0]);
      }
      if (errorData.phone_number) {
        throw new Error(errorData.phone_number[0]);
      }
      if (errorData.non_field_errors) {
        throw new Error(errorData.non_field_errors[0]);
      }
    }

    // Generic error fallback
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Invalid OTP code. Please try again."
    );
  }
}

/**
 * Resend OTP via specified channel
 * 
 * @param phoneNumber - Full phone number from localStorage
 * @param channel - Delivery channel (whatsapp, email, telegram)
 * @returns Promise with resend response
 * @throws Error with user-friendly message
 */
export async function resendOTP(phoneNumber: string, channel: "whatsapp" | "email" | "telegram"): Promise<ResendOTPResponse> {
  try {
    const payload: ResendOTPRequest = {
      phone_number: phoneNumber,
      channel: channel,
    };

    const response = await axiosInstance.post<ResendOTPResponse>(
      "/auth/resend-otp/",
      payload
    );

    return response.data;
  } catch (error: any) {
    // Handle rate limiting and other errors
    if (error.response?.status === 429) {
      throw new Error("Please wait before requesting another code.");
    }

    if (error.response?.data) {
      const errorData = error.response.data as OTPErrorResponse;

      if (errorData.phone_number) {
        throw new Error(errorData.phone_number[0]);
      }
      if (errorData.non_field_errors) {
        throw new Error(errorData.non_field_errors[0]);
      }
    }

    // Generic error fallback
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to resend code. Please try again."
    );
  }
}

/**
 * Check if user has required OTP data in localStorage
 * @returns Object with validation result and data
 */
export function getOTPData() {
  if (typeof window === "undefined") {
    return { isValid: false, data: null };
  }

  const otpPhone = localStorage.getItem("otpPhone");
  const otpPhoneFull = localStorage.getItem("otpPhoneFull");
  const otpEmail = localStorage.getItem("otpEmail");

  if (!otpPhone || !otpPhoneFull) {
    return { isValid: false, data: null };
  }

  return {
    isValid: true,
    data: {
      maskedPhone: otpPhone,
      fullPhone: otpPhoneFull,
      maskedEmail: otpEmail || null,
      hasEmail: Boolean(otpEmail),
    },
  };
}

/**
 * Clear OTP data from localStorage (after successful verification)
 */
export function clearOTPData() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("otpPhone");
    localStorage.removeItem("otpPhoneFull");
    localStorage.removeItem("otpEmail");
  }
}