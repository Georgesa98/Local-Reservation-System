"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CalendarDays,
	ChevronRight,
	ConciergeBell,
	MapPin,
	Share2,
	Users,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";
import { PropertyCard } from "@/components/property-card";
import useCurrentUser from "@/hooks/useCurrentUser";
import type { RoomCard, WishlistParams } from "@/lib/types/room";
import { resolveImageUrl } from "../../../lib/image-url";
import {
	fetchMyBookings,
	fetchWishlistRoomCards,
	type BookingRecord,
	wishlistRoom,
} from "./api";

type ProfileTab = "upcoming" | "past" | "wishlist";

const profileTabs: Array<{ id: ProfileTab; label: string }> = [
	{ id: "upcoming", label: "Upcoming" },
	{ id: "past", label: "Past Trips" },
	{ id: "wishlist", label: "Wishlist" },
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(value: string): Date {
	return new Date(`${value}T00:00:00`);
}

function getStartOfToday(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isPastBooking(booking: BookingRecord, today: Date): boolean {
	if (booking.status === "cancelled" || booking.status === "completed") {
		return true;
	}

	const checkOutDate = parseDateOnly(booking.check_out_date);
	return checkOutDate < today;
}

function formatCurrency(amount: string): string {
	const value = Number.parseFloat(amount);

	if (Number.isNaN(value)) {
		return amount;
	}

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDateRange(checkIn: string, checkOut: string): string {
	const formatter = new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
	});

	return `${formatter.format(parseDateOnly(checkIn))} - ${formatter.format(parseDateOnly(checkOut))}`;
}

function formatStatusLabel(status: BookingRecord["status"]): string {
	const statusLabels: Record<BookingRecord["status"], string> = {
		pending: "Pending",
		confirmed: "Confirmed",
		checked_in: "Checked In",
		completed: "Completed",
		cancelled: "Cancelled",
	};

	return statusLabels[status];
}

function getBookingPillLabel(booking: BookingRecord, today: Date): string {
	if (booking.status === "cancelled") {
		return "Cancelled";
	}

	if (booking.status === "completed") {
		return "Completed";
	}

	const checkInDate = parseDateOnly(booking.check_in_date);
	const checkOutDate = parseDateOnly(booking.check_out_date);

	if (checkInDate <= today && today < checkOutDate) {
		return "In Progress";
	}

	const diffDays = Math.ceil((checkInDate.getTime() - today.getTime()) / DAY_IN_MS);

	if (diffDays <= 0) {
		return "Today";
	}

	return diffDays === 1 ? "In 1 Day" : `In ${diffDays} Days`;
}

function BookingSkeletonCard() {
	return (
		<div className="radius-hero overflow-hidden bg-card ambient-shadow-md">
			<div className="aspect-16/10 animate-pulse bg-muted" />
			<div className="space-y-3 p-5">
				<div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
				<div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
				<div className="h-12 w-full animate-pulse rounded-2xl bg-muted" />
			</div>
		</div>
	);
}

function SummaryPill({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-full bg-surface-container-low px-4 py-2">
			<span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
				{label}
			</span>
			<p className="font-headline text-lg font-bold text-foreground">{value}</p>
		</div>
	);
}

function BookingTripCard({
	booking,
	today,
	variant,
}: {
	booking: BookingRecord;
	today: Date;
	variant: "upcoming" | "past";
}) {
	const roomImages = booking.room.images || [];
	const mainImage = roomImages.find((image) => image.is_main) || roomImages[0];
	const imageUrl = resolveImageUrl(mainImage?.image);
	const imageAlt = mainImage?.alt_text || booking.room.title;
	const pillLabel = getBookingPillLabel(booking, today);

	return (
		<article className="radius-hero overflow-hidden bg-card ambient-shadow-md">
			<Link href={`/rooms/${booking.room.id}`} className="block">
				<div className="relative aspect-16/10 overflow-hidden">
					<Image
						src={imageUrl}
						alt={imageAlt}
						fill
						className="object-cover transition-transform duration-700 hover:scale-105"
						sizes="(max-width: 768px) 100vw, 640px"
					/>
					<span className="absolute left-4 top-4 rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
						{pillLabel}
					</span>
				</div>
			</Link>

			<div className="space-y-4 p-5">
				<div className="space-y-1">
					<h3 className="font-headline text-2xl font-bold text-foreground sm:text-3xl">
						{booking.room.title}
					</h3>
					<p className="inline-flex items-center gap-1.5 text-base text-muted-foreground">
						<MapPin className="h-4 w-4" />
						{booking.room.location}
					</p>
				</div>

				<div className="rounded-2xl bg-surface-container-low px-3 py-3">
					<div className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground">
						<span className="inline-flex items-center gap-2">
							<CalendarDays className="h-4 w-4 text-primary" />
							{formatDateRange(
								booking.check_in_date,
								booking.check_out_date,
							)}
						</span>
						<span className="inline-flex items-center gap-2">
							<Users className="h-4 w-4 text-primary" />
							{booking.number_of_guests} {booking.number_of_guests === 1 ? "Guest" : "Guests"}
						</span>
						<span className="inline-flex items-center rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-primary">
							{formatStatusLabel(booking.status)}
						</span>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3">
					<Button
						variant="ghost"
						className="h-auto p-0 text-base font-bold text-primary hover:bg-transparent"
						asChild
					>
						<Link href={`/rooms/${booking.room.id}`}>
							{variant === "upcoming" ? "Manage Booking" : "View Stay"}
							<ChevronRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>

					<p className="font-headline text-2xl font-bold text-foreground">
						{formatCurrency(booking.total_price)}
					</p>
				</div>
			</div>
		</article>
	);
}

export default function ProfilePage() {
	const [activeTab, setActiveTab] = useState<ProfileTab>("upcoming");
	const currentUser = useCurrentUser();
	const queryClient = useQueryClient();

	const bookingsQueryKey = ["profile", "bookings"];
	const wishlistRoomsQueryKey = ["profile", "wishlist", "rooms"];

	const bookingsQuery = useQuery({
		queryKey: bookingsQueryKey,
		queryFn: () => fetchMyBookings(50),
	});

	const wishlistQuery = useQuery({
		queryKey: wishlistRoomsQueryKey,
		queryFn: () => fetchWishlistRoomCards(50),
	});

	const today = useMemo(() => getStartOfToday(), []);
	const bookings = bookingsQuery.data?.results || [];
	const wishlistRooms = wishlistQuery.data || [];

	const { upcomingBookings, pastBookings } = useMemo(() => {
		const upcoming: BookingRecord[] = [];
		const past: BookingRecord[] = [];

		bookings.forEach((booking) => {
			if (isPastBooking(booking, today)) {
				past.push(booking);
				return;
			}

			upcoming.push(booking);
		});

		upcoming.sort(
			(a, b) =>
				parseDateOnly(a.check_in_date).getTime() -
				parseDateOnly(b.check_in_date).getTime(),
		);

		past.sort(
			(a, b) =>
				parseDateOnly(b.check_in_date).getTime() -
				parseDateOnly(a.check_in_date).getTime(),
		);

		return {
			upcomingBookings: upcoming,
			pastBookings: past,
		};
	}, [bookings, today]);

	const firstName = currentUser.user?.first_name?.trim() || "User";
	const visibleBookings = activeTab === "upcoming" ? upcomingBookings : pastBookings;

	async function handleRoomWishlist(wishlistData: WishlistParams) {
		if (!wishlistData.user_id) {
			toast.error("Please login to save wishlist items.");
			return;
		}

		try {
			const message = await wishlistRoom(wishlistData);

			queryClient.setQueryData<RoomCard[]>(
				wishlistRoomsQueryKey,
				(currentRooms) =>
					currentRooms?.filter(
						(room) => room.id !== wishlistData.room_id,
					) || [],
			);

			void queryClient.invalidateQueries({
				queryKey: wishlistRoomsQueryKey,
			});

			toast.success(message);
		} catch {
			toast.error("Failed to update wishlist. Please try again.");
		}
	}

	async function handleReferFriend() {
		const sharePayload = {
			title: "LuxeStay",
			text: "Join me on LuxeStay and get a credit on your first booking.",
			url:
				typeof window !== "undefined"
					? `${window.location.origin}/signup`
					: "/signup",
		};

		try {
			if (navigator.share) {
				await navigator.share(sharePayload);
				toast.success("Referral invite sent.");
				return;
			}

			await navigator.clipboard.writeText(sharePayload.url);
			toast.success("Invite link copied to clipboard.");
		} catch {
			toast.error("Could not share invitation right now.");
		}
	}

	return (
		<main className="space-y-8 px-6 pb-32 pt-10">
			<section className="space-y-4">
				<p className="label-sm">Profile</p>
				<h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight text-foreground">
					Welcome Back,
					<span className="text-primary"> {firstName}</span>
				</h1>
				<p className="text-sm text-muted-foreground">
					Keep track of your upcoming stays, revisit past trips, and
					manage your wishlist in one place.
				</p>

				<div className="flex flex-wrap items-center gap-2">
					<SummaryPill label="Upcoming" value={upcomingBookings.length} />
					<SummaryPill label="Past" value={pastBookings.length} />
					<SummaryPill label="Wishlist" value={wishlistRooms.length} />
				</div>
			</section>

			<section className="space-y-5">
				<div className="radius-hero inline-flex w-full items-center gap-2 bg-surface-container-low p-1">
					{profileTabs.map((tab) => {
						const isActive = activeTab === tab.id;

						return (
							<Button
								key={tab.id}
								variant="ghost"
								onClick={() => setActiveTab(tab.id)}
								aria-pressed={isActive}
								className={cn(
									"h-10 flex-1 rounded-full px-3 text-sm font-semibold",
									isActive
										? "ambient-shadow bg-primary text-primary-foreground hover:bg-primary/90"
										: "text-foreground/70 hover:bg-card",
								)}
							>
								{tab.label}
							</Button>
						);
					})}
				</div>

				{activeTab !== "wishlist" && (
					<div className="space-y-5">
						<div className="flex items-end justify-between gap-3">
							<div className="space-y-1">
								<p className="label-sm">Wayfinding</p>
								<h2 className="font-headline text-3xl font-bold tracking-tight">
									{activeTab === "upcoming"
										? "Upcoming Journeys"
										: "Past Trips"}
								</h2>
							</div>
							<span className="font-headline text-xl font-bold text-primary">
								{visibleBookings.length}
							</span>
						</div>

						{bookingsQuery.isLoading && (
							<div className="space-y-6">
								{[1, 2].map((item) => (
									<BookingSkeletonCard key={item} />
								))}
							</div>
						)}

						{!bookingsQuery.isLoading && bookingsQuery.isError && (
							<div className="radius-hero bg-card p-6 text-center">
								<h3 className="font-headline text-xl font-bold text-foreground">
									Unable to load bookings
								</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									Please refresh and try again.
								</p>
							</div>
						)}

						{!bookingsQuery.isLoading &&
							!bookingsQuery.isError &&
							visibleBookings.length === 0 && (
								<div className="radius-hero bg-card p-6 text-center">
									<h3 className="font-headline text-xl font-bold text-foreground">
										{activeTab === "upcoming"
											? "No upcoming journeys"
											: "No past trips yet"}
									</h3>
									<p className="mt-2 text-sm text-muted-foreground">
										{activeTab === "upcoming"
											? "Once you confirm a reservation, it will show up here."
											: "Completed or cancelled stays will appear here."}
									</p>
								</div>
							)}

						{!bookingsQuery.isLoading &&
							!bookingsQuery.isError &&
							visibleBookings.length > 0 && (
								<div className="space-y-6">
									{visibleBookings.map((booking) => (
										<BookingTripCard
											key={booking.id}
											booking={booking}
											today={today}
											variant={activeTab}
										/>
									))}
								</div>
							)}
					</div>
				)}

				{activeTab === "wishlist" && (
					<div className="space-y-5">
						<div className="flex items-end justify-between gap-3">
							<div className="space-y-1">
								<p className="label-sm">Saved Stays</p>
								<h2 className="font-headline text-3xl font-bold tracking-tight">
									Wishlist
								</h2>
							</div>
							<span className="font-headline text-xl font-bold text-primary">
								{wishlistRooms.length}
							</span>
						</div>

						{wishlistQuery.isLoading && (
							<div className="space-y-6">
								{[1, 2].map((item) => (
									<BookingSkeletonCard key={item} />
								))}
							</div>
						)}

						{!wishlistQuery.isLoading && wishlistQuery.isError && (
							<div className="radius-hero bg-card p-6 text-center">
								<h3 className="font-headline text-xl font-bold text-foreground">
									Unable to load wishlist
								</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									Please try again in a moment.
								</p>
							</div>
						)}

						{!wishlistQuery.isLoading &&
							!wishlistQuery.isError &&
							wishlistRooms.length === 0 && (
								<div className="radius-hero bg-card p-6 text-center">
									<h3 className="font-headline text-xl font-bold text-foreground">
										Wishlist is empty
									</h3>
									<p className="mt-2 text-sm text-muted-foreground">
										Save properties you love and they will
										appear here.
									</p>
								</div>
							)}

						{!wishlistQuery.isLoading &&
							!wishlistQuery.isError &&
							wishlistRooms.length > 0 && (
								<div className="space-y-8">
									{wishlistRooms.map((room) => (
										<PropertyCard
											key={room.id}
											room={room}
											onFavoriteClick={handleRoomWishlist}
										/>
									))}
								</div>
							)}
					</div>
				)}
			</section>

			<section className="space-y-4">
				<div className="radius-hero flex items-center justify-between gap-4 bg-primary/10 p-5">
					<div>
						<h3 className="font-headline text-2xl font-bold text-foreground">
							Refer a Friend
						</h3>
						<p className="mt-1 text-sm text-muted-foreground">
							Get a booking credit when your referral completes a stay.
						</p>
					</div>
					<Button
						size="icon-lg"
						onClick={handleReferFriend}
						className="h-12 w-12 rounded-full"
						aria-label="Share referral invite"
					>
						<Share2 className="h-5 w-5" />
					</Button>
				</div>

				<div className="radius-hero bg-surface-container-low p-5">
					<div className="flex items-start gap-3">
						<div className="rounded-full bg-card p-2 text-primary">
							<ConciergeBell className="h-5 w-5" />
						</div>
						<div>
							<h4 className="font-headline text-lg font-bold text-foreground">
								Concierge
							</h4>
							<p className="mt-1 text-sm text-muted-foreground">
								24/7 assistance for bookings, local recommendations,
								and special requests.
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
