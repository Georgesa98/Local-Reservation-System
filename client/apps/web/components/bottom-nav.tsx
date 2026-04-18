"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Compass, User } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/" },
    {
        id: "search",
        label: "Search",
        icon: Search,
        href: "/search",
    },
    {
        id: "profile",
        label: "Profile",
        icon: User,
        href: "/profile",
    },
];

const hiddenNavRoutes = [/^\/rooms\/[^/]+$/];

export function BottomNav() {
    const pathname = usePathname();

    const shouldHideNav = hiddenNavRoutes.some((pattern) =>
        pattern.test(pathname),
    );

    if (shouldHideNav) {
        return null;
    }

    const isActiveRoute = (href: string) => {
        if (href === "/") {
            return pathname === "/";
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <nav className="radius-hero-top ambient-shadow-top fixed bottom-0 left-0 z-50 flex w-full items-center justify-around bg-card/80 px-4 pb-8 pt-4 backdrop-blur-2xl">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                    <Link
                        key={item.id}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            "flex flex-col items-center justify-center px-5 py-2 transition-all duration-300 active:scale-90",
                            isActive
                                ? "rounded-2xl bg-primary/5 text-primary"
                                : "text-muted-foreground hover:text-primary",
                        )}
                    >
                        <Icon
                            className="mb-1 h-6 w-6"
                            fill={isActive ? "currentColor" : "none"}
                        />
                        <span className="text-xs font-medium uppercase tracking-widest">
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
