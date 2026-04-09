"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, SlidersHorizontal, MapPin, Sparkles } from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import { PropertyCard } from "@/components/property-card";
import type { RoomCard, WishlistParams } from "@/lib/types/room";
import { fetchSearchCatalogRooms, wishlistRoom } from "./api";

const categories = [
    { id: "all", label: "All", keywords: [] as string[] },
    { id: "family", label: "Family", keywords: ["family", "suite", "2 bed"] },
    { id: "budget", label: "Budget", keywords: ["budget", "basic", "economy"] },
    { id: "premium", label: "Premium", keywords: ["luxury", "premium", "executive"] },
    { id: "weekend", label: "Weekend", keywords: ["resort", "weekend", "getaway"] },
    { id: "work", label: "Workcation", keywords: ["business", "studio", "work"] },
];

const roomsQueryKey = ["rooms", "search", "catalog", { limit: 18 }];

function matchesCategory(room: RoomCard, categoryId: string) {
    if (categoryId === "all") return true;

    const category = categories.find((item) => item.id === categoryId);

    if (!category || category.keywords.length === 0) return true;

    const haystack = room.title.toLowerCase();
    return category.keywords.some((keyword) => haystack.includes(keyword));
}

function getAreaFromTitle(title: string) {
    const normalized = title.trim();
    const separators = [" - ", " | ", " in "];

    for (const separator of separators) {
        const parts = normalized.split(separator);
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
    }

    return "Nearby";
}

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeArea, setActiveArea] = useState("all");
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: roomsQueryKey,
        queryFn: fetchSearchCatalogRooms,
    });

    const rooms = data || [];

    const popularAreas = useMemo(() => {
        const areaCount = rooms.reduce<Record<string, number>>((acc, room) => {
            const area = getAreaFromTitle(room.title);
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(areaCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, count]) => ({ label, count }));
    }, [rooms]);

    const filteredRooms = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return rooms.filter((room) => {
            const area = getAreaFromTitle(room.title);
            const matchesText =
                normalizedQuery.length === 0 ||
                room.title.toLowerCase().includes(normalizedQuery);
            const matchesArea = activeArea === "all" || area === activeArea;

            return matchesText && matchesArea && matchesCategory(room, activeCategory);
        });
    }, [rooms, searchQuery, activeArea, activeCategory]);

    const topRatedRooms = useMemo(() => {
        return [...filteredRooms]
            .sort((a, b) => Number(b.average_rating) - Number(a.average_rating))
            .slice(0, 8);
    }, [filteredRooms]);

    async function handleRoomWishlist(wishlistData: WishlistParams) {
        if (!wishlistData.user_id) {
            toast.error("Please login to save wishlist items.");
            return;
        }

        try {
            const message = await wishlistRoom(wishlistData);
            queryClient.setQueryData<RoomCard[]>(roomsQueryKey, (currentRooms) =>
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
        } catch {
            toast.error("Failed to update wishlist. Please try again.");
        }
    }

    return (
        <main className="space-y-8 px-6 pb-28 pt-24">
            <section className="space-y-3">
                <p className="label-sm">Local Discovery</p>
                <div className="flex items-end justify-between gap-3">
                    <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-foreground">
                        Search nearby stays
                    </h1>
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
            </section>

            <section className="ambient-shadow flex w-full items-center gap-1 rounded-full bg-card p-1">
                <div className="flex flex-1 items-center gap-3 px-5">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Neighborhood, vibe, or room type"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-none bg-transparent text-sm font-medium focus-visible:ring-0"
                    />
                </div>
                <Button
                    size="icon"
                    className="h-12 w-12 rounded-full bg-primary from-primary to-primary-container shadow-lg transition-transform active:scale-95"
                    aria-label="Open filters"
                >
                    <SlidersHorizontal className="h-5 w-5" />
                </Button>
            </section>

            <section className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {categories.map((category) => {
                    const isActive = activeCategory === category.id;

                    return (
                        <Button
                            key={category.id}
                            variant={isActive ? "default" : "outline"}
                            onClick={() => setActiveCategory(category.id)}
                            className={cn(
                                "rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm",
                                isActive
                                    ? "border-primary bg-primary text-white"
                                    : "border-0 bg-card text-muted-foreground hover:bg-muted",
                            )}
                        >
                            {category.label}
                        </Button>
                    );
                })}
            </section>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h2 className="font-headline text-xl font-bold tracking-tight">
                        Popular nearby areas
                    </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <Button
                        variant={activeArea === "all" ? "default" : "outline"}
                        onClick={() => setActiveArea("all")}
                        className={cn(
                            "whitespace-nowrap rounded-full px-4 py-2 text-sm",
                            activeArea === "all"
                                ? "border-primary bg-primary text-white"
                                : "border-0 bg-card text-muted-foreground",
                        )}
                    >
                        All areas
                    </Button>
                    {popularAreas.map((area) => {
                        const isActive = activeArea === area.label;

                        return (
                            <Button
                                key={area.label}
                                variant={isActive ? "default" : "outline"}
                                onClick={() => setActiveArea(area.label)}
                                className={cn(
                                    "whitespace-nowrap rounded-full px-4 py-2 text-sm",
                                    isActive
                                        ? "border-primary bg-primary text-white"
                                        : "border-0 bg-card text-muted-foreground",
                                )}
                            >
                                {area.label} ({area.count})
                            </Button>
                        );
                    })}
                </div>
            </section>

            <section className="space-y-5 pb-2">
                <div className="flex items-end justify-between">
                    <h2 className="font-headline text-2xl font-bold tracking-tight">
                        Top rated nearby
                    </h2>
                    <span className="text-sm font-semibold text-muted-foreground">
                        {topRatedRooms.length} results
                    </span>
                </div>

                {isLoading && (
                    <div className="flex flex-col gap-8">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="space-y-4">
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
                    <div className="rounded-3xl bg-card p-6 text-center">
                        <h3 className="font-headline text-lg font-bold text-foreground">
                            Unable to load nearby stays
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Please try again in a moment.
                        </p>
                    </div>
                )}

                {!isLoading && !isError && topRatedRooms.length > 0 && (
                    <div className="flex flex-col gap-8">
                        {topRatedRooms.map((room) => (
                            <PropertyCard
                                key={room.id}
                                room={room}
                                onFavoriteClick={handleRoomWishlist}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && !isError && topRatedRooms.length === 0 && (
                    <div className="rounded-3xl bg-card p-6 text-center">
                        <h3 className="font-headline text-lg font-bold text-foreground">
                            No local matches yet
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Try another keyword or switch area filters.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}
