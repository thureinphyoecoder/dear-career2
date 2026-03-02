from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from ..models import FeedbackMessage
from ..validation import clean_text_input, format_validation_error, validate_instance
from .shared import load_json_body


@csrf_exempt
@require_POST
def feedback_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["name", "email", "subject", "message"]
    missing = [field for field in required if not clean_text_input(payload.get(field))]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    feedback = FeedbackMessage(
        name=clean_text_input(payload["name"]),
        email=clean_text_input(payload["email"]),
        subject=clean_text_input(payload["subject"]),
        message=clean_text_input(payload["message"]),
    )
    try:
        validate_instance(feedback)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid feedback payload."))
    feedback.save()
    return JsonResponse({"id": feedback.pk, "detail": "Feedback received."}, status=201)
