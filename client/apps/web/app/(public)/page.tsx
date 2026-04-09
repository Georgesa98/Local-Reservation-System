"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapIcon } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { PropertyCard } from "@/components/property-card";
import { fetchFeaturedRooms, wishlistRoom } from "./api";
import { cn } from "@workspace/ui/lib/utils";
import type { RoomCard, WishlistParams } from "@/lib/types/room";
import { toast } from "sonner";

const categories = [
    {
        id: "modern-villas",
        label: "Modern Villas",
        icon: "villa",
        active: true,
    },
    { id: "castles", label: "Castles", icon: "castle", active: false },
    { id: "cabins", label: "Cabins", icon: "cabin", active: false },
    { id: "penthouses", label: "Penthouses", icon: "apartment", active: false },
];

export default function LandingPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("modern-villas");
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

    return (
        <>
            {/* Main Content */}
            <main className="px-6 pt-24 space-y-10">
                {/* Hero Section */}
                <section className="space-y-6">
                    <div className="space-y-2">
                        <p className="label-sm">Curated Collections</p>
                        <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-foreground">
                            Find your next{" "}
                            <span className="text-primary">masterpiece</span>{" "}
                            stay.
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="ambient-shadow flex w-full items-center gap-1 rounded-full bg-card p-1">
                        <div className="flex flex-1 items-center gap-3 px-5">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Where to next?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        goToSearch();
                                    }
                                }}
                                className="border-none bg-transparent text-sm font-medium focus-visible:ring-0"
                            />
                        </div>
                        <Button
                            size="icon"
                            onClick={goToSearch}
                            className="h-12 w-12 rounded-full bg-primary from-primary to-primary-container shadow-lg transition-transform active:scale-95"
                        >
                            <SlidersHorizontal className="h-5 w-5" />
                        </Button>
                    </div>
                </section>

                {/* Category Chips */}
                <section className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {categories.map((category) => {
                        const isActive = activeCategory === category.id;

                        return (
                            <Button
                                key={category.id}
                                variant={isActive ? "default" : "outline"}
                                onClick={() => setActiveCategory(category.id)}
                                className={cn(
                                    "flex items-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-semibold shadow-md transition-colors",
                                    isActive && "bg-primary text-white",
                                    !isActive &&
                                        "border-0 bg-card text-muted-foreground hover:bg-muted",
                                )}
                            >
                                <span className="text-sm">
                                    {category.label}
                                </span>
                            </Button>
                        );
                    })}
                </section>

                {/* Featured Properties */}
                <section className="space-y-8 pb-12">
                    <div className="flex items-end justify-between">
                        <h2 className="font-headline text-2xl font-bold tracking-tight">
                            Handpicked for you
                        </h2>
                        <span className="text-sm font-bold text-primary">
                            View all
                        </span>
                    </div>

                    {/* Loading State */}
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

                    {/* Error State */}
                    {!isLoading && isError && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <h3 className="mb-2 font-headline text-xl font-bold">
                                Unable to load properties
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Please try again in a moment.
                            </p>
                        </div>
                    )}

                    {/* Property Cards */}
                    {!isLoading && !isError && (
                        <div className="flex flex-col gap-8">
                            {rooms.map((room) => (
                                <PropertyCard
                                    key={room.id}
                                    room={room}
                                    onFavoriteClick={handleRoomWishlist}
                                />
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !isError && rooms.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <MapIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 font-headline text-xl font-bold">
                                No properties found
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Try adjusting your search or check back later.
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}
