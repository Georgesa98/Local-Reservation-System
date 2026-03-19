/**
 * Search Existing Guests Dialog
 *
 * Allows staff to search for existing guests by name, phone, or email
 * before creating a new booking. Matches Neo-Swiss design from Stitch.
 *
 * Design Reference: Stitch Screen ID 640939f483de4450b960e25a6c446259
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { searchGuests } from "../../pages/dashboard/booking/new/api";
import type { GuestSearchResult } from "../../pages/dashboard/booking/new/types";

interface SearchGuestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGuest: (guest: GuestSearchResult) => void;
}

export function SearchGuestsDialog({
  open,
  onOpenChange,
  onSelectGuest,
}: SearchGuestsDialogProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<GuestSearchResult | null>(
    null,
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search guests query
  const { data: results = [], isLoading } = useQuery({
    queryKey: ["guests", "search", debouncedQuery],
    queryFn: () => searchGuests(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
  });

  const handleSelectGuest = (guest: GuestSearchResult) => {
    setSelectedGuest(guest);
  };

  const handleConfirm = () => {
    if (selectedGuest) {
      onSelectGuest(selectedGuest);
      onOpenChange(false);
      // Reset state
      setSearchQuery("");
      setSelectedGuest(null);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSearchQuery("");
    setSelectedGuest(null);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "—";
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        {/* Header */}
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="auth-heading uppercase">
              {t("booking.searchGuests.title")}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 hover:bg-primary hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Search Input */}
        <div className="pt-4 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("booking.searchGuests.placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 uppercase font-medium"
            />
          </div>
        </div>

        {/* Results Table / Empty State */}
        <div className="min-h-[400px] overflow-auto">
          {searchQuery.trim().length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
              <Search className="h-12 w-12 text-muted-foreground/30" />
              <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
                {t("booking.searchGuests.emptyState")}
              </p>
            </div>
          ) : isLoading ? (
            // Loading state
            <div className="flex items-center justify-center h-full py-20">
              <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
                {t("common.loading")}
              </p>
            </div>
          ) : results.length === 0 ? (
            // No results
            <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
              <Search className="h-12 w-12 text-muted-foreground/30" />
              <p className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
                {t("booking.searchGuests.noResults")}
              </p>
            </div>
          ) : (
            // Results table
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="py-3 label-caps text-muted-foreground">
                    {t("booking.searchGuests.name")}
                  </th>
                  <th className="py-3 label-caps text-muted-foreground">
                    {t("booking.searchGuests.phone")}
                  </th>
                  <th className="py-3 label-caps text-muted-foreground">
                    {t("booking.searchGuests.email")}
                  </th>
                  <th className="py-3 label-caps text-muted-foreground">
                    {t("booking.searchGuests.lastStay")}
                  </th>
                  <th className="py-3 label-caps text-muted-foreground text-right">
                    {t("booking.searchGuests.action")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((guest) => (
                  <tr
                    key={guest.id}
                    onClick={() => handleSelectGuest(guest)}
                    className={`border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedGuest?.id === guest.id ? "bg-muted" : ""
                    }`}
                  >
                    <td className="py-4 font-bold text-sm uppercase">
                      {guest.first_name} {guest.last_name}
                    </td>
                    <td className="py-4 font-mono text-xs tracking-tighter">
                      {guest.phone_number}
                    </td>
                    <td className="py-4 font-mono text-[10px] text-muted-foreground uppercase">
                      {guest.email || "—"}
                    </td>
                    <td className="py-4 font-mono text-xs">
                      {formatDate(guest.last_booking_date)}
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        variant={
                          selectedGuest?.id === guest.id ? "default" : "outline"
                        }
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectGuest(guest);
                        }}
                        className="label-caps"
                      >
                        {selectedGuest?.id === guest.id
                          ? t("booking.searchGuests.selected")
                          : t("booking.searchGuests.select")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-border pt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="label-caps px-8"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedGuest}
            className="label-caps px-8"
          >
            {t("booking.searchGuests.useSelected")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
