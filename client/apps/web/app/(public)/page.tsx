"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapIcon, ArrowRight } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { PropertyCard } from "@/components/property-card";
import { fetchFeaturedRooms, wishlistRoom } from "./api";
import { cn } from "@workspace/ui/lib/utils";
import type { RoomCard, WishlistParams } from "@/lib/types/room";
import { toast } from "sonner";

const discoveryIntents = [
    { id: "weekend", label: "Weekend escape", query: "weekend" },
    { id: "family", label: "Family stay", query: "family" },
    { id: "work", label: "Work-friendly", query: "business" },
    { id: "budget", label: "Budget", query: "budget" },
];

export default function LandingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const queryClient = useQueryClient();
    const roomsQueryKey = ["rooms", "featured", { limit: 6 }];

    // Fetch featured rooms
    const { data, isLoading, isError } = useQuery({
        queryKey: roomsQueryKey,
        queryFn: () => fetchFeaturedRooms({ limit: 6 }),
    });

    const rooms = data || [];

    async function handleRoomWishlist(wishlistData: WishlistParams) {
        try {
            const message = await wishlistRoom(wishlistData);
            queryClient.setQueryData<RoomCard[]>(
                roomsQueryKey,
                (currentRooms) =>
                    currentRooms?.map((room) =>
                        room.id === wishlistData.room_id
                            ? {
                                  ...room,
                                  is_wishlisted: !room.is_wishlisted,
                              }
                            : room,
                    ),
            );
            toast.success(message);
        } catch (error) {
            toast.error("Failed to update wishlist. Please try again.");
        }
    }

    function goToSearch() {
        const query = searchQuery.trim();

        if (!query) {
            router.push("/search");
            return;
        }

        router.push(`/search?q=${encodeURIComponent(query)}`);
    }

    function goToIntentSearch(query: string) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
    }

    return (
        <main className="space-y-10 px-6 pb-28 pt-24">
            <section className="space-y-6">
                <div className="space-y-2">
                    <p className="label-sm">Discover Local Stays</p>
                    <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-foreground">
                        Find a stay that fits your
                        <span className="text-primary"> moment</span>.
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Start with inspiration here, then jump into Search to
                        filter by what matters.
                    </p>
                </div>

                <div className="ambient-shadow flex w-full items-center gap-1 rounded-full bg-card p-1">
                    <div className="flex flex-1 items-center gap-3 px-5">
                        <Search className="h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Try: downtown, family, weekend"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    goToSearch();
                                }
                            }}
                            className="border-none h-auto py-3 bg-transparent text-sm font-medium focus-visible:ring-0"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-end justify-between">
                    <h2 className="font-headline text-xl font-bold tracking-tight">
                        Start with an intent
                    </h2>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Quick jump
                    </span>
                </div>
                <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {discoveryIntents.map((intent) => (
                        <Button
                            key={intent.id}
                            variant="outline"
                            onClick={() => goToIntentSearch(intent.query)}
                            className={cn(
                                "whitespace-nowrap rounded-full border-0 bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground",
                            )}
                        >
                            {intent.label}
                        </Button>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-end justify-between">
                    <h2 className="font-headline text-2xl font-bold tracking-tight">
                        Editor picks this week
                    </h2>
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/search")}
                        className="h-auto p-0 text-sm font-bold text-primary"
                    >
                        Open Search <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>

                {isLoading && (
                    <div className="flex flex-col gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-4">
                                <div className="radius-hero aspect-[4/3] animate-pulse bg-muted" />
                                <div className="space-y-2">
                                    <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && isError && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <h3 className="mb-2 font-headline text-xl font-bold">
                            Unable to load picks
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Please try again in a moment.
                        </p>
                    </div>
                )}

                {!isLoading && !isError && rooms.length > 0 && (
                    <div className="flex flex-col gap-8">
                        {rooms.slice(0, 3).map((room) => (
                            <PropertyCard
                                key={room.id}
                                room={room}
                                onFavoriteClick={handleRoomWishlist}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && !isError && rooms.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <MapIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 font-headline text-xl font-bold">
                            No properties found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Explore Search for broader matches.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
