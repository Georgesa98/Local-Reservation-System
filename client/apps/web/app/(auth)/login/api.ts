import axiosInstance, { tokenManager, type TokenResponse } from '@/lib/axios';
import { type AxiosError } from 'axios';
import type { LoginFormData } from './schema';

export async function login(credentials: LoginFormData): Promise<TokenResponse> {
  try {
    const response = await axiosInstance.post<TokenResponse>(
      'auth/jwt/create/',
      credentials
    );

    // Store tokens in localStorage
    const { access, refresh } = response.data;
    tokenManager.setTokens(access, refresh);

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Handle different error types
      if (error.response) {
        // Server responded with error status
        throw {
          status: error.response.status,
          message: error.response.data?.message || 'Login failed',
          errors: error.response.data?.errors || {},
        };
      } else if (error.request) {
        // Request made but no response
        throw {
          status: 0,
          message: 'Network error. Please check your connection.',
          errors: {},
        };
      }
    }
    
    // Unknown error
    throw {
      status: 500,
      message: 'An unexpected error occurred',
      errors: {},
    };
  }
}

/**
 * Logout
 * Clears tokens from localStorage
 */
export function logout(): void {
  tokenManager.clearTokens();
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

/**
 * Get current user from token
 * Decodes the JWT access token to extract user info
 */
export function getCurrentUser() {
  const accessToken = tokenManager.getAccessToken();
  
  if (!accessToken) {
    return null;
  }
  
  return tokenManager.decodeToken(accessToken);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const accessToken = tokenManager.getAccessToken();
  
  if (!accessToken) {
    return false;
  }
  
  // Check if token is expired
  return !tokenManager.isTokenExpired(accessToken);
}
