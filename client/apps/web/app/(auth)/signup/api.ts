import axiosInstance from "@/lib/axios";
import { maskPhoneNumber, maskEmail } from "@/lib/mask";
import type { SignupFormData } from "./schema";

/**
 * API integration for user signup
 * 
 * Endpoint: POST /api/auth/users/ (PUBLIC)
 * 
 * Request body shape:
 * {
 *   phone_number: "+963XXXXXXXXX",
 *   password: "secure_password",
 *   first_name: "John",      // optional
 *   last_name: "Doe",         // optional
 *   email: "john@example.com" // optional
 * }
 * 
 * Response shape:
 * {
 *   id: 1,
 *   phone_number: "+963XXXXXXXXX",
 *   email: "john@example.com",
 *   first_name: "John",
 *   last_name: "Doe",
 *   otp_sent: true
 * }
 */

export interface SignupRequest {
  phone_number: string;
  password: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface SignupResponse {
  id: number;
  phone_number: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  otp_sent: boolean;
}

export interface SignupErrorResponse {
  phone_number?: string[];
  email?: string[];
  password?: string[];
  non_field_errors?: string[];
}

/**
 * Register a new user account
 * 
 * @param data - Signup form data
 * @returns Promise with signup response
 * @throws Error with user-friendly message
 */
export async function signup(data: SignupFormData): Promise<SignupResponse> {
  try {
    const payload: SignupRequest = {
      phone_number: data.phoneNumber,
      password: data.password,
      first_name: data.firstName,
      last_name: data.lastName,
    };

    // Only include email if it's provided and not empty
    if (data.email && data.email.trim() !== "") {
      payload.email = data.email;
    }

    const response = await axiosInstance.post<SignupResponse>(
      "/auth/users/",
      payload
    );

    // Store masked phone/email data in localStorage for OTP verification
    if (typeof window !== "undefined") {
      localStorage.setItem("otpPhone", maskPhoneNumber(response.data.phone_number));
      localStorage.setItem("otpPhoneFull", response.data.phone_number);
      
      if (response.data.email) {
        localStorage.setItem("otpEmail", maskEmail(response.data.email));
      }
    }

    return response.data;
  } catch (error: any) {
    // Handle DRF validation errors
    if (error.response?.data) {
      const errorData = error.response.data as SignupErrorResponse;

      // Extract first error message from any field
      if (errorData.phone_number) {
        throw new Error(errorData.phone_number[0]);
      }
      if (errorData.email) {
        throw new Error(errorData.email[0]);
      }
      if (errorData.password) {
        throw new Error(errorData.password[0]);
      }
      if (errorData.non_field_errors) {
        throw new Error(errorData.non_field_errors[0]);
      }
    }

    // Generic error fallback
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Failed to create account. Please try again."
    );
  }
}