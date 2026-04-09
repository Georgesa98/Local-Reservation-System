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

export default function useCurrentUser(): UseCurrentUserResult {
    const [user, setUser] = useState<JWTPayload | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(() => {
        setUser(getUserFromAccessToken());
        setIsLoading(false);
    }, []);

    useEffect(() => {
        refreshUser();

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refreshUser();
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
