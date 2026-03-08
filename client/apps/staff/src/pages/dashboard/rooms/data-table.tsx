import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { roomColumns } from "./columns";
import type { Room } from "./types";

interface RoomsDataTableProps {
  data: Room[];
  isLoading: boolean;
  isError: boolean;
}

export function RoomsDataTable({ data, isLoading, isError }: RoomsDataTableProps) {
  const table = useReactTable({
    data,
    columns: roomColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isError) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <p className="text-sm" style={{ color: "var(--destructive, #ef4444)" }}>
          Failed to load rooms. Please try again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center flex-1 py-20">
        <p className="label-caps">Loading…</p>
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
              colSpan={roomColumns.length}
              className="text-center py-12"
            >
              <span className="label-caps">No rooms found</span>
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
