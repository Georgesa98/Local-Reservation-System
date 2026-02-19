from django.urls import path, include
from .views import VerifyOTPView, ResendOTPView


urlpatterns = [
    path("", include("djoser.urls")),
    path("", include("djoser.urls.authtoken")),
    path("", include("djoser.urls.jwt")),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
]
