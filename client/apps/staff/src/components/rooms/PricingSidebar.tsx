import { useTranslation } from "react-i18next";
import type { PricingRule } from "../../pages/dashboard/rooms/types";

interface PricingSidebarProps {
  basePrice: string | undefined; // e.g. "240.00"
  rules: PricingRule[];
}

/** Compute final rate = basePrice × (1 + Σ active-percentage-modifiers / 100) */
function computeFinalRate(basePrice: string, rules: PricingRule[]): string {
  const base = parseFloat(basePrice);
  if (isNaN(base)) return basePrice;

  const totalPctAdjustment = rules
    .filter((r) => r.is_active && r.is_percentage)
    .reduce((sum, r) => sum + parseFloat(r.price_modifier), 0);

  const flatAdjustment = rules
    .filter((r) => r.is_active && !r.is_percentage)
    .reduce((sum, r) => sum + parseFloat(r.price_modifier), 0);

  const final = base * (1 + totalPctAdjustment / 100) + flatAdjustment;
  return final.toFixed(2);
}

export function PricingSidebar({ basePrice, rules }: PricingSidebarProps) {
  const { t } = useTranslation();

  const activeCount = rules.filter((r) => r.is_active).length;
  const finalRate = basePrice ? computeFinalRate(basePrice, rules) : "—";
  const displayBase = basePrice ? parseFloat(basePrice).toFixed(2) : "—";

  return (
    <aside className="flex flex-col gap-6">
      {/* Summary card */}
      <div
        className="flex flex-col"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Card header */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--muted)" }}
        >
          <span className="label-caps">{t("room.pricing.summary.title")}</span>
        </div>

        <div className="flex flex-col divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
          {/* Base Rate */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="label-caps" style={{ color: "var(--muted-foreground)" }}>
              {t("room.pricing.summary.baseRate")}
            </span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>
              {displayBase} USD{" "}
              <span className="font-normal" style={{ color: "var(--muted-foreground)" }}>
                {t("room.pricing.summary.perNight")}
              </span>
            </span>
          </div>

          {/* Active Rules */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="label-caps" style={{ color: "var(--muted-foreground)" }}>
              {t("room.pricing.summary.activeRules")}
            </span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--foreground)" }}>
              {String(activeCount).padStart(2, "0")}{" "}
              <span className="font-normal" style={{ color: "var(--muted-foreground)" }}>
                {t("room.pricing.summary.adjustmentsApplied")}
              </span>
            </span>
          </div>

          {/* Final Rate */}
          <div className="flex flex-col gap-1 px-4 py-4">
            <span className="label-caps" style={{ color: "var(--muted-foreground)" }}>
              {t("room.pricing.summary.finalRate")}
            </span>
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: "var(--foreground)" }}
            >
              {finalRate} USD
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
