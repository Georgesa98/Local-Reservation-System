import {
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import AppSidebar from "../../components/sidebar/AppSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>{children}</main>
    </SidebarProvider>
  );
}
