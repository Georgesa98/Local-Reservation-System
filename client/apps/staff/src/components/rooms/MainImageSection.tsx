import { ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RoomImage } from "../../pages/dashboard/rooms/types";
import { SectionHeading } from "./SectionHeading";

interface MainImageSectionProps {
  images: RoomImage[];
  onManageAll: () => void;
}

export function MainImageSection({
  images,
  onManageAll,
}: MainImageSectionProps) {
  const { t } = useTranslation();

  const mainImage = images.find((img) => img.is_main) ?? images[0];
  // Thumbnails: all non-main images, up to 2
  const thumbnails = images.filter((img) => img !== mainImage).slice(0, 2);

  return (
    <section>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="auth-heading text-base">
          {t("room.section.mainImage")}
        </h2>
        <button
          type="button"
          onClick={onManageAll}
          className="label-caps transition-colors hover:opacity-70"
          style={{ color: "var(--primary)" }}
        >
          {t("room.manageAll")}
        </button>
      </div>
      <div
        className="w-full h-px mb-4"
        style={{ background: "var(--border)" }}
      />

      {/* Hero image */}
      {mainImage ? (
        <img
          src={mainImage.image}
          alt={mainImage.alt_text || t("room.mainImageAlt")}
          className="w-full object-cover"
          style={{ height: 200 }}
        />
      ) : (
        <div
          className="w-full flex items-center justify-center"
          style={{
            height: 200,
            background: "var(--muted)",
            border: "1px dashed var(--border)",
          }}
        >
          <ImageIcon size={32} style={{ color: "var(--muted-foreground)" }} />
        </div>
      )}

      {/* Thumbnail strip */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        {thumbnails.map((img) => (
          <img
            key={img.id}
            src={img.image}
            alt={img.alt_text}
            className="w-full object-cover"
            style={{ height: 80 }}
          />
        ))}

        {/* Fill remaining slots up to 3 — last slot is always "add" placeholder */}
        {Array.from({ length: Math.max(0, 2 - thumbnails.length) }).map(
          (_, i) => (
            <div
              key={`empty-${i}`}
              className="w-full"
              style={{ height: 80, background: "var(--muted)" }}
            />
          ),
        )}

        {/* Add placeholder */}
        <div
          className="w-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-70"
          style={{
            height: 80,
            border: "1px dashed var(--border)",
            background: "var(--card)",
          }}
          onClick={onManageAll}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onManageAll()}
          title={t("room.addImage")}
        >
          <ImageIcon size={20} style={{ color: "var(--muted-foreground)" }} />
        </div>
      </div>
    </section>
  );
}
