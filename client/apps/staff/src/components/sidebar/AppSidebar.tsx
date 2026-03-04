import { useTranslation } from "react-i18next";
import { Sidebar } from "@workspace/ui/components/sidebar";
import SidebarLogo from "./SidebarLogo";
import SidebarNav from "./SidebarNav";
import SidebarUserFooter from "./SidebarUserFooter";

export default function AppSidebar() {
  const { i18n } = useTranslation();
  const side = i18n.language === "ar" ? "right" : "left";

  return (
    <Sidebar side={side}>
      <SidebarLogo />
      <SidebarNav />
      <SidebarUserFooter />
    </Sidebar>
  );
}
