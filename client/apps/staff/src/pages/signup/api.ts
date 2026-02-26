import { axiosClient } from "@/lib/axiosClient"
import type { SignupFormValues } from "./schema"

interface SignupResponse {
  id: number
  phone_number: string
}

export async function signup(data: SignupFormValues): Promise<SignupResponse> {
  const response = await axiosClient.post<SignupResponse>("/api/auth/users/", {
    phone_number: data.phonenumber,
    password: data.password,
  })

  return response.data
}
