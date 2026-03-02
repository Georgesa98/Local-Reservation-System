import { useLocation, Navigate } from "react-router";
import { useState } from "react";
import { OtpForm } from "./otp-form";
import type { OtpChannel } from "./api";
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

export function OtpPage() {
  const location = useLocation();
  const phoneNumber: string = location.state?.phoneNumber ?? "";
  const hasEmail: boolean = location.state?.hasEmail ?? false;
  const hasTelegram: boolean = location.state?.hasTelegram ?? false;

  const [channel, setChannel] = useState<OtpChannel>("whatsapp");

  if (!phoneNumber) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="absolute top-4 end-4">
          <LangToggle />
        </div>
        <OtpForm
          phoneNumber={phoneNumber}
          channel={channel}
          hasEmail={hasEmail}
          hasTelegram={hasTelegram}
          onChannelChange={setChannel}
        />
      </div>
    </div>
  );
}
