import axiosInstance, { tokenManager } from "@/lib/axios";
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
    success: boolean;
    message: string;
    data: {
        verified: boolean;
    };
}

export interface InitiateOTPRequest {
    phone_number: string;
}

export interface InitiateOTPResponse {
    success: boolean;
    message: string;
    data: {
        has_email: boolean;
        has_telegram: boolean;
        is_verified: boolean;
    };
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

export interface OTPChannelInfo {
    hasEmail: boolean;
    hasTelegram: boolean;
}

/**
 * Initiate OTP flow by calling the backend endpoint.
 * Returns channel availability info (has_email, has_telegram).
 * Also sends an OTP via WhatsApp by default.
 */
export async function initiateOTP(
    phoneNumber: string,
): Promise<InitiateOTPResponse> {
    try {
        const payload: InitiateOTPRequest = { phone_number: phoneNumber };
        const response = await axiosInstance.post<InitiateOTPResponse>(
            "/auth/initiate-otp/",
            payload,
        );
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            throw new Error("No account found with this phone number.");
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
        throw new Error(
            error.response?.data?.message ||
                error.message ||
                "Failed to initiate OTP verification.",
        );
    }
}

/**
 * Fetch OTP channel availability for a given phone number.
 * If user has an unverified JWT, skips the backend call and uses token data.
 */
export async function fetchOTPData(
    phoneNumber: string,
): Promise<OTPChannelInfo> {
    const accessToken = tokenManager.getAccessToken();

    if (accessToken) {
        const decoded = tokenManager.decodeToken(accessToken);
        if (decoded && !decoded.is_verified) {
            return {
                hasEmail: Boolean(decoded.email),
                hasTelegram: false,
            };
        }
    }

    const response = await initiateOTP(phoneNumber);
    return {
        hasEmail: response.data.has_email,
        hasTelegram: response.data.has_telegram,
    };
}

/**
 * Verify OTP code
 *
 * @param data - OTP form data
 * @param phoneNumber - Full phone number from localStorage
 * @returns Promise with verification response
 * @throws Error with user-friendly message
 */
export async function verifyOTP(
    data: OTPFormData,
    phoneNumber: string,
): Promise<VerifyOTPResponse> {
    try {
        const payload: VerifyOTPRequest = {
            phone_number: phoneNumber,
            otp_code: data.otp_code,
        };

        const response = await axiosInstance.post<VerifyOTPResponse>(
            "/auth/verify-otp/",
            payload,
        );

        return response.data;
    } catch (error: any) {
        if (error.response?.data) {
            const errorData = error.response.data as OTPErrorResponse;

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

        throw new Error(
            error.response?.data?.message ||
                error.message ||
                "Invalid OTP code. Please try again.",
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
export async function resendOTP(
    phoneNumber: string,
    channel: "whatsapp" | "email" | "telegram",
): Promise<ResendOTPResponse> {
    try {
        const payload: ResendOTPRequest = {
            phone_number: phoneNumber,
            channel: channel,
        };

        const response = await axiosInstance.post<ResendOTPResponse>(
            "/auth/resend-otp/",
            payload,
        );

        return response.data;
    } catch (error: any) {
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

        throw new Error(
            error.response?.data?.message ||
                error.message ||
                "Failed to resend code. Please try again.",
        );
    }
}

/**
 * Clear OTP data from localStorage (after successful verification)
 */
export function clearOTPData() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("otpPhoneFull");
    }
}
