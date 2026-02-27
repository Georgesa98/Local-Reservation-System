import { LoginForm } from "./login-form";
import { useTranslation } from "react-i18next";

function LangToggle() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      {isAr ? "English" : "عربي"}
    </button>
  );
}

export function LoginPage() {
  return (
    <>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-end">
            <LangToggle />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/placeholder.svg"
            alt="Image"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </>
  );
}
