from django.core.exceptions import ValidationError
from urllib.parse import urlparse

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..admin_api import has_valid_admin_api_key, require_admin_api_auth
from ..fetch_security import UnsafeFetchTargetError, validate_public_fetch_url
from ..models import AdminNotification, Job
from ..serializers import serialize_job
from ..validation import clean_text_input, clean_url_input, format_validation_error, validate_instance
from .shared import build_scraped_job_payload, create_admin_notification, load_json_body


@require_GET
def job_list(request: HttpRequest):
    include_inactive = request.GET.get("include_inactive") == "1" and has_valid_admin_api_key(request)
    jobs = Job.objects.all() if include_inactive else Job.objects.filter(is_active=True)
    results = [serialize_job(job) for job in jobs]
    return JsonResponse({"count": len(results), "results": results})


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["POST"])
def job_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["title", "company", "location", "description_mm"]
    missing = [field for field in required if not clean_text_input(payload.get(field))]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    slug = clean_text_input(payload.get("slug", ""))
    job = Job(
        title=clean_text_input(payload["title"]),
        slug=slug or "",
        company=clean_text_input(payload["company"]),
        location=clean_text_input(payload["location"]),
        category=payload.get("category", Job.CategoryChoices.WHITE_COLLAR),
        description_mm=clean_text_input(payload["description_mm"]),
        description_en=clean_text_input(payload.get("description_en", "")),
        source=payload.get("source", Job.SourceChoices.MANUAL),
        source_url=clean_url_input(payload.get("source_url", "")) or None,
        employment_type=payload.get("employment_type", Job.EmploymentType.FULL_TIME),
        salary=clean_text_input(payload.get("salary", "")),
        contact_email=clean_text_input(payload.get("contact_email", "")),
        contact_phone=clean_text_input(payload.get("contact_phone", "")),
        status=payload.get("status", Job.WorkflowStatus.DRAFT),
        is_active=bool(payload.get("is_active", True)),
        requires_website_approval=bool(payload.get("requires_website_approval", False)),
        requires_facebook_approval=bool(payload.get("requires_facebook_approval", False)),
    )
    try:
        validate_instance(job)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid job payload."))
    job.save()
    return JsonResponse(serialize_job(job), status=201)


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["GET", "PATCH", "DELETE"])
def job_detail(request: HttpRequest, job_id: int):
    job = get_object_or_404(Job, pk=job_id)

    if request.method == "GET":
        return JsonResponse(serialize_job(job))

    if request.method == "DELETE":
        job.delete()
        return JsonResponse({"detail": "Job deleted."})

    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    for field in [
        "title",
        "slug",
        "company",
        "location",
        "category",
        "description_mm",
        "description_en",
        "source",
        "employment_type",
        "salary",
        "contact_email",
        "contact_phone",
        "status",
    ]:
        if field in payload:
            setattr(job, field, clean_text_input(payload[field]))

    if "source_url" in payload:
        job.source_url = clean_url_input(payload.get("source_url", "")) or None
    if "is_active" in payload:
        job.is_active = bool(payload["is_active"])
    if "requires_website_approval" in payload:
        job.requires_website_approval = bool(payload["requires_website_approval"])
    if "requires_facebook_approval" in payload:
        job.requires_facebook_approval = bool(payload["requires_facebook_approval"])

    required = {
        "title": clean_text_input(job.title),
        "company": clean_text_input(job.company),
        "location": clean_text_input(job.location),
        "description_mm": clean_text_input(job.description_mm),
    }
    missing = [field for field, value in required.items() if not value]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    try:
        validate_instance(job)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid job payload."))
    job.save()
    return JsonResponse(serialize_job(job))


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["POST"])
def job_scrape_preview(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    url = str(payload.get("url", "")).strip()
    if not url:
        return HttpResponseBadRequest("Missing required field: url")
    try:
        validate_public_fetch_url(url)
    except UnsafeFetchTargetError as exc:
        return HttpResponseBadRequest(str(exc))

    try:
        import requests
    except ImportError as exc:
        return HttpResponseBadRequest(str(exc))

    request_headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0 Safari/537.36"
        )
    }
    try:
        response = requests.get(url, headers=request_headers, timeout=20)
        response.raise_for_status()
    except requests.RequestException as exc:
        create_admin_notification(
            "Manual scrape failed",
            f"{urlparse(url).netloc or 'Source URL'} could not be fetched. {exc}",
            tone=AdminNotification.ToneChoices.WARNING,
        )
        return HttpResponseBadRequest(f"Unable to fetch URL: {exc}")

    result = build_scraped_job_payload(url, response.text)
    create_admin_notification(
        "Manual scrape ready",
        f"{result['title']} from {result['company']} was fetched and is ready for review.",
        tone=AdminNotification.ToneChoices.SUCCESS,
    )
    return JsonResponse(result)
