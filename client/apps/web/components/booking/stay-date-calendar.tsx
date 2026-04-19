"use client";

import { addDays } from "date-fns";
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

function rangeContainsBlockedDate(
    from: Date,
    to: Date,
    blockedDates: Date[],
): boolean {
    const blockedTimestamps = new Set(
        blockedDates.map((blockedDate) => blockedDate.getTime()),
    );

    let currentDate = from;
    while (currentDate < to) {
        if (blockedTimestamps.has(currentDate.getTime())) {
            return true;
        }
        currentDate = addDays(currentDate, 1);
    }

    return false;
}

export function StayDateCalendar({
    value,
    onChange,
    className,
    blockedDates = [],
}: StayDateCalendarProps) {
    const minDate = getStartOfToday();
    const normalizedBlockedDates = blockedDates ?? [];

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
                onSelect={(next) => {
                    const nextRange = next as StayDateRange | undefined;

                    if (
                        nextRange?.from &&
                        nextRange.to &&
                        rangeContainsBlockedDate(
                            nextRange.from,
                            nextRange.to,
                            normalizedBlockedDates,
                        )
                    ) {
                        onChange({ from: nextRange.from });
                        return;
                    }

                    onChange(nextRange);
                }}
                disabled={[{ before: minDate }, ...normalizedBlockedDates]}
                modifiers={{ blocked: normalizedBlockedDates }}
                modifiersClassNames={{
                    blocked:
                        "bg-destructive/10 text-destructive opacity-100 ring-1 ring-destructive/15",
                }}
                className="w-full"
            />
        </div>
    );
}
