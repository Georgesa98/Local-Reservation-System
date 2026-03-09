import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@workspace/ui/components/button";

interface RoomDetailHeaderProps {
  roomNumber: string | number;
  isActive: boolean;
  lastSynced: string;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function RoomDetailHeader({
  roomNumber,
  isActive,
  lastSynced,
  isDirty,
  isSaving,
  onSave,
}: RoomDetailHeaderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--card)",
      }}
    >
      {/* Left: back + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/rooms")}
          className="flex items-center justify-center w-7 h-7 transition-colors hover:opacity-60"
          style={{ color: "var(--foreground)" }}
          title={t("common.back")}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>

        <div
          className="w-px h-4 shrink-0"
          style={{ background: "var(--border)" }}
        />

        <nav className="flex items-center gap-1.5">
          <span
            className="label-caps"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.breadcrumb.inventory")}
          </span>
          <span
            className="label-caps"
            style={{ color: "var(--muted-foreground)" }}
          >
            /
          </span>
          <span
            className="label-caps"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.breadcrumb.rooms")}
          </span>
          <span
            className="label-caps"
            style={{ color: "var(--muted-foreground)" }}
          >
            /
          </span>
          <span
            className="label-caps font-bold"
            style={{ color: "var(--foreground)" }}
          >
            {t("room.breadcrumb.room", { number: roomNumber })}
          </span>
        </nav>

        {/* Live / Inactive badge */}
        <span
          className="label-caps px-2 py-0.5"
          style={{
            border: `1px solid ${isActive ? "#22c55e" : "var(--border)"}`,
            color: isActive ? "#22c55e" : "var(--muted-foreground)",
          }}
        >
          {isActive ? t("room.badge.live") : t("room.badge.inactive")}
        </span>
      </div>

      {/* Right: last sync + save */}
      <div className="flex items-center gap-4">
        <span
          className="label-caps"
          style={{ color: "var(--muted-foreground)" }}
        >
          {t("room.lastSync")}: {lastSynced}
        </span>
        <Button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className="label-caps px-5 py-2 font-bold tracking-widest"
          style={{
            background: isDirty ? "var(--primary)" : "var(--muted)",
            color: isDirty
              ? "var(--primary-foreground)"
              : "var(--muted-foreground)",
          }}
        >
          {isSaving ? t("room.saving") : t("room.saveChanges")}
        </Button>
      </div>
    </div>
  );
}
