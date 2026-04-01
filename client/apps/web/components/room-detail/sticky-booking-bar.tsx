"use client";

import { Button } from "@workspace/ui/components/button";

interface StickyBookingBarProps {
    basePrice: string;
    onReserveClick: () => void;
}

export function StickyBookingBar({
    basePrice,
    onReserveClick,
}: StickyBookingBarProps) {
    const price = parseFloat(basePrice);

    return (
        <div className="fixed bottom-0 left-0 z-50 w-full">
            <div className="flex items-center justify-between rounded-t-[32px] bg-card/80 px-6 pb-10 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="font-headline text-2xl font-extrabold text-foreground">
                            ${price.toFixed(0)}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                            / night
                        </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-primary underline underline-offset-4">
                        Select dates
                    </p>
                </div>
                <Button
                    onClick={onReserveClick}
                    className="rounded-xl bg-gradient-to-br from-primary to-primary/80 px-10 py-4 font-headline text-sm font-bold tracking-wide shadow-lg shadow-primary/20 transition-transform active:scale-95"
                >
                    Reserve Now
                </Button>
            </div>
        </div>
    );
}
