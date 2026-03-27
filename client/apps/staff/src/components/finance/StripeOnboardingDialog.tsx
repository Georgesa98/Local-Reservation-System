import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { startStripeOnboarding } from "../../pages/dashboard/finance/api";

interface StripeOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StripeOnboardingDialog({
  open,
  onOpenChange,
}: StripeOnboardingDialogProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const onboardingMutation = useMutation({
    mutationFn: startStripeOnboarding,
    onSuccess: (data) => {
      setHasStarted(true);
      // Open Stripe onboarding in new window
      window.open(data.data.onboarding_url, "_blank");
      // Invalidate status query so it refreshes when user returns
      queryClient.invalidateQueries({ queryKey: ["stripeConnectStatus"] });
    },
  });

  const handleClose = () => {
    setHasStarted(false);
    onOpenChange(false);
  };

  const handleStartOnboarding = () => {
    onboardingMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-black">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t("finance.stripeOnboarding.dialogTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-600">
            {t("finance.stripeOnboarding.dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!hasStarted ? (
            <>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{t("finance.stripeOnboarding.benefit1Title")}</p>
                    <p className="text-sm text-neutral-600">
                      {t("finance.stripeOnboarding.benefit1Description")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{t("finance.stripeOnboarding.benefit2Title")}</p>
                    <p className="text-sm text-neutral-600">
                      {t("finance.stripeOnboarding.benefit2Description")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{t("finance.stripeOnboarding.benefit3Title")}</p>
                    <p className="text-sm text-neutral-600">
                      {t("finance.stripeOnboarding.benefit3Description")}
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  {t("finance.stripeOnboarding.alertInfo")}
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900">
                <p className="font-medium mb-1">{t("finance.stripeOnboarding.alertSuccess")}</p>
                <p>
                  {t("finance.stripeOnboarding.alertSuccessDescription")}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {onboardingMutation.isError && (
            <Alert variant="destructive" className="border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t("finance.stripeOnboarding.alertError")}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {!hasStarted ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-black"
                disabled={onboardingMutation.isPending}
              >
                {t("finance.stripeOnboarding.cancelButton")}
              </Button>
              <Button
                onClick={handleStartOnboarding}
                disabled={onboardingMutation.isPending}
                className="bg-black text-white hover:bg-neutral-800"
              >
                {onboardingMutation.isPending ? (
                  t("finance.stripeOnboarding.startingButton")
                ) : (
                  <>
                    {t("finance.stripeOnboarding.continueButton")}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleClose}
              className="bg-black text-white hover:bg-neutral-800"
            >
              {t("finance.stripeOnboarding.doneButton")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
