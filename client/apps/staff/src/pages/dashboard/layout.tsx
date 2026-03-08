import { SidebarProvider } from "@workspace/ui/components/sidebar";
import AppSidebar from "../../components/sidebar/AppSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="flex flex-1 w-full overflow-hidden">
      <AppSidebar />
      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {children}
      </main>
    </SidebarProvider>
  );
}
