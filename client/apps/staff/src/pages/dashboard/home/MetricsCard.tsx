import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetricsCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon: ReactNode;
  growth?: number;
  growthLabel?: string;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGrowth(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MetricsCard({
  label,
  value,
  suffix,
  icon,
  growth,
  growthLabel,
  isLoading = false,
}: MetricsCardProps) {
  const isPositive = growth !== undefined && growth >= 0;
  const isNegative = growth !== undefined && growth < 0;

  return (
    <div className="relative aspect-square border-r border-b border-black p-6 flex flex-col justify-between group hover:bg-gray-50 transition-colors last:border-r-0">
      {/* Header: Label + Icon */}
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-black">
          {label}
        </span>
        <span className="text-gray-400 group-hover:text-black">{icon}</span>
      </div>

      {/* Value */}
      <div className="flex flex-col items-center justify-center flex-1">
        {isLoading ? (
          <span className="text-4xl font-bold tracking-tighter text-gray-300">
            —
          </span>
        ) : (
          <span className="text-5xl font-bold tracking-tighter font-mono">
            {value}
            {suffix && (
              <span className="text-2xl text-gray-400">{suffix}</span>
            )}
          </span>
        )}
      </div>

      {/* Growth Indicator */}
      <div className="flex justify-end items-center gap-1">
        {growth !== undefined && !isLoading ? (
          <>
            {isPositive && (
              <TrendingUp size={16} className="text-green-600" />
            )}
            {isNegative && (
              <TrendingDown size={16} className="text-red-600" />
            )}
            <span
              className={`font-mono text-xs font-medium ${
                isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-500"
              }`}
            >
              {formatGrowth(growth)}
            </span>
          </>
        ) : growthLabel && !isLoading ? (
          <span className="font-mono text-xs text-gray-500">{growthLabel}</span>
        ) : null}
      </div>
    </div>
  );
}
