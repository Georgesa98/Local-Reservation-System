import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import type { StripeConnectStatus } from "../../pages/dashboard/finance/types";

interface StripeConnectCardProps {
  status: StripeConnectStatus | undefined;
  isLoading: boolean;
  onStartOnboarding: () => void;
  onViewDashboard: () => void;
}

export function StripeConnectCard({
  status,
  isLoading,
  onStartOnboarding,
  onViewDashboard,
}: StripeConnectCardProps) {
  if (isLoading) {
    return (
      <div className="border border-black p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 animate-pulse w-48" />
            <div className="h-4 bg-gray-200 animate-pulse w-64" />
          </div>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!status?.has_account || !status?.onboarding_complete) {
    return (
      <div className="border border-black p-6">
        <div className="flex items-start gap-4">
          {/* Stripe Logo Placeholder */}
          <div className="w-12 h-12 bg-black flex items-center justify-center text-white font-bold text-xl">
            S
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold">Stripe Connect Express</h3>
                <Badge
                  variant="secondary"
                  className="border border-yellow-600 bg-yellow-50 text-yellow-800"
                >
                  SETUP REQUIRED
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Get paid instantly after each booking. Stripe handles all
                payment processing and transfers funds directly to your bank
                account.
              </p>
            </div>

            <div className="border-t border-black pt-4 space-y-2">
              <p className="text-sm font-bold">Benefits:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Instant transfers after guest payment</li>
                <li>✓ Secure payment processing</li>
                <li>✓ Manage payouts from Stripe dashboard</li>
                <li>✓ Platform fee: 10% per booking</li>
              </ul>
            </div>

            <Button onClick={onStartOnboarding} className="w-full sm:w-auto">
              Complete Stripe Setup →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Connected but needs action
  const hasRequirements =
    status.requirements?.currently_due?.length ||
    status.requirements?.past_due?.length;

  if (hasRequirements) {
    return (
      <div className="border border-red-600 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-600 flex items-center justify-center text-white font-bold text-xl">
            !
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-red-900">
                  Stripe Connect Express
                </h3>
                <Badge variant="destructive">ACTION REQUIRED</Badge>
              </div>
              <p className="text-sm text-red-700 mt-2">
                Stripe needs additional information to keep your account active.
              </p>
            </div>

            {(status.requirements?.currently_due?.length ?? 0) > 0 && (
              <div className="border-t border-red-600 pt-4">
                <p className="text-sm font-bold text-red-900 mb-2">
                  Required actions:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {status.requirements?.currently_due?.map((req) => (
                    <li key={req}>• {formatRequirement(req)}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={onStartOnboarding} variant="destructive">
              Resolve Issues →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fully connected and active
  return (
    <div className="border border-green-600 bg-green-50 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-green-600 flex items-center justify-center text-white font-bold text-xl">
          ✓
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-green-900">
                Stripe Connect Express
              </h3>
              <Badge
                variant="default"
                className="border border-green-600 bg-green-100 text-green-800"
              >
                ACTIVE
              </Badge>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Your account is fully active and ready to receive payments.
            </p>
          </div>

          <div className="border-t border-green-600 pt-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="font-bold text-green-900">Account ID</dt>
                <dd className="font-mono text-green-700 mt-1">
                  {status.account_id}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-green-900">Capabilities</dt>
                <dd className="text-green-700 mt-1 space-y-1">
                  <div>
                    {status.charges_enabled ? "✓" : "✗"} Accept card payments
                  </div>
                  <div>
                    {status.payouts_enabled ? "✓" : "✗"} Receive payouts
                  </div>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-green-900">Platform Fee</dt>
                <dd className="text-green-700 mt-1">10% per booking</dd>
              </div>
              <div>
                <dt className="font-bold text-green-900">Transfer Timing</dt>
                <dd className="text-green-700 mt-1">
                  Instant (after guest payment)
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onViewDashboard} variant="secondary">
              View Stripe Dashboard →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to format requirement field names
function formatRequirement(req: string): string {
  return (
    req
      .split(".")
      .pop()
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()) ?? req
  );
}
