/**
 * Settings page — /dashboard/settings
 *
 * User profile editing and Telegram integration management.
 *
 * Features:
 * - Edit user profile (first_name, last_name, phone_number, email)
 * - Telegram integration toggle with QR code dialog
 * - Neo-Swiss minimalist design matching Stitch design
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import {
  userProfileSchema,
  type UserProfileFormState,
  generateTelegramBotLink,
} from "./schema";
import {
  getUserProfile,
  updateUserProfile,
  registerTelegram,
  disconnectTelegram,
} from "./api";
import { useTelegramConnectionPolling } from "./useTelegramConnectionPolling";
import DashboardLayout from "../dashboard/layout";

// ─── FieldError ────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      className="font-mono text-[10px] uppercase tracking-widest mt-1"
      style={{ color: "var(--destructive, #ef4444)" }}
    >
      {message}
    </p>
  );
}

// ─── FieldLabel ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label
      className="block text-[12px] font-bold uppercase tracking-wider"
      style={{ color: "var(--muted-foreground)" }}
    >
      {children}
    </Label>
  );
}

// ─── Dialog State Type ─────────────────────────────────────────────────────

type DialogState = "waiting" | "success" | "timeout";

// ─── Constants ─────────────────────────────────────────────────────────────

const TELEGRAM_BOT_USERNAME = "al_wadi_reservation_system_bot";
const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ─── SettingsPage ──────────────────────────────────────────────────────────

export function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isTelegramDialogOpen, setIsTelegramDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>("waiting");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  // Form setup with default values from profile
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UserProfileFormState>({
    resolver: zodResolver(userProfileSchema),
    values: profile
      ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          email: profile.email || "",
        }
      : undefined,
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (payload: Partial<UserProfileFormState>) =>
      updateUserProfile(payload),
    onSuccess: (updatedProfile) => {
      toast.success(t("settings.toast.profileUpdated"));
      queryClient.setQueryData(["userProfile"], updatedProfile);
      reset(updatedProfile);
    },
    onError: () => {
      toast.error(t("settings.toast.profileUpdateFailed"));
    },
  });

  // Disconnect Telegram mutation
  const disconnectMutation = useMutation({
    mutationFn: disconnectTelegram,
    onSuccess: () => {
      toast.success(t("settings.toast.telegramDisconnected"));
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
    onError: () => {
      toast.error(t("settings.toast.telegramDisconnectFailed"));
    },
  });

  // Handle successful connection
  const handleConnectionSuccess = useCallback(() => {
    setDialogState("success");
    toast.success(t("settings.toast.telegramConnected"));

    // Clear timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    // Auto-close dialog after 2 seconds
    setTimeout(() => {
      setIsTelegramDialogOpen(false);
    }, 2000);
  }, [timeoutId, t]);

  // Polling hook - only active when dialog is open and in waiting state
  useTelegramConnectionPolling(
    isTelegramDialogOpen && dialogState === "waiting",
    handleConnectionSuccess
  );

  // Setup timeout when dialog opens
  useEffect(() => {
    if (isTelegramDialogOpen && dialogState === "waiting") {
      const id = setTimeout(() => {
        setDialogState("timeout");
        toast.error(t("settings.toast.connectionTimeout"));
      }, TIMEOUT_MS);
      setTimeoutId(id);

      return () => {
        clearTimeout(id);
      };
    }
  }, [isTelegramDialogOpen, dialogState, t]);

  // Reset dialog state when closed
  useEffect(() => {
    if (!isTelegramDialogOpen) {
      setDialogState("waiting");
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    }
  }, [isTelegramDialogOpen, timeoutId]);

  function onSubmit(data: UserProfileFormState) {
    updateMutation.mutate(data);
  }

  function handleTelegramToggle(checked: boolean) {
    if (checked) {
      // User wants to connect — open dialog
      setDialogState("waiting");
      setIsTelegramDialogOpen(true);
    } else {
      // User wants to disconnect
      disconnectMutation.mutate();
    }
  }

  function handleRetry() {
    setDialogState("waiting");
  }

  const isTelegramConnected = !!profile?.telegram_chat_id;
  const inputCls =
    "rounded-none font-mono text-sm border-black focus:border-black focus:ring-0 focus:shadow-none";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="font-mono text-sm text-muted-foreground">{t("settings.loading")}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="flex flex-col flex-1 min-h-0 overflow-y-auto"
        style={{ background: "var(--card)" }}
      >
        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main className="p-8 lg:p-12 z-10">
          <div className="max-w-[800px] mx-auto flex flex-col gap-12">
            {/* ── Header ────────────────────────────────────────────────── */}
            <header
              className="flex flex-col gap-2 pb-6"
              style={{ borderBottom: "1px solid var(--foreground)" }}
            >
              <div className="flex items-center gap-2 font-mono text-xs mb-1">
                <span style={{ color: "var(--muted-foreground)" }}>{t("settings.breadcrumb.system")}</span>
                <span style={{ color: "var(--muted-foreground)" }}>/</span>
                <span style={{ color: "var(--foreground)" }}>{t("settings.breadcrumb.settings")}</span>
              </div>
              <h2
                className="text-4xl font-black uppercase tracking-tighter"
                style={{ color: "var(--foreground)" }}
              >
                {t("settings.header.title")}
              </h2>
            </header>

            {/* ── User Profile Form ─────────────────────────────────────── */}
            <section>
              <h3
                className="text-lg font-bold uppercase tracking-tight mb-6"
                style={{ color: "var(--foreground)" }}
              >
                {t("settings.userProfile.title")}
              </h3>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="flex flex-col gap-2">
                    <FieldLabel>{t("settings.userProfile.firstName")}</FieldLabel>
                    <Input
                      {...register("first_name")}
                      placeholder={t("settings.userProfile.firstNamePlaceholder")}
                      aria-invalid={!!errors.first_name}
                      className={inputCls}
                      style={{
                        padding: "0.75rem",
                        borderColor: "var(--foreground)",
                      }}
                    />
                    <FieldError message={errors.first_name?.message} />
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col gap-2">
                    <FieldLabel>{t("settings.userProfile.lastName")}</FieldLabel>
                    <Input
                      {...register("last_name")}
                      placeholder={t("settings.userProfile.lastNamePlaceholder")}
                      aria-invalid={!!errors.last_name}
                      className={inputCls}
                      style={{
                        padding: "0.75rem",
                        borderColor: "var(--foreground)",
                      }}
                    />
                    <FieldError message={errors.last_name?.message} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Phone Number */}
                  <div className="flex flex-col gap-2">
                    <FieldLabel>{t("settings.userProfile.phoneNumber")}</FieldLabel>
                    <Input
                      {...register("phone_number")}
                      placeholder={t("settings.userProfile.phoneNumberPlaceholder")}
                      aria-invalid={!!errors.phone_number}
                      className={inputCls}
                      style={{
                        padding: "0.75rem",
                        borderColor: "var(--foreground)",
                      }}
                    />
                    <FieldError message={errors.phone_number?.message} />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-2">
                    <FieldLabel>{t("settings.userProfile.email")}</FieldLabel>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder={t("settings.userProfile.emailPlaceholder")}
                      aria-invalid={!!errors.email}
                      className={inputCls}
                      style={{
                        padding: "0.75rem",
                        borderColor: "var(--foreground)",
                      }}
                    />
                    <FieldError message={errors.email?.message} />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={!isDirty || updateMutation.isPending}
                    className="h-10 px-6 rounded-none font-mono text-xs font-bold uppercase tracking-wider"
                  >
                    {updateMutation.isPending ? t("settings.userProfile.saving") : t("settings.userProfile.saveChanges")}
                  </Button>
                </div>
              </form>
            </section>

            {/* ── Telegram Integration Card ─────────────────────────────── */}
            <section className="flex flex-col gap-6">
              <div
                className="flex items-start justify-between p-6 bg-white"
                style={{
                  border: "1px solid var(--foreground)",
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                <div className="flex gap-6">
                  <div
                    className="p-3 h-fit"
                    style={{
                      background: "var(--surface, #F4F4F4)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-8 h-8"
                      style={{ color: "var(--accent, #0a38c2)" }}
                    >
                      <path d="m22 2-7 20-4-9-9-4Z" />
                      <path d="M22 2 11 13" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-2 max-w-md">
                    <h3
                      className="text-lg font-bold uppercase tracking-tight"
                      style={{ color: "var(--foreground)" }}
                    >
                      {t("settings.telegram.title")}
                    </h3>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {t("settings.telegram.description")}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {isTelegramConnected ? (
                        <>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#00C853" }}
                          />
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {t("settings.telegram.statusConnected")}
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: "#FF3D00" }}
                          />
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {t("settings.telegram.statusDisconnected")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isTelegramConnected}
                  onCheckedChange={handleTelegramToggle}
                  disabled={disconnectMutation.isPending}
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ── Telegram QR Code Dialog ──────────────────────────────────────── */}
      <Dialog
        open={isTelegramDialogOpen}
        onOpenChange={setIsTelegramDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold uppercase tracking-tight">
              {t("settings.telegramDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {dialogState === "waiting" &&
                t("settings.telegramDialog.descriptionWaiting")}
              {dialogState === "success" &&
                t("settings.telegramDialog.descriptionSuccess")}
              {dialogState === "timeout" &&
                t("settings.telegramDialog.descriptionTimeout")}
            </DialogDescription>
          </DialogHeader>

          {/* ── Waiting State ───────────────────────────────────────────── */}
          {dialogState === "waiting" && profile && (
            <div className="flex flex-col items-center gap-6 py-4">
              {/* QR Code */}
              <div
                className="p-4 bg-white"
                style={{
                  border: "2px solid var(--border)",
                }}
              >
                <QRCodeSVG
                  value={generateTelegramBotLink(
                    TELEGRAM_BOT_USERNAME,
                    profile.id
                  )}
                  size={256}
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Bot Link */}
              <div className="flex flex-col items-center gap-2 w-full">
                <p className="text-xs font-mono uppercase text-muted-foreground">
                  {t("settings.telegramDialog.orOpenLink")}
                </p>
                <a
                  href={generateTelegramBotLink(
                    TELEGRAM_BOT_USERNAME,
                    profile.id
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono underline break-all text-center px-4"
                  style={{ color: "var(--accent, #0a38c2)" }}
                >
                  https://t.me/{TELEGRAM_BOT_USERNAME}?start={profile.id}
                </a>
              </div>

              {/* Waiting Indicator */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs font-mono uppercase">
                  {t("settings.telegramDialog.waitingForConnection")}
                </span>
              </div>

              {/* Instructions */}
              <div
                className="w-full p-4"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                }}
              >
                <p className="text-xs font-mono leading-relaxed">
                  <strong>{t("settings.telegramDialog.instructionsTitle")}</strong>
                  <br />
                  {t("settings.telegramDialog.instruction1")}
                  <br />
                  {t("settings.telegramDialog.instruction2")}
                  <br />
                  {t("settings.telegramDialog.instruction3")}
                  <br />
                  {t("settings.telegramDialog.instruction4")}
                </p>
              </div>

              {/* Cancel Button */}
              <Button
                onClick={() => setIsTelegramDialogOpen(false)}
                className="w-full h-10 rounded-none font-mono text-xs font-bold uppercase tracking-wider"
                variant="outline"
              >
                {t("settings.telegramDialog.cancel")}
              </Button>
            </div>
          )}

          {/* ── Success State ────────────────────────────────────────────── */}
          {dialogState === "success" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <CheckCircle2
                className="w-16 h-16"
                style={{ color: "#00C853" }}
              />
              <p className="text-lg font-bold uppercase tracking-tight text-center">
                {t("settings.telegramDialog.successTitle")}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {t("settings.telegramDialog.successMessage")}
              </p>
            </div>
          )}

          {/* ── Timeout State ─────────────────────────────────────────────── */}
          {dialogState === "timeout" && (
            <div className="flex flex-col items-center gap-6 py-8">
              <XCircle className="w-16 h-16" style={{ color: "#FF3D00" }} />
              <p className="text-lg font-bold uppercase tracking-tight text-center">
                {t("settings.telegramDialog.timeoutTitle")}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                {t("settings.telegramDialog.timeoutMessage")}
              </p>
              <div className="flex gap-3 w-full">
                <Button
                  onClick={handleRetry}
                  className="flex-1 h-10 rounded-none font-mono text-xs font-bold uppercase tracking-wider"
                >
                  {t("settings.telegramDialog.retry")}
                </Button>
                <Button
                  onClick={() => setIsTelegramDialogOpen(false)}
                  className="flex-1 h-10 rounded-none font-mono text-xs font-bold uppercase tracking-wider"
                  variant="outline"
                >
                  {t("settings.telegramDialog.close")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
