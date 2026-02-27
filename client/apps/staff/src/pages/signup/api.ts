import { axiosClient } from "@/lib/axiosClient"
import type { SignupFormValues } from "./schema"

interface SignupResponse {
  id: number
  phone_number: string
  otp_sent: boolean
}

export async function signup(data: SignupFormValues): Promise<SignupResponse> {
  const response = await axiosClient.post<SignupResponse>("/api/auth/users/", {
    phone_number: data.phonenumber,
    email: data.email,
    password: data.password,
  })

  return response.data
}
