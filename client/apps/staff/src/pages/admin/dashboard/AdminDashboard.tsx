import DashboardLayout from "../../dashboard/layout";

export function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System administration and management overview
          </p>
        </div>

        {/* Placeholder content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Total Users
            </h3>
            <p className="text-2xl font-bold mt-2">Coming Soon</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              System Health
            </h3>
            <p className="text-2xl font-bold mt-2">Coming Soon</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Active Sessions
            </h3>
            <p className="text-2xl font-bold mt-2">Coming Soon</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground">
              Revenue
            </h3>
            <p className="text-2xl font-bold mt-2">Coming Soon</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Admin Features</h2>
          <p className="text-muted-foreground mb-4">
            This admin dashboard is a placeholder. Future features will include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>User management and role assignments</li>
            <li>System configuration and settings</li>
            <li>Payment provider management</li>
            <li>Analytics and reporting</li>
            <li>Audit logs and activity monitoring</li>
            <li>Manager oversight and performance metrics</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
