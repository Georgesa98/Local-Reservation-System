/**
 * AvailabilityBlockedTable — left column of the Availability tab.
 *
 * Renders:
 *   1. "Currently Blocked" table — sorted ascending by start_date, with
 *      Active/Expired Badge and a per-row Remove button.
 *   2. "Availability Log" — sorted descending, alternating muted rows.
 *
 * Purely presentational — all state/mutation lives in AvailabilityTabSection.
 */

import { useTranslation } from "react-i18next";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@workspace/ui/components/table";
import type { RoomAvailability, AvailabilityReason } from "../../pages/dashboard/rooms/types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvailabilityBlockedTableProps {
  availabilities: RoomAvailability[];
  onRemove: (id: number) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isActive(avail: RoomAvailability): boolean {
  return new Date(avail.end_date) >= new Date(new Date().toDateString());
}

function formatDateRange(start: string, end: string): string {
  const fmt = (d: string) =>
    new Date(d)
      .toLocaleDateString("en-US", { month: "short", day: "2-digit" })
      .toUpperCase();
  return `${fmt(start)} — ${fmt(end)}`;
}

const REASON_KEYS: Record<AvailabilityReason, string> = {
  maintenance: "room.availability.reason.maintenance",
  personal_use: "room.availability.reason.personal_use",
  other: "room.availability.reason.other",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function AvailabilityBlockedTable({
  availabilities,
  onRemove,
}: AvailabilityBlockedTableProps) {
  const { t } = useTranslation();

  const sortedAsc = [...availabilities].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const sortedDesc = [...availabilities].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  return (
    <div className="flex flex-col gap-10">
      {/* ── Currently Blocked ────────────────────────────────────────────── */}
      <section>
        <div
          className="flex items-center justify-between mb-6 pb-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2
            className="text-lg font-bold uppercase tracking-tight"
            style={{ color: "var(--foreground)" }}
          >
            {t("room.availability.currentlyBlocked")}
          </h2>
          <span
            className="font-mono text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.availability.activeRanges", {
              count: availabilities.filter(isActive).length,
            })}
          </span>
        </div>

        {availabilities.length === 0 ? (
          <p
            className="font-mono text-sm py-6 text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.availability.noBlocked")}
          </p>
        ) : (
          <div
            style={{
              border: "1px solid var(--foreground)",
              borderCollapse: "collapse",
            }}
          >
            <Table className="border-collapse">
              <TableHeader style={{ background: "var(--muted)" }}>
                <TableRow className="border-0 hover:bg-transparent">
                  <TableHead
                    className="p-3 text-[11px] font-bold uppercase tracking-wider"
                    style={{ border: "1px solid var(--foreground)", color: "var(--muted-foreground)" }}
                  >
                    {t("room.availability.columns.dateRange")}
                  </TableHead>
                  <TableHead
                    className="p-3 text-[11px] font-bold uppercase tracking-wider"
                    style={{ border: "1px solid var(--foreground)", color: "var(--muted-foreground)" }}
                  >
                    {t("room.availability.columns.reason")}
                  </TableHead>
                  <TableHead
                    className="p-3 text-[11px] font-bold uppercase tracking-wider"
                    style={{ border: "1px solid var(--foreground)", color: "var(--muted-foreground)" }}
                  >
                    {t("room.availability.columns.status")}
                  </TableHead>
                  <TableHead
                    className="p-3"
                    style={{ border: "1px solid var(--foreground)" }}
                  />
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-sm">
                {sortedAsc.map((avail) => {
                  const active = isActive(avail);
                  return (
                    <TableRow
                      key={avail.id}
                      className="border-0 hover:bg-transparent"
                    >
                      <TableCell
                        className="p-3"
                        style={{ border: "1px solid var(--foreground)" }}
                      >
                        {formatDateRange(avail.start_date, avail.end_date)}
                      </TableCell>
                      <TableCell
                        className="p-3 italic"
                        style={{
                          border: "1px solid var(--foreground)",
                          color: "var(--muted-foreground)",
                        }}
                      >
                        {t(REASON_KEYS[avail.reason])}
                        {avail.notes && `: ${avail.notes}`}
                      </TableCell>
                      <TableCell
                        className="p-3"
                        style={{ border: "1px solid var(--foreground)" }}
                      >
                        {active ? (
                          <Badge
                            className="font-mono text-[9px] uppercase tracking-widest rounded-none"
                            style={{
                              background: "var(--foreground)",
                              color: "var(--background)",
                              border: "none",
                            }}
                          >
                            {t("room.availability.status.active")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-mono text-[9px] uppercase tracking-widest rounded-none"
                          >
                            {t("room.availability.status.expired")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className="p-3 text-center"
                        style={{ border: "1px solid var(--foreground)" }}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRemove(avail.id)}
                          className="font-mono text-[9px] uppercase tracking-widest h-6 px-2 rounded-none"
                        >
                          {t("room.availability.actions.remove")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* ── Availability Log ─────────────────────────────────────────────── */}
      <section>
        <h2
          className="text-lg font-bold uppercase tracking-tight mb-6 pb-2"
          style={{
            borderBottom: "1px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          {t("room.availability.availabilityLog")}
        </h2>

        {availabilities.length === 0 ? (
          <p
            className="font-mono text-sm py-6 text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            {t("room.availability.noBlocked")}
          </p>
        ) : (
          <div style={{ border: "1px solid var(--foreground)" }}>
            {sortedDesc.map((avail, i) => (
              <div
                key={avail.id}
                className="p-4 flex justify-between font-mono text-[11px] uppercase"
                style={{
                  background: i % 2 === 0 ? "var(--muted)" : "transparent",
                  borderTop: i > 0 ? "1px solid var(--foreground)" : undefined,
                }}
              >
                <span style={{ color: "var(--muted-foreground)" }}>
                  {new Date(avail.start_date)
                    .toLocaleDateString("en-US", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .toUpperCase()}
                </span>
                <span style={{ color: "var(--foreground)" }}>
                  {t(REASON_KEYS[avail.reason])}{" "}
                  {formatDateRange(avail.start_date, avail.end_date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
