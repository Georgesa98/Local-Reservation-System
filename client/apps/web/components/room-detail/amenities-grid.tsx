"use client";

import {
    Wifi,
    Car,
    Snowflake,
    UtensilsCrossed,
    Waves,
    Tv,
    Wind,
    Coffee,
    Dumbbell,
    Dog,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

interface AmenitiesGridProps {
    services: string[];
}

// Map service names to icons
const serviceIconMap: Record<string, React.ReactNode> = {
    wifi: <Wifi className="h-5 w-5" />,
    "wi-fi": <Wifi className="h-5 w-5" />,
    "free wifi": <Wifi className="h-5 w-5" />,
    parking: <Car className="h-5 w-5" />,
    "free parking": <Car className="h-5 w-5" />,
    "air conditioning": <Snowflake className="h-5 w-5" />,
    ac: <Snowflake className="h-5 w-5" />,
    kitchen: <UtensilsCrossed className="h-5 w-5" />,
    pool: <Waves className="h-5 w-5" />,
    "infinity pool": <Waves className="h-5 w-5" />,
    tv: <Tv className="h-5 w-5" />,
    heating: <Wind className="h-5 w-5" />,
    breakfast: <Coffee className="h-5 w-5" />,
    gym: <Dumbbell className="h-5 w-5" />,
    "pet friendly": <Dog className="h-5 w-5" />,
};

function getServiceIcon(service: string): React.ReactNode {
    const normalized = service.toLowerCase().trim();
    return serviceIconMap[normalized] || <Wifi className="h-5 w-5" />;
}

export function AmenitiesGrid({ services }: AmenitiesGridProps) {
    const displayedServices = services.slice(0, 5);
    const hasMore = services.length > 5;

    if (services.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-primary">
                What this place offers
            </div>
            <div className="grid grid-cols-2 gap-3">
                {displayedServices.map((service, index) => {
                    const isLongText = service.length > 20;
                    return (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl bg-card p-4",
                                isLongText && "col-span-2"
                            )}
                        >
                            <span className="text-primary">
                                {getServiceIcon(service)}
                            </span>
                            <span className="text-sm font-medium">
                                {service}
                            </span>
                        </div>
                    );
                })}
            </div>
            {hasMore && (
                <Button
                    variant="outline"
                    className="w-full rounded-xl border-border/15 py-4 font-bold transition-transform active:scale-95"
                >
                    Show all {services.length} amenities
                </Button>
            )}
        </div>
    );
}
