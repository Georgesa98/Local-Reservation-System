/**
 * NewRoom page — /rooms/new
 *
 * Matches Stitch "Create New Listing (Redesigned)" design.
 * Layout:
 *   - Sticky header: breadcrumb left | Create Room right
 *   - Full-width white main area (no card wrapper), p-10
 *   - Three named sections: General Information / Occupancy & Base Rate /
 *     Description & Amenities — each with bold underlined h2
 *   - Visibility status toggle row (border-y)
 *   - Two-column footer info block
 *
 * Validated with Zod via zodResolver. All Shadcn components from @workspace/ui.
 */

import { useState, type KeyboardEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Switch } from "@workspace/ui/components/switch";
import { newRoomSchema, type NewRoomFormState } from "./schema";
import { createRoom } from "./api";
import DashboardLayout from "../../layout";
import type { NewRoomPayload } from "./types";

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

// ─── SectionHeading ────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-bold uppercase tracking-tight mb-6 pb-2"
      style={{
        color: "var(--foreground)",
        borderBottom: "1px solid var(--foreground)",
      }}
    >
      {children}
    </h2>
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

// ─── ServicesField ─────────────────────────────────────────────────────────

interface ServicesFieldProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}

function ServicesField({ value, onChange, placeholder }: ServicesFieldProps) {
  const [draft, setDraft] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toUpperCase();
    if (tag && !value.map((s) => s.toUpperCase()).includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((s) => s !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(draft);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2"
              style={{
                background: "var(--foreground)",
                color: "var(--primary-foreground)",
                border: "1px solid var(--foreground)",
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
                className="flex items-center opacity-70 hover:opacity-100 transition-opacity"
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="rounded-none font-mono text-sm p-4 border-black focus:border-black focus:ring-0"
        style={{ borderColor: "var(--foreground)" }}
      />
    </div>
  );
}

// ─── NewRoomPage ───────────────────────────────────────────────────────────

export function NewRoomPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NewRoomFormState>({
    resolver: zodResolver(newRoomSchema),
    defaultValues: {
      title: "",
      description: "",
      base_price_per_night: "",
      location: "",
      full_address: "",
      capacity: "",
      services: [],
      is_active: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: NewRoomPayload) => createRoom(payload),
    onSuccess: (room) => {
      toast.success(t("newRoom.toast.created"));
      navigate(`/rooms/${room.id}`);
    },
    onError: () => {
      toast.error(t("newRoom.toast.createFailed"));
    },
  });

  function onSubmit(data: NewRoomFormState) {
    const payload: NewRoomPayload = {
      title: data.title,
      description: data.description,
      base_price_per_night: data.base_price_per_night,
      location: data.location,
      full_address: data.full_address,
      capacity: parseInt(data.capacity, 10),
      services: data.services,
      is_active: data.is_active,
    };
    createMutation.mutate(payload);
  }

  const isPending = createMutation.isPending;

  // shared input className matching Stitch design
  const inputCls =
    "rounded-none font-mono text-sm border-black focus:border-black focus:ring-0 focus:shadow-none";

  return (
    <DashboardLayout>
      <div
        className="flex flex-col flex-1 min-h-0"
        style={{ background: "var(--card)" }}
      >
        {/* ── Sticky Header ───────────────────────────────────────────────── */}
        <header
          className="h-16 flex items-center justify-between px-8 sticky top-0 z-20"
          style={{
            background: "var(--card)",
            borderBottom: "1px solid var(--foreground)",
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/rooms")}
              className="font-bold text-[10px] uppercase tracking-widest transition-colors hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t("newRoom.breadcrumb.back")}
            </button>
            <div
              className="h-4 w-px mx-1"
              style={{ background: "var(--border)" }}
            />
            <span
              className="text-sm font-bold tracking-wide uppercase"
              style={{ color: "var(--foreground)" }}
            >
              {t("newRoom.breadcrumb.label")}
            </span>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-4">
            <Button
              type="submit"
              form="new-room-form"
              disabled={isPending}
              className="h-9 px-6 rounded-none font-mono text-xs font-bold uppercase tracking-wider"
            >
              {isPending ? t("room.loading") : t("newRoom.actions.submit")}
            </Button>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <main className="p-10 max-w-[1200px]">
          <form
            id="new-room-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-12"
          >
            {/* ── Section: General Information ─────────────────────────── */}
            <section>
              <SectionHeading>
                {t("newRoom.section.generalInfo")}
              </SectionHeading>
              <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                {/* Room Title — full width */}
                <div className="col-span-2 flex flex-col gap-2">
                  <FieldLabel>{t("newRoom.field.roomTitle")}</FieldLabel>
                  <Input
                    {...register("title")}
                    placeholder={t("newRoom.field.roomTitlePlaceholder")}
                    aria-invalid={!!errors.title}
                    className={inputCls}
                    style={{
                      padding: "1rem",
                      borderColor: "var(--foreground)",
                    }}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                {/* Location */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("newRoom.field.location")}</FieldLabel>
                  <Input
                    {...register("location")}
                    placeholder={t("newRoom.field.locationPlaceholder")}
                    aria-invalid={!!errors.location}
                    className={inputCls}
                    style={{
                      padding: "1rem",
                      borderColor: "var(--foreground)",
                    }}
                  />
                  <FieldError message={errors.location?.message} />
                </div>

                {/* Full Address */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("newRoom.field.fullAddress")}</FieldLabel>
                  <Input
                    {...register("full_address")}
                    placeholder={t("newRoom.field.fullAddressPlaceholder")}
                    aria-invalid={!!errors.full_address}
                    className={inputCls}
                    style={{
                      padding: "1rem",
                      borderColor: "var(--foreground)",
                    }}
                  />
                  <FieldError message={errors.full_address?.message} />
                </div>
              </div>
            </section>

            {/* ── Section: Occupancy & Base Rate ───────────────────────── */}
            <section>
              <SectionHeading>{t("newRoom.section.occupancy")}</SectionHeading>
              <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                {/* Capacity */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("newRoom.field.capacity")}</FieldLabel>
                  <div className="relative">
                    <Input
                      {...register("capacity")}
                      type="number"
                      min={1}
                      placeholder="2"
                      aria-invalid={!!errors.capacity}
                      className={inputCls + " pr-12"}
                      style={{
                        padding: "1rem",
                        borderColor: "var(--foreground)",
                      }}
                    />
                    <span
                      className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold uppercase"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      PAX
                    </span>
                  </div>
                  <FieldError message={errors.capacity?.message} />
                </div>

                {/* Base Price */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("newRoom.field.basePrice")}</FieldLabel>
                  <div className="relative">
                    <Input
                      {...register("base_price_per_night")}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="120.00"
                      aria-invalid={!!errors.base_price_per_night}
                      className={inputCls + " pr-12"}
                      style={{
                        padding: "1rem",
                        borderColor: "var(--foreground)",
                      }}
                    />
                    <span
                      className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] font-bold uppercase"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      EUR
                    </span>
                  </div>
                  <FieldError message={errors.base_price_per_night?.message} />
                </div>
              </div>
            </section>

            {/* ── Section: Description & Amenities ─────────────────────── */}
            <section>
              <SectionHeading>
                {t("newRoom.section.descriptionAmenities")}
              </SectionHeading>
              <div className="flex flex-col gap-8">
                {/* Description */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("newRoom.field.description")}</FieldLabel>
                  <Textarea
                    {...register("description")}
                    placeholder={t("newRoom.field.descriptionPlaceholder")}
                    rows={4}
                    aria-invalid={!!errors.description}
                    className="rounded-none font-mono text-sm leading-relaxed resize-none border-black focus:border-black focus:ring-0 focus:shadow-none"
                    style={{
                      padding: "1rem",
                      borderColor: "var(--foreground)",
                    }}
                  />
                  <FieldError message={errors.description?.message} />
                </div>

                {/* Services */}
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("newRoom.field.services")}</FieldLabel>
                  <Controller
                    name="services"
                    control={control}
                    render={({ field }) => (
                      <ServicesField
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t("newRoom.field.servicesPlaceholder")}
                      />
                    )}
                  />
                </div>
              </div>
            </section>

            {/* ── Section: Visibility Status ───────────────────────────── */}
            <section>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <div
                    className="flex items-center justify-between py-6"
                    style={{
                      borderTop: "1px solid var(--foreground)",
                      borderBottom: "1px solid var(--foreground)",
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <span
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: "var(--foreground)" }}
                      >
                        {t("newRoom.visibility.label")}
                      </span>
                      <span
                        className="font-mono text-[10px] uppercase mt-1"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {t("newRoom.visibility.hint")}
                      </span>
                    </div>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                )}
              />
            </section>

            {/* ── Footer Info ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-12 pt-8">
              <div>
                <h4
                  className="font-mono text-[10px] font-black uppercase tracking-widest mb-3 underline decoration-2"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("newRoom.footer.bestPracticeTitle")}
                </h4>
                <p
                  className="font-mono text-[10px] leading-relaxed uppercase tracking-tight"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("newRoom.footer.bestPracticeText")}
                </p>
              </div>
              <div
                className="pl-8"
                style={{ borderLeft: "1px solid var(--foreground)" }}
              >
                <h4
                  className="font-mono text-[10px] font-black uppercase tracking-widest mb-3"
                  style={{ color: "var(--foreground)" }}
                >
                  {t("newRoom.footer.supportTitle")}
                </h4>
                <p
                  className="font-mono text-[10px] leading-relaxed uppercase tracking-tight"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {t("newRoom.footer.supportText")}
                </p>
              </div>
            </div>
          </form>
        </main>
      </div>
    </DashboardLayout>
  );
}
