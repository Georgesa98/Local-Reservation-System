import { useTranslation } from "react-i18next";

interface LangToggleProps {
  className?: string;
}

export default function LangToggle({ className }: LangToggleProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
      className={`text-xs text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase ${className ?? ""}`}
    >
      {isAr ? "English" : "عربي"}
    </button>
  );
}
