"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import type { RoomImage } from "@/lib/types/room";

interface ImageCarouselProps {
    images: RoomImage[];
    roomTitle: string;
}

export function ImageCarousel({ images, roomTitle }: ImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
        /\/$/,
        "",
    ).replace(/\/api$/, "");

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const width = container.clientWidth;
            const index = Math.round(scrollLeft / width);
            setCurrentIndex(index);
        };

        container.addEventListener("scroll", handleScroll);
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    // Sort images to show main image first
    const sortedImages = [...images].sort((a, b) => {
        if (a.is_main) return -1;
        if (b.is_main) return 1;
        return 0;
    });

    if (sortedImages.length === 0) {
        return (
            <section className="relative h-[530px] w-full overflow-hidden bg-muted">
                <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No images available</p>
                </div>
            </section>
        );
    }

    return (
        <section className="relative h-[530px] w-full overflow-hidden">
            <div
                ref={scrollContainerRef}
                className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                {sortedImages.map((image, index) => {
                    const imageAlt =
                        image.alt_text || `${roomTitle} - Image ${index + 1}`;

                    return (
                        <div
                            key={image.id}
                            className="relative h-full min-w-full shrink-0 snap-center"
                        >
                            <Image
                                src={image.image}
                                alt={imageAlt}
                                fill
                                className="object-cover"
                                sizes="100vw"
                                priority={index === 0}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Pagination Dots */}
            {sortedImages.length > 1 && (
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                    {sortedImages.map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "h-2 w-2 rounded-full transition-colors",
                                index === currentIndex
                                    ? "bg-white"
                                    : "bg-white/40",
                            )}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
