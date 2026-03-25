import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Button } from "@workspace/ui/components/button";
import { usePaymentColumns } from "./columns";
import type { Payment } from "./types";

interface PaymentsDataTableProps {
  data: Payment[];
  isLoading: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  onPageChange?: (page: number) => void;
}

export function PaymentsDataTable({
  data,
  isLoading,
  pagination,
  onPageChange,
}: PaymentsDataTableProps) {
  const columns = usePaymentColumns();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="border border-black">
        <div className="p-4 border-b border-black">
          <h2 className="text-lg font-bold">Transactions</h2>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-black">
      <div className="p-4 border-b border-black">
        <h2 className="text-lg font-bold">Transactions</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-black"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-3 font-semibold">
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
                  className="text-center py-8"
                >
                  <span className="text-sm text-gray-600">No transactions found</span>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-black"
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
      </div>

      {/* Pagination */}
      {pagination && pagination.totalCount > 0 && (
        <div className="p-4 border-t border-black flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{" "}
            {pagination.totalCount} transactions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={!pagination.hasPrevious}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
