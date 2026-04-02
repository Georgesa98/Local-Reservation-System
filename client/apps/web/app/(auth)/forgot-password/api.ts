import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";
import type { ForgotPasswordFormData } from "./schema";

export interface OTPInitiateResponse {
    data: {
        masked_phone: string;
        masked_email: string | null;
        has_email: boolean;
        has_telegram: boolean;
        is_verified: boolean;
    };
    message: string;
}

export async function forgotPassword(
    data: ForgotPasswordFormData,
): Promise<OTPInitiateResponse> {
    try {
        const response = await axiosInstance.post<OTPInitiateResponse>(
            "auth/initiate-otp/",
            { phone_number: data.phone_number },
        );

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response) {
                throw {
                    status: error.response.status,
                    message:
                        error.response.data?.message || "Failed to send code",
                    errors: error.response.data?.errors || {},
                };
            } else if (error.request) {
                throw {
                    status: 0,
                    message: "Network error. Please check your connection.",
                    errors: {},
                };
            }
        }

        throw {
            status: 500,
            message: "An unexpected error occurred",
            errors: {},
        };
    }
}
