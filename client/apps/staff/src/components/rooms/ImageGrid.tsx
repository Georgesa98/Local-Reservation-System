/**
 * ImageGrid — upload card + image cards for the Images tab.
 *
 * Purely presentational. All mutations and state live in ImageTabSection.
 * Each ImageCard handles its own hover state internally.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import type { RoomImage } from "../../pages/dashboard/rooms/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageGridProps {
  images: RoomImage[];
  isUploading: boolean;
  onUploadClick: () => void;
  onMakeMain: (imageId: number) => void;
  onDelete: (imageId: number) => void;
  isSettingMain: boolean;
  pendingDeleteId: number | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageGrid({
  images,
  isUploading,
  onUploadClick,
  onMakeMain,
  onDelete,
  isSettingMain,
  pendingDeleteId,
}: ImageGridProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* Upload card */}
      <button
        type="button"
        onClick={onUploadClick}
        disabled={isUploading}
        className="aspect-square flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-colors duration-200 hover:border-solid disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: "var(--border)",
          background: "transparent",
          cursor: isUploading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border)";
        }}
      >
        <Upload
          size={28}
          style={{ color: "var(--muted-foreground)" }}
          strokeWidth={1.5}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="label-caps" style={{ color: "var(--foreground)" }}>
            {t("room.images.uploadCard.label")}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            {isUploading ? t("room.loading") : t("room.images.uploadCard.hint")}
          </span>
        </div>
      </button>

      {/* Existing image cards */}
      {images.map((img) => (
        <ImageCard
          key={img.id}
          image={img}
          isSettingMain={isSettingMain}
          isDeleting={pendingDeleteId === img.id}
          onMakeMain={() => onMakeMain(img.id)}
          onDelete={() => onDelete(img.id)}
        />
      ))}
    </div>
  );
}

// ─── ImageCard ────────────────────────────────────────────────────────────────

interface ImageCardProps {
  image: RoomImage;
  isSettingMain: boolean;
  isDeleting: boolean;
  onMakeMain: () => void;
  onDelete: () => void;
}

function ImageCard({
  image,
  isSettingMain,
  isDeleting,
  onMakeMain,
  onDelete,
}: ImageCardProps) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative aspect-square overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image — grayscale default, colour on hover */}
      <img
        src={image.image}
        alt={image.alt_text || t("room.mainImageAlt")}
        className="w-full h-full object-cover transition-all duration-500"
        style={{ filter: hovered ? "grayscale(0)" : "grayscale(100%)" }}
      />

      {/* Main badge */}
      {image.is_main && (
        <Badge
          className="absolute top-0 left-0 font-mono text-[9px] uppercase tracking-widest rounded-none px-2 py-1"
          style={{
            background: "var(--foreground)",
            color: "var(--background)",
            border: "none",
          }}
        >
          {t("room.images.badge.main")}
        </Badge>
      )}

      {/* Hover overlay */}
      {hovered && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: "rgba(15, 23, 42, 0.80)" }}
        >
          {!image.is_main && (
            <Button
              type="button"
              onClick={onMakeMain}
              disabled={isSettingMain}
              className="w-40 font-mono text-[10px] uppercase tracking-widest rounded-none"
              style={{
                background: "var(--background)",
                color: "var(--foreground)",
              }}
            >
              {t("room.images.actions.makeMain")}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onDelete}
            disabled={isDeleting}
            className="w-40 font-mono text-[10px] uppercase tracking-widest rounded-none"
            style={{
              background: "transparent",
              color: "white",
              borderColor: "white",
            }}
          >
            {isDeleting ? "…" : t("room.images.actions.delete")}
          </Button>
        </div>
      )}
    </div>
  );
}
