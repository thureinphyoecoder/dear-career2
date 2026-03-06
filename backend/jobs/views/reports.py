from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST

from ..admin_api import require_admin_api_auth
from ..models import AdminNotification, Job, JobReport
from ..serializers import serialize_job_report
from ..validation import clean_text_input, format_validation_error, validate_instance
from .shared import create_admin_notification, load_json_body


@csrf_exempt
@require_POST
def job_report_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    raw_job_id = payload.get("job_id")
    if raw_job_id is None:
        return HttpResponseBadRequest("Missing required field: job_id")

    try:
        job_id = int(raw_job_id)
    except (TypeError, ValueError):
        return HttpResponseBadRequest("job_id must be an integer.")

    job = Job.objects.filter(pk=job_id).first()
    if job is None:
        return HttpResponseBadRequest("Job not found.")

    reason = clean_text_input(payload.get("reason")).lower()
    valid_reasons = {choice[0] for choice in JobReport.ReasonChoices.choices}
    if reason not in valid_reasons:
        return HttpResponseBadRequest("Invalid reason. Use scam, inaccurate, expired, duplicate, or other.")

    report = JobReport(
        job=job,
        job_title=job.title,
        job_company=job.company,
        job_location=job.location,
        job_slug=job.slug,
        reporter_name=clean_text_input(payload.get("name")),
        reporter_email=clean_text_input(payload.get("email")),
        reason=reason,
        message=clean_text_input(payload.get("message")),
    )

    try:
        validate_instance(report)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid report payload."))

    report.save()
    create_admin_notification(
        "Job report submitted",
        f"{job.title} at {job.company} was reported by a visitor.",
        tone=AdminNotification.ToneChoices.WARNING,
        target_url="/admin/reports",
    )

    return JsonResponse({"id": report.pk, "detail": "Report received. Admin has been notified."}, status=201)


@require_admin_api_auth
@require_http_methods(["GET"])
def admin_report_list(request: HttpRequest):
    reports = list(JobReport.objects.select_related("job")[:100])
    return JsonResponse({"count": len(reports), "results": [serialize_job_report(item) for item in reports]})


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["PATCH"])
def admin_report_detail(request: HttpRequest, report_id: int):
    report = get_object_or_404(JobReport, pk=report_id)

    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    next_status = clean_text_input(payload.get("status")).lower()
    if next_status:
        valid_statuses = {choice[0] for choice in JobReport.StatusChoices.choices}
        if next_status not in valid_statuses:
            return HttpResponseBadRequest("Invalid status. Use open, reviewed, or resolved.")
        report.status = next_status
        report.reviewed_at = timezone.now() if next_status in {"reviewed", "resolved"} else None

    if "review_note" in payload:
        report.review_note = clean_text_input(payload.get("review_note"))

    try:
        validate_instance(report)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid report update payload."))

    report.save()
    return JsonResponse(serialize_job_report(report))
