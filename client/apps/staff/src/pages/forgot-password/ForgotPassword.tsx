import { ForgotPasswordForm } from "./forgot-password-form";
import LangToggle from "../../components/LangToggle";

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
