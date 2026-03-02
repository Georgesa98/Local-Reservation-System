import { ForgotPasswordForm } from "./forgot-password-form";
import { useTranslation } from "react-i18next";

function LangToggle() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-widest uppercase"
    >
      {isAr ? "English" : "عربي"}
    </button>
  );
}

export function ForgotPasswordPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="absolute top-4 end-4">
          <LangToggle />
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
