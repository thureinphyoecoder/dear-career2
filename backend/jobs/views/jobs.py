from io import BytesIO
import uuid
from pathlib import Path
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from urllib.parse import urlparse

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods
from PIL import Image, UnidentifiedImageError

from ..admin_api import has_valid_admin_api_key, require_admin_api_auth
from ..fetch_security import UnsafeFetchTargetError, validate_public_fetch_url
from ..models import AdminNotification, Job
from ..serializers import serialize_job
from ..validation import clean_text_input, clean_url_input, format_validation_error, validate_instance
from .shared import build_scraped_job_payload, create_admin_notification, load_json_body

MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
    "GIF": "gif",
}


def _build_generated_slug(title: str) -> str:
    base_slug = slugify(title) or "job"
    return f"{base_slug}-{uuid.uuid4().hex[:6]}"


def _normalize_uploaded_image(uploaded_file) -> tuple[str, ContentFile]:
    raw_bytes = uploaded_file.read()
    if len(raw_bytes) > MAX_IMAGE_UPLOAD_BYTES:
        raise ValueError("Image upload exceeds 10 MB limit.")

    try:
        with Image.open(BytesIO(raw_bytes)) as image:
            image.verify()
        with Image.open(BytesIO(raw_bytes)) as image:
            image_format = (image.format or "").upper()
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise ValueError("Uploaded file is not a valid image.") from exc

    extension = ALLOWED_IMAGE_FORMATS.get(image_format)
    if not extension:
        allowed_formats = ", ".join(sorted(ALLOWED_IMAGE_FORMATS.values()))
        raise ValueError(f"Unsupported image format. Allowed formats: {allowed_formats}.")

    sanitized_stem = slugify(Path(uploaded_file.name).stem) or "job-image"
    filename = f"{sanitized_stem}-{uuid.uuid4().hex[:8]}.{extension}"
    return filename, ContentFile(raw_bytes)


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
        slug=slug or _build_generated_slug(clean_text_input(payload["title"])),
        company=clean_text_input(payload["company"]),
        location=clean_text_input(payload["location"]),
        category=payload.get("category", Job.CategoryChoices.WHITE_COLLAR),
        description_mm=clean_text_input(payload["description_mm"]),
        description_en=clean_text_input(payload.get("description_en", "")),
        source=payload.get("source", Job.SourceChoices.MANUAL),
        source_url=clean_url_input(payload.get("source_url", "")) or None,
        image_url=clean_url_input(payload.get("image_url", "")),
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
    previous_status = job.status
    previous_active = job.is_active
    previous_requires_website_approval = job.requires_website_approval
    previous_requires_facebook_approval = job.requires_facebook_approval

    if request.method == "GET":
        return JsonResponse(serialize_job(job))

    if request.method == "DELETE":
        create_admin_notification(
            "Job deleted",
            f"{job.title} at {job.company} was deleted from the admin dashboard.",
            tone=AdminNotification.ToneChoices.WARNING,
            target_url="/admin/jobs",
        )
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
    if "image_url" in payload:
        job.image_url = clean_url_input(payload.get("image_url", ""))
    if "is_active" in payload:
        job.is_active = bool(payload["is_active"])
    if "requires_website_approval" in payload:
        job.requires_website_approval = bool(payload["requires_website_approval"])
    if "requires_facebook_approval" in payload:
        job.requires_facebook_approval = bool(payload["requires_facebook_approval"])
    if payload.get("remove_image_file"):
        if job.image_file:
            job.image_file.delete(save=False)
        job.image_file = ""

    required = {
        "title": clean_text_input(job.title),
        "company": clean_text_input(job.company),
        "location": clean_text_input(job.location),
        "description_mm": clean_text_input(job.description_mm),
    }
    if not clean_text_input(job.slug):
        job.slug = _build_generated_slug(job.title)
    missing = [field for field, value in required.items() if not value]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    try:
        validate_instance(job)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid job payload."))
    job.save()

    approval_cleared = (
        (previous_requires_website_approval and not job.requires_website_approval)
        or (previous_requires_facebook_approval and not job.requires_facebook_approval)
    )
    published_now = (
        job.status == Job.WorkflowStatus.PUBLISHED
        and (previous_status != Job.WorkflowStatus.PUBLISHED or not previous_active)
    )
    if published_now or approval_cleared:
        create_admin_notification(
            "Job published",
            f"{job.title} at {job.company} is now live and approvals have been cleared.",
            tone=AdminNotification.ToneChoices.SUCCESS,
            target_url=f"/admin/jobs/{job.id}",
        )

    return JsonResponse(serialize_job(job))


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["POST", "DELETE"])
def job_image_upload(request: HttpRequest, job_id: int):
    job = get_object_or_404(Job, pk=job_id)

    if request.method == "DELETE":
        if job.image_file:
            job.image_file.delete(save=False)
            job.image_file = ""
            job.save(update_fields=["image_file", "updated_at"])
        return JsonResponse(serialize_job(job))

    uploaded_file = request.FILES.get("image")
    if uploaded_file is None:
        return HttpResponseBadRequest("Missing uploaded file: image")

    try:
        filename, content = _normalize_uploaded_image(uploaded_file)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    if job.image_file:
        job.image_file.delete(save=False)
    job.image_file.save(filename, content, save=False)
    job.save(update_fields=["image_file", "updated_at"])
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
            target_url="/admin/jobs/new",
        )
        return HttpResponseBadRequest(f"Unable to fetch URL: {exc}")

    result = build_scraped_job_payload(url, response.text)
    create_admin_notification(
        "Manual scrape ready",
        f"{result['title']} from {result['company']} was fetched and is ready for review.",
        tone=AdminNotification.ToneChoices.SUCCESS,
        target_url="/admin/jobs/new",
    )
    return JsonResponse(result)
