"use client";

import dynamic from "next/dynamic";
import type { RoomMapProps } from "./room-map";

// Dynamically import RoomMap with SSR disabled to avoid Leaflet window issues
export const RoomMapWrapper = dynamic<RoomMapProps>(
    () => import("./room-map").then((mod) => ({ default: mod.RoomMap })),
    {
        ssr: false,
        loading: () => (
            <div className="space-y-4 pt-4">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">
                    Location
                </div>
                <div className="relative h-64 w-full animate-pulse overflow-hidden rounded-3xl bg-muted" />
            </div>
        ),
    }
);
