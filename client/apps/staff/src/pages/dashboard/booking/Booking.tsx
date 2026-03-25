import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Search, SlidersHorizontal, FileDown, Plus } from "lucide-react";
import DashboardLayout from "../layout";
import { fetchBookings } from "./api";
import { BookingsDataTable } from "./data-table";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ─── Component ───────────────────────────────────────────────────────────────

export function BookingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["bookings", currentPage, search],
    queryFn: () =>
      fetchBookings({
        page: currentPage,
        page_size: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
      }),
    placeholderData: keepPreviousData,
  });

  const totalCount = data?.count ?? 0;
  const bookings = data?.results ?? [];
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const rangeStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalCount);

  const pageNumbers = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  function handleSearchChange(value: string) {
    setSearch(value);
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
          className="flex items-end justify-between px-8 py-6 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex flex-col gap-1">
            <h1 className="auth-heading">{t("bookings.title")}</h1>
            <p
              className="text-sm"
              style={{
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--muted-foreground)",
              }}
            >
              {t("bookings.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* New Booking */}
            <Button
              className="label-caps flex items-center gap-2 px-4 py-2 h-auto font-bold tracking-widest"
              onClick={() => navigate("/bookings/new")}
            >
              <Plus size={14} />
              {t("bookings.newBooking")}
            </Button>
          </div>
        </div>

        {/* ── Filter Rail ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-8 py-3 shrink-0"
          style={{
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left: Search + Filter button */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div
              className="flex items-center gap-2 px-3 py-2 w-64"
              style={{
                border: "1px solid var(--border)",
                background: "var(--card)",
              }}
            >
              <Search
                size={14}
                className="shrink-0"
                style={{ color: "var(--muted-foreground)" }}
              />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("bookings.searchPlaceholder").toUpperCase()}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent label-caps h-auto p-0"
              />
            </div>

            {/* Divider */}
            <div
              style={{
                width: 1,
                height: 24,
                background: "var(--border)",
                flexShrink: 0,
              }}
            />

            {/* Filter button */}
            <Button
              variant="outline"
              className="label-caps flex items-center gap-2 px-3 py-2 h-auto"
            >
              <SlidersHorizontal size={14} />
              {t("bookings.filter")}
            </Button>
          </div>

          {/* Right: mini stats */}
          <div
            className="flex gap-6 text-right"
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.75rem",
            }}
          >
            <div className="flex flex-col items-end gap-0.5">
              <span className="label-caps">
                {t("bookings.stats.totalBookings")}
              </span>
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--foreground)",
                  fontSize: "0.875rem",
                }}
              >
                {totalCount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-auto">
          <BookingsDataTable
            data={bookings}
            isLoading={isLoading}
            isError={isError}
          />
        </div>

        {/* ── Footer / Pagination ─────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="label-caps">
            {totalCount === 0
              ? t("bookings.noBookings")
              : t("bookings.showing", {
                  start: rangeStart,
                  end: rangeEnd,
                  total: totalCount.toLocaleString(),
                })}
          </span>

          <div className="flex items-center">
            <Button
              variant="outline"
              className="label-caps px-3 py-1.5 h-auto"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              {t("bookings.prev")}
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
              {t("bookings.next")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
