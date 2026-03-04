import { SignupForm } from "./signup-form";
import LangToggle from "../../components/LangToggle";

export function SignupPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="absolute top-4 end-4">
          <LangToggle />
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
