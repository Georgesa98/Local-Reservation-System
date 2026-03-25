import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  fetchPaymentStatistics,
  fetchPayments,
} from "../../pages/dashboard/finance/api";
import type { PaymentFilters } from "../../pages/dashboard/finance/types";
import { PaymentsDataTable } from "../../pages/dashboard/finance/data-table";

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

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
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
      <PaymentsDataTable
        data={payments?.results ?? []}
        isLoading={paymentsLoading}
        pagination={
          payments
            ? {
                page: filters.page!,
                pageSize: filters.page_size!,
                totalCount: payments.count,
                hasNext: !!payments.next,
                hasPrevious: !!payments.previous,
              }
            : undefined
        }
        onPageChange={handlePageChange}
      />
    </div>
  );
}
