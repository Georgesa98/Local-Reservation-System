import Image from "next/image";
import { MapPin, Heart } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";
import { StarRating } from "./star-rating";
import type { Room } from "@/lib/types/room";

interface PropertyCardProps {
    room: Room;
    badge?: {
        label: string;
        variant?: "default" | "secondary" | "tertiary";
    };
    onFavoriteClick?: () => void;
    className?: string;
}

export function PropertyCard({
    room,
    badge,
    onFavoriteClick,
    className,
}: PropertyCardProps) {
    const mainImage = room.images.find((img) => img.is_main) || room.images[0];
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
        /\/$/,
        "",
    ).replace(/\/api$/, "");

    const imageUrl = mainImage?.image
        ? `${baseUrl}${mainImage.image}`
        : "/placeholder-room.jpg";
    const imageAlt = mainImage?.alt_text || room.title;

    return (
        <article className={cn("group space-y-4", className)}>
            {/* Image Container */}
            <div className="radius-hero relative aspect-[4/3] overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Favorite Button */}
                <button
                    onClick={onFavoriteClick}
                    className="absolute right-4 top-4 flex items-center justify-center rounded-full bg-white/20 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-white/30"
                    aria-label="Add to favorites"
                >
                    <Heart className="h-5 w-5" />
                </button>

                {/* Badge */}
                {badge && (
                    <div className="absolute bottom-4 left-4">
                        <Badge
                            className={cn(
                                "px-3 py-1 text-xs font-bold uppercase tracking-wider",
                                badge.variant === "tertiary" &&
                                    "bg-tertiary-container text-tertiary-container-foreground",
                                badge.variant === "secondary" &&
                                    "bg-primary-container text-primary-container-foreground",
                            )}
                        >
                            {badge.label}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-1">
                {/* Title and Rating */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-bold leading-tight text-foreground">
                        {room.title}
                    </h3>
                    <StarRating
                        rating={room.average_rating}
                        showValue
                        size="sm"
                    />
                </div>

                {/* Location */}
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {room.location}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-lg font-extrabold text-primary">
                        ${parseFloat(room.base_price_per_night).toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        / night
                    </span>
                </div>
            </div>
        </article>
    );
}
