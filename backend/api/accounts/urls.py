from django.urls import path, include
from .views.otp import VerifyOTPView, ResendOTPView, OTPInitiateView, ResetPasswordView, ResetPasswordView
from .views.staff import CreateGuestView, SearchGuestsView


urlpatterns = [
    path("", include("djoser.urls")),
    path("", include("djoser.urls.authtoken")),
    path("", include("djoser.urls.jwt")),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
    path("initiate-otp/", OTPInitiateView.as_view(), name="otp-initiate"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    # Staff guest management
    path("guests/", CreateGuestView.as_view(), name="create-guest"),
    path("guests/search/", SearchGuestsView.as_view(), name="search-guests"),
]
