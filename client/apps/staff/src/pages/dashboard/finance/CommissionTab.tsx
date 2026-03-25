import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchPaymentStatistics, fetchPayments } from "./api";
import type { PaymentFilters } from "./types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";

export function CommissionTab() {
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    page_size: 20,
    ordering: "-paid_at",
  });

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["payment-statistics", "month"],
    queryFn: () => fetchPaymentStatistics({ period: "month" }),
  });

  // Fetch payments list
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", filters],
    queryFn: () => fetchPayments(filters),
  });

  const formatCurrency = (amount: string) => {
    return `SYP ${parseFloat(amount).toLocaleString()}`;
  };

  const formatGrowth = (percent: number) => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "pending":
        return "secondary";
      case "processing":
        return "secondary";
      case "failed":
        return "destructive";
      case "refunded":
        return "outline";
      case "cancelled":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Commissions Card */}
        <div className="border border-black p-4">
          <p className="text-sm text-gray-600">Commissions (MTD)</p>
          {statsLoading ? (
            <p className="text-2xl font-mono font-bold mt-2">Loading...</p>
          ) : (
            <>
              <p className="text-2xl font-mono font-bold mt-2">
                {stats ? formatCurrency(stats.total_commissions) : "SYP 0"}
              </p>
              <p
                className={`text-sm font-mono mt-1 ${
                  stats && stats.commission_growth_percent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats
                  ? formatGrowth(stats.commission_growth_percent)
                  : "+0.0%"}
              </p>
            </>
          )}
        </div>

        {/* Online Bookings Card */}
        <div className="border border-black p-4">
          <p className="text-sm text-gray-600">Online Bookings (MTD)</p>
          {statsLoading ? (
            <p className="text-2xl font-mono font-bold mt-2">Loading...</p>
          ) : (
            <>
              <p className="text-2xl font-mono font-bold mt-2">
                {stats?.online_bookings_count ?? 0}
              </p>
              <p
                className={`text-sm font-mono mt-1 ${
                  stats && stats.online_bookings_growth_percent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats
                  ? formatGrowth(stats.online_bookings_growth_percent)
                  : "+0.0%"}
              </p>
            </>
          )}
        </div>

        {/* Average Order Value Card */}
        <div className="border border-black p-4">
          <p className="text-sm text-gray-600">Average Order Value</p>
          {statsLoading ? (
            <p className="text-2xl font-mono font-bold mt-2">Loading...</p>
          ) : (
            <>
              <p className="text-2xl font-mono font-bold mt-2">
                {stats ? formatCurrency(stats.average_order_value) : "SYP 0"}
              </p>
              <p
                className={`text-sm font-mono mt-1 ${
                  stats && stats.aov_growth_percent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats ? formatGrowth(stats.aov_growth_percent) : "+0.0%"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="border border-black">
        <div className="p-4 border-b border-black">
          <h2 className="text-lg font-bold">Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Booking Reference</TableHead>
                <TableHead>Guest Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Platform Fee</TableHead>
                <TableHead>Final Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : (payments?.results?.length ?? 0) > 0 ? (
                payments.results.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono">{payment.id}</TableCell>
                    <TableCell className="font-mono">
                      {payment.booking_reference ?? `BK-${payment.booking}`}
                    </TableCell>
                    <TableCell>{payment.guest_name ?? "-"}</TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(payment.platform_fee)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(payment.final_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {(payments?.count ?? 0) > 0 && (
          <div className="p-4 border-t border-black flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(filters.page! - 1) * filters.page_size! + 1} to{" "}
              {Math.min(filters.page! * filters.page_size!, payments?.count ?? 0)} of{" "}
              {payments?.count ?? 0} transactions
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page! - 1 }))
                }
                disabled={!payments?.previous}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))
                }
                disabled={!payments?.next}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
