from urllib.parse import urlparse

from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..admin_api import has_valid_admin_api_key, require_admin_api_auth
from ..fetch_security import UnsafeFetchTargetError, validate_public_fetch_url
from ..models import AdminNotification, Job
from ..services.images import normalize_uploaded_image
from ..services.ocr import (
    OCREngineUnavailableError,
    OCRExtractionError,
    extract_text_from_image_bytes,
)
from ..services.job_admin import (
    apply_job_payload,
    build_job_from_payload,
    clear_uploaded_job_image,
    format_job_validation_error,
    persist_job,
)
from ..services.publish import publish_job
from ..serializers import serialize_job
from .shared import (
    build_image_text_job_payload,
    build_scraped_job_payload,
    create_admin_notification,
    load_json_body,
)


@require_GET
def job_list(request: HttpRequest):
    include_inactive = request.GET.get("include_inactive") == "1" and has_valid_admin_api_key(request)
    compact = request.GET.get("compact") == "1" and include_inactive
    jobs = (
        Job.objects.all()
        if include_inactive
        else Job.objects.filter(
            is_active=True,
            status=Job.WorkflowStatus.PUBLISHED,
            requires_website_approval=False,
        )
    )
    if compact:
        jobs = jobs.defer("description_mm", "description_en")
    results = [
        serialize_job(
            job,
            include_source_url=include_inactive,
            include_descriptions=not compact,
        )
        for job in jobs
    ]
    return JsonResponse({"count": len(results), "results": results})


@require_GET
def public_job_detail(request: HttpRequest, slug: str):
    job = get_object_or_404(
        Job,
        slug=slug,
        is_active=True,
        status=Job.WorkflowStatus.PUBLISHED,
        requires_website_approval=False,
    )
    return JsonResponse(serialize_job(job, include_source_url=False))


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["POST"])
def job_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    try:
        job = persist_job(build_job_from_payload(payload))
    except Exception as exc:
        return HttpResponseBadRequest(format_job_validation_error(exc))

    maybe_auto_publish(job)
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

    try:
        apply_job_payload(job, payload)
        persist_job(job)
    except Exception as exc:
        return HttpResponseBadRequest(format_job_validation_error(exc))

    maybe_auto_publish(job, force_facebook=True)

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


def maybe_auto_publish(job: Job, *, force_facebook: bool = False) -> None:
    if job.status != Job.WorkflowStatus.PUBLISHED or not job.is_active:
        return

    if not job.requires_website_approval:
        publish_job(job, channel="website")

    if job.requires_facebook_approval:
        return

    if job.is_fb_posted and not force_facebook:
        return

    was_fb_posted = bool(job.is_fb_posted)
    result = publish_job(job, channel="facebook")
    if result.get("published"):
        notification_title = (
            f"{job.title} updated on Facebook"
            if force_facebook and was_fb_posted
            else f"{job.title} posted to Facebook"
        )
        create_admin_notification(
            notification_title,
            f"{job.company} is now live on Facebook. Post ID: {result.get('post_id', 'n/a')}",
            tone=AdminNotification.ToneChoices.SUCCESS,
            target_url="/admin/facebook",
        )
    else:
        reason = str(result.get("reason", "Facebook publish failed."))
        create_admin_notification(
            f"{job.title} Facebook post failed",
            reason,
            tone=AdminNotification.ToneChoices.WARNING,
            target_url="/admin/facebook",
        )


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["POST", "DELETE"])
def job_image_upload(request: HttpRequest, job_id: int):
    job = get_object_or_404(Job, pk=job_id)

    if request.method == "DELETE":
        clear_uploaded_job_image(job, save=True)
        return JsonResponse(serialize_job(job))

    uploaded_file = request.FILES.get("image")
    if uploaded_file is None:
        return HttpResponseBadRequest("Missing uploaded file: image")

    try:
        filename, content = normalize_uploaded_image(uploaded_file)
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


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["POST"])
def job_image_ocr_preview(request: HttpRequest):
    uploaded_file = request.FILES.get("image")
    if uploaded_file is None:
        return HttpResponseBadRequest("Missing uploaded file: image")
    ocr_mode = (request.POST.get("ocr_mode") or "balanced").strip().lower()

    try:
        extracted_text = extract_text_from_image_bytes(
            uploaded_file.name,
            uploaded_file.read(),
            ocr_mode,
        )
    except (ValueError, OCRExtractionError, OCREngineUnavailableError) as exc:
        create_admin_notification(
            "Image OCR failed",
            str(exc),
            tone=AdminNotification.ToneChoices.WARNING,
            target_url="/admin/jobs/new",
        )
        return HttpResponseBadRequest(str(exc))

    result = build_image_text_job_payload(extracted_text)
    create_admin_notification(
        "Image OCR ready",
        f"{result['title']} from {result['company']} was extracted from an uploaded image.",
        tone=AdminNotification.ToneChoices.SUCCESS,
        target_url="/admin/jobs/new",
    )
    return JsonResponse(result)
