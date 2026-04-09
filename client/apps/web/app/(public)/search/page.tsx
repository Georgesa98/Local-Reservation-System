"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Search,
    SlidersHorizontal,
    MapPin,
    Sparkles,
    Sliders,
} from "lucide-react";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import { PropertyCard } from "@/components/property-card";
import type {
    RoomCard,
    RoomSearchParams,
    WishlistParams,
} from "@/lib/types/room";
import { fetchSearchTopRatedRooms, wishlistRoom } from "./api";

const categories = [
    { id: "all", label: "All", keywords: [] as string[] },
    { id: "family", label: "Family", keywords: ["family", "suite", "2 bed"] },
    { id: "budget", label: "Budget", keywords: ["budget", "basic", "economy"] },
    {
        id: "premium",
        label: "Premium",
        keywords: ["luxury", "premium", "executive"],
    },
    {
        id: "weekend",
        label: "Weekend",
        keywords: ["resort", "weekend", "getaway"],
    },
    {
        id: "work",
        label: "Workcation",
        keywords: ["business", "studio", "work"],
    },
];

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
            const areaSegment = parts[parts.length - 1];
            if (areaSegment) {
                return areaSegment.trim();
            }
        }
    }

    return "Nearby";
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const [searchQueryInput, setSearchQueryInput] = useState(initialQuery);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeArea, setActiveArea] = useState("all");
    const [guestInput, setGuestInput] = useState("");
    const [minPriceInput, setMinPriceInput] = useState("");
    const [maxPriceInput, setMaxPriceInput] = useState("");
    const [checkInInput, setCheckInInput] = useState("");
    const [checkOutInput, setCheckOutInput] = useState("");
    const [appliedFilters, setAppliedFilters] = useState<RoomSearchParams>({});
    const queryClient = useQueryClient();

    const normalizedQuery = searchQuery.trim();
    const backendParams = useMemo<RoomSearchParams>(() => {
        const params: RoomSearchParams = {
            ...appliedFilters,
            limit: 18,
        };

        if (normalizedQuery) {
            params.location = normalizedQuery;
        }

        return params;
    }, [appliedFilters, normalizedQuery]);

    const roomsQueryKey = ["rooms", "search", "top-rated", backendParams];

    const { data, isLoading, isError } = useQuery({
        queryKey: roomsQueryKey,
        queryFn: () => fetchSearchTopRatedRooms(backendParams),
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
        const normalizedSearchText = searchQuery.trim().toLowerCase();

        return rooms.filter((room) => {
            const area = getAreaFromTitle(room.title);
            const matchesText =
                normalizedSearchText.length === 0 ||
                room.title.toLowerCase().includes(normalizedSearchText);
            const matchesArea = activeArea === "all" || area === activeArea;

            return (
                matchesText &&
                matchesArea &&
                matchesCategory(room, activeCategory)
            );
        });
    }, [rooms, searchQuery, activeArea, activeCategory]);

    const topRatedRooms = useMemo(
        () => filteredRooms.slice(0, 8),
        [filteredRooms],
    );

    async function handleRoomWishlist(wishlistData: WishlistParams) {
        if (!wishlistData.user_id) {
            toast.error("Please login to save wishlist items.");
            return;
        }

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
        } catch {
            toast.error("Failed to update wishlist. Please try again.");
        }
    }

    function applyFilters() {
        const guests = guestInput ? Number(guestInput) : undefined;
        const minPrice = minPriceInput ? Number(minPriceInput) : undefined;
        const maxPrice = maxPriceInput ? Number(maxPriceInput) : undefined;

        if (
            (checkInInput && !checkOutInput) ||
            (!checkInInput && checkOutInput)
        ) {
            toast.error("Please select both check-in and check-out dates.");
            return;
        }

        if (checkInInput && checkOutInput && checkOutInput <= checkInInput) {
            toast.error("Check-out must be after check-in.");
            return;
        }

        if (
            minPrice !== undefined &&
            maxPrice !== undefined &&
            maxPrice < minPrice
        ) {
            toast.error(
                "Max price must be greater than or equal to min price.",
            );
            return;
        }

        setSearchQuery(searchQueryInput.trim());
        setAppliedFilters({
            guests,
            min_price: minPrice,
            max_price: maxPrice,
            check_in: checkInInput || undefined,
            check_out: checkOutInput || undefined,
        });
    }

    function clearFilters() {
        setSearchQueryInput("");
        setSearchQuery("");
        setGuestInput("");
        setMinPriceInput("");
        setMaxPriceInput("");
        setCheckInInput("");
        setCheckOutInput("");
        setAppliedFilters({});
        setActiveArea("all");
        setActiveCategory("all");
    }

    return (
        <main className="space-y-8 px-6 pb-28 pt-24">
            <section className="space-y-3">
                <p className="label-sm">Search Workspace</p>
                <div className="flex items-end justify-between gap-3">
                    <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-foreground">
                        Find your exact stay
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground">
                    Refine by query, area, and intent. Results come from the
                    top-rated local index.
                </p>
            </section>

            <section className="ambient-shadow flex w-full items-center gap-1 rounded-full bg-card p-1">
                <div className="flex flex-1 items-center gap-3 px-5">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Neighborhood, vibe, or room type"
                        value={searchQueryInput}
                        onChange={(e) => setSearchQueryInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                applyFilters();
                            }
                        }}
                        className="border-none bg-transparent text-sm font-medium focus-visible:ring-0 h-auto py-3"
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-border/40 bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Sliders className="h-4 w-4 text-primary" />
                    Filters
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input
                        type="date"
                        value={checkInInput}
                        onChange={(e) => setCheckInInput(e.target.value)}
                        className="h-10 shadow-md border-primary/10"
                        aria-label="Check-in date"
                    />
                    <Input
                        type="date"
                        value={checkOutInput}
                        onChange={(e) => setCheckOutInput(e.target.value)}
                        className="h-10 shadow-md border-primary/10"
                        aria-label="Check-out date"
                    />
                    <Input
                        type="number"
                        min={1}
                        placeholder="Guests"
                        value={guestInput}
                        onChange={(e) => setGuestInput(e.target.value)}
                        className="h-10 shadow-md border-primary/10"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            min={0}
                            placeholder="Min"
                            value={minPriceInput}
                            onChange={(e) => setMinPriceInput(e.target.value)}
                            className="h-10 shadow-md border-primary/10"
                        />
                        <Input
                            type="number"
                            min={0}
                            placeholder="Max"
                            value={maxPriceInput}
                            onChange={(e) => setMaxPriceInput(e.target.value)}
                            className="h-10 shadow-md border-primary/10"
                        />
                    </div>
                </div>
                <div className="mt-3 flex gap-2">
                    <Button onClick={applyFilters} className="flex-1">
                        Apply filters
                    </Button>
                    <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="flex-1"
                    >
                        Clear
                    </Button>
                </div>
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
            <section className="space-y-5 pb-2">
                <div className="flex items-end justify-between">
                    <h2 className="font-headline text-2xl font-bold tracking-tight">
                        Matching stays
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
