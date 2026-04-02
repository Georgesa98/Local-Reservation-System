import axiosInstance from "@/lib/axios";
import { AxiosError } from "axios";
import type { ResetPasswordFormData } from "./schema";

export interface ResetPasswordResponse {
    success: boolean;
    message: string;
}

export async function resetPassword(
    phoneNumber: string,
    data: ResetPasswordFormData,
): Promise<ResetPasswordResponse> {
    try {
        const response = await axiosInstance.post<ResetPasswordResponse>(
            "auth/reset-password/",
            {
                phone_number: phoneNumber,
                new_password: data.newPassword,
            },
        );

        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response) {
                throw {
                    status: error.response.status,
                    message:
                        error.response.data?.message ||
                        "Failed to reset password",
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
