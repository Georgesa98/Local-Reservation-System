import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, getTokens, refreshTokens, clearTokens } from './tokenManager'

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token!)
    }
  })
  failedQueue = []
}

axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosClient(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const tokens = await getTokens()
      if (!tokens?.refresh) {
        throw new Error('No refresh token available')
      }
      const refreshed = await refreshTokens(tokens.refresh)
      if (!refreshed) {
        throw new Error('Token refresh failed')
      }
      const newAccessToken = await getAccessToken()
      processQueue(null, newAccessToken)
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return axiosClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      await clearTokens()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
