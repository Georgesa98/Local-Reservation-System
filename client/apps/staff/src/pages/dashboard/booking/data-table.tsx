import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useBookingColumns } from "./column";
import type { Booking } from "./types";

interface BookingsDataTableProps {
  data: Booking[];
  isLoading: boolean;
  isError: boolean;
}

export function BookingsDataTable({
  data,
  isLoading,
  isError,
}: BookingsDataTableProps) {
  const { t } = useTranslation();
  const columns = useBookingColumns();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isError) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <p className="text-sm" style={{ color: "var(--destructive, #ef4444)" }}>
          {t("bookings.errorLoading")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <p className="label-caps">{t("bookings.loading")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow
            key={headerGroup.id}
            style={{
              background: "var(--card)",
              borderBottom: "1px solid var(--foreground)",
            }}
          >
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id} className="label-caps px-4 py-3">
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="text-center py-12"
            >
              <span className="label-caps">{t("bookings.noBookingsFound")}</span>
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              style={{ borderBottom: "1px solid var(--border)" }}
              className="hover:bg-[var(--secondary)] transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
