from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from ..models import FeedbackMessage
from .shared import load_json_body


@csrf_exempt
@require_POST
def feedback_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["name", "email", "subject", "message"]
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    feedback = FeedbackMessage.objects.create(
        name=str(payload["name"]).strip(),
        email=str(payload["email"]).strip(),
        subject=str(payload["subject"]).strip(),
        message=str(payload["message"]).strip(),
    )
    return JsonResponse({"id": feedback.pk, "detail": "Feedback received."}, status=201)
