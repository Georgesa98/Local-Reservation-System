import { axiosClient } from "@/lib/axiosClient"
import { saveTokens } from "@/lib/tokenManager"
import type { LoginFormValues } from "./schema"

interface LoginResponse {
  access: string
  refresh: string
}

export async function login(data: LoginFormValues): Promise<LoginResponse> {
  const response = await axiosClient.post<LoginResponse>("/api/auth/jwt/create/", {
    phone_number: data.phonenumber,
    password: data.password,
  })

  await saveTokens(response.data.access, response.data.refresh)

  return response.data
}
