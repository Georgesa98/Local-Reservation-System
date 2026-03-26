import { Building2, DoorOpen, CalendarCheck, DollarSign } from "lucide-react";
import { MetricsCard } from "./MetricsCard";
import type { DashboardMetrics } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: string): string {
  const num = parseFloat(amount);
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(1)}k`;
  }
  return `$${num.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MetricsGridProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
}

export function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-b border-black">
      {/* Total Rooms */}
      <MetricsCard
        label="Total Rooms"
        value={metrics?.total_rooms ?? 0}
        icon={<Building2 size={20} strokeWidth={1.5} />}
        growth={metrics?.total_rooms_growth}
        isLoading={isLoading}
      />

      {/* Active Rooms */}
      <MetricsCard
        label="Active Rooms"
        value={metrics?.active_rooms_percent ?? 0}
        suffix="%"
        icon={<DoorOpen size={20} strokeWidth={1.5} />}
        growth={metrics?.active_rooms_change}
        isLoading={isLoading}
      />

      {/* Today's Check-ins */}
      <MetricsCard
        label="Today's Check-ins"
        value={metrics?.todays_checkins ?? 0}
        icon={<CalendarCheck size={20} strokeWidth={1.5} />}
        growthLabel={
          metrics
            ? `PENDING: ${metrics.todays_checkins_pending}`
            : undefined
        }
        isLoading={isLoading}
      />

      {/* Pending Revenue */}
      <MetricsCard
        label="Pending Revenue"
        value={metrics ? formatCurrency(metrics.pending_revenue) : "$0"}
        icon={<DollarSign size={20} strokeWidth={1.5} />}
        growth={metrics?.pending_revenue_growth}
        isLoading={isLoading}
      />
    </div>
  );
}
