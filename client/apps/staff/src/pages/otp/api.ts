import { axiosClient } from "@/lib/axiosClient"
import type { OtpFormValues } from "./schema"

interface VerifyOtpResponse {
  verified: boolean
}

export async function verifyOtp(
  phoneNumber: string,
  data: OtpFormValues
): Promise<VerifyOtpResponse> {
  const response = await axiosClient.post<VerifyOtpResponse>("/api/auth/verify-otp/", {
    phone_number: phoneNumber,
    otp_code: data.otp,
  })

  return response.data
}

export async function resendOtp(phoneNumber: string): Promise<void> {
  await axiosClient.post("/api/auth/resend-otp/", {
    phone_number: phoneNumber,
  })
}
