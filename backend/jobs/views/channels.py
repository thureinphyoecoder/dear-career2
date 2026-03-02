from django.core.exceptions import ValidationError
import json
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from ..admin_api import require_admin_api_auth
from ..models import AdminNotification, ChannelCredential, Job
from ..serializers import serialize_channel_credential
from ..services.publish import publish_job
from ..validation import clean_text_input, clean_url_input, format_validation_error, validate_instance
from .shared import create_admin_notification, load_json_body


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["GET", "PATCH"])
def facebook_channel_credential(request: HttpRequest):
    credential, _ = ChannelCredential.objects.get_or_create(
        platform=ChannelCredential.PlatformChoices.FACEBOOK
    )

    if request.method == "GET":
        return JsonResponse(serialize_channel_credential(credential))

    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    if "account_name" in payload:
        credential.account_name = clean_text_input(payload.get("account_name", ""))
    if "page_id" in payload:
        credential.page_id = clean_text_input(payload.get("page_id", ""))
    if "access_token" in payload:
        credential.access_token = clean_text_input(payload.get("access_token", ""))
    if "profile_name" in payload:
        credential.profile_name = clean_text_input(payload.get("profile_name", ""))
    if "profile_image_url" in payload:
        credential.profile_image_url = clean_url_input(payload.get("profile_image_url", ""))

    try:
        validate_instance(credential)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid Facebook credential payload."))
    credential.save()
    return JsonResponse(serialize_channel_credential(credential))


@require_GET
@require_admin_api_auth
def facebook_page_posts(request: HttpRequest):
    credential = ChannelCredential.objects.filter(
        platform=ChannelCredential.PlatformChoices.FACEBOOK
    ).first()
    if not credential or not credential.page_id or not credential.access_token:
        return HttpResponseBadRequest("Facebook page is not connected yet.")

    try:
        import requests
    except ImportError as exc:
        return HttpResponseBadRequest(str(exc))

    try:
        response = requests.get(
            f"https://graph.facebook.com/v23.0/{credential.page_id}/feed",
            params={
                "fields": ",".join(
                    [
                        "message",
                        "permalink_url",
                        "created_time",
                        "full_picture",
                        "reactions.summary(total_count).limit(0)",
                        "comments.summary(total_count).limit(0)",
                        "shares",
                    ]
                ),
                "limit": 10,
                "access_token": credential.access_token,
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        error_text = ""
        if getattr(exc, "response", None) is not None:
            try:
                payload = exc.response.json()
                error_text = str(payload.get("error", {}).get("message", "")).strip()
            except (ValueError, json.JSONDecodeError, AttributeError):
                error_text = exc.response.text.strip()
        message = error_text or str(exc)
        if "pages_read_engagement" in message:
            return HttpResponseBadRequest(
                "Facebook post history cannot be loaded yet. Reconnect the page with the pages_read_engagement permission."
            )
        return HttpResponseBadRequest(f"Unable to load Facebook posts: {message}")

    posts = [
        {
            "id": str(item.get("id", "")),
            "message": item.get("message", ""),
            "permalink_url": item.get("permalink_url", ""),
            "created_time": item.get("created_time"),
            "full_picture": item.get("full_picture", ""),
            "reactions_count": int(item.get("reactions", {}).get("summary", {}).get("total_count", 0)),
            "comments_count": int(item.get("comments", {}).get("summary", {}).get("total_count", 0)),
            "shares_count": int(item.get("shares", {}).get("count", 0)),
        }
        for item in payload.get("data", [])
    ]
    return JsonResponse({"results": posts})


@csrf_exempt
@require_admin_api_auth
@require_POST
def facebook_publish_job(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    raw_job_id = str(payload.get("job_id", "")).strip()
    if not raw_job_id:
        return HttpResponseBadRequest("Job is required.")

    job = get_object_or_404(Job, pk=raw_job_id)
    result = publish_job(job, channel="facebook", message=clean_text_input(payload.get("message", "")))
    if not result.get("published"):
        reason = str(result.get("reason", "Facebook publish failed."))
        create_admin_notification(
            f"{job.title} Facebook post failed",
            reason,
            tone=AdminNotification.ToneChoices.WARNING,
        )
        return HttpResponseBadRequest(reason)

    create_admin_notification(
        f"{job.title} posted to Facebook",
        f"{job.company} is now live on the connected Facebook page.",
        tone=AdminNotification.ToneChoices.SUCCESS,
    )
    return JsonResponse(result)
