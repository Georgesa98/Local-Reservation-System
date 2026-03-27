import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CommissionTab } from "../../../components/finance/CommissionTab";
import { PayoutTab } from "../../../components/finance/PayoutTab";
import { PaymentMethodsTab } from "../../../components/finance/PaymentMethodsTab";
import DashboardLayout from "../layout";

type TabType = "commissions" | "payouts" | "payment-methods";

export function FinancePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("commissions");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" style={{ background: "var(--card)" }}>
        {/* Header */}
        <div className="border-b border-black pb-4">
          <h1 className="text-3xl font-bold">{t("finance.header.title")}</h1>
          <p className="text-gray-600 mt-1">
            {t("finance.header.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-black">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("commissions")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "commissions"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("finance.tabs.commissions")}
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "payouts"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("finance.tabs.payouts")}
            </button>
            <button
              onClick={() => setActiveTab("payment-methods")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "payment-methods"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t("finance.tabs.paymentMethods")}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "commissions" && <CommissionTab />}
          {activeTab === "payouts" && <PayoutTab />}
          {activeTab === "payment-methods" && <PaymentMethodsTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}
