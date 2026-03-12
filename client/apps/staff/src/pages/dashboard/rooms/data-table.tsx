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
import { useRoomColumns } from "./columns";
import type { Room } from "./types";

interface RoomsDataTableProps {
  data: Room[];
  isLoading: boolean;
  isError: boolean;
  onDeleteRoom: (id: number) => void;
}

export function RoomsDataTable({
  data,
  isLoading,
  isError,
  onDeleteRoom,
}: RoomsDataTableProps) {
  const { t } = useTranslation();
  const columns = useRoomColumns();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onDeleteRoom },
  });

  if (isError) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <p className="text-sm" style={{ color: "var(--destructive, #ef4444)" }}>
          {t("rooms.errorLoading")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <p className="label-caps">{t("rooms.loading")}</p>
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
              borderBottom: "1px solid var(--border)",
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
              <span className="label-caps">{t("rooms.noRoomsFound")}</span>
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="px-4 py-2">
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
