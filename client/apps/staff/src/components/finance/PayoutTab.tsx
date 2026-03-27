import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchPayoutStatistics,
  fetchPayouts,
  fetchBankAccounts,
  fetchStripeConnectStatus,
} from "../../pages/dashboard/finance/api";
import { Badge } from "@workspace/ui/components/badge";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function PayoutTab() {
  const { t } = useTranslation();
  // Fetch payout statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["payout-statistics"],
    queryFn: fetchPayoutStatistics,
  });

  // Fetch payouts list
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["payouts"],
    queryFn: () => fetchPayouts({ page: 1, page_size: 10 }),
  });

  // Fetch bank accounts
  const { data: bankAccounts, isLoading: bankAccountsLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: fetchBankAccounts,
  });

  // Fetch Stripe Connect status
  const { data: stripeStatus } = useQuery({
    queryKey: ["stripeConnectStatus"],
    queryFn: fetchStripeConnectStatus,
  });

  const formatCurrency = (amount: string) => {
    return `SYP ${parseFloat(amount).toLocaleString()}`;
  };

  const formatGrowth = (percent: number) => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-800";
      case "failed":
        return "bg-red-100 text-red-800 border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stripe Connect Status Banner */}
      {stripeStatus &&
        stripeStatus.charges_enabled &&
        stripeStatus.payouts_enabled && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-sm text-green-900">
              <span className="font-medium">{t("finance.payouts.stripe.activeTitle")}</span> —
              {t("finance.payouts.stripe.activeMessage")}
            </AlertDescription>
          </Alert>
        )}

      {stripeStatus &&
        stripeStatus.has_account &&
        !stripeStatus.charges_enabled && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-900">
              <span className="font-medium">{t("finance.payouts.stripe.incompleteTitle")}</span> —
              {t("finance.payouts.stripe.incompleteMessage")}
            </AlertDescription>
          </Alert>
        )}
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pending Balance Card */}
        <div className="border border-black p-4">
          <p className="text-sm text-gray-600">{t("finance.payouts.stats.pendingBalance")}</p>
          {statsLoading ? (
            <p className="text-2xl font-mono font-bold mt-2">{t("finance.payouts.stats.loading")}</p>
          ) : (
            <p className="text-2xl font-mono font-bold mt-2">
              {stats ? formatCurrency(stats.pending_balance) : "SYP 0"}
            </p>
          )}
        </div>

        {/* Paid Last 30 Days Card */}
        <div className="border border-black p-4">
          <p className="text-sm text-gray-600">{t("finance.payouts.stats.paid30Days")}</p>
          {statsLoading ? (
            <p className="text-2xl font-mono font-bold mt-2">{t("finance.payouts.stats.loading")}</p>
          ) : (
            <>
              <p className="text-2xl font-mono font-bold mt-2">
                {stats ? formatCurrency(stats.paid_last_30_days) : "SYP 0"}
              </p>
              <p
                className={`text-sm font-mono mt-1 ${
                  stats && stats.payout_growth_percent >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stats ? formatGrowth(stats.payout_growth_percent) : "+0.0%"}
              </p>
            </>
          )}
        </div>

        {/* Next Payout Card */}
        <div className="border border-black p-4">
          <p className="text-sm text-gray-600">{t("finance.payouts.stats.nextPayout")}</p>
          {statsLoading ? (
            <p className="text-2xl font-mono font-bold mt-2">{t("finance.payouts.stats.loading")}</p>
          ) : stats?.next_payout ? (
            <>
              <p className="text-2xl font-mono font-bold mt-2">
                {formatCurrency(stats.next_payout.amount)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(stats.next_payout.scheduled_for).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-600 mt-2">{t("finance.payouts.stats.noPendingPayouts")}</p>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payouts List (Left Column) */}
        <div className="border border-black">
          <div className="p-4 border-b border-black">
            <h2 className="text-lg font-bold">{t("finance.payouts.payoutsList.title")}</h2>
          </div>
          <div className="p-4 space-y-4">
            {payoutsLoading ? (
              <p className="text-center py-8">{t("finance.payouts.payoutsList.loading")}</p>
            ) : (payouts?.results?.length ?? 0) > 0 ? (
              payouts.results.map((payout) => (
                <div
                  key={payout.id}
                  className="border border-black p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono font-bold text-lg">
                        {formatCurrency(payout.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("finance.payouts.payoutsList.scheduled")}:{" "}
                        {new Date(payout.scheduled_for).toLocaleDateString()}
                      </p>
                      {payout.completed_at && (
                        <p className="text-sm text-gray-600">
                          {t("finance.payouts.payoutsList.completed")}:{" "}
                          {new Date(payout.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 border text-xs font-mono ${getPayoutStatusColor(
                        payout.status,
                      )}`}
                    >
                      {payout.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-600">{t("finance.payouts.payoutsList.noPayouts")}</p>
            )}
          </div>
        </div>

        {/* Bank Accounts List (Right Column) */}
        <div className="border border-black">
          <div className="p-4 border-b border-black">
            <h2 className="text-lg font-bold">{t("finance.payouts.bankAccounts.title")}</h2>
          </div>
          <div className="p-4 space-y-4">
            {bankAccountsLoading ? (
              <p className="text-center py-8">{t("finance.payouts.bankAccounts.loading")}</p>
            ) : (bankAccounts?.results?.length ?? 0) > 0 ? (
              bankAccounts.results.map((account) => (
                <div
                  key={account.id}
                  className="border border-black p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold">{account.bank_name}</p>
                      <p className="text-sm text-gray-600">
                        {account.account_holder_name}
                      </p>
                      <p className="text-sm font-mono text-gray-600">
                        {account.account_type.replace("_", " ")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {account.is_verified && (
                        <Badge variant="default">{t("finance.payouts.bankAccounts.verified")}</Badge>
                      )}
                      {account.is_active && (
                        <Badge variant="secondary">{t("finance.payouts.bankAccounts.active")}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-600">
                {t("finance.payouts.bankAccounts.noAccounts")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
