import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { StripeConnectCard } from "./StripeConnectCard";
import { StripeOnboardingDialog } from "./StripeOnboardingDialog";
import { fetchStripeConnectStatus } from "../../pages/dashboard/finance/api";
import { CreditCard, Building2 } from "lucide-react";

export function PaymentMethodsTab() {
  const { t } = useTranslation();
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);

  // Fetch Stripe Connect status
  const { data: stripeStatus, isLoading: stripeLoading } = useQuery({
    queryKey: ["stripeConnectStatus"],
    queryFn: fetchStripeConnectStatus,
  });

  const handleViewDashboard = () => {
    // Opens the Stripe Express dashboard login link
    // In production, this would call an API to get the dashboard link
    window.open("https://dashboard.stripe.com/", "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("finance.paymentMethods.header.title")}
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          {t("finance.paymentMethods.header.subtitle")}
        </p>
      </div>

      {/* Stripe Connect */}
      <StripeConnectCard
        status={stripeStatus}
        isLoading={stripeLoading}
        onStartOnboarding={() => setShowOnboardingDialog(true)}
        onViewDashboard={handleViewDashboard}
      />

      {/* Coming Soon Providers */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">{t("finance.paymentMethods.comingSoon.title")}</h3>

        {/* QNB Card */}
        <Card className="border-black border-dashed opacity-60">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md border border-black bg-neutral-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {t("finance.paymentMethods.providers.qnb.title")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("finance.paymentMethods.providers.qnb.description")}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-neutral-300 text-neutral-600"
              >
                {t("finance.paymentMethods.comingSoon.badge")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600">
            <p>
              {t("finance.paymentMethods.providers.qnb.message")}
            </p>
          </CardContent>
        </Card>

        {/* Visa/Mastercard */}
        <Card className="border-black border-dashed opacity-60">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md border border-black bg-neutral-50 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-neutral-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{t("finance.paymentMethods.providers.card.title")}</CardTitle>
                  <CardDescription className="text-xs">
                    {t("finance.paymentMethods.providers.card.description")}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-neutral-300 text-neutral-600"
              >
                {t("finance.paymentMethods.comingSoon.badge")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600">
            <p>{t("finance.paymentMethods.providers.card.message")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Dialog */}
      <StripeOnboardingDialog
        open={showOnboardingDialog}
        onOpenChange={setShowOnboardingDialog}
      />
    </div>
  );
}
