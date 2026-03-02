from datetime import timedelta

from django.db.models import Count, Max
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..models import VisitorEvent
from ..serializers import serialize_visitor_summary
from .shared import load_json_body


@csrf_exempt
@require_http_methods(["POST"])
def visitor_track(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    session_key = str(payload.get("session_key", "")).strip()
    path = str(payload.get("path", "")).strip()
    page_title = str(payload.get("page_title", "")).strip()
    if not session_key or not path:
        return HttpResponseBadRequest("Missing required fields: session_key, path")

    today = timezone.localdate()
    event, created = VisitorEvent.objects.get_or_create(
        session_key=session_key,
        path=path,
        visit_date=today,
        defaults={"page_title": page_title[:160]},
    )
    if not created:
        updates: list[str] = []
        if page_title and event.page_title != page_title[:160]:
            event.page_title = page_title[:160]
            updates.append("page_title")
        event.save(update_fields=updates + ["last_seen_at"])

    return JsonResponse({"recorded": True, "created": created})


@require_GET
def visitor_summary(request: HttpRequest):
    today = timezone.localdate()
    last_7_days = today - timedelta(days=6)
    events = VisitorEvent.objects.all()
    payload = {
        "total_visitors": events.values("session_key").distinct().count(),
        "today_visitors": events.filter(visit_date=today).values("session_key").distinct().count(),
        "last_7_days_visitors": events.filter(visit_date__gte=last_7_days)
        .values("session_key")
        .distinct()
        .count(),
        "top_paths": list(
            events.values("path")
            .annotate(
                visitors=Count("session_key", distinct=True),
                visits=Count("id"),
                last_seen_at=Max("last_seen_at"),
            )
            .order_by("-visitors", "path")[:8]
        ),
    }
    return JsonResponse(serialize_visitor_summary(payload))
