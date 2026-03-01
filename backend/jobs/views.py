import json

from django.shortcuts import get_object_or_404
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .models import FetchRun, FetchSource, Job
from .serializers import serialize_fetch_run, serialize_fetch_source, serialize_job
from .services.ingest import ingest_source


def _load_json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON body.") from exc


@require_GET
def job_list(request):
    include_inactive = request.GET.get("include_inactive") == "1"
    jobs = Job.objects.all() if include_inactive else Job.objects.filter(is_active=True)
    results = [serialize_job(job) for job in jobs]
    return JsonResponse({"count": len(results), "results": results})


@require_GET
def fetch_source_list(request):
    sources = FetchSource.objects.all()
    return JsonResponse(
        {
            "count": sources.count(),
            "results": [serialize_fetch_source(source) for source in sources],
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def fetch_source_create(request: HttpRequest):
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["key", "label", "domain", "mode"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return HttpResponseBadRequest(
            f"Missing required fields: {', '.join(missing)}"
        )

    source = FetchSource.objects.create(
        key=payload["key"],
        label=payload["label"],
        domain=payload["domain"],
        feed_url=payload.get("feed_url", ""),
        mode=payload["mode"],
        enabled=payload.get("enabled", True),
        requires_manual_url=payload.get("requires_manual_url", False),
        auto_publish_website=payload.get("auto_publish_website", True),
        auto_publish_facebook=payload.get("auto_publish_facebook", False),
        approval_required_for_website=payload.get(
            "approval_required_for_website", False
        ),
        approval_required_for_facebook=payload.get(
            "approval_required_for_facebook", True
        ),
        default_category=payload.get(
            "default_category", Job.CategoryChoices.WHITE_COLLAR
        ),
        cadence_value=payload.get("cadence_value", 30),
        cadence_unit=payload.get("cadence_unit", FetchSource.CadenceUnit.MINUTES),
        max_jobs_per_run=payload.get("max_jobs_per_run", 25),
        selectors=payload.get("selectors", {}),
        headers=payload.get("headers", {}),
    )
    return JsonResponse(serialize_fetch_source(source), status=201)


@csrf_exempt
@require_http_methods(["PATCH"])
def fetch_source_update(request: HttpRequest, source_id: int):
    source = get_object_or_404(FetchSource, pk=source_id)
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    for field in [
        "label",
        "domain",
        "feed_url",
        "mode",
        "enabled",
        "requires_manual_url",
        "auto_publish_website",
        "auto_publish_facebook",
        "approval_required_for_website",
        "approval_required_for_facebook",
        "default_category",
        "cadence_value",
        "cadence_unit",
        "max_jobs_per_run",
        "selectors",
        "headers",
        "status",
    ]:
        if field in payload:
            setattr(source, field, payload[field])

    source.save()
    return JsonResponse(serialize_fetch_source(source))


@csrf_exempt
@require_POST
def fetch_source_run(request: HttpRequest, source_id: int):
    source = get_object_or_404(FetchSource, pk=source_id)
    result = ingest_source(source)
    return JsonResponse(result)


@require_GET
def fetch_run_list(request):
    runs = FetchRun.objects.select_related("source")[:20]
    return JsonResponse(
        {"count": len(runs), "results": [serialize_fetch_run(run) for run in runs]}
    )
