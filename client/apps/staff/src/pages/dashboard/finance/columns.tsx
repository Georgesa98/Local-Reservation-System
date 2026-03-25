import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import type { Payment, PaymentStatus } from "./types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatCurrency(amount: string): string {
  return `SYP ${parseFloat(amount).toLocaleString()}`;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

export function getStatusBadgeVariant(
  status: PaymentStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "pending":
    case "processing":
      return "secondary";
    case "failed":
      return "destructive";
    case "refunded":
    case "cancelled":
      return "outline";
    default:
      return "default";
  }
}

// ─── Column definitions ───────────────────────────────────────────────────────

const col = createColumnHelper<Payment>();

export function usePaymentColumns() {
  return useMemo(
    () => [
      col.accessor("id", {
        header: () => "Transaction ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue()}</span>
        ),
      }),

      col.display({
        id: "booking_reference",
        header: () => "Booking Ref",
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <span className="font-mono text-sm">
              {payment.booking_reference ?? `BK-${payment.booking}`}
            </span>
          );
        },
      }),

      col.display({
        id: "guest_name",
        header: () => "Guest",
        cell: ({ row }) => {
          const guestName = row.original.guest_name;
          return <span className="text-sm">{guestName ?? "-"}</span>;
        },
      }),

      col.accessor("amount", {
        header: () => "Amount",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatCurrency(getValue())}</span>
        ),
      }),

      col.accessor("platform_fee", {
        header: () => "Platform Fee",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatCurrency(getValue())}</span>
        ),
      }),

      col.accessor("status", {
        header: () => "Status",
        cell: ({ getValue }) => {
          const status = getValue();
          return (
            <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
          );
        },
      }),

      col.accessor("paid_at", {
        header: () => "Date",
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{formatDate(getValue())}</span>
        ),
      }),
    ],
    []
  );
}
