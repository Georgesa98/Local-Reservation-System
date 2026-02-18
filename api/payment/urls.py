from django.urls import path

from .views import (
    BankAccountDetailView,
    BankAccountListView,
    BookingPaymentListView,
    PaymentDetailView,
    PaymentProviderConfigView,
    PaymentProviderDetailView,
    PaymentProviderListView,
    PaymentProviderSetActiveView,
    PayoutDetailView,
    PayoutListView,
    RefundCreateView,
    StripeWebhookView,
)

urlpatterns = [
    # Providers (admin)
    path("providers/", PaymentProviderListView.as_view(), name="provider-list"),
    path(
        "providers/<int:pk>/",
        PaymentProviderDetailView.as_view(),
        name="provider-detail",
    ),
    path(
        "providers/<int:pk>/activate/",
        PaymentProviderSetActiveView.as_view(),
        name="provider-activate",
    ),
    path(
        "providers/<int:pk>/config/",
        PaymentProviderConfigView.as_view(),
        name="provider-config",
    ),
    # Payments
    path(
        "bookings/<int:booking_id>/",
        BookingPaymentListView.as_view(),
        name="booking-payment-list",
    ),
    path("<int:pk>/", PaymentDetailView.as_view(), name="payment-detail"),
    path("<int:pk>/refund/", RefundCreateView.as_view(), name="payment-refund"),
    # Webhook
    path("webhook/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
    # Payouts
    path("payouts/", PayoutListView.as_view(), name="payout-list"),
    path("payouts/<int:pk>/", PayoutDetailView.as_view(), name="payout-detail"),
    # Bank accounts
    path("bank-accounts/", BankAccountListView.as_view(), name="bank-account-list"),
    path(
        "bank-accounts/<int:pk>/",
        BankAccountDetailView.as_view(),
        name="bank-account-detail",
    ),
]
