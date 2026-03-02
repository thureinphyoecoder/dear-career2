from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from ..models import AdminNotification, ChannelCredential, Job
from ..serializers import serialize_channel_credential
from ..services.publish import publish_job
from .shared import create_admin_notification, load_json_body


@csrf_exempt
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
        credential.account_name = str(payload.get("account_name", "")).strip()
    if "page_id" in payload:
        credential.page_id = str(payload.get("page_id", "")).strip()
    if "access_token" in payload:
        credential.access_token = str(payload.get("access_token", "")).strip()
    if "profile_name" in payload:
        credential.profile_name = str(payload.get("profile_name", "")).strip()
    if "profile_image_url" in payload:
        credential.profile_image_url = str(payload.get("profile_image_url", "")).strip()

    credential.save()
    return JsonResponse(serialize_channel_credential(credential))


@require_GET
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
            f"https://graph.facebook.com/v23.0/{credential.page_id}/posts",
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
        return HttpResponseBadRequest(f"Unable to load Facebook posts: {exc}")

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
    result = publish_job(job, channel="facebook", message=str(payload.get("message", "")).strip())
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
