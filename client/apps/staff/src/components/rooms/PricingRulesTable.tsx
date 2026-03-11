import { useTranslation } from "react-i18next";
import type { PricingRule } from "../../pages/dashboard/rooms/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface PricingRulesTableProps {
  rules: PricingRule[];
  isLoading: boolean;
  onToggleActive: (rule: PricingRule) => void;
  onEditRule: (rule: PricingRule) => void;
  onAddRule: () => void;
  onExportCsv: () => void;
  onUpdateAll: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatModifier(rule: PricingRule): string {
  const num = parseFloat(rule.price_modifier);
  if (isNaN(num)) return rule.price_modifier;
  const sign = num > 0 ? "+" : "";
  return rule.is_percentage ? `${sign}${num}%` : `${sign}${num} USD`;
}

function getModifierColor(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "var(--foreground)";
  return num > 0 ? "#22c55e" : num < 0 ? "#ef4444" : "var(--foreground)";
}

function formatDateRange(
  start: string | null,
  end: string | null,
  recurringLabel: string,
  dateRangeLabel: (s: string, e: string) => string
): string {
  if (!start && !end) return recurringLabel;
  if (start && end) return dateRangeLabel(start, end);
  return start ?? end ?? recurringLabel;
}

// ── Component ────────────────────────────────────────────────────────────────

export function PricingRulesTable({
  rules,
  isLoading,
  onToggleActive,
  onEditRule,
  onAddRule,
  onExportCsv,
  onUpdateAll,
}: PricingRulesTableProps) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-0">
      {/* Section header */}
      <div className="flex flex-col gap-0.5 mb-4">
        <h2 className="auth-heading text-base">{t("room.pricing.title")}</h2>
        <p className="label-caps" style={{ color: "var(--muted-foreground)" }}>
          {t("room.pricing.subtitle")}
        </p>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <button
          type="button"
          onClick={onExportCsv}
          className="label-caps px-3 py-1.5 transition-opacity hover:opacity-70"
          style={{
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        >
          {t("room.pricing.exportCsv")}
        </button>
        <button
          type="button"
          onClick={onUpdateAll}
          className="label-caps px-3 py-1.5 transition-opacity hover:opacity-70"
          style={{
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
          }}
        >
          {t("room.pricing.updateAll")}
        </button>
        <button
          type="button"
          onClick={onAddRule}
          className="label-caps px-3 py-1.5 transition-opacity hover:opacity-70"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          + {t("room.pricing.addRule")}
        </button>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border)" }}>
        {/* Column headers */}
        <div
          className="grid items-center px-4 py-2.5"
          style={{
            gridTemplateColumns: "2fr 1fr 2fr 1fr 1fr",
            borderBottom: "1px solid var(--border)",
            background: "var(--muted)",
          }}
        >
          {(
            [
              "ruleType",
              "modifier",
              "dates",
              "minNights",
              "status",
            ] as const
          ).map((col) => (
            <span key={col} className="label-caps">
              {t(`room.pricing.columns.${col}`)}
            </span>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div
            className="flex items-center justify-center py-10"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span className="label-caps">{t("room.loading")}</span>
          </div>
        ) : rules.length === 0 ? (
          <div
            className="flex items-center justify-center py-10"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span className="label-caps">{t("room.pricing.noRules")}</span>
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div
              key={rule.id}
              className="grid items-center px-4 py-3 cursor-pointer transition-colors"
              style={{
                gridTemplateColumns: "2fr 1fr 2fr 1fr 1fr",
                borderBottom:
                  idx < rules.length - 1 ? "1px solid var(--border)" : "none",
              }}
              onClick={() => onEditRule(rule)}
            >
              {/* Rule type */}
              <span
                className="text-sm font-semibold capitalize"
                style={{ color: "var(--foreground)" }}
              >
                {t(`room.pricing.ruleType.${rule.rule_type}`)}
              </span>

              {/* Modifier */}
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: getModifierColor(rule.price_modifier) }}
              >
                {formatModifier(rule)}
              </span>

              {/* Dates */}
              <span className="label-caps" style={{ color: "var(--muted-foreground)" }}>
                {formatDateRange(
                  rule.start_date,
                  rule.end_date,
                  t("room.pricing.recurring"),
                  (s, e) =>
                    t("room.pricing.dateRange", { start: s, end: e })
                )}
              </span>

              {/* Min nights */}
              <span className="label-caps" style={{ color: "var(--muted-foreground)" }}>
                {rule.min_nights != null ? rule.min_nights : "—"}
              </span>

              {/* Status toggle */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleActive(rule);
                }}
              >
                <button
                  type="button"
                  className="label-caps px-2.5 py-1 transition-colors"
                  style={{
                    border: "1px solid var(--border)",
                    background: rule.is_active ? "var(--primary)" : "var(--muted)",
                    color: rule.is_active
                      ? "var(--primary-foreground)"
                      : "var(--muted-foreground)",
                  }}
                >
                  {rule.is_active
                    ? t("room.pricing.active")
                    : t("room.pricing.inactive")}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
