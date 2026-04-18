"use client";

import { useCallback, useEffect, useState } from "react";
import { tokenManager, type JWTPayload } from "@/lib/axios";

export interface UseCurrentUserResult {
    user: JWTPayload | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    refreshUser: () => void;
}

const getUserFromAccessToken = (): JWTPayload | null => {
    const accessToken = tokenManager.getAccessToken();

    if (!accessToken || tokenManager.isTokenExpired(accessToken)) {
        return null;
    }

    return tokenManager.decodeToken(accessToken);
};

const getUserFromSession = async (): Promise<JWTPayload | null> => {
    const accessToken = tokenManager.getAccessToken();

    if (accessToken && !tokenManager.isTokenExpired(accessToken)) {
        return tokenManager.decodeToken(accessToken);
    }

    const refreshed = await tokenManager.refreshTokens();

    if (!refreshed) {
        return null;
    }

    return tokenManager.decodeToken(refreshed.access);
};

export default function useCurrentUser(): UseCurrentUserResult {
    const [user, setUser] = useState<JWTPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        const nextUser = await getUserFromSession();
        setUser(nextUser);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        void refreshUser();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshUser();
            }
        };

        window.addEventListener("focus", refreshUser);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("focus", refreshUser);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [refreshUser]);

    return {
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        refreshUser,
    };
}
