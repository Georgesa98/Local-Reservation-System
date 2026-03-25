// Mirrors backend serializers from /backend/api/payment/serializers.py
// Keep in sync with API_ENDPOINTS.md

// ---------------------------------------------------------------------------
// Payment Types
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";

export type PaymentType = "gateway" | "cash";

export interface Payment {
  id: number;
  booking: number;
  booking_reference?: string;
  guest_name?: string;
  amount: string; // DecimalField → string
  platform_fee: string; // DecimalField → string
  final_amount: string; // DecimalField → string
  status: PaymentStatus;
  payment_type: PaymentType;
  payment_method: string;
  gateway: string;
  gateway_transaction_id: string | null;
  paid_at: string | null; // ISO datetime
  created_at: string; // ISO datetime
}

export interface PaginatedPayments {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payment[];
}

export interface PaymentFilters {
  page?: number;
  page_size?: number;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
  status?: PaymentStatus;
  payment_type?: PaymentType;
  ordering?: string;
}

// ---------------------------------------------------------------------------
// Payment Statistics
// ---------------------------------------------------------------------------

export interface PaymentStatistics {
  total_commissions: string;
  commission_growth_percent: number;
  online_bookings_count: number;
  online_bookings_growth_percent: number;
  average_order_value: string;
  aov_growth_percent: number;
  period: string;
  date_from: string; // ISO datetime
  date_to: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// Payout Types
// ---------------------------------------------------------------------------

export type PayoutStatus = "pending" | "processing" | "completed" | "failed";

export interface Payout {
  id: number;
  manager: number;
  bank_account: number;
  amount: string; // DecimalField → string
  status: PayoutStatus;
  scheduled_for: string; // ISO datetime
  completed_at: string | null; // ISO datetime
  payout_details: Record<string, unknown>;
  created_at: string; // ISO datetime
}

export interface PaginatedPayouts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Payout[];
}

export interface PayoutFilters {
  page?: number;
  page_size?: number;
  status?: PayoutStatus;
}

// ---------------------------------------------------------------------------
// Payout Statistics
// ---------------------------------------------------------------------------

export interface NextPayout {
  id: number;
  amount: string;
  scheduled_for: string; // ISO datetime
  status: PayoutStatus;
}

export interface PayoutStatistics {
  pending_balance: string;
  paid_last_30_days: string;
  payout_growth_percent: number;
  next_payout: NextPayout | null;
}

// ---------------------------------------------------------------------------
// Bank Account Types
// ---------------------------------------------------------------------------

export interface BankAccount {
  id: number;
  bank_name: string;
  account_holder_name: string;
  account_type: "bank_transfer" | "mobile_money";
  routing_code: string;
  is_verified: boolean;
  is_active: boolean;
  verified_at: string | null;
  created_at: string; // ISO datetime
}

export interface PaginatedBankAccounts {
  count: number;
  next: string | null;
  previous: string | null;
  results: BankAccount[];
}
