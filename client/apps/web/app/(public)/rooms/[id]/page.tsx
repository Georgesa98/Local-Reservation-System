"use client";

import { use } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Star, MessageCircle, Heart } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { fetchRoomById } from "./api";
import { ImageCarousel } from "@/components/room-detail/image-carousel";
import { AmenitiesGrid } from "@/components/room-detail/amenities-grid";
import { ReviewsSection } from "@/components/room-detail/reviews-section";
import { RoomMapWrapper } from "@/components/room-detail/room-map-wrapper";
import { StickyBookingBar } from "@/components/room-detail/sticky-booking-bar";
import { wishlistRoom } from "../../api";
import useCurrentUser from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { Room } from "@/lib/types/room";

interface RoomDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function RoomDetailPage({ params }: RoomDetailPageProps) {
    const router = useRouter();
    const { id } = use(params);
    const queryClient = useQueryClient();
    const user = useCurrentUser();

    const roomDetailsQueryKey = ["room", id];

    const {
        data: room,
        isLoading,
        isError,
    } = useQuery({
        queryKey: roomDetailsQueryKey,
        queryFn: () => fetchRoomById(id),
    });

    const handleShare = async () => {
        if (navigator.share && room) {
            try {
                await navigator.share({
                    title: room.title,
                    text: `Check out ${room.title} in ${room.location}`,
                    url: window.location.href,
                });
            } catch (error) {
                // User cancelled or share failed
                console.log("Share cancelled or failed:", error);
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            // TODO: Show toast notification
            alert("Link copied to clipboard!");
        }
    };
    const handleWishlist = async () => {
        try {
            const message = await wishlistRoom({
                room_id: room?.id,
                user_id: user.user?.user_id,
            });
            queryClient.setQueryData<Room>(roomDetailsQueryKey, (room) =>
                room
                    ? {
                          ...room,
                          is_wishlisted: !room.is_wishlisted,
                      }
                    : undefined,
            );
            toast.success(message);
        } catch (error) {
            toast.error("Failed to update wishlist. Please try again.");
        }
    };
    const handleReserve = () => {
        // TODO: Navigate to booking flow
        console.log("Reserve clicked for room:", id);
        alert("Booking flow coming soon!");
    };

    const handleChatClick = () => {
        // Placeholder for chat functionality
        alert("Chat feature coming soon!");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen">
                {/* Header Skeleton */}
                <header className="fixed top-0 z-50 w-full bg-card/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                        <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                        <div className="flex gap-4">
                            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                            <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
                        </div>
                    </div>
                </header>

                {/* Image Skeleton */}
                <div className="mt-16 h-[530px] w-full animate-pulse bg-muted" />

                {/* Content Skeleton */}
                <div className="space-y-6 px-6 pt-8">
                    <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                    <div className="h-20 animate-pulse rounded bg-muted" />
                </div>
            </div>
        );
    }

    if (isError || !room) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
                <h1 className="mb-2 font-headline text-2xl font-bold">
                    Room not found
                </h1>
                <p className="mb-6 text-sm text-muted-foreground">
                    The room you're looking for doesn't exist or is no longer
                    available.
                </p>
                <Button onClick={() => router.push("/")}>Back to home</Button>
            </div>
        );
    }

    const rating = parseFloat(room.average_rating);
    const isHighlyRated = rating >= 4.8;

    return (
        <div className="min-h-screen pb-32">
            {/* Top App Bar */}
            <header className="fixed top-0 z-50 w-full bg-card/80 shadow-sm backdrop-blur-xl">
                <div className="flex w-full items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="text-primary transition-transform duration-200 active:scale-95"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="font-headline text-lg font-bold tracking-tight">
                        Details
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleShare}
                            className="transition-transform duration-200 active:scale-95"
                        >
                            <Share2 className="h-5 w-5" />
                        </button>
                        <button
                            className="transition-transform duration-200 active:scale-95"
                            onClick={handleWishlist}
                        >
                            <Heart
                                className="h-5 w-5"
                                fill={
                                    room.is_wishlisted ? "currentColor" : "none"
                                }
                            />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-16">
                {/* Image Carousel */}
                <ImageCarousel images={room.images} roomTitle={room.title} />

                {/* Property Info */}
                <section className="space-y-6 px-6 pt-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            {isHighlyRated && (
                                <Badge className="bg-tertiary-container px-3 py-1 text-xs font-bold uppercase tracking-widest text-tertiary-container-foreground">
                                    Guest Favorite
                                </Badge>
                            )}
                            {room.ratings_count > 0 && (
                                <div className="flex items-center gap-1 text-primary">
                                    <Star className="h-4 w-4 fill-current" />
                                    <span className="text-sm font-bold">
                                        {rating.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                        <h1 className="font-headline text-3xl font-extrabold leading-tight tracking-tight">
                            {room.title}
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {room.location}
                        </p>
                    </div>

                    {/* Description Section */}
                    <div className="space-y-4">
                        <div className="text-xs font-bold uppercase tracking-widest text-primary">
                            The Space
                        </div>
                        <p className="text-base leading-relaxed">
                            {room.description}
                        </p>
                    </div>

                    {/* Amenities Grid */}
                    <AmenitiesGrid services={room.services} />

                    {/* Reviews Section */}
                    <ReviewsSection
                        reviews={room.reviews}
                        averageRating={room.average_rating}
                    />

                    {/* Room Map */}
                    <RoomMapWrapper
                        latitude={room.latitude}
                        longitude={room.longitude}
                        roomName={room.title}
                        location={room.location}
                    />

                    {/* Chat Button Placeholder */}
                    <div className="rounded-2xl bg-card p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold">Have questions?</p>
                                <p className="text-sm text-muted-foreground">
                                    Chat feature coming soon
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="outline"
                                disabled
                                className="h-10 w-10 rounded-full"
                                onClick={handleChatClick}
                            >
                                <MessageCircle className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Sticky Booking Bar */}
            <StickyBookingBar
                basePrice={room.base_price_per_night}
                onReserveClick={handleReserve}
            />
        </div>
    );
}
