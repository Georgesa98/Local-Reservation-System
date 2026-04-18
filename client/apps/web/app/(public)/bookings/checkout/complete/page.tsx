"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
    fetchBookingPayments,
    fetchCheckoutBooking,
    type PaymentStatus,
} from "../api";

function isPaymentPending(status?: PaymentStatus): boolean {
    return status === "pending" || status === "processing";
}

export default function BookingCheckoutCompletePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingIdParam = searchParams.get("bookingId") || "";
    const bookingId = Number.parseInt(bookingIdParam, 10);
    const hasValidBookingId = Number.isFinite(bookingId) && bookingId > 0;

    const bookingQuery = useQuery({
        queryKey: ["booking", "checkout", "complete", "booking", bookingId],
        queryFn: () => fetchCheckoutBooking(bookingId),
        enabled: hasValidBookingId,
        refetchInterval: (query) => {
            if (query.state.data?.status === "pending") {
                return 4000;
            }

            return false;
        },
    });

    const paymentsQuery = useQuery({
        queryKey: ["booking", "checkout", "complete", "payments", bookingId],
        queryFn: () => fetchBookingPayments(bookingId),
        enabled: hasValidBookingId,
        refetchInterval: (query) => {
            const latestStatus = query.state.data?.[0]?.status;
            return isPaymentPending(latestStatus) ? 4000 : false;
        },
    });

    const latestPayment = paymentsQuery.data?.[0];
    const paymentStatus = latestPayment?.status;
    const bookingStatus = bookingQuery.data?.status;

    const isSuccess =
        bookingStatus === "confirmed" || paymentStatus === "completed";
    const isFailure = paymentStatus === "failed";
    const isPending = !isSuccess && !isFailure;

    useEffect(() => {
        if (!hasValidBookingId || typeof window === "undefined") {
            return;
        }

        if (isSuccess || isFailure) {
            sessionStorage.removeItem(`booking_client_secret_${bookingId}`);
        }
    }, [bookingId, hasValidBookingId, isFailure, isSuccess]);

    if (!hasValidBookingId) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6 py-12">
                <div className="radius-hero w-full bg-card p-6 text-center">
                    <h1 className="font-headline text-2xl font-bold text-foreground">
                        Invalid booking reference
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        We could not determine which booking to verify.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/")}>
                        Back to home
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-2xl space-y-6 px-6 pb-16 pt-10">
            <section className="radius-hero bg-card p-6 ambient-shadow-sm">
                {isSuccess && (
                    <div className="space-y-3 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                        <h1 className="font-headline text-3xl font-bold text-foreground">
                            Payment successful
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Your booking is confirmed and reflected in your
                            profile.
                        </p>
                    </div>
                )}

                {isFailure && (
                    <div className="space-y-3 text-center">
                        <XCircle className="mx-auto h-12 w-12 text-red-600" />
                        <h1 className="font-headline text-3xl font-bold text-foreground">
                            Payment failed
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Your card was not charged. Please try payment again.
                        </p>
                    </div>
                )}

                {isPending && (
                    <div className="space-y-3 text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        <h1 className="font-headline text-3xl font-bold text-foreground">
                            Finalizing payment
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            We are waiting for Stripe confirmation. This page
                            updates automatically.
                        </p>
                    </div>
                )}

                <div className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Booking status
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                            {bookingStatus || "pending"}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-surface-container-low p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Payment status
                        </p>
                        <p className="mt-1 font-semibold text-foreground">
                            {paymentStatus || "pending"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="flex flex-col gap-3 sm:flex-row">
                {isFailure && (
                    <Button
                        className="h-12 flex-1 rounded-2xl"
                        onClick={() =>
                            router.push(
                                `/bookings/checkout/payment?bookingId=${bookingId}`,
                            )
                        }
                    >
                        Retry payment
                    </Button>
                )}

                {isPending && (
                    <Button
                        variant="outline"
                        className="h-12 flex-1 rounded-2xl"
                        onClick={() => {
                            bookingQuery.refetch();
                            paymentsQuery.refetch();
                        }}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh status
                    </Button>
                )}

                <Button
                    variant={isSuccess ? "default" : "outline"}
                    className="h-12 flex-1 rounded-2xl"
                    onClick={() => router.push("/profile")}
                >
                    View profile trips
                </Button>
            </section>
        </main>
    );
}
