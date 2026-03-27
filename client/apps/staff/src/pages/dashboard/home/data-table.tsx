import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { useActivityColumns } from "./columns";
import type { ActivityBooking } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActivityDataTableProps {
  data: ActivityBooking[];
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivityDataTable({ data, isLoading }: ActivityDataTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const columns = useActivityColumns();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase tracking-widest">
              {t("dashboardHome.activity.title")}
            </h3>
            <span className="text-[11px] font-bold border-b border-black uppercase cursor-pointer hover:text-blue-600 hover:border-blue-600 transition-colors">
              {t("dashboardHome.activity.viewAll")}
            </span>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">{t("dashboardHome.activity.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest">
            {t("dashboardHome.activity.title")}
          </h3>
          <span
            className="text-[11px] font-bold border-b border-black uppercase cursor-pointer hover:text-blue-600 hover:border-blue-600 transition-colors"
            onClick={() => navigate("/dashboard/bookings")}
          >
            {t("dashboardHome.activity.viewAll")}
          </span>
        </div>
      </div>

      {/* Table */}
      <Table>
        {/* Table Header */}
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="grid grid-cols-12 px-8 py-3 border-b border-black bg-gray-50"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`text-[10px] font-bold uppercase tracking-widest text-gray-500 p-0 ${
                    header.id === "action" ? "text-right col-span-1" : ""
                  } ${header.id === "guest" ? "col-span-4" : ""} ${
                    header.id === "room" ? "col-span-2" : ""
                  } ${header.id === "dates" ? "col-span-3" : ""} ${
                    header.id === "status" ? "col-span-2" : ""
                  }`}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {/* Table Body */}
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-12">
                <span className="text-sm text-gray-500">
                  {t("dashboardHome.activity.noActivity")}
                </span>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="grid grid-cols-12 items-center px-8 h-16 border-b border-gray-200 hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={() =>
                  navigate(`/dashboard/bookings/${row.original.id}`)
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`p-0 ${
                      cell.column.id === "action" ? "text-right col-span-1" : ""
                    } ${cell.column.id === "guest" ? "col-span-4" : ""} ${
                      cell.column.id === "room" ? "col-span-2" : ""
                    } ${cell.column.id === "dates" ? "col-span-3" : ""} ${
                      cell.column.id === "status" ? "col-span-2" : ""
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
