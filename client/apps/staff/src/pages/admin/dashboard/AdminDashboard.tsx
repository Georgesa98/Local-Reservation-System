import { useTranslation } from "react-i18next";
import DashboardLayout from "../../dashboard/layout";

export function AdminDashboardPage() {
  const { t } = useTranslation();
  
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("adminDashboard.header.title")}</h1>
          <p className="text-muted-foreground">
            {t("adminDashboard.header.subtitle")}
          </p>
        </div>

        {/* Placeholder content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("adminDashboard.stats.totalUsers")}
            </h3>
            <p className="text-2xl font-bold mt-2">{t("adminDashboard.comingSoon")}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("adminDashboard.stats.systemHealth")}
            </h3>
            <p className="text-2xl font-bold mt-2">{t("adminDashboard.comingSoon")}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("adminDashboard.stats.activeSessions")}
            </h3>
            <p className="text-2xl font-bold mt-2">{t("adminDashboard.comingSoon")}</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              {t("adminDashboard.stats.revenue")}
            </h3>
            <p className="text-2xl font-bold mt-2">{t("adminDashboard.comingSoon")}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">{t("adminDashboard.features.title")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("adminDashboard.features.description")}
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>{t("adminDashboard.features.userManagement")}</li>
            <li>{t("adminDashboard.features.systemConfig")}</li>
            <li>{t("adminDashboard.features.paymentProvider")}</li>
            <li>{t("adminDashboard.features.analytics")}</li>
            <li>{t("adminDashboard.features.auditLogs")}</li>
            <li>{t("adminDashboard.features.managerOversight")}</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
