import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
          Payment Methods
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Connect and manage your payment accounts for receiving transfers
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
        <h3 className="text-lg font-medium">Coming Soon</h3>

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
                    QNB Direct Transfer
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Receive payments directly to your QNB account
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-neutral-300 text-neutral-600"
              >
                Coming Soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600">
            <p>
              Manual payout system for QNB accounts will be available in a
              future update.
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
                  <CardTitle className="text-base">Visa / Mastercard</CardTitle>
                  <CardDescription className="text-xs">
                    Receive payments to your debit card
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-neutral-300 text-neutral-600"
              >
                Coming Soon
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-neutral-600">
            <p>Direct card transfers will be available in a future update.</p>
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
