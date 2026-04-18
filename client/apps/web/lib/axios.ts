import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { jwtDecode } from "jwt-decode";
import {
    getCookie,
    setCookie,
    deleteCookie,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
} from "./cookies";

// Types
interface TokenResponse {
    access: string;
    refresh: string;
    user: {
        id: number;
        role: string;
        first_name: string;
        last_name: string;
        phone_number: string;
        email?: string;
    };
}

interface RefreshResponse {
    access: string;
    refresh: string;
}

interface JWTPayload {
    user_id: number;
    role: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    is_verified: boolean;
    email: string | null;
    exp: number;
    iat: number;
    jti: string;
}

// Create axios instance
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const REFRESH_ENDPOINT = "/auth/jwt/refresh/";

async function requestTokenRefresh(): Promise<RefreshResponse> {
    const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);

    if (!refreshToken) {
        throw new Error("No refresh token available");
    }

    const response = await axiosInstance.post<RefreshResponse>(REFRESH_ENDPOINT, {
        refresh: refreshToken,
    });

    const { access, refresh } = response.data;
    setCookie(ACCESS_TOKEN_COOKIE, access, 5 / (24 * 60)); // 5 minutes
    setCookie(REFRESH_TOKEN_COOKIE, refresh, 1); // 1 day

    return response.data;
}

// Token management utilities
export const tokenManager = {
    getAccessToken: (): string | null => {
        if (typeof window === "undefined") return null;
        return getCookie(ACCESS_TOKEN_COOKIE);
    },

    getRefreshToken: (): string | null => {
        if (typeof window === "undefined") return null;
        return getCookie(REFRESH_TOKEN_COOKIE);
    },

    setTokens: (access: string, refresh: string): void => {
        if (typeof window === "undefined") return;
        // Access token expires in 5 minutes
        setCookie(ACCESS_TOKEN_COOKIE, access, 5 / (24 * 60)); // 5 minutes in days
        // Refresh token expires in 1 day
        setCookie(REFRESH_TOKEN_COOKIE, refresh, 1);
    },

    clearTokens: (): void => {
        if (typeof window === "undefined") return;
        deleteCookie(ACCESS_TOKEN_COOKIE);
        deleteCookie(REFRESH_TOKEN_COOKIE);
    },

    isTokenExpired: (token: string): boolean => {
        try {
            const decoded = jwtDecode<JWTPayload>(token);
            const currentTime = Date.now() / 1000;
            // Add 30 second buffer to refresh before expiry
            return decoded.exp < currentTime + 30;
        } catch {
            return true;
        }
    },

    decodeToken: (token: string): JWTPayload | null => {
        try {
            return jwtDecode<JWTPayload>(token);
        } catch {
            return null;
        }
    },

    /**
     * Manually refresh tokens to get updated JWT claims
     * Useful after user state changes (e.g., OTP verification)
     */
    refreshTokens: async (): Promise<{
        access: string;
        refresh: string;
    } | null> => {
        if (typeof window === "undefined") return null;

        try {
            return await requestTokenRefresh();
        } catch (error) {
            console.error("Token refresh failed:", error);
            return null;
        }
    },
};

// Promise to prevent concurrent refresh requests
let refreshPromise: Promise<string> | null = null;

// Refresh token function
const refreshAccessToken = async (): Promise<string> => {
    // If already refreshing, return existing promise
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const { access } = await requestTokenRefresh();
            return access;
        } catch (error) {
            // Clear tokens and redirect to login on refresh failure
            tokenManager.clearTokens();
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
            throw error;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

// Request interceptor - Attach access token
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Skip token for auth endpoints
        if (
            config.url?.includes("/auth/jwt/create") ||
            config.url?.includes("/auth/jwt/refresh") ||
            config.url?.includes("/auth/users/")
        ) {
            return config;
        }

        let accessToken = tokenManager.getAccessToken();

        // Check if token is expired and refresh if needed
        if (accessToken && tokenManager.isTokenExpired(accessToken)) {
            try {
                accessToken = await refreshAccessToken();
            } catch {
                // Refresh failed, will be handled by response interceptor
                return config;
            }
        }

        // Attach token to request
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor - Handle 401 errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        if (originalRequest.url?.includes("/auth/jwt/refresh")) {
            return Promise.reject(error);
        }

        // If 401 error and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const newAccessToken = await refreshAccessToken();

                // Retry original request with new token
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                tokenManager.clearTokens();
                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default axiosInstance;
export type { TokenResponse, RefreshResponse, JWTPayload };
