import { GalleryVerticalEnd } from "lucide-react";
import { useLocation, Navigate } from "react-router";
import { useState } from "react";
import { OtpForm } from "./otp-form";
import type { OtpChannel } from "./api";

export function OtpPage() {
  const location = useLocation()
  const phoneNumber: string = location.state?.phoneNumber ?? ""
  const hasEmail: boolean = location.state?.hasEmail ?? false
  const hasTelegram: boolean = location.state?.hasTelegram ?? false

  const [channel, setChannel] = useState<OtpChannel>("whatsapp")

  if (!phoneNumber) {
    return <Navigate to="/signup" replace />
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Acme Inc.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <OtpForm
              phoneNumber={phoneNumber}
              channel={channel}
              hasEmail={hasEmail}
              hasTelegram={hasTelegram}
              onChannelChange={setChannel}
            />
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
  );
}
