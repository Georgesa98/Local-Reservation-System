import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  DollarSign,
  Settings,
  ArrowRight,
  DoorOpen,
} from "lucide-react";
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@workspace/ui/components/sidebar";

const navItems = [
  { key: "dashboard" as const, path: "/dashboard", icon: LayoutDashboard },
  { key: "rooms" as const, path: "/rooms", icon: DoorOpen },
  { key: "bookings" as const, path: "/bookings", icon: CalendarDays },
  { key: "finance" as const, path: "/finance", icon: DollarSign },
  { key: "system" as const, path: "/system", icon: Settings },
];

export default function SidebarNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <SidebarContent className="px-0 py-4">
      <SidebarMenu>
        {navItems.map(({ key, path, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <SidebarMenuItem key={key}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={`
                  rounded-none px-6 py-5 h-auto
                  text-xs font-semibold tracking-widest uppercase
                  transition-colors duration-150
                  bg-sidebar text-sidebar-foreground
                  hover:bg-sidebar hover:text-sidebar-foreground
                  data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground
                  data-[active=true]:hover:bg-sidebar-primary data-[active=true]:hover:text-sidebar-primary-foreground
                `}
              >
                <NavLink
                  to={path}
                  className="flex items-center justify-between w-full"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-4 shrink-0" strokeWidth={2} />
                    {t(`nav.${key}`)}
                  </span>
                  {isActive && (
                    <ArrowRight className="size-4 shrink-0" strokeWidth={2} />
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarContent>
  );
}
