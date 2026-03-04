import { LayoutGrid } from "lucide-react";
import { SidebarHeader } from "@workspace/ui/components/sidebar";

export default function SidebarLogo() {
  return (
    <SidebarHeader className="px-4 py-5 border-b border-border">
      <div className="flex items-center gap-3">
        <LayoutGrid className="size-6 shrink-0" strokeWidth={2} />
        <span className="text-xl font-bold tracking-tight">GRID/OS</span>
      </div>
    </SidebarHeader>
  );
}
