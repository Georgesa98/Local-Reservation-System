from django.urls import path

from .views import NotificationDetailView, NotificationListView, TelegramRegisterView

urlpatterns = [
    path("", NotificationListView.as_view(), name="notification-list"),
    path("<int:pk>/", NotificationDetailView.as_view(), name="notification-detail"),
    path("telegram/register/", TelegramRegisterView.as_view(), name="telegram-register"),
]
