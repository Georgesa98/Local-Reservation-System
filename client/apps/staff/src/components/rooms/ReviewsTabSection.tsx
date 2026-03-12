/**
 * ReviewsTabSection — orchestrator for the Reviews tab.
 *
 * Owns:
 *  - Paginated data fetch (GET /api/bookings/rooms/<id>/reviews/)
 *  - Toggle publish mutation (PATCH /api/bookings/reviews/<id>/publish/)
 *  - Derived stats (total, positive %, published %)
 *  - Page state
 *
 * Children (purely presentational):
 *  - ReviewsStatsBar  — 4-col stats strip
 *  - ReviewsTable     — high-density list + pagination
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchRoomReviews, toggleReviewPublish } from "../../pages/dashboard/rooms/[id]/api";
import type { Review } from "../../pages/dashboard/rooms/types";
import { ReviewsStatsBar } from "./ReviewsStatsBar";
import { ReviewsTable } from "./ReviewsTable";

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

// ── Props ─────────────────────────────────────────────────────────────────────

interface ReviewsTabSectionProps {
  roomId: number;
  averageRating?: string; // e.g. "4.80" — from room object
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ReviewsTabSection({ roomId, averageRating }: ReviewsTabSectionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // ── Data ─────────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["room-reviews", roomId, page],
    queryFn: () => fetchRoomReviews(roomId, page, PAGE_SIZE),
    enabled: !isNaN(roomId),
    placeholderData: (prev) => prev, // keep stale data during page transitions
  });

  const reviews: Review[] = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  // ── Stats (from current page + total count) ──────────────────────────────────
  // For a richer stats computation we use the current page's data.
  // positive = rating >= 4; published = is_published === true
  const positiveCount = reviews.filter((r) => r.rating >= 4).length;
  const publishedCount = reviews.filter((r) => r.is_published).length;

  const positivePercent =
    reviews.length > 0 ? Math.round((positiveCount / reviews.length) * 100) : 0;
  const publishedPercent =
    reviews.length > 0 ? Math.round((publishedCount / reviews.length) * 100) : 0;

  // ── Publish mutation ──────────────────────────────────────────────────────────

  const publishMutation = useMutation({
    mutationFn: (review: Review) => toggleReviewPublish(review.id),
    onMutate: (review) => setTogglingId(review.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-reviews", roomId] });
      toast.success(t("room.reviews.toast.toggled"));
    },
    onError: () => {
      toast.error(t("room.reviews.toast.toggleFailed"));
    },
    onSettled: () => setTogglingId(null),
  });

  // ── Export CSV ────────────────────────────────────────────────────────────────

  function handleExportCsv() {
    const headers = ["ID", "Guest", "Phone", "Rating", "Comment", "Published", "Date"];
    const rows = reviews.map((r) =>
      [
        r.id,
        `${r.guest.first_name} ${r.guest.last_name}`.trim(),
        r.guest.phone,
        r.rating,
        `"${r.comment.replace(/"/g, '""')}"`,
        r.is_published,
        r.created_at,
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `room-${roomId}-reviews-page${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col px-8 py-8 overflow-auto">
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-bold uppercase" style={{ fontSize: "13px", letterSpacing: "0.08em" }}>
            {t("room.reviews.title")}
          </h2>
          {averageRating && (
            <span className="font-mono label-caps">
              {t("room.reviews.averageRating", { value: averageRating })}
            </span>
          )}
        </div>

        <button
          onClick={handleExportCsv}
          disabled={reviews.length === 0}
          className="h-9 px-6 font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
          style={{
            fontSize: "12px",
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            border: "none",
            cursor: reviews.length === 0 ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (reviews.length > 0) {
              (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          }}
        >
          {t("room.reviews.exportData")}
        </button>
      </div>

      {/* Stats strip */}
      <ReviewsStatsBar
        totalCount={totalCount}
        positivePercent={positivePercent}
        publishedPercent={publishedPercent}
      />

      {/* Review list */}
      {isLoading ? (
        <ReviewsSkeleton />
      ) : (
        <ReviewsTable
          reviews={reviews}
          totalCount={totalCount}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onTogglePublish={(review) => publishMutation.mutate(review)}
          isToggling={togglingId}
        />
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ReviewsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        />
      ))}
    </div>
  );
}
