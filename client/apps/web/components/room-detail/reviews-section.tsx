"use client";

import { Star } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import type { RoomReview } from "@/lib/types/room";

interface ReviewsSectionProps {
    reviews: RoomReview[];
    averageRating: string;
}

export function ReviewsSection({
    reviews,
    averageRating,
}: ReviewsSectionProps) {
    if (reviews.length === 0) {
        return null;
    }

    const rating = parseFloat(averageRating);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">
                    Guest Reviews
                </div>
                <div className="flex items-center gap-1 text-primary">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold">
                        {rating.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => {
                    const reviewDate = new Date(review.created_at);
                    const formattedDate = reviewDate.toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                    });

                    return (
                        <div
                            key={review.id}
                            className="space-y-2 rounded-2xl bg-card p-4"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold">
                                        {review.guest_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formattedDate}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                    <span className="text-sm font-bold">
                                        {review.rating}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">
                                {review.comment}
                            </p>
                        </div>
                    );
                })}
            </div>

            {reviews.length > 3 && (
                <button className="w-full text-center text-sm font-bold text-primary underline underline-offset-4">
                    Show all {reviews.length} reviews
                </button>
            )}
        </div>
    );
}
