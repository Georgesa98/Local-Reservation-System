import { axiosClient } from "@/lib/axiosClient"
import type { OtpFormValues } from "./schema"

export type OtpChannel = "whatsapp" | "email" | "telegram"

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

interface VerifyOtpData {
  verified: boolean
}

export async function verifyOtp(
  phoneNumber: string,
  data: OtpFormValues
): Promise<VerifyOtpData> {
  const response = await axiosClient.post<ApiEnvelope<VerifyOtpData>>("/api/auth/verify-otp/", {
    phone_number: phoneNumber,
    otp_code: data.otp,
  })

  return response.data.data
}

export async function resendOtp(phoneNumber: string, channel: OtpChannel = "whatsapp"): Promise<void> {
  await axiosClient.post("/api/auth/resend-otp/", {
    phone_number: phoneNumber,
    channel,
  })
}
