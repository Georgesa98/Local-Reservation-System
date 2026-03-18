/**
 * AvailabilityBlockForm — right column of the Availability tab.
 *
 * Renders:
 *   1. "New Block Exception" form — start date, end date, blocking reason
 *      (Select), internal notes (Textarea). Owns react-hook-form state and
 *      calls onSubmit with the validated payload.
 *   2. Stats strip — Total Blocked YTD / Availability Rate.
 *
 * Purely presentational for the stats; mutation pending state is passed in.
 * Accepts initialDate prop to pre-fill the form when clicking calendar dates.
 */

import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { format } from "date-fns";
import { CalendarOff } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import type { AvailabilityPayload, RoomAvailability } from "../../pages/dashboard/rooms/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvailabilityBlockFormProps {
  availabilities: RoomAvailability[];
  isPending: boolean;
  onSubmit: (data: AvailabilityPayload) => void;
  initialDate?: Date | null; // Pre-fill form with this date when calendar date is clicked
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcBlockedDaysYtd(availabilities: RoomAvailability[]): number {
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const yearEnd = new Date(new Date().getFullYear(), 11, 31);
  return availabilities.reduce((sum, a) => {
    const start = new Date(
      Math.max(new Date(a.start_date).getTime(), yearStart.getTime())
    );
    const end = new Date(
      Math.min(new Date(a.end_date).getTime(), yearEnd.getTime())
    );
    const days = Math.max(
      0,
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
    );
    return sum + days;
  }, 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvailabilityBlockForm({
  availabilities,
  isPending,
  onSubmit,
  initialDate,
}: AvailabilityBlockFormProps) {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AvailabilityPayload>({
    defaultValues: { reason: "maintenance", notes: "" },
  });

  // ── Pre-fill form when calendar date is clicked ─────────────────────────────

  useEffect(() => {
    if (initialDate) {
      const dateString = format(initialDate, "yyyy-MM-dd");
      setValue("start_date", dateString);
      setValue("end_date", dateString);
    }
  }, [initialDate, setValue]);

  function handleFormSubmit(data: AvailabilityPayload) {
    onSubmit(data);
    reset();
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const blockedDays = calcBlockedDaysYtd(availabilities);
  const availabilityRate = Math.max(
    0,
    parseFloat(((365 - blockedDays) / 365 * 100).toFixed(1))
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-10">
      {/* ── New Block Exception form ─────────────────────────────────────── */}
      <section
        className="p-8"
        style={{ border: "1px solid var(--foreground)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 mb-8 pb-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <CalendarOff
            size={20}
            strokeWidth={1.5}
            style={{ color: "var(--foreground)" }}
          />
          <h2
            className="font-mono text-sm font-bold uppercase tracking-widest"
            style={{ color: "var(--foreground)" }}
          >
            {t("room.availability.newBlock")}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-6"
        >
          {/* Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className="font-mono text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                {t("room.availability.form.startDate")}
              </Label>
              <Input
                type="date"
                {...register("start_date", { required: true })}
                aria-invalid={!!errors.start_date}
                className="rounded-none font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className="font-mono text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                {t("room.availability.form.endDate")}
              </Label>
              <Input
                type="date"
                {...register("end_date", { required: true })}
                aria-invalid={!!errors.end_date}
                className="rounded-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Blocking reason */}
          <div className="flex flex-col gap-1.5">
            <Label
              className="font-mono text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t("room.availability.form.blockingReason")}
            </Label>
            <Controller
              name="reason"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-none w-full font-mono text-sm uppercase tracking-widest h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">
                      {t("room.availability.reason.maintenance")}
                    </SelectItem>
                    <SelectItem value="personal_use">
                      {t("room.availability.reason.personal_use")}
                    </SelectItem>
                    <SelectItem value="other">
                      {t("room.availability.reason.other")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Internal notes */}
          <div className="flex flex-col gap-1.5">
            <Label
              className="font-mono text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t("room.availability.form.internalNotes")}
            </Label>
            <Textarea
              {...register("notes")}
              rows={4}
              placeholder={t("room.availability.form.notesPlaceholder")}
              className="rounded-none text-sm leading-relaxed resize-none"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] rounded-none"
          >
            {isPending
              ? t("room.loading")
              : t("room.availability.form.submit")}
          </Button>

          <p
            className="font-mono text-[10px] uppercase tracking-widest text-center leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.availability.syncNotice")}
          </p>
        </form>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-4">
        <StatBox
          label={t("room.availability.stats.totalBlockedYtd")}
          value={t("room.availability.stats.days", { count: blockedDays })}
        />
        <StatBox
          label={t("room.availability.stats.availabilityRate")}
          value={t("room.availability.stats.rate", { value: availabilityRate })}
        />
      </section>
    </div>
  );
}

// ─── StatBox ──────────────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-6 flex flex-col gap-1"
      style={{ border: "1px solid var(--foreground)" }}
    >
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
      <span
        className="text-3xl font-bold font-mono tracking-tighter"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}
