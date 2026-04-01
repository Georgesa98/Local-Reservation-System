"use client";

import { MapPin } from "lucide-react";
import Image from "next/image";

interface MapPlaceholderProps {
    location: string;
}

export function MapPlaceholder({ location }: MapPlaceholderProps) {
    return (
        <div className="space-y-4 pt-4">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">
                Location
            </div>
            <div className="relative h-48 w-full overflow-hidden rounded-3xl bg-muted">
                {/* Placeholder for map - could integrate Google Maps or Mapbox later */}
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <MapPin className="h-8 w-8 text-primary" />
                    <div>
                        <p className="font-semibold text-foreground">
                            {location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Map integration coming soon
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
