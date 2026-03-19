/**
 * New Booking Form - Main Component
 * Multi-section form for creating walk-in or phone bookings
 * Uses react-hook-form with FormProvider pattern for form management
 * Uses tanstack/react-query for API calls
 *
 * Layout: Centered card (~680px) with sidebar visible
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  useForm,
  FormProvider,
  useController,
  useFormContext,
} from "react-hook-form";
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
  SearchGuestsDialog,
} from "../../../../components/booking";
import { fetchManagerRooms, createBooking, createGuest } from "./api";
import { calculateNights, calculateTotalPrice, formatCurrency } from "./utils";
import type {
  CreateBookingPayload,
  GuestSearchResult,
  BookingFormState,
} from "./types";
import DashboardLayout from "../../layout";

// ─── Default Form State ──────────────────────────────────────────────────────

function defaultFormState(): BookingFormState {
  return {
    booking_type: "walk-in",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    room_id: null,
    check_in_date: "",
    check_out_date: "",
    number_of_guests: 1,
    payment_method: "cash",
    special_requests: "",
  };
}

// ─── Child Components ────────────────────────────────────────────────────────

interface RoomDateSectionProps {
  rooms: any[];
  selectedRoom: any;
}

function RoomDateSection({ rooms, selectedRoom }: RoomDateSectionProps) {
  const { t } = useTranslation();
  const { register, watch } = useFormContext<BookingFormState>();
  const { field: roomField } = useController<BookingFormState, "room_id">({
    name: "room_id",
  });

  const checkInDate = watch("check_in_date");

  return (
    <div className="p-6 space-y-4">
      <Label className="label-caps">{t("booking.roomDate.title")}</Label>

      {/* Room Selection */}
      <Field>
        <Label htmlFor="room" className="label-caps">
          {t("booking.roomDate.room")}
        </Label>
        <Select
          value={roomField.value?.toString() || ""}
          onValueChange={(value) => roomField.onChange(parseInt(value))}
        >
          <SelectTrigger id="room">
            <SelectValue placeholder={t("booking.roomDate.selectRoom")} />
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
          <Input id="check_in" type="date" {...register("check_in_date")} />
        </Field>

        <Field>
          <Label htmlFor="check_out" className="label-caps">
            {t("booking.roomDate.checkOut")}
          </Label>
          <Input
            id="check_out"
            type="date"
            {...register("check_out_date")}
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
          {...register("number_of_guests", { valueAsNumber: true })}
        />
        {selectedRoom && (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("booking.roomDate.capacity")}: {selectedRoom.capacity}
          </p>
        )}
      </Field>
    </div>
  );
}

function PaymentSection() {
  const { t } = useTranslation();
  const { register } = useFormContext<BookingFormState>();
  const { field: paymentMethodField } = useController<
    BookingFormState,
    "payment_method"
  >({
    name: "payment_method",
  });

  return (
    <div className="p-6 space-y-4">
      <Label className="label-caps">{t("booking.payment.title")}</Label>

      {/* Payment Method */}
      <Field>
        <Label htmlFor="payment_method" className="label-caps">
          {t("booking.payment.method")}
        </Label>
        <Select
          value={paymentMethodField.value}
          onValueChange={paymentMethodField.onChange}
        >
          <SelectTrigger id="payment_method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">{t("booking.payment.cash")}</SelectItem>
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
          {...register("special_requests")}
          placeholder={t("booking.payment.specialRequestsPlaceholder")}
          rows={3}
        />
      </Field>
    </div>
  );
}

interface BookingSummaryStripProps {
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  selectedRoom: any;
  totalPrice: string;
  isSubmitting: boolean;
  onCancel: () => void;
}

function BookingSummaryStrip({
  checkInDate,
  checkOutDate,
  nights,
  selectedRoom,
  totalPrice,
  isSubmitting,
  onCancel,
}: BookingSummaryStripProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t-2 border-primary bg-card shadow-lg z-50">
      <div className="flex justify-center px-6 py-4">
        <div className="w-full max-w-[680px] flex items-center justify-between">
          {/* Summary */}
          <div className="flex items-center gap-6">
            <div>
              <p className="label-caps">{t("booking.summary.checkIn")}</p>
              <p className="font-mono text-sm">
                {checkInDate ? format(new Date(checkInDate), "MMM dd") : "—"}
              </p>
            </div>
            <div>
              <p className="label-caps">{t("booking.summary.checkOut")}</p>
              <p className="font-mono text-sm">
                {checkOutDate ? format(new Date(checkOutDate), "MMM dd") : "—"}
              </p>
            </div>
            <div>
              <p className="label-caps">{t("booking.summary.total")}</p>
              <p className="font-mono text-lg font-semibold">
                {nights > 0 && selectedRoom ? (
                  <>
                    {nights} ×{" "}
                    {formatCurrency(selectedRoom.base_price_per_night)} ={" "}
                    {formatCurrency(totalPrice)}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("booking.creating") : t("booking.create")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NewBooking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Guest search dialog state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [selectedExistingGuest, setSelectedExistingGuest] =
    useState<GuestSearchResult | null>(null);

  // ── React Hook Form ─────────────────────────────────────────────────────────

  const methods = useForm<BookingFormState>({
    defaultValues: defaultFormState(),
  });

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { isDirty },
  } = methods;

  // ── Data fetching ───────────────────────────────────────────────────────────

  // Watch form values for calculations
  const checkInDate = watch("check_in_date");
  const checkOutDate = watch("check_out_date");
  const selectedRoomId = watch("room_id");

  // Fetch manager's rooms
  const { data: roomsData } = useQuery({
    queryKey: ["manager-rooms"],
    queryFn: () => fetchManagerRooms({ is_active: true }),
  });

  const rooms = roomsData?.results || [];
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // ── Calculations ────────────────────────────────────────────────────────────

  // Calculate booking details
  const nights = calculateNights(checkInDate, checkOutDate);
  const totalPrice = selectedRoom
    ? calculateTotalPrice(selectedRoom.base_price_per_night, nights)
    : "0.00";

  // ── Mutations ───────────────────────────────────────────────────────────────

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

  // ── Event Handlers ──────────────────────────────────────────────────────────

  // Handle guest selection from search dialog
  const handleSelectGuest = (guest: GuestSearchResult) => {
    setSelectedExistingGuest(guest);
    setValue("first_name", guest.first_name);
    setValue("last_name", guest.last_name);
    setValue("email", guest.email || "");
    setValue("phone", guest.phone_number);
    setSearchDialogOpen(false);
  };

  // Form submission
  const onSubmit = async (data: BookingFormState) => {
    // Validate room selection
    if (!data.room_id || !selectedRoom) {
      toast.error(t("booking.validation.roomRequired"));
      return;
    }

    // Validate dates
    if (!data.check_in_date || !data.check_out_date) {
      toast.error(t("booking.validation.datesRequired"));
      return;
    }

    if (nights <= 0) {
      toast.error(t("booking.validation.invalidDateRange"));
      return;
    }

    // Validate guest count
    if (
      data.number_of_guests < 1 ||
      data.number_of_guests > selectedRoom.capacity
    ) {
      toast.error(
        t("booking.validation.guestCountExceedsCapacity", {
          capacity: selectedRoom.capacity,
        }),
      );
      return;
    }

    try {
      let guestId: number;

      if (selectedExistingGuest) {
        // Use existing guest
        guestId = selectedExistingGuest.id;
      } else {
        // Create new shadow guest
        const guestResponse = await createGuest({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone_number: data.phone,
        });

        // Show notification if phone already existed
        if (guestResponse.is_existing) {
          toast.info(
            `Guest with phone ${data.phone} already exists. Using existing guest.`,
          );
        }

        guestId = guestResponse.guest.id;
      }

      // Create booking
      const payload: CreateBookingPayload = {
        guest: guestId,
        room: data.room_id,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        number_of_guests: data.number_of_guests,
        payment_method: data.payment_method,
        special_requests: data.special_requests || undefined,
      };

      await createMutation.mutateAsync(payload);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t("booking.createError"));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
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
                {/* Single Unified Card */}
                <div className="border border-border bg-card">
                  {/* Section 1: Booking Type */}
                  <div className="p-6">
                    <BookingTypeSection />
                  </div>

                  <Separator />

                  {/* Section 2: Guest Information */}
                  <div className="p-6">
                    <GuestInfoSection
                      onOpenSearch={() => setSearchDialogOpen(true)}
                      isExistingGuest={!!selectedExistingGuest}
                    />
                  </div>

                  <Separator />

                  {/* Section 3: Room & Dates */}
                  <RoomDateSection rooms={rooms} selectedRoom={selectedRoom} />

                  <Separator />

                  {/* Section 4: Payment */}
                  <PaymentSection />
                </div>
              </div>
            </div>

            {/* Fixed Bottom Summary Strip */}
            <BookingSummaryStrip
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              nights={nights}
              selectedRoom={selectedRoom}
              totalPrice={totalPrice}
              isSubmitting={createMutation.isPending}
              onCancel={() => navigate("/dashboard/bookings")}
            />
          </div>
        </form>

        {/* Search Guests Dialog */}
        <SearchGuestsDialog
          open={searchDialogOpen}
          onOpenChange={setSearchDialogOpen}
          onSelectGuest={handleSelectGuest}
        />
      </FormProvider>
    </DashboardLayout>
  );
}

export default NewBooking;
