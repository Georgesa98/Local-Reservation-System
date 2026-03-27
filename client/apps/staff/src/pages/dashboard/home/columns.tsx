import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { ArrowRight } from "lucide-react";
import type { ActivityBooking, BookingStatus } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatDateRange(checkIn: string, checkOut: string): string {
  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  return `${formatDate(checkIn)} → ${formatDate(checkOut)}`;
}

export function getStatusBadgeStyles(status: BookingStatus): {
  borderColor: string;
  textColor: string;
  bgColor: string;
} {
  switch (status) {
    case "confirmed":
      return {
        borderColor: "border-blue-600",
        textColor: "text-blue-600",
        bgColor: "bg-blue-600/5",
      };
    case "checked_in":
      return {
        borderColor: "border-green-600",
        textColor: "text-green-600",
        bgColor: "bg-green-600/5",
      };
    case "pending":
      return {
        borderColor: "border-gray-500",
        textColor: "text-gray-500",
        bgColor: "bg-gray-100",
      };
    case "cancelled":
      return {
        borderColor: "border-red-600",
        textColor: "text-red-600",
        bgColor: "bg-red-600/5",
      };
    case "completed":
      return {
        borderColor: "border-black",
        textColor: "text-black",
        bgColor: "bg-gray-100",
      };
    default:
      return {
        borderColor: "border-gray-400",
        textColor: "text-gray-500",
        bgColor: "bg-gray-50",
      };
  }
}

export function formatStatus(status: BookingStatus): string {
  return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const col = createColumnHelper<ActivityBooking>();

export function useActivityColumns() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return useMemo(
    () => [
      // Guest column (col-span-4)
      col.display({
        id: "guest",
        header: () => t("dashboardHome.columns.guest"),
        cell: ({ row }) => {
          const booking = row.original;
          const guest = booking.guest;
          const fullName = `${guest.first_name} ${guest.last_name}`;

          return (
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-black group-hover:text-blue-600 transition-colors">
                  {fullName}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {t("dashboardHome.columns.id")}: #{guest.id}
                </span>
              </div>
            </div>
          );
        },
        meta: { className: "col-span-4" },
      }),

      // Room column (col-span-2)
      col.display({
        id: "room",
        header: () => t("dashboardHome.columns.room"),
        cell: ({ row }) => {
          const room = row.original.room;
          return (
            <span className="font-mono text-[11px] text-black bg-gray-100 px-2 py-1">
              {room.location}
            </span>
          );
        },
        meta: { className: "col-span-2" },
      }),

      // Dates column (col-span-3)
      col.display({
        id: "dates",
        header: () => t("dashboardHome.columns.dates"),
        cell: ({ row }) => {
          const booking = row.original;
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);

          const formatDate = (d: Date) =>
            d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <span className="font-mono text-[11px] text-gray-600">
              {formatDate(checkIn)}{" "}
              <span className="text-gray-300 mx-1">→</span>{" "}
              {formatDate(checkOut)}
            </span>
          );
        },
        meta: { className: "col-span-3" },
      }),

      // Status column (col-span-2)
      col.accessor("status", {
        header: () => t("dashboardHome.columns.status"),
        cell: ({ getValue }) => {
          const status = getValue();
          const styles = getStatusBadgeStyles(status);

          return (
            <span
              className={`inline-flex items-center px-2 py-1 border text-[9px] font-bold uppercase tracking-wide ${styles.borderColor} ${styles.textColor} ${styles.bgColor}`}
            >
              {formatStatus(status)}
            </span>
          );
        },
        meta: { className: "col-span-2" },
      }),

      // Action column (col-span-1)
      col.display({
        id: "action",
        header: () => t("dashboardHome.columns.action"),
        cell: ({ row }) => (
          <ArrowRight
            size={16}
            className="text-gray-300 group-hover:text-black transition-colors cursor-pointer"
            onClick={() => navigate(`/bookings/${row.original.id}`)}
          />
        ),
        meta: { className: "col-span-1 text-right" },
      }),
    ],
    [navigate, t],
  );
}
