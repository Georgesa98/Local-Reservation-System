import { LoginForm } from "./login-form";
import LangToggle from "../../components/LangToggle";

export function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="absolute top-4 end-4">
          <LangToggle />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
