import { useTranslation } from "react-i18next";
import type { PricingRule } from "../../pages/dashboard/rooms/types";

interface ActiveRulesSectionProps {
  rules: PricingRule[];
  totalCount: number;
  isLoading: boolean;
  onEditRules: () => void;
}

function formatModifier(rule: PricingRule): string {
  const num = parseFloat(rule.price_modifier);
  if (isNaN(num)) return rule.price_modifier;
  const formatted = num > 0 ? `+${num}` : `${num}`;
  return rule.is_percentage ? `${formatted}%` : `${formatted} USD`;
}

function getModifierColor(value: string): string {
  const num = parseFloat(value);
  if (isNaN(num)) return "var(--foreground)";
  return num > 0 ? "#22c55e" : "#ef4444";
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getRuleDescriptor(rule: PricingRule): string | null {
  if (rule.days_of_week.length > 0) {
    return rule.days_of_week.map((d) => DAY_NAMES[d] ?? d).join(", ");
  }
  if (rule.min_nights) return `> ${rule.min_nights} nights`;
  return null;
}

export function ActiveRulesSection({
  rules,
  totalCount,
  isLoading,
  onEditRules,
}: ActiveRulesSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="auth-heading text-base">
          {t("room.section.activeRules")}
        </h2>
        <button
          type="button"
          onClick={onEditRules}
          className="label-caps transition-colors hover:opacity-70"
          style={{ color: "var(--primary)" }}
        >
          {t("room.editRules")}
        </button>
      </div>
      <div
        className="w-full h-px mb-0"
        style={{ background: "var(--border)" }}
      />

      {/* Rules table */}
      <div style={{ border: "1px solid var(--border)", borderTop: "none" }}>
        {/* Column header */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "var(--muted)",
          }}
        >
          <span className="label-caps">{t("room.rules.rule")}</span>
          <span className="label-caps">{t("room.rules.adj")}</span>
        </div>

        {/* Rule rows */}
        {isLoading ? (
          <div className="px-3 py-4 flex items-center justify-center">
            <span
              className="label-caps"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t("room.loading")}
            </span>
          </div>
        ) : rules.length === 0 ? (
          <div className="px-3 py-4 flex items-center justify-center">
            <span
              className="label-caps"
              style={{ color: "var(--muted-foreground)" }}
            >
              {t("room.rules.none")}
            </span>
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div
              key={rule.id}
              className="flex items-center justify-between px-3 py-3"
              style={{
                borderBottom:
                  idx < rules.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--foreground)" }}
                >
                  {rule.rule_type.replace("_", " ")}
                </p>
                {getRuleDescriptor(rule) && (
                  <p className="label-caps mt-0.5">{getRuleDescriptor(rule)}</p>
                )}
              </div>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: getModifierColor(rule.price_modifier) }}
              >
                {formatModifier(rule)}
              </span>
            </div>
          ))
        )}

        {/* Footer */}
        <div
          className="px-3 py-2.5 flex items-center justify-center"
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--muted)",
          }}
        >
          <span
            className="label-caps"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.rules.total", { count: totalCount })}
          </span>
        </div>
      </div>
    </section>
  );
}
