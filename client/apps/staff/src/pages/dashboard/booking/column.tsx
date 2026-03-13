import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { Booking, BookingStatus } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr: string): string {
  // YYYY-MM-DD → "Oct 12"
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; borderColor: string; color: string; bg: string }
> = {
  checked_in: {
    label: "Checked In",
    borderColor: "oklch(0.55 0.18 145)",
    color: "oklch(0.40 0.18 145)",
    bg: "oklch(0.97 0.03 145)",
  },
  confirmed: {
    label: "Confirmed",
    borderColor: "oklch(0.50 0.20 255)",
    color: "oklch(0.40 0.20 255)",
    bg: "oklch(0.97 0.03 255)",
  },
  pending: {
    label: "Pending",
    borderColor: "var(--border)",
    color: "var(--muted-foreground)",
    bg: "var(--muted)",
  },
  cancelled: {
    label: "Cancelled",
    borderColor: "oklch(0.55 0.22 25)",
    color: "oklch(0.45 0.22 25)",
    bg: "oklch(0.97 0.03 25)",
  },
  completed: {
    label: "Completed",
    borderColor: "var(--border)",
    color: "var(--foreground)",
    bg: "var(--secondary)",
  },
};

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        border: `1px solid ${cfg.borderColor}`,
        color: cfg.color,
        background: cfg.bg,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "0.6875rem",
        fontWeight: 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Columns ──────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Booking>();

export function useBookingColumns() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return useMemo(
    () => [
      // ID / Ref
      columnHelper.accessor("id", {
        header: () => t("bookings.columns.idRef"),
        cell: (info) => {
          const id = info.getValue();
          // Show last 4 chars as short ref, like #4829 in the design
          const shortRef = id.toString().slice(-4).toUpperCase();
          return (
            <span
              style={{
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--muted-foreground)",
                fontWeight: 500,
                fontSize: "0.8125rem",
              }}
            >
              #{shortRef}
            </span>
          );
        },
      }),

      // Guest Details
      columnHelper.display({
        id: "guest",
        header: () => t("bookings.columns.guestDetails"),
        cell: ({ row }) => {
          const { guest } = row.original;
          const fullName =
            [guest.first_name, guest.last_name].filter(Boolean).join(" ") ||
            guest.phone_number;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--foreground)",
                  fontSize: "0.9375rem",
                }}
              >
                {fullName}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  color: "var(--muted-foreground)",
                }}
              >
                {guest.phone_number}
              </span>
            </div>
          );
        },
      }),

      // Dates & Duration
      columnHelper.display({
        id: "dates",
        header: () => t("bookings.columns.datesDuration"),
        cell: ({ row }) => {
          const { check_in_date, check_out_date, number_of_nights } =
            row.original;
          const nightLabel =
            number_of_nights === 1
              ? t("bookings.night", { count: 1 })
              : t("bookings.nights", { count: number_of_nights });
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  color: "var(--foreground)",
                }}
              >
                <span>{formatDate(check_in_date)}</span>
                <span style={{ color: "var(--muted-foreground)" }}>→</span>
                <span>{formatDate(check_out_date)}</span>
              </div>
              <span className="label-caps" style={{ marginTop: 0 }}>
                {nightLabel}
              </span>
            </div>
          );
        },
      }),

      // Status
      columnHelper.accessor("status", {
        header: () => t("bookings.columns.status"),
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),

      // Total
      columnHelper.display({
        id: "total",
        header: () => (
          <div style={{ textAlign: "right" }}>
            {t("bookings.columns.total")}
          </div>
        ),
        cell: ({ row }) => {
          const { total_price, status } = row.original;
          const isCancelled = status === "cancelled";

          // Payment sub-label derived from status (no payment model on list endpoint)
          let paymentLabel = "";
          let paymentColor = "var(--muted-foreground)";
          if (status === "checked_in" || status === "completed") {
            paymentLabel = t("bookings.payment.paid");
            paymentColor = "oklch(0.40 0.18 145)";
          } else if (status === "confirmed") {
            paymentLabel = t("bookings.payment.depositOnly");
            paymentColor = "oklch(0.55 0.18 65)";
          } else if (status === "pending") {
            paymentLabel = t("bookings.payment.unpaid");
            paymentColor = "var(--muted-foreground)";
          } else if (status === "cancelled") {
            paymentLabel = t("bookings.payment.refunded");
            paymentColor = "oklch(0.45 0.22 25)";
          }

          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                  color: isCancelled
                    ? "var(--muted-foreground)"
                    : "var(--foreground)",
                  textDecoration: isCancelled ? "line-through" : "none",
                }}
              >
                {formatPrice(total_price)}
              </span>
              {paymentLabel && (
                <span
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: paymentColor,
                  }}
                >
                  {paymentLabel}
                </span>
              )}
            </div>
          );
        },
      }),

      // Action
      columnHelper.display({
        id: "action",
        header: () => (
          <div style={{ textAlign: "right" }}>
            {t("bookings.columns.action")}
          </div>
        ),
        cell: ({ row }) => {
          const { id, status } = row.original;
          const isCancelled = status === "cancelled";
          return (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => navigate(`/bookings/${id}`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: isCancelled
                    ? "var(--muted-foreground)"
                    : "var(--foreground)",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                {t("bookings.actions.view")}
                <span style={{ fontSize: "1em" }}>→</span>
              </button>
            </div>
          );
        },
      }),
    ],
    [t, navigate],
  );
}
