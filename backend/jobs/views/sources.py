from django.core.exceptions import ValidationError
from urllib.parse import urlparse

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from ..admin_api import require_admin_api_auth
from ..fetch_security import UnsafeFetchTargetError, validate_public_fetch_url
from ..models import AdminNotification, FetchRun, FetchSource, Job
from ..serializers import serialize_fetch_run, serialize_fetch_source
from ..services.ingest import ingest_source
from ..validation import (
    clean_json_object,
    clean_text_input,
    clean_url_input,
    format_validation_error,
    validate_instance,
)
from .shared import (
    create_admin_notification,
    derive_source_key_from_url,
    derive_source_label_from_url,
    load_json_body,
)


@require_GET
@require_admin_api_auth
def fetch_source_list(request: HttpRequest):
    sources = FetchSource.objects.all()
    return JsonResponse({"count": sources.count(), "results": [serialize_fetch_source(source) for source in sources]})


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["POST"])
def fetch_source_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    raw_feed_url = clean_url_input(payload.get("feed_url", ""))
    if not raw_feed_url:
        return HttpResponseBadRequest("Source URL is required.")
    try:
        validate_public_fetch_url(raw_feed_url)
    except UnsafeFetchTargetError as exc:
        return HttpResponseBadRequest(str(exc))

    derived_domain = urlparse(raw_feed_url).netloc.replace("www.", "")
    derived_label = clean_text_input(payload.get("label", "")) or derive_source_label_from_url(
        raw_feed_url, derived_domain
    )
    derived_key = clean_text_input(payload.get("key", "")) or derive_source_key_from_url(
        raw_feed_url, derived_domain
    )
    source_domain = clean_text_input(payload.get("domain", "")) or derived_domain

    if not derived_key:
        return HttpResponseBadRequest("Unable to derive a source key from that URL.")
    if not derived_label:
        return HttpResponseBadRequest("Unable to derive a source label from that URL.")
    if not source_domain:
        return HttpResponseBadRequest("Unable to derive a source domain from that URL.")
    if FetchSource.objects.filter(key=derived_key).exists():
        return HttpResponseBadRequest("Source key already exists.")

    source = FetchSource(
        key=derived_key,
        label=derived_label,
        domain=source_domain,
        feed_url=raw_feed_url,
        mode=payload.get("mode", FetchSource.ModeChoices.MANUAL),
        enabled=payload.get("enabled", True),
        requires_manual_url=payload.get("requires_manual_url", True),
        auto_publish_website=payload.get("auto_publish_website", True),
        auto_publish_facebook=payload.get("auto_publish_facebook", False),
        approval_required_for_website=payload.get("approval_required_for_website", False),
        approval_required_for_facebook=payload.get("approval_required_for_facebook", True),
        default_category=payload.get("default_category", Job.CategoryChoices.WHITE_COLLAR),
        cadence_value=payload.get("cadence_value", 30),
        cadence_unit=payload.get("cadence_unit", FetchSource.CadenceUnit.MINUTES),
        max_jobs_per_run=payload.get("max_jobs_per_run", 25),
        selectors=clean_json_object(payload.get("selectors", {})),
        headers=clean_json_object(payload.get("headers", {})),
    )
    try:
        validate_instance(source)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid source payload."))
    source.save()
    return JsonResponse(serialize_fetch_source(source), status=201)


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["PATCH", "DELETE"])
def fetch_source_update(request: HttpRequest, source_id: int):
    source = get_object_or_404(FetchSource, pk=source_id)

    if request.method == "DELETE":
        source.delete()
        return JsonResponse({"detail": "Source deleted."})

    try:
        payload = load_json_body(request)
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
            if field == "feed_url":
                setattr(source, field, clean_url_input(payload[field]))
            elif field in {"label", "domain", "mode", "default_category", "cadence_unit", "status"}:
                setattr(source, field, clean_text_input(payload[field]))
            elif field in {"selectors", "headers"}:
                setattr(source, field, clean_json_object(payload[field]))
            else:
                setattr(source, field, payload[field])

    required = {
        "label": clean_text_input(source.label),
        "domain": clean_text_input(source.domain),
        "mode": clean_text_input(source.mode),
    }
    missing = [field for field, value in required.items() if not value]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")
    if source.feed_url:
        try:
            validate_public_fetch_url(source.feed_url)
        except UnsafeFetchTargetError as exc:
            return HttpResponseBadRequest(str(exc))

    try:
        validate_instance(source)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid source payload."))
    source.save()
    return JsonResponse(serialize_fetch_source(source))


@csrf_exempt
@require_admin_api_auth
@require_POST
def fetch_source_run(request: HttpRequest, source_id: int):
    source = get_object_or_404(FetchSource, pk=source_id)
    try:
        result = ingest_source(source)
    except Exception as exc:
        latest_run = FetchRun.objects.filter(source=source).order_by("-started_at").first()
        create_admin_notification(
            f"{source.label} run failed",
            str(exc),
            tone=AdminNotification.ToneChoices.WARNING,
            source=source,
            fetch_run=latest_run,
            target_url="/admin/fetch",
        )
        return HttpResponseBadRequest(str(exc))

    latest_run = FetchRun.objects.filter(source=source).order_by("-started_at").first()
    create_admin_notification(
        f"{source.label} run complete",
        f"{result.get('fetched_count', 0)} fetched, {result.get('created_count', 0)} created, {result.get('updated_count', 0)} updated.",
        tone=AdminNotification.ToneChoices.SUCCESS,
        source=source,
        fetch_run=latest_run,
        target_url="/admin/fetch",
    )
    return JsonResponse(result)


@require_GET
@require_admin_api_auth
def fetch_run_list(request: HttpRequest):
    runs = list(FetchRun.objects.select_related("source")[:20])
    return JsonResponse({"count": len(runs), "results": [serialize_fetch_run(run) for run in runs]})
