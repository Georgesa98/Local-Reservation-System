"use client";

import { Home, Search, Compass, User } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/", active: true },
    {
        id: "search",
        label: "Search",
        icon: Search,
        href: "/search",
        active: false,
    },
    {
        id: "trips",
        label: "Trips",
        icon: Compass,
        href: "/trips",
        active: false,
    },
    {
        id: "profile",
        label: "Profile",
        icon: User,
        href: "/profile",
        active: false,
    },
];

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[32px] bg-card/80 px-4 pb-8 pt-4 shadow-[0_-8px_30px_rgba(40,47,63,0.04)] backdrop-blur-2xl">
            {navItems.map((item) => {
                const Icon = item.icon;
                return (
                    <a
                        key={item.id}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center px-5 py-2 transition-all duration-300 active:scale-90",
                            item.active
                                ? "rounded-2xl bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-primary",
                        )}
                    >
                        <Icon
                            className="mb-1 h-6 w-6"
                            fill={item.active ? "currentColor" : "none"}
                        />
                        <span className="font-body text-[11px] font-medium uppercase tracking-widest">
                            {item.label}
                        </span>
                    </a>
                );
            })}
        </nav>
    );
}
