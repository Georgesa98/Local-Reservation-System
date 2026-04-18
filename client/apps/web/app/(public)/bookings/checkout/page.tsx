"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format, differenceInCalendarDays } from "date-fns";
import {
    ArrowLeft,
    CalendarDays,
    ChevronDown,
    Info,
    ShieldCheck,
    Users,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "sonner";
import useCurrentUser from "@/hooks/useCurrentUser";
import { resolveImageUrl } from "@/lib/image-url";
import {
    StayDateCalendar,
    type StayDateRange,
} from "@/components/booking/stay-date-calendar";
import { createCheckoutBooking, fetchCheckoutRoom } from "./api";

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError<{ error?: string; message?: string }>(error)) {
        const responseData = error.response?.data;
        if (
            typeof responseData?.error === "string" &&
            responseData.error.trim()
        ) {
            return responseData.error;
        }

        if (
            typeof responseData?.message === "string" &&
            responseData.message.trim()
        ) {
            return responseData.message;
        }
    }

    return fallback;
}

export default function BookingCheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get("roomId") || "";
    const currentUser = useCurrentUser();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [guestCount, setGuestCount] = useState(2);
    const [specialRequests, setSpecialRequests] = useState("");
    const [dateRange, setDateRange] = useState<StayDateRange | undefined>();

    const roomQuery = useQuery({
        queryKey: ["booking", "checkout", "room", roomId],
        queryFn: () => fetchCheckoutRoom(roomId),
        enabled: Boolean(roomId),
    });

    const createBookingMutation = useMutation({
        mutationFn: createCheckoutBooking,
        onSuccess: (result) => {
            if (!result.client_secret) {
                toast.error(
                    "Booking created but Stripe setup is missing. Please contact support.",
                );
                return;
            }

            if (typeof window !== "undefined") {
                sessionStorage.setItem(
                    `booking_client_secret_${result.id}`,
                    result.client_secret,
                );
            }

            router.push(`/bookings/checkout/payment?bookingId=${result.id}`);
        },
        onError: (error) => {
            toast.error(
                getApiErrorMessage(
                    error,
                    "Unable to start Stripe checkout. Please try again.",
                ),
            );
        },
    });

    const room = roomQuery.data;
    const roomImage =
        room?.images.find((image) => image.is_main) || room?.images[0];

    useEffect(() => {
        if (!currentUser.user) {
            return;
        }

        if (!fullName.trim()) {
            setFullName(
                `${currentUser.user.first_name || ""} ${currentUser.user.last_name || ""}`.trim(),
            );
        }

        if (!email.trim()) {
            setEmail(currentUser.user.email || "");
        }
    }, [currentUser.user, email, fullName]);

    useEffect(() => {
        if (!room) {
            return;
        }

        setGuestCount((existing) =>
            Math.min(Math.max(1, existing), Math.max(1, room.capacity)),
        );
    }, [room]);

    const nightlyRate = useMemo(() => {
        if (!room) {
            return 0;
        }

        const parsed = Number.parseFloat(room.base_price_per_night);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [room]);

    const nightCount = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) {
            return 0;
        }

        return Math.max(
            0,
            differenceInCalendarDays(dateRange.to, dateRange.from),
        );
    }, [dateRange]);

    const totalPrice = useMemo(() => {
        if (!nightCount) {
            return nightlyRate;
        }

        return nightlyRate * nightCount;
    }, [nightCount, nightlyRate]);

    const isFormValid = Boolean(
        fullName.trim() &&
        email.trim() &&
        dateRange?.from &&
        dateRange?.to &&
        room &&
        guestCount >= 1,
    );

    function handleBack() {
        router.back();
    }

    function handleContinueToStripe() {
        if (!isFormValid || !room || !dateRange?.from || !dateRange?.to) {
            toast.error("Please complete guest details and stay dates first.");
            return;
        }

        if (createBookingMutation.isPending) {
            return;
        }

        if (!currentUser.user?.user_id) {
            toast.error("Please login to continue with booking.");
            router.push(
                `/login?next=${encodeURIComponent(`/bookings/checkout?roomId=${roomId}`)}`,
            );
            return;
        }

        createBookingMutation.mutate({
            guest_id: currentUser.user.user_id,
            room_id: room.id,
            check_in_date: format(dateRange.from, "yyyy-MM-dd"),
            check_out_date: format(dateRange.to, "yyyy-MM-dd"),
            number_of_guests: guestCount,
            booking_source: "web",
            special_requests: specialRequests.trim(),
            payment_method: "gateway",
        });
    }

    if (!roomId) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 pb-16 pt-10">
                <div className="radius-hero w-full bg-card p-6 text-center">
                    <h1 className="font-headline text-2xl font-bold text-foreground">
                        Missing reservation context
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Please select a room first, then tap Reserve Now.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/")}>
                        Browse rooms
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-3xl space-y-8 px-6 pb-44 pt-6">
            <header className="flex items-center justify-between gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <h1 className="font-headline text-xl font-bold text-foreground sm:text-2xl">
                    Confirm your stay
                </h1>

                <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                    Step 1 of 2
                </span>
            </header>

            <section className="radius-hero bg-card p-4 ambient-shadow-sm">
                {roomQuery.isLoading && (
                    <div className="flex items-center gap-4">
                        <div className="h-24 w-28 animate-pulse rounded-2xl bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                            <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
                            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                        </div>
                    </div>
                )}

                {!roomQuery.isLoading && room && (
                    <div className="flex items-start gap-4">
                        <div className="radius-card relative h-24 w-28 overflow-hidden">
                            <Image
                                src={resolveImageUrl(roomImage?.image)}
                                alt={roomImage?.alt_text || room.title}
                                fill
                                className="object-cover"
                                sizes="112px"
                            />
                        </div>

                        <div className="space-y-1">
                            <p className="label-sm">Luxury Escape</p>
                            <h2 className="font-headline text-2xl font-bold text-foreground">
                                {room.title}
                            </h2>
                            <p className="text-base text-muted-foreground">
                                {room.location}
                            </p>
                        </div>
                    </div>
                )}

                {!roomQuery.isLoading && roomQuery.isError && (
                    <div className="text-center">
                        <h2 className="font-headline text-xl font-bold text-foreground">
                            Unable to load room details
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Please go back and try another room.
                        </p>
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex items-end justify-between">
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground">
                        Guest details
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="guest-full-name">Full name</Label>
                        <Input
                            id="guest-full-name"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            className="h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="guest-email">Email address</Label>
                        <Input
                            id="guest-email"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="h-12"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="guest-count">Guests</Label>
                            <div className="relative">
                                <Input
                                    id="guest-count"
                                    type="number"
                                    min={1}
                                    max={room?.capacity || 16}
                                    value={guestCount}
                                    onChange={(event) =>
                                        setGuestCount(
                                            Math.max(
                                                1,
                                                Number.parseInt(
                                                    event.target.value || "1",
                                                    10,
                                                ),
                                            ),
                                        )
                                    }
                                    className="h-12 pr-10"
                                />
                                <Users className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {room
                                    ? `Maximum ${room.capacity} guests for this stay.`
                                    : "Set the number of guests."}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="special-requests">
                                Special requests
                            </Label>
                            <Textarea
                                id="special-requests"
                                placeholder="Optional notes for your host"
                                value={specialRequests}
                                onChange={(event) =>
                                    setSpecialRequests(event.target.value)
                                }
                                className="min-h-12"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-headline text-3xl font-bold tracking-tight text-foreground">
                        Select stay dates
                    </h2>
                    <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Stripe next
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    Pick check-in and check-out dates like Airbnb. Payment
                    fields are intentionally removed from this step because
                    Stripe handles card collection in the next step.
                </p>

                <StayDateCalendar value={dateRange} onChange={setDateRange} />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Check-in
                        </p>
                        <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {dateRange?.from
                                ? format(dateRange.from, "MMM d, yyyy")
                                : "Select"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Check-out
                        </p>
                        <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {dateRange?.to
                                ? format(dateRange.to, "MMM d, yyyy")
                                : "Select"}
                        </p>
                    </div>

                    <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Nights
                        </p>
                        <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Info className="h-4 w-4 text-primary" />
                            {nightCount || 0}
                        </p>
                    </div>
                </div>
            </section>

            <section className="fixed bottom-0 left-0 z-60 w-full">
                <div className="radius-hero-top ambient-shadow-top mx-auto w-full max-w-3xl bg-card/90 px-6 pb-8 pt-4 backdrop-blur-2xl">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                Total price
                            </p>
                            <p className="font-headline text-4xl font-bold text-foreground">
                                {formatCurrency(totalPrice)}
                                <span className="ml-1 text-base font-medium text-muted-foreground">
                                    / {nightCount || 1}{" "}
                                    {nightCount === 1 ? "night" : "nights"}
                                </span>
                            </p>
                        </div>

                        <Button variant="outline" className="rounded-2xl">
                            Details
                            <ChevronDown className="ml-1 h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={handleContinueToStripe}
                        disabled={
                            !isFormValid ||
                            roomQuery.isLoading ||
                            roomQuery.isError ||
                            createBookingMutation.isPending
                        }
                        className="h-14 w-full rounded-2xl bg-linear-to-r from-primary to-primary/75 font-headline text-lg font-bold tracking-tight"
                    >
                        {createBookingMutation.isPending
                            ? "Creating secure payment..."
                            : "Continue to Stripe"}
                    </Button>
                </div>
            </section>
        </main>
    );
}
