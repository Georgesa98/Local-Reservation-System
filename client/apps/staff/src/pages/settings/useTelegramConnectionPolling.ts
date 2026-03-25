import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserProfile } from "./api";

/**
 * Hook to poll for Telegram connection status.
 * 
 * When enabled, polls /api/auth/users/me/ every 3 seconds to check if
 * telegram_chat_id has changed from null to a value.
 * 
 * @param enabled - Whether polling is active
 * @param onConnected - Callback when connection is detected
 */
export function useTelegramConnectionPolling(
  enabled: boolean,
  onConnected: () => void
) {
  const queryClient = useQueryClient();
  const previousChatId = useRef<string | null>(null);

  // Query that polls when enabled
  const { data: profile } = useQuery({
    queryKey: ["userProfile", "polling"],
    queryFn: getUserProfile,
    enabled: enabled,
    refetchInterval: enabled ? 3000 : false, // Poll every 3 seconds when enabled
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
  });

  useEffect(() => {
    if (!profile || !enabled) return;

    // Initialize on first run
    if (previousChatId.current === undefined) {
      previousChatId.current = profile.telegram_chat_id;
      return;
    }

    // Check if connection was established (null → value)
    const wasDisconnected = previousChatId.current === null;
    const isNowConnected = profile.telegram_chat_id !== null;

    if (wasDisconnected && isNowConnected) {
      // Connection detected! Update main cache and trigger callback
      queryClient.setQueryData(["userProfile"], profile);
      onConnected();
    }

    // Update ref for next check
    previousChatId.current = profile.telegram_chat_id;
  }, [profile, enabled, onConnected, queryClient]);
}
