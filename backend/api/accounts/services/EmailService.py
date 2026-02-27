from django.core.mail import send_mail
from django.conf import settings

from api.notification.models import Channel, Notification, Status


def send_otp_email(user, otp_code: str) -> Notification:
    """
    Send an OTP code via email and log it as a Notification.

    Args:
        user: The User instance (must have email set).
        otp_code: The 6-digit OTP code to send.

    Returns:
        The created Notification instance.
    """
    subject = "Your verification code"
    message = f"Your OTP code is {otp_code}. It will expire in 5 minutes."

    notification = Notification.objects.create(
        user_id=user,
        channel=Channel.EMAIL,
        recipient=user.email,
        message=message,
        status=Status.SENT,
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        notification.status = Status.DELIVERED
        notification.save(update_fields=["status"])
    except Exception as e:
        notification.status = Status.FAILED
        notification.response_data = {"error": str(e)}
        notification.save(update_fields=["status", "response_data"])

    return notification
