import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { StarRating } from "./star-rating";
import type { RoomCard, WishlistParams } from "@/lib/types/room";
import useCurrentUser from "@/hooks/useCurrentUser";

interface PropertyCardProps {
    room: RoomCard;
    onFavoriteClick: (data: WishlistParams) => void;
    className?: string;
}

export function PropertyCard({
    room,
    onFavoriteClick,
    className,
}: PropertyCardProps) {
    const user = useCurrentUser();
    const mainImage = room.main_image;
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
            <Link href={`/rooms/${room.id}`} className="block space-y-4">
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
                        onClick={(e) => {
                            e.preventDefault();
                            onFavoriteClick({
                                room_id: room.id,
                                user_id: user.user?.user_id || 0,
                            });
                        }}
                        className="absolute right-4 top-4 flex items-center justify-center rounded-full bg-white/20 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-white/30"
                        aria-label="Add to favorites"
                    >
                        <Heart
                            className="h-5 w-5"
                            fill={room.is_wishlisted ? "currentColor" : "none"}
                        />
                    </button>
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

                    {/* Price */}
                    <div className="flex items-baseline gap-1 pt-2">
                        <span className="text-lg font-extrabold text-primary">
                            ${parseFloat(room.display_price).toFixed(0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            / night
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}
