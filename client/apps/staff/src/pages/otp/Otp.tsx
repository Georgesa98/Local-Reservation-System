import { useLocation, Navigate } from "react-router";
import { useState } from "react";
import { OtpForm } from "./otp-form";
import type { OtpChannel } from "./api";
import LangToggle from "../../components/LangToggle";

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
