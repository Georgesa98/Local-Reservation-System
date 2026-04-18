"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/ui/components/sonner";
import { tokenManager } from "@/lib/axios";

function SessionKeepAlive() {
    React.useEffect(() => {
        let isActive = true;

        const refreshSessionIfNeeded = async () => {
            if (!isActive) {
                return;
            }

            const accessToken = tokenManager.getAccessToken();
            const refreshToken = tokenManager.getRefreshToken();

            if (!refreshToken) {
                return;
            }

            if (accessToken && !tokenManager.isTokenExpired(accessToken)) {
                return;
            }

            await tokenManager.refreshTokens();
        };

        void refreshSessionIfNeeded();

        const intervalId = window.setInterval(() => {
            void refreshSessionIfNeeded();
        }, 30_000);

        const handleFocus = () => {
            void refreshSessionIfNeeded();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshSessionIfNeeded();
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            isActive = false;
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, []);

    return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <NextThemesProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
                enableColorScheme
            >
                <SessionKeepAlive />
                {children}
                <Toaster />
            </NextThemesProvider>
        </QueryClientProvider>
    );
}
