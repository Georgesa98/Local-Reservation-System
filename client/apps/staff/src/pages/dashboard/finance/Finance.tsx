import { useState } from "react";
import { CommissionTab } from "../../../components/finance/CommissionTab";
import { PayoutTab } from "../../../components/finance/PayoutTab";
import { PaymentMethodsTab } from "../../../components/finance/PaymentMethodsTab";
import DashboardLayout from "../layout";

type TabType = "commissions" | "payouts" | "payment-methods";

export function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("commissions");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" style={{ background: "var(--card)" }}>
        {/* Header */}
        <div className="border-b border-black pb-4">
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-gray-600 mt-1">
            Manage commissions, payouts, and payment methods
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
              Commissions
            </button>
            <button
              onClick={() => setActiveTab("payouts")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "payouts"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Payouts & Banks
            </button>
            <button
              onClick={() => setActiveTab("payment-methods")}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === "payment-methods"
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Payment Methods
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
