import { useFormContext, useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { SectionHeading } from "./SectionHeading";
import type { RoomFormState } from "../../pages/dashboard/rooms/[id]/SpecificRoom";

interface StepperProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

function Stepper({ label, value, min = 1, max = 99, onChange }: StepperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label-caps">{label}</label>
      <div
        className="flex items-center h-10"
        style={{ border: "1px solid var(--border)" }}
      >
        <Button
          type="button"
          variant="ghost"
          className="h-full w-10 shrink-0 flex items-center justify-center"
          style={{
            borderInlineEnd: "1px solid var(--border)",
            borderRadius: 0,
          }}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus size={14} strokeWidth={1.5} />
        </Button>
        <span
          className="flex-1 text-center text-sm font-semibold tabular-nums"
          style={{ color: "var(--foreground)" }}
        >
          {value}
        </span>
        <Button
          type="button"
          variant="ghost"
          className="h-full w-10 shrink-0 flex items-center justify-center"
          style={{
            borderInlineStart: "1px solid var(--border)",
            borderRadius: 0,
          }}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}

export function OccupancySection() {
  const { t } = useTranslation();
  const { register } = useFormContext<RoomFormState>();

  const { field: capacityField } = useController<RoomFormState, "capacity">({
    name: "capacity",
  });
  const { field: bedroomsField } = useController<RoomFormState, "bedrooms">({
    name: "bedrooms",
  });

  return (
    <section>
      <SectionHeading>{t("room.section.occupancyRate")}</SectionHeading>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <Stepper
          label={t("room.field.maxGuests")}
          value={capacityField.value}
          min={1}
          max={20}
          onChange={capacityField.onChange}
        />

        <Stepper
          label={t("room.field.bedrooms")}
          value={bedroomsField.value}
          min={0}
          max={20}
          onChange={bedroomsField.onChange}
        />

        {/* Base nightly rate — USD prefix */}
        <div className="flex flex-col gap-1.5">
          <label className="label-caps">
            {t("room.field.baseNightlyRate")}
          </label>
          <div
            className="flex items-center h-10"
            style={{ border: "1px solid var(--border)" }}
          >
            <span
              className="px-3 text-xs font-semibold shrink-0"
              style={{
                borderInlineEnd: "1px solid var(--border)",
                color: "var(--muted-foreground)",
                height: "100%",
                display: "flex",
                alignItems: "center",
              }}
            >
              USD
            </span>
            <Input
              type="number"
              min={0}
              step="0.01"
              {...register("base_price_per_night")}
              className="border-0 shadow-none focus-visible:ring-0 h-full flex-1 font-semibold tabular-nums"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
