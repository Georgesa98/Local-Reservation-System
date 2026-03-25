import axios from 'axios'
import { getUserFromToken as decodeUser, type UserFromToken } from './jwtUtils'

export interface Tokens {
  access: string
  refresh: string
}

const REFRESH_ENDPOINT = '/api/auth/jwt/refresh/'
const PROACTIVE_REFRESH_SECONDS = 60
const API_URL = import.meta.env.VITE_API_URL

let cachedTokens: Tokens | null = null

const refreshAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

async function getElectronAPI() {
  if (!window.electronAPI) {
    throw new Error('Electron API not available. Running in browser?')
  }
  return window.electronAPI
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  const api = await getElectronAPI()
  const result = await api.saveTokens(access, refresh)
  if (!result.success) {
    throw new Error(result.error ?? 'Failed to save tokens')
  }
  cachedTokens = { access, refresh }
}

export async function getAccessToken(): Promise<string | null> {
  if (cachedTokens) {
    if (!isTokenExpiringSoon(cachedTokens.access)) {
      return cachedTokens.access
    }
    if (cachedTokens.refresh) {
      const refreshed = await refreshTokens(cachedTokens.refresh)
      if (refreshed) {
        return cachedTokens.access
      }
    }
    return null
  }

  const api = await getElectronAPI()
  const result = await api.getTokens()
  if (!result.success || !result.data) {
    return null
  }

  cachedTokens = result.data

  if (isTokenExpiringSoon(cachedTokens.access)) {
    const refreshed = await refreshTokens(cachedTokens.refresh)
    if (!refreshed) {
      return null
    }
  }

  return cachedTokens.access
}

export async function getTokens(): Promise<Tokens | null> {
  if (cachedTokens) {
    return cachedTokens
  }

  const api = await getElectronAPI()
  const result = await api.getTokens()
  if (!result.success) {
    return null
  }

  cachedTokens = result.data
  return cachedTokens
}

export async function clearTokens(): Promise<void> {
  cachedTokens = null
  const api = await getElectronAPI()
  await api.clearTokens()
  window.dispatchEvent(new CustomEvent('auth:logout'))
}

function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000
    const now = Date.now()
    return exp - now < PROACTIVE_REFRESH_SECONDS * 1000
  } catch {
    return true
  }
}

export async function refreshTokens(refresh: string): Promise<boolean> {
  try {
    const response = await refreshAxios.post(REFRESH_ENDPOINT, {
      refresh,
    })
    const { access, refresh: newRefresh } = response.data
    await saveTokens(access, newRefresh)
    return true
  } catch {
    return false
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const tokens = await getTokens();
  return tokens !== null;
}

/**
 * Get user information from the current access token.
 * 
 * This decodes the JWT payload to extract user data without making an API call.
 * Returns null if no token exists or the token is invalid/expired.
 * 
 * @returns User data from token or null
 */
export async function getCurrentUser(): Promise<UserFromToken | null> {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return null
  }
  
  return decodeUser(accessToken)
}
