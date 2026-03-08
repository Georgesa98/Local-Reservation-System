import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Search, LayoutList, LayoutGrid } from "lucide-react";
import DashboardLayout from "../layout";
import { fetchRooms, deleteRoom } from "./api";
import { RoomsDataTable } from "./data-table";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Component ───────────────────────────────────────────────────────────────

export function RoomsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  // Single query key — React Query deduplicates by key, eliminating triple calls
  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["rooms", currentPage, search, showInactive],
    queryFn: () =>
      fetchRooms({
        page: currentPage,
        page_size: PAGE_SIZE,
        ...(search.trim() ? { location: search.trim() } : {}),
        ...(!showInactive ? { is_active: true } : {}),
      }),
    placeholderData: keepPreviousData, // keep current page visible while next loads
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(t("rooms.toast.deleted"));
    },
    onError: () => {
      toast.error(t("rooms.toast.deleteFailed"));
    },
  });

  const totalCount = data?.count ?? 0;
  const rooms = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  // Page buttons — up to 5 pages centred around current
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // Reset to page 1 when filters change
  function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleShowInactiveChange(checked: boolean) {
    setShowInactive(checked);
    setCurrentPage(1);
  }

  return (
    <DashboardLayout>
      <div
        className="flex flex-col w-full flex-1 min-h-0"
        style={{ background: "var(--card)" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h1 className="auth-heading">{t("rooms.title")}</h1>
          <Button className="px-5 py-2 text-xs font-bold tracking-widest uppercase">
            {t("rooms.addRoom")}&nbsp;+
          </Button>
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────── */}
        <div
          className="flex items-center shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 px-4 py-2"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <Search
              size={14}
              className="shrink-0"
              style={{ color: "var(--muted-foreground)" }}
            />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("rooms.searchPlaceholder").toUpperCase()}
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent label-caps h-8 px-0"
            />
          </div>

          {/* Show inactive */}
          <label
            className="flex items-center gap-2 px-4 cursor-pointer shrink-0"
            style={{ borderRight: "1px solid var(--border)" }}
          >
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => handleShowInactiveChange(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
              style={{ accentColor: "var(--foreground)" }}
            />
            <span className="label-caps whitespace-nowrap">{t("rooms.showInactive")}</span>
          </label>

          {/* View mode */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center justify-center w-10 h-10 transition-colors"
              style={{
                background: viewMode === "list" ? "var(--foreground)" : "transparent",
                color: viewMode === "list" ? "var(--card)" : "var(--muted-foreground)",
                borderRight: "1px solid var(--border)",
              }}
              title="List view"
            >
              <LayoutList size={16} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className="flex items-center justify-center w-10 h-10 transition-colors"
              style={{
                background: viewMode === "grid" ? "var(--foreground)" : "transparent",
                color: viewMode === "grid" ? "var(--card)" : "var(--muted-foreground)",
              }}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-auto">
          {viewMode === "grid" ? (
            <div className="flex items-center justify-center h-full py-20">
              <p className="label-caps">{t("rooms.gridComingSoon")}</p>
            </div>
          ) : (
            <RoomsDataTable
              data={rooms}
              isLoading={isLoading}
              isError={isError}
              onDeleteRoom={(id) => deleteMutation.mutate(id)}
            />
          )}
        </div>

        {/* ── Footer / Pagination ─────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="label-caps">
            {totalCount === 0
              ? t("rooms.noRooms")
              : t("rooms.showing", { start: rangeStart, end: rangeEnd, total: totalCount })}
          </span>

          <div className="flex items-center">
            <Button
              variant="outline"
              className="label-caps px-3 py-1.5 h-auto"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {t("rooms.prev")}
            </Button>

            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                className="label-caps w-8 h-8 p-0"
                disabled={isFetching}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              className="label-caps px-3 py-1.5 h-auto"
              disabled={currentPage >= totalPages || isFetching}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              {t("rooms.next")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
