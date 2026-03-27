import { useQuery } from "@tanstack/react-query";
import { Download, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/ui/components/button";
import { fetchDashboardMetrics, fetchLatestActivity } from "./api";
import { MetricsGrid } from "./MetricsGrid";
import { ActivityDataTable } from "./data-table";
import DashboardLayout from "../layout";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrentDate(): string {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const month = now.toLocaleDateString("en-US", { month: "short" });
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;

  return `${dayName}, ${month} ${day} • ${hour12}:${minutes} ${ampm}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardHome() {
  const { t } = useTranslation();
  
  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
  });

  // Fetch latest activity (recent bookings)
  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["latest-activity"],
    queryFn: () => fetchLatestActivity({ page_size: 10 }),
  });

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-black bg-white shrink-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter uppercase leading-none">
              {t("dashboardHome.header.title")}
            </h2>
            <p className="font-mono text-[10px] text-gray-500 mt-1 uppercase">
              {formatCurrentDate()}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 border-black hover:bg-black hover:text-white transition-colors text-xs font-bold uppercase tracking-wide"
            >
              <Download size={16} className="mr-2" />
              {t("dashboardHome.header.exportReport")}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 border-black hover:bg-gray-100"
            >
              <Bell size={18} />
            </Button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Metrics Grid */}
          <MetricsGrid metrics={metrics} isLoading={metricsLoading} />

          {/* Activity Table */}
          <ActivityDataTable
            data={activity?.results ?? []}
            isLoading={activityLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
