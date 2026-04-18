"use client";

import { Calendar } from "@workspace/ui/components/calendar";
import { cn } from "@workspace/ui/lib/utils";

export interface StayDateRange {
    from: Date | undefined;
    to?: Date;
}

interface StayDateCalendarProps {
    value?: StayDateRange;
    onChange: (next: StayDateRange | undefined) => void;
    className?: string;
    blockedDates?: Date[];
}

function getStartOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function StayDateCalendar({
    value,
    onChange,
    className,
    blockedDates = [],
}: StayDateCalendarProps) {
    const minDate = getStartOfToday();

    return (
        <div
            className={cn(
                "radius-hero border border-border/40 bg-card p-3",
                className,
            )}
        >
            <Calendar
                mode="range"
                numberOfMonths={1}
                selected={value}
                onSelect={(next) => onChange(next as StayDateRange | undefined)}
                disabled={[
                    { before: minDate },
                    ...blockedDates,
                ]}
                className="w-full"
            />
        </div>
    );
}
