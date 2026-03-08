from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from ..models import JobAlertSubscriber
from ..validation import clean_text_input, format_validation_error, validate_instance
from .shared import load_json_body


@csrf_exempt
@require_POST
def job_alert_subscribe(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    email = clean_text_input(payload.get("email"))
    if not email:
        return HttpResponseBadRequest("Email is required.")
    try:
        validate_email(email)
    except ValidationError:
        return HttpResponseBadRequest("Enter a valid email address.")

    source = clean_text_input(payload.get("source")) or "public"

    subscriber, created = JobAlertSubscriber.objects.get_or_create(
        email=email,
        defaults={"source": source, "is_active": True},
    )

    if not created and (not subscriber.is_active or subscriber.source != source):
        subscriber.is_active = True
        subscriber.source = source
        try:
            validate_instance(subscriber)
        except ValidationError as exc:
            return HttpResponseBadRequest(
                format_validation_error(exc, "Invalid subscription payload.")
            )
        subscriber.save(update_fields=["is_active", "source", "updated_at"])
        return JsonResponse({"detail": "Job alert subscribed.", "id": subscriber.pk}, status=200)

    if created:
        try:
            validate_instance(subscriber)
        except ValidationError as exc:
            subscriber.delete()
            return HttpResponseBadRequest(
                format_validation_error(exc, "Invalid subscription payload.")
            )
        return JsonResponse({"detail": "Job alert subscribed.", "id": subscriber.pk}, status=201)

    return JsonResponse({"detail": "You are already subscribed.", "id": subscriber.pk}, status=200)
