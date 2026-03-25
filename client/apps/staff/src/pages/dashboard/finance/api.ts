import { axiosClient } from "../../../lib/axiosClient";
import type {
  PaginatedPayments,
  PaymentFilters,
  PaymentStatistics,
  PaginatedPayouts,
  PayoutFilters,
  PayoutStatistics,
  PaginatedBankAccounts,
  Payout,
  BankAccount,
  StripeConnectStatus,
  StripeOnboardingResponse,
} from "./types";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Payment API
// ---------------------------------------------------------------------------

/**
 * Fetch paginated list of payments with optional filters.
 * GET /api/payments/payments/
 */
export async function fetchPayments(
  params?: PaymentFilters
): Promise<PaginatedPayments> {
  const query: Record<string, string | number> = {};

  if (params?.page !== undefined) query.page = params.page;
  if (params?.page_size !== undefined) query.page_size = params.page_size;
  if (params?.date_from) query.date_from = params.date_from;
  if (params?.date_to) query.date_to = params.date_to;
  if (params?.status) query.status = params.status;
  if (params?.payment_type) query.payment_type = params.payment_type;
  if (params?.ordering) query.ordering = params.ordering;

  const response = await axiosClient.get<
    ApiEnvelope<
      | PaginatedPayments
      | {
          results: PaginatedPayments["results"];
          pagination?: {
            page?: number;
            page_size?: number;
            total_pages?: number;
            total_count?: number;
          };
        }
    >
  >(
    "/api/payments/payments/",
    { params: query }
  );

  const payload = response.data.data;

  if (
    payload &&
    typeof payload === "object" &&
    "count" in payload &&
    "results" in payload
  ) {
    return payload as PaginatedPayments;
  }

  if (payload && typeof payload === "object" && "results" in payload) {
    const normalized = payload as {
      results: PaginatedPayments["results"];
      pagination?: { total_count?: number };
    };

    return {
      count:
        normalized.pagination?.total_count ?? normalized.results?.length ?? 0,
      next: null,
      previous: null,
      results: normalized.results ?? [],
    };
  }

  return {
    count: 0,
    next: null,
    previous: null,
    results: [],
  };
}

/**
 * Fetch payment statistics for the commissions tab.
 * GET /api/payments/payments/statistics/
 */
export async function fetchPaymentStatistics(params?: {
  period?: "month" | "quarter" | "year";
  date_from?: string;
  date_to?: string;
}): Promise<PaymentStatistics> {
  const query: Record<string, string> = {};

  if (params?.period) query.period = params.period;
  if (params?.date_from) query.date_from = params.date_from;
  if (params?.date_to) query.date_to = params.date_to;

  const response = await axiosClient.get<ApiEnvelope<PaymentStatistics>>(
    "/api/payments/payments/statistics/",
    { params: query }
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Payout API
// ---------------------------------------------------------------------------

/**
 * Fetch paginated list of payouts with optional filters.
 * GET /api/payments/payouts/
 */
export async function fetchPayouts(
  params?: PayoutFilters
): Promise<PaginatedPayouts> {
  const query: Record<string, string | number> = {};

  if (params?.page !== undefined) query.page = params.page;
  if (params?.page_size !== undefined) query.page_size = params.page_size;
  if (params?.status) query.status = params.status;

  const response = await axiosClient.get<ApiEnvelope<PaginatedPayouts | Payout[]>>(
    "/api/payments/payouts/",
    { params: query }
  );

  const payload = response.data.data;

  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload,
    };
  }

  return {
    count: payload?.count ?? 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: payload?.results ?? [],
  };
}

/**
 * Fetch payout statistics for the payouts tab.
 * GET /api/payments/payouts/statistics/
 */
export async function fetchPayoutStatistics(): Promise<PayoutStatistics> {
  const response = await axiosClient.get<ApiEnvelope<PayoutStatistics>>(
    "/api/payments/payouts/statistics/"
  );
  return response.data.data;
}

// ---------------------------------------------------------------------------
// Bank Account API
// ---------------------------------------------------------------------------

/**
 * Fetch list of bank accounts for the authenticated manager.
 * GET /api/payments/bank-accounts/
 */
export async function fetchBankAccounts(): Promise<PaginatedBankAccounts> {
  const response = await axiosClient.get<
    ApiEnvelope<PaginatedBankAccounts | BankAccount[]>
  >(
    "/api/payments/bank-accounts/"
  );

  const payload = response.data.data;

  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload,
    };
  }

  return {
    count: payload?.count ?? 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: payload?.results ?? [],
  };
}

// ---------------------------------------------------------------------------
// Stripe Connect API
// ---------------------------------------------------------------------------

/**
 * Fetch Stripe Connect account status for the authenticated manager.
 * GET /api/payments/stripe/connect/status/
 */
export async function fetchStripeConnectStatus(): Promise<StripeConnectStatus> {
  const response = await axiosClient.get<ApiEnvelope<StripeConnectStatus>>(
    "/api/payments/stripe/connect/status/"
  );
  return response.data.data;
}

/**
 * Start Stripe Connect onboarding flow.
 * POST /api/payments/stripe/connect/onboard/
 */
export async function startStripeOnboarding(params: {
  refresh_url?: string;
  return_url?: string;
}): Promise<StripeOnboardingResponse> {
  const response = await axiosClient.post<ApiEnvelope<StripeOnboardingResponse>>(
    "/api/payments/stripe/connect/onboard/",
    params
  );
  return response.data.data;
}
