import json
import time

from django.http import HttpRequest, JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_GET

from ..models import AdminNotification
from ..serializers import serialize_admin_notification


@require_GET
def admin_notification_list(request: HttpRequest):
    notifications = list(AdminNotification.objects.select_related("source", "fetch_run")[:15])
    return JsonResponse(
        {
            "count": len(notifications),
            "results": [serialize_admin_notification(item) for item in notifications],
        }
    )


@require_GET
def admin_notification_stream(request: HttpRequest):
    last_id = 0
    raw_last_id = request.META.get("HTTP_LAST_EVENT_ID") or request.GET.get("last_id")
    if raw_last_id:
        try:
            last_id = int(raw_last_id)
        except (TypeError, ValueError):
            last_id = 0

    def event_stream():
        current_last_id = last_id
        started = time.monotonic()
        yield b"retry: 3000\n\n"

        while time.monotonic() - started < 55:
            notifications = list(
                AdminNotification.objects.filter(id__gt=current_last_id).order_by("id")[:20]
            )
            for notification in notifications:
                payload = json.dumps(serialize_admin_notification(notification))
                notification_id = int(notification.pk or 0)
                yield f"id: {notification_id}\n".encode("utf-8")
                yield b"event: notification\n"
                yield f"data: {payload}\n\n".encode("utf-8")
                current_last_id = notification_id

            yield b": keepalive\n\n"
            time.sleep(2)

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response
