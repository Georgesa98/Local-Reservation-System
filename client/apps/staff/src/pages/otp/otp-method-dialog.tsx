import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { MessageCircle, Mail, Send, ExternalLink } from "lucide-react"
import type { OtpChannel } from "./api"
import { useTranslation } from "react-i18next"

interface OtpMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentChannel: OtpChannel
  hasEmail: boolean
  hasTelegram: boolean
  onSelectChannel: (channel: OtpChannel) => void
}

const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined
const telegramBotLink = telegramBotUsername
  ? `https://t.me/${telegramBotUsername}?start=link`
  : undefined

const channelIcons: Record<OtpChannel, React.ReactNode> = {
  whatsapp: <MessageCircle className="size-5 text-green-500" />,
  email: <Mail className="size-5 text-blue-500" />,
  telegram: <Send className="size-5 text-sky-500" />,
}

export function OtpMethodDialog({
  open,
  onOpenChange,
  currentChannel,
  hasEmail,
  hasTelegram,
  onSelectChannel,
}: OtpMethodDialogProps) {
  const { t } = useTranslation()

  const methods: { channel: OtpChannel; available: boolean }[] = [
    { channel: "whatsapp", available: true },
    { channel: "email", available: hasEmail },
    { channel: "telegram", available: hasTelegram },
  ]

  function handleSelect(channel: OtpChannel, available: boolean) {
    if (!available || channel === currentChannel) return
    onSelectChannel(channel)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("otpDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("otpDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {methods.map(({ channel, available }) => {
            const isCurrent = channel === currentChannel
            const isTelegramUnlinked = channel === "telegram" && !available

            const label = t(`otpDialog.${channel}.label`)
            const description = isTelegramUnlinked
              ? t("otpDialog.telegram.unlinked")
              : !available && channel === "email"
                ? t("otpDialog.email.unavailable")
                : t(`otpDialog.${channel}.description`)

            const rowContent = (
              <>
                {channelIcons[channel]}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {label}
                    {isCurrent && (
                      <span className="text-primary ml-2 text-xs font-normal">
                        {t("common.current")}
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">{description}</div>
                </div>
                {isTelegramUnlinked && telegramBotLink && (
                  <ExternalLink className="size-4 text-muted-foreground shrink-0" />
                )}
              </>
            )

            if (isTelegramUnlinked && telegramBotLink) {
              return (
                <a
                  key={channel}
                  href={telegramBotLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted cursor-pointer"
                >
                  {rowContent}
                </a>
              )
            }

            return (
              <button
                key={channel}
                type="button"
                disabled={!available}
                onClick={() => handleSelect(channel, available)}
                className={[
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  isCurrent
                    ? "border-primary bg-primary/5 cursor-default"
                    : available
                      ? "border-border hover:bg-muted cursor-pointer"
                      : "border-border bg-muted/40 cursor-not-allowed opacity-50",
                ].join(" ")}
              >
                {rowContent}
              </button>
            )
          })}
        </div>

        <DialogClose asChild>
          <Button variant="outline" className="w-full mt-1">
            {t("otpDialog.cancel")}
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
