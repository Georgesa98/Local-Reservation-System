/**
 * ImageStatsBar — footer stats strip for the Images tab.
 *
 * Displays Storage Usage, Asset Count, and Last Synced.
 * Purely presentational — all values computed and passed in from ImageTabSection.
 */

import { useTranslation } from "react-i18next";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImageStatsBarProps {
  usedMb: number;
  assetCount: number;
  lastSynced: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImageStatsBar({
  usedMb,
  assetCount,
  lastSynced,
}: ImageStatsBarProps) {
  const { t } = useTranslation();

  return (
    <div
      className="mt-16 pt-6 grid grid-cols-3 gap-8"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <StatCell
        label={t("room.images.stats.storage")}
        value={t("room.images.stats.storageValue", { used: usedMb })}
      />
      <StatCell
        label={t("room.images.stats.assets")}
        value={t("room.images.stats.assetsValue", { count: assetCount })}
      />
      <StatCell
        label={t("room.images.stats.lastSynced")}
        value={lastSynced}
      />
    </div>
  );
}

// ─── StatCell ─────────────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="font-mono text-[10px] uppercase tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-sm"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}
