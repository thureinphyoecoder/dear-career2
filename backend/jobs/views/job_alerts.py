from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.conf import settings

from ..models import JobAlertSubscriber
from ..validation import clean_text_input
from .shared import load_json_body


@csrf_exempt
@require_POST
def job_alert_subscribe(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    email = clean_text_input(payload.get("email")).lower()
    if not email:
        return HttpResponseBadRequest("Email is required.")
    try:
        validate_email(email)
    except ValidationError:
        return HttpResponseBadRequest("Enter a valid email address.")

    source = clean_text_input(payload.get("source")) or "public"

    email_subject = "You are subscribed to Dear Career Job Alerts"
    email_body = (
        "Hi,\n\n"
        "You are now subscribed to Dear Career Job Alerts.\n"
        "We will send new job updates to this email address.\n\n"
        "If this was not you, please ignore this email.\n\n"
        "Dear Career"
    )

    subscriber, created = JobAlertSubscriber.objects.get_or_create(
        email=email,
        defaults={"source": source, "is_active": True},
    )

    if created:
        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.JOB_ALERT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            subscriber.delete()
            return JsonResponse(
                {"detail": "Subscription failed: email delivery is unavailable right now."},
                status=502,
            )
        return JsonResponse({"detail": "Job alert subscribed.", "id": subscriber.pk}, status=201)

    if not subscriber.is_active or subscriber.source != source:
        subscriber.is_active = True
        subscriber.source = source
        subscriber.save(update_fields=["is_active", "source", "updated_at"])
        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.JOB_ALERT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            return JsonResponse(
                {"detail": "Subscription saved, but email delivery is unavailable right now."},
                status=502,
            )
        return JsonResponse({"detail": "Job alert subscribed.", "id": subscriber.pk}, status=200)

    return JsonResponse({"detail": "You are already subscribed.", "id": subscriber.pk}, status=200)
