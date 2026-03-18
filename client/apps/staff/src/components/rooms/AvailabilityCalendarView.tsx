/**
 * AvailabilityCalendarView — monthly calendar showing room availability states.
 *
 * Features:
 * - Month navigation (prev/next/today)
 * - 4 date states: available, booked, pending, blocked
 * - Custom day cell renderer with Neo-Swiss styling
 * - Click handler to pre-fill availability form
 * - Past dates dimmed and non-interactive
 *
 * Data sources:
 * - Blocked dates: room.availabilities[] (maintenance, personal use, etc.)
 * - Booked dates: bookings API (status: confirmed, checked_in, completed)
 * - Pending dates: bookings API (status: pending)
 */

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  startOfMonth,
  endOfMonth,
  startOfDay,
  isBefore,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { Calendar } from "@workspace/ui/components/calendar";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  RoomAvailability,
  Booking,
  BookingStatus,
} from "../../pages/dashboard/rooms/types";
import { fetchRoomBookings } from "../../pages/dashboard/rooms/[id]/api";
import { CalendarLegend } from "./CalendarLegend";

// ─── Date state type ──────────────────────────────────────────────────────────

type DateState = "available" | "booked" | "pending" | "blocked" | "past";

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Checks if a date falls within a date range (inclusive).
 */
function isDateInRange(
  date: Date,
  start: string,
  end: string
): boolean {
  const d = startOfDay(date);
  const startDate = startOfDay(new Date(start));
  const endDate = startOfDay(new Date(end));
  return d >= startDate && d <= endDate;
}

/**
 * Determines the state of a date based on availabilities and bookings.
 * Priority: past > blocked > booked > pending > available
 */
function getDateState(
  date: Date,
  availabilities: RoomAvailability[],
  bookings: Booking[]
): DateState {
  const today = startOfDay(new Date());

  // Past dates
  if (isBefore(date, today)) return "past";

  // Blocked dates (maintenance, personal use)
  const isBlocked = availabilities.some((avail) =>
    isDateInRange(date, avail.start_date, avail.end_date)
  );
  if (isBlocked) return "blocked";

  // Booked/pending dates
  const booking = bookings.find((b) =>
    isDateInRange(date, b.check_in_date, b.check_out_date)
  );

  if (booking) {
    const bookedStatuses: BookingStatus[] = [
      "confirmed",
      "checked_in",
      "completed",
    ];
    return bookedStatuses.includes(booking.status) ? "booked" : "pending";
  }

  return "available";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvailabilityCalendarViewProps {
  roomId: number;
  availabilities: RoomAvailability[];
  onDateClick?: (date: Date) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvailabilityCalendarView({
  roomId,
  availabilities,
  onDateClick,
}: AvailabilityCalendarViewProps) {
  const { t } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ── Fetch bookings for current month ────────────────────────────────────────

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: [
      "room-bookings-calendar",
      roomId,
      format(monthStart, "yyyy-MM-dd"),
      format(monthEnd, "yyyy-MM-dd"),
    ],
    queryFn: () =>
      fetchRoomBookings(
        roomId,
        format(monthStart, "yyyy-MM-dd"),
        format(monthEnd, "yyyy-MM-dd")
      ),
  });

  // ── Month navigation handlers ───────────────────────────────────────────────

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  // ── Custom day cell renderer ────────────────────────────────────────────────

  const modifiers = useMemo(() => {
    if (isLoading) return {};

    const blocked: Date[] = [];
    const booked: Date[] = [];
    const pending: Date[] = [];
    const past: Date[] = [];

    // Generate all dates in current month
    const daysInMonth =
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      ).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      const state = getDateState(date, availabilities, bookings);

      switch (state) {
        case "past":
          past.push(date);
          break;
        case "blocked":
          blocked.push(date);
          break;
        case "booked":
          booked.push(date);
          break;
        case "pending":
          pending.push(date);
          break;
      }
    }

    return { blocked, booked, pending, past };
  }, [currentMonth, availabilities, bookings, isLoading]);

  const modifiersClassNames = {
    blocked: "calendar-day-blocked",
    booked: "calendar-day-booked",
    pending: "calendar-day-pending",
    past: "calendar-day-past",
  };

  const handleDayClick = useCallback(
    (date: Date | undefined) => {
      if (!date) return;

      const state = getDateState(date, availabilities, bookings);

      // Only allow clicks on available dates
      if (state === "available" && onDateClick) {
        onDateClick(date);
      }
    },
    [availabilities, bookings, onDateClick]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header: Title + Month nav + Legend */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-bold uppercase tracking-tight">
            {t("room.availability.calendarView")}
          </h2>

          {/* Month navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="size-8"
              aria-label={t("room.availability.navigation.previousMonth")}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <span className="font-mono text-sm font-bold w-32 text-center uppercase">
              {format(currentMonth, "MMMM yyyy")}
            </span>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="size-8"
              aria-label={t("room.availability.navigation.nextMonth")}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="px-4 h-8 text-[10px] font-bold uppercase tracking-widest"
          >
            {t("room.availability.navigation.today")}
          </Button>
        </div>

        {/* Legend */}
        <CalendarLegend />
      </div>

      {/* Calendar grid */}
      <div className="border border-border">
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          onDayClick={handleDayClick}
          disabled={(date) => {
            const state = getDateState(date, availabilities, bookings);
            return state !== "available";
          }}
          className="w-full"
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <span className="label-caps">{t("room.loading")}</span>
        </div>
      )}
    </div>
  );
}
