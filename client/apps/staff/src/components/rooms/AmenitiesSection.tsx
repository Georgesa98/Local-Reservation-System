import { useState } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import type { RoomFormState } from "../../pages/dashboard/rooms/[id]/SpecificRoom";

const ALL_AMENITIES = [
  "WIFI",
  "KITCHEN",
  "WORKSPACE",
  "PARKING",
  "GYM",
  "WASHER",
  "AC",
  "TV",
  "POOL",
  "DRYER",
  "HEATING",
  "BREAKFAST",
] as const;

export function AmenitiesSection() {
  const { t } = useTranslation();
  const [addOpen, setAddOpen] = useState(false);

  const { field } = useController<RoomFormState, "services">({
    name: "services",
  });

  const services: string[] = field.value;
  const selected = new Set(services.map((s) => s.toUpperCase()));

  function toggle(amenity: string) {
    const upper = amenity.toUpperCase();
    if (selected.has(upper)) {
      field.onChange(services.filter((s) => s.toUpperCase() !== upper));
    } else {
      field.onChange([...services, upper]);
    }
  }

  return (
    <section>
      <SectionHeading>{t("room.section.amenities")}</SectionHeading>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* Selected amenities — filled black */}
        {services.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggle(s)}
            className="label-caps px-3 py-1.5 transition-colors"
            style={{
              background: "var(--foreground)",
              color: "var(--primary-foreground)",
              border: "1px solid var(--foreground)",
            }}
          >
            {s.toUpperCase()}
          </button>
        ))}

        {/* + ADD — dashed outline button that opens inline picker */}
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          className="label-caps px-3 py-1.5 flex items-center gap-1 transition-colors"
          style={{
            border: "1px dashed var(--border)",
            color: "var(--muted-foreground)",
            background: "transparent",
          }}
        >
          <Plus size={10} strokeWidth={2} />
          {t("room.amenities.add")}
        </button>
      </div>

      {/* Inline amenity picker — shown when addOpen */}
      {addOpen && (
        <div
          className="mt-3 p-3 flex flex-wrap gap-2"
          style={{
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
        >
          {ALL_AMENITIES.filter((a) => !selected.has(a)).map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggle(amenity)}
              className="label-caps px-3 py-1.5 transition-colors hover:opacity-70"
              style={{
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                background: "transparent",
              }}
            >
              {amenity}
            </button>
          ))}
          {ALL_AMENITIES.every((a) => selected.has(a)) && (
            <span
              className="label-caps"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t("room.amenities.allAdded")}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
