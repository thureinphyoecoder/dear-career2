from datetime import timedelta

from django.db.models import Count, Max, Q
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..models import AdminNotification, FetchSource, Job, ManagedAd, VisitorEvent
from ..serializers import (
    serialize_admin_notification,
    serialize_approval_item,
    serialize_fetch_source,
    serialize_visitor_summary,
)
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


@require_GET
def admin_dashboard_snapshot(request: HttpRequest):
    today = timezone.localdate()
    last_7_days = today - timedelta(days=6)

    job_counts = Job.objects.aggregate(
        total_jobs=Count("id"),
        published_jobs=Count("id", filter=Q(is_active=True)),
        draft_jobs=Count("id", filter=Q(status=Job.WorkflowStatus.DRAFT)),
        pending_count=Count(
            "id",
            filter=Q(status=Job.WorkflowStatus.PENDING_REVIEW)
            | Q(requires_website_approval=True)
            | Q(requires_facebook_approval=True),
        ),
    )

    visitor_counts = VisitorEvent.objects.aggregate(
        total_visitors=Count("session_key", distinct=True),
        today_visitors=Count(
            "session_key",
            filter=Q(visit_date=today),
            distinct=True,
        ),
        last_7_days_visitors=Count(
            "session_key",
            filter=Q(visit_date__gte=last_7_days),
            distinct=True,
        ),
    )

    top_paths = list(
        VisitorEvent.objects.values("path")
        .annotate(
            visitors=Count("session_key", distinct=True),
            visits=Count("id"),
            last_seen_at=Max("last_seen_at"),
        )
        .order_by("-visitors", "path")[:8]
    )

    pending_jobs = list(
        Job.objects.filter(
            Q(status=Job.WorkflowStatus.PENDING_REVIEW)
            | Q(requires_website_approval=True)
            | Q(requires_facebook_approval=True)
        )
        .order_by("-updated_at")[:12]
    )
    notifications = list(
        AdminNotification.objects.select_related("source", "fetch_run").order_by("-created_at")[:15]
    )
    sources = list(FetchSource.objects.order_by("label"))
    active_ads = ManagedAd.objects.filter(status=ManagedAd.StatusChoices.ACTIVE).count()

    return JsonResponse(
        {
            "total_jobs": job_counts["total_jobs"] or 0,
            "published_jobs": job_counts["published_jobs"] or 0,
            "draft_jobs": job_counts["draft_jobs"] or 0,
            "source_count": len(sources),
            "total_visitors": visitor_counts["total_visitors"] or 0,
            "active_ads": active_ads,
            "pending_approvals": [serialize_approval_item(job) for job in pending_jobs],
            "notifications": [serialize_admin_notification(item) for item in notifications],
            "sources": [serialize_fetch_source(source) for source in sources],
            "visitor_summary": serialize_visitor_summary(
                {
                    "total_visitors": visitor_counts["total_visitors"] or 0,
                    "today_visitors": visitor_counts["today_visitors"] or 0,
                    "last_7_days_visitors": visitor_counts["last_7_days_visitors"] or 0,
                    "top_paths": top_paths,
                }
            ),
        }
    )
