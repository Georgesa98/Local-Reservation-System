"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { AlertCircle, ArrowLeft, Lock, Loader2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { fetchCheckoutBooking } from "../api";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = stripePublishableKey
    ? loadStripe(stripePublishableKey)
    : null;

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}

interface StripePaymentFormProps {
    bookingId: number;
}

function StripePaymentForm({ bookingId }: StripePaymentFormProps) {
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!stripe || !elements || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        const returnUrl = `${window.location.origin}/bookings/checkout/complete?bookingId=${bookingId}`;

        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: returnUrl,
            },
            redirect: "if_required",
        });

        if (result.error) {
            setErrorMessage(result.error.message || "Payment failed. Please try again.");
            setIsSubmitting(false);
            return;
        }

        router.push(`/bookings/checkout/complete?bookingId=${bookingId}`);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="radius-hero border border-border/40 bg-card p-4">
                <PaymentElement />
            </div>

            {errorMessage && (
                <div className="radius-card flex items-start gap-2 border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{errorMessage}</p>
                </div>
            )}

            <Button
                type="submit"
                disabled={!stripe || !elements || isSubmitting}
                className="h-12 w-full rounded-2xl bg-linear-to-r from-primary to-primary/75 font-semibold"
            >
                {isSubmitting ? "Confirming payment..." : "Pay securely"}
            </Button>
        </form>
    );
}

export default function BookingStripePaymentPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookingIdParam = searchParams.get("bookingId") || "";
    const bookingId = Number.parseInt(bookingIdParam, 10);
    const hasValidBookingId = Number.isFinite(bookingId) && bookingId > 0;

    const [clientSecret, setClientSecret] = useState<string>("");
    const [didCheckStorage, setDidCheckStorage] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        if (!hasValidBookingId) {
            setDidCheckStorage(true);
            return;
        }

        const storedClientSecret = sessionStorage.getItem(
            `booking_client_secret_${bookingId}`,
        );

        if (storedClientSecret) {
            setClientSecret(storedClientSecret);
        }

        setDidCheckStorage(true);
    }, [bookingId, hasValidBookingId]);

    const bookingQuery = useQuery({
        queryKey: ["booking", "checkout", "payment", bookingId],
        queryFn: () => fetchCheckoutBooking(bookingId),
        enabled: hasValidBookingId,
    });

    const amount = useMemo(() => {
        const parsed = Number.parseFloat(bookingQuery.data?.total_price || "0");
        return Number.isFinite(parsed) ? parsed : 0;
    }, [bookingQuery.data?.total_price]);

    if (!hasValidBookingId) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6 py-12">
                <div className="radius-hero w-full bg-card p-6 text-center">
                    <h1 className="font-headline text-2xl font-bold text-foreground">
                        Invalid payment context
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        We could not find a valid booking to pay for.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/")}>
                        Back to home
                    </Button>
                </div>
            </main>
        );
    }

    if (!stripePromise) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6 py-12">
                <div className="radius-hero w-full bg-card p-6 text-center">
                    <h1 className="font-headline text-2xl font-bold text-foreground">
                        Stripe key missing
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable card payments.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/")}>
                        Back to home
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto w-full max-w-2xl space-y-6 px-6 pb-16 pt-8">
            <header className="flex items-center justify-between gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Go back"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <h1 className="font-headline text-xl font-bold text-foreground sm:text-2xl">
                    Secure payment
                </h1>

                <span className="text-sm font-semibold uppercase tracking-widest text-primary">
                    Step 2 of 2
                </span>
            </header>

            <section className="radius-hero bg-card p-5 ambient-shadow-sm">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <span>Payments are encrypted and processed by Stripe.</span>
                </div>

                {bookingQuery.isLoading && (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading booking summary...
                    </div>
                )}

                {bookingQuery.data && (
                    <p className="mt-3 font-headline text-3xl font-bold text-foreground">
                        {formatCurrency(amount)}
                    </p>
                )}
            </section>

            {!didCheckStorage && (
                <div className="radius-hero flex items-center gap-2 border border-border/40 bg-card p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing secure payment session...
                </div>
            )}

            {didCheckStorage && !clientSecret && (
                <div className="radius-hero border border-amber-300 bg-amber-50 p-5 text-amber-900">
                    <h2 className="font-headline text-xl font-bold">Missing Stripe session</h2>
                    <p className="mt-2 text-sm">
                        Your payment session has expired. Please restart checkout from the room page.
                    </p>
                    <Button className="mt-4" onClick={() => router.push("/")}>
                        Browse rooms
                    </Button>
                </div>
            )}

            {didCheckStorage && clientSecret && (
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                    }}
                >
                    <StripePaymentForm bookingId={bookingId} />
                </Elements>
            )}
        </main>
    );
}
