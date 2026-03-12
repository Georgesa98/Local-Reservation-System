import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  SidebarFooter,
  SidebarSeparator,
} from "@workspace/ui/components/sidebar";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useQueryClient } from "@tanstack/react-query";
import LangToggle from "../LangToggle";

export default function SidebarUserFooter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();

  async function handleLogout() {
    await logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  }

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.role
    : null;

  return (
    <SidebarFooter className="p-0">
      <SidebarSeparator />

      {/* User profile row */}
      <div className="flex flex-col min-w-0 px-4 py-4">
        {isLoading ? (
          <div className="h-3 w-20 rounded bg-muted animate-pulse" />
        ) : (
          <>
            <span className="text-xs font-bold tracking-widest uppercase truncate leading-tight">
              {displayName ?? user?.role ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums tracking-wider mt-0.5">
              {user?.phone_number ?? ""}
            </span>
          </>
        )}
      </div>

      {/* Lang toggle + Logout row */}
      <div className="flex items-center justify-between px-4 pb-4">
        <LangToggle />
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-semibold tracking-widest uppercase underline underline-offset-2 hover:text-foreground text-muted-foreground transition-colors"
        >
          {t("nav.logout")}
        </button>
      </div>
    </SidebarFooter>
  );
}
