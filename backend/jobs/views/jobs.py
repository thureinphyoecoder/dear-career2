from urllib.parse import urlparse

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..models import AdminNotification, Job
from ..serializers import serialize_job
from .shared import build_scraped_job_payload, create_admin_notification, load_json_body


@require_GET
def job_list(request: HttpRequest):
    include_inactive = request.GET.get("include_inactive") == "1"
    jobs = Job.objects.all() if include_inactive else Job.objects.filter(is_active=True)
    results = [serialize_job(job) for job in jobs]
    return JsonResponse({"count": len(results), "results": results})


@csrf_exempt
@require_http_methods(["POST"])
def job_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["title", "company", "location", "description_mm"]
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    slug = str(payload.get("slug", "")).strip()
    job = Job.objects.create(
        title=str(payload["title"]).strip(),
        slug=slug or "",
        company=str(payload["company"]).strip(),
        location=str(payload["location"]).strip(),
        category=payload.get("category", Job.CategoryChoices.WHITE_COLLAR),
        description_mm=str(payload["description_mm"]).strip(),
        description_en=str(payload.get("description_en", "")).strip(),
        source=payload.get("source", Job.SourceChoices.MANUAL),
        source_url=str(payload.get("source_url", "")).strip() or None,
        employment_type=payload.get("employment_type", Job.EmploymentType.FULL_TIME),
        salary=str(payload.get("salary", "")).strip(),
        contact_email=str(payload.get("contact_email", "")).strip(),
        contact_phone=str(payload.get("contact_phone", "")).strip(),
        status=payload.get("status", Job.WorkflowStatus.DRAFT),
        is_active=bool(payload.get("is_active", True)),
        requires_website_approval=bool(payload.get("requires_website_approval", False)),
        requires_facebook_approval=bool(payload.get("requires_facebook_approval", False)),
    )
    return JsonResponse(serialize_job(job), status=201)


@csrf_exempt
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
            setattr(job, field, str(payload[field]).strip())

    if "source_url" in payload:
        job.source_url = str(payload.get("source_url", "")).strip() or None
    if "is_active" in payload:
        job.is_active = bool(payload["is_active"])
    if "requires_website_approval" in payload:
        job.requires_website_approval = bool(payload["requires_website_approval"])
    if "requires_facebook_approval" in payload:
        job.requires_facebook_approval = bool(payload["requires_facebook_approval"])

    required = {
        "title": str(job.title).strip(),
        "company": str(job.company).strip(),
        "location": str(job.location).strip(),
        "description_mm": str(job.description_mm).strip(),
    }
    missing = [field for field, value in required.items() if not value]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    job.save()
    return JsonResponse(serialize_job(job))


@csrf_exempt
@require_http_methods(["POST"])
def job_scrape_preview(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    url = str(payload.get("url", "")).strip()
    if not url:
        return HttpResponseBadRequest("Missing required field: url")
    if not url.startswith(("http://", "https://")):
        return HttpResponseBadRequest("URL must start with http:// or https://")

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
        try:
            response = requests.get(url, headers=request_headers, timeout=20)
        except requests.exceptions.SSLError:
            requests.packages.urllib3.disable_warnings()  # type: ignore[attr-defined]
            response = requests.get(url, headers=request_headers, timeout=20, verify=False)
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
