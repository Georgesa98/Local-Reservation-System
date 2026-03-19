/**
 * New Booking Form - Main Component
 * Multi-section form for creating walk-in or phone bookings
 * Uses tanstack/react-query for API calls
 * 
 * Layout: Centered card (~680px) with sidebar visible
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Field } from "@workspace/ui/components/field";
import { Textarea } from "@workspace/ui/components/textarea";
import { Separator } from "@workspace/ui/components/separator";
import {
  BookingTypeSection,
  GuestInfoSection,
} from "../../../../components/booking";
import { fetchManagerRooms, createBooking } from "./api";
import {
  calculateNights,
  calculateTotalPrice,
  formatCurrency,
  validateGuestData,
  validateGuestCount,
} from "./utils";
import type {
  BookingType,
  CreateBookingPayload,
  GuestFormData,
} from "./types";

export function NewBooking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [bookingType, setBookingType] = useState<BookingType>("walk-in");
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [guestInfo, setGuestInfo] = useState<GuestFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "gateway">(
    "cash",
  );
  const [specialRequests, setSpecialRequests] = useState("");

  // Fetch manager's rooms
  const { data: roomsData } = useQuery({
    queryKey: ["manager-rooms"],
    queryFn: () => fetchManagerRooms({ is_active: true }),
  });

  const rooms = roomsData?.results || [];
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Calculate booking details
  const nights = calculateNights(checkInDate, checkOutDate);
  const totalPrice = selectedRoom
    ? calculateTotalPrice(selectedRoom.base_price_per_night, nights)
    : "0.00";

  // Create booking mutation
  const createMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (booking) => {
      toast.success(t("booking.createSuccess"));
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      if (selectedRoomId) {
        queryClient.invalidateQueries({ queryKey: ["room", selectedRoomId] });
        queryClient.invalidateQueries({
          queryKey: ["room-bookings-calendar", selectedRoomId],
        });
      }
      navigate(`/dashboard/bookings/${booking.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t("booking.createError"));
    },
  });

  // Form validation
  const validateForm = (): boolean => {
    // Validate guest info
    const guestErrors = validateGuestData(guestInfo);
    if (Object.keys(guestErrors).length > 0) {
      toast.error(t("booking.validation.guestInfoRequired"));
      return false;
    }

    // Validate room selection
    if (!selectedRoomId || !selectedRoom) {
      toast.error(t("booking.validation.roomRequired"));
      return false;
    }

    // Validate dates
    if (!checkInDate || !checkOutDate) {
      toast.error(t("booking.validation.datesRequired"));
      return false;
    }

    if (nights <= 0) {
      toast.error(t("booking.validation.invalidDateRange"));
      return false;
    }

    // Validate guest count
    const guestValidation = validateGuestCount(
      numberOfGuests,
      selectedRoom.capacity,
    );
    if (!guestValidation.valid) {
      toast.error(guestValidation.error);
      return false;
    }

    return true;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Note: Guest creation/lookup needs backend endpoint
    toast.error(
      "Guest creation not yet implemented. Backend guest endpoint needed.",
    );

    // Once guest creation is implemented:
    /*
    const payload: CreateBookingPayload = {
      guest: guestId,
      room: selectedRoomId!,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      number_of_guests: numberOfGuests,
      payment_method: paymentMethod,
      special_requests: specialRequests || undefined,
    };
    createMutation.mutate(payload);
    */
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="auth-heading">{t("booking.new.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("booking.new.subtitle")}
        </p>
      </div>

      {/* Centered Form Container */}
      <div className="flex-1 flex items-start justify-center py-8 px-6 pb-32">
        <div className="w-full max-w-[680px]">
          <form onSubmit={handleSubmit}>
            {/* Single Unified Card */}
            <div className="border border-border bg-card">
              {/* Section 1: Booking Type */}
              <div className="p-6">
                <BookingTypeSection
                  value={bookingType}
                  onChange={setBookingType}
                />
              </div>

              <Separator />

              {/* Section 2: Guest Information */}
              <div className="p-6">
                <GuestInfoSection value={guestInfo} onChange={setGuestInfo} />
              </div>

              <Separator />

              {/* Section 3: Room & Dates */}
              <div className="p-6 space-y-4">
                <Label className="label-caps">
                  {t("booking.roomDate.title")}
                </Label>

                {/* Room Selection */}
                <Field>
                  <Label htmlFor="room" className="label-caps">
                    {t("booking.roomDate.room")}
                  </Label>
                  <Select
                    value={selectedRoomId?.toString() || ""}
                    onValueChange={(value) => setSelectedRoomId(parseInt(value))}
                  >
                    <SelectTrigger id="room">
                      <SelectValue
                        placeholder={t("booking.roomDate.selectRoom")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.title} - {room.location} (
                          {formatCurrency(room.base_price_per_night)}/night)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <Label htmlFor="check_in" className="label-caps">
                      {t("booking.roomDate.checkIn")}
                    </Label>
                    <Input
                      id="check_in"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="check_out" className="label-caps">
                      {t("booking.roomDate.checkOut")}
                    </Label>
                    <Input
                      id="check_out"
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate}
                    />
                  </Field>
                </div>

                {/* Number of Guests */}
                <Field>
                  <Label htmlFor="guests" className="label-caps">
                    {t("booking.roomDate.guests")}
                  </Label>
                  <Input
                    id="guests"
                    type="number"
                    min={1}
                    max={selectedRoom?.capacity || 10}
                    value={numberOfGuests}
                    onChange={(e) =>
                      setNumberOfGuests(parseInt(e.target.value) || 1)
                    }
                  />
                  {selectedRoom && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("booking.roomDate.capacity")}: {selectedRoom.capacity}
                    </p>
                  )}
                </Field>
              </div>

              <Separator />

              {/* Section 4: Payment */}
              <div className="p-6 space-y-4">
                <Label className="label-caps">
                  {t("booking.payment.title")}
                </Label>

                {/* Payment Method */}
                <Field>
                  <Label htmlFor="payment_method" className="label-caps">
                    {t("booking.payment.method")}
                  </Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value: "cash" | "gateway") =>
                      setPaymentMethod(value)
                    }
                  >
                    <SelectTrigger id="payment_method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        {t("booking.payment.cash")}
                      </SelectItem>
                      <SelectItem value="gateway">
                        {t("booking.payment.gateway")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {/* Special Requests */}
                <Field>
                  <Label htmlFor="special_requests" className="label-caps">
                    {t("booking.payment.specialRequests")}
                  </Label>
                  <Textarea
                    id="special_requests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder={t("booking.payment.specialRequestsPlaceholder")}
                    rows={3}
                  />
                </Field>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Fixed Bottom Summary Strip - Centered */}
      <div className="fixed bottom-0 left-0 right-0 border-t-2 border-primary bg-card shadow-lg z-50">
        <div className="flex justify-center px-6 py-4">
          <div className="w-full max-w-[680px] flex items-center justify-between">
            {/* Summary */}
            <div className="flex items-center gap-6">
              <div>
                <p className="label-caps">{t("booking.summary.checkIn")}</p>
                <p className="font-mono text-sm">
                  {checkInDate
                    ? format(new Date(checkInDate), "MMM dd")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="label-caps">{t("booking.summary.checkOut")}</p>
                <p className="font-mono text-sm">
                  {checkOutDate
                    ? format(new Date(checkOutDate), "MMM dd")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="label-caps">{t("booking.summary.total")}</p>
                <p className="font-mono text-lg font-semibold">
                  {nights > 0 && selectedRoom ? (
                    <>
                      {nights} × {formatCurrency(selectedRoom.base_price_per_night)}{" "}
                      = {formatCurrency(totalPrice)}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/bookings")}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending
                  ? t("booking.creating")
                  : t("booking.create")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewBooking;
