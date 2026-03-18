/**
 * CalendarLegend — displays 4-state legend for availability calendar.
 *
 * States:
 * - Available: white background with border
 * - Booked: primary color (black in light mode)
 * - Pending: yellow/amber
 * - Blocked: diagonal stripes (maintenance/personal use)
 */

import { useTranslation } from "react-i18next";

export function CalendarLegend() {
  const { t } = useTranslation();

  const states = [
    {
      key: "available",
      label: t("room.availability.legend.available"),
      className: "bg-card border border-border",
    },
    {
      key: "booked",
      label: t("room.availability.legend.booked"),
      className: "bg-primary",
    },
    {
      key: "pending",
      label: t("room.availability.legend.pending"),
      className: "bg-[oklch(0.75_0.15_85)]",
    },
    {
      key: "blocked",
      label: t("room.availability.legend.blocked"),
      className: "calendar-day-blocked",
    },
  ] as const;

  return (
    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest">
      {states.map((state) => (
        <div key={state.key} className="flex items-center gap-2">
          <div className={`size-3 ${state.className}`} />
          <span>{state.label}</span>
        </div>
      ))}
    </div>
  );
}
