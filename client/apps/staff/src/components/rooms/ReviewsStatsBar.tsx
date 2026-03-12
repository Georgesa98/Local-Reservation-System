/**
 * ReviewsStatsBar — 4-column stats strip at the top of the Reviews tab.
 * Derived from the full reviews list (all pages), computed client-side.
 * Purely presentational.
 */

interface ReviewsStatsBarProps {
  totalCount: number;
  positivePercent: number;  // 0–100
  publishedPercent: number; // 0–100 — proxy for "verification"
}

export function ReviewsStatsBar({
  totalCount,
  positivePercent,
  publishedPercent,
}: ReviewsStatsBarProps) {
  return (
    <div
      className="grid grid-cols-4 mb-8"
      style={{ border: "1px solid var(--border)" }}
    >
      <StatCell
        label="Total Reviews"
        value={String(totalCount)}
        borderRight
      />
      <StatCell
        label="Positive"
        value={`${positivePercent}%`}
        valueColor="var(--foreground)"
        borderRight
      />
      <StatCell
        label="Response Rate"
        value="—"
        borderRight
      />
      <StatCell
        label="Published"
        value={`${publishedPercent}%`}
      />
    </div>
  );
}

// ── Internal cell ─────────────────────────────────────────────────────────────

interface StatCellProps {
  label: string;
  value: string;
  valueColor?: string;
  borderRight?: boolean;
}

function StatCell({ label, value, valueColor, borderRight }: StatCellProps) {
  return (
    <div
      className="p-6"
      style={borderRight ? { borderRight: "1px solid var(--border)" } : undefined}
    >
      <span
        className="block label-caps mb-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>
      <span
        className="text-3xl font-bold"
        style={{ color: valueColor ?? "var(--foreground)" }}
      >
        {value}
      </span>
    </div>
  );
}
