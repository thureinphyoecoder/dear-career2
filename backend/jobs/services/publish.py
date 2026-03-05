"""Publishing helpers for downstream channels."""

import json

from django.conf import settings

from jobs.content import build_facebook_post_message
from jobs.models import ChannelCredential, Job


def publish_job(job: Job, *, channel: str = "website", message: str = "") -> dict:
    if channel == "website":
        if not job.is_active or job.status != Job.WorkflowStatus.PUBLISHED:
            job.is_active = True
            job.status = Job.WorkflowStatus.PUBLISHED
            job.save(update_fields=["is_active", "status", "updated_at"])
        return {"job_id": job.id, "published": True, "channel": channel}

    if channel == "facebook":
        try:
            import requests
        except ImportError:
            return {
                "job_id": job.id,
                "published": False,
                "channel": channel,
                "reason": "requests is not installed",
            }

        page_id = getattr(settings, "FACEBOOK_PAGE_ID", "")
        access_token = getattr(settings, "FACEBOOK_PAGE_ACCESS_TOKEN", "")
        if not page_id or not access_token:
            credential = ChannelCredential.objects.filter(
                platform=ChannelCredential.PlatformChoices.FACEBOOK
            ).first()
            if credential:
                page_id = page_id or credential.page_id
                access_token = access_token or credential.access_token
        if not page_id or not access_token:
            return {
                "job_id": job.id,
                "published": False,
                "channel": channel,
                "reason": "facebook credentials missing",
            }

        post_message = message.strip() or build_facebook_post_message(job)
        if not post_message:
            return {
                "job_id": job.id,
                "published": False,
                "channel": channel,
                "reason": "facebook post content is empty",
            }

        try:
            response = requests.post(
                f"https://graph.facebook.com/v23.0/{page_id}/feed",
                data={
                    "message": post_message,
                    "access_token": access_token,
                },
                timeout=20,
            )
            response.raise_for_status()
            payload = response.json()
        except requests.RequestException as exc:
            api_message = ""
            if getattr(exc, "response", None) is not None:
                try:
                    error_payload = exc.response.json()
                    api_message = str(error_payload.get("error", {}).get("message", "")).strip()
                except (ValueError, json.JSONDecodeError, AttributeError):
                    api_message = str(exc.response.text).strip()
            message = api_message or str(exc)
            if "cannot call api for app" in message.lower():
                message = (
                    "Facebook token does not match the current app. Reconnect page from Admin > Facebook."
                )
            elif "pages_manage_posts" in message:
                message = (
                    "Facebook permission pages_manage_posts is missing. Reconnect page and grant permissions."
                )
            return {
                "job_id": job.id,
                "published": False,
                "channel": channel,
                "reason": f"facebook publish failed: {message}",
            }

        post_id = str(payload.get("id", "")).strip()
        if not post_id:
            return {
                "job_id": job.id,
                "published": False,
                "channel": channel,
                "reason": "facebook publish response did not include a post id",
            }

        permalink_url = ""
        try:
            permalink_response = requests.get(
                f"https://graph.facebook.com/v23.0/{post_id}",
                params={
                    "fields": "permalink_url",
                    "access_token": access_token,
                },
                timeout=10,
            )
            if permalink_response.ok:
                permalink_url = str(
                    permalink_response.json().get("permalink_url", "")
                ).strip()
        except requests.RequestException:
            permalink_url = ""

        job.is_fb_posted = True
        job.fb_post_id = post_id or None
        job.requires_facebook_approval = False
        job.save(update_fields=["is_fb_posted", "fb_post_id", "requires_facebook_approval", "updated_at"])

        return {
            "post_id": post_id,
            "permalink_url": permalink_url,
            "job_id": job.id,
            "published": True,
            "channel": channel,
        }

    return {"job_id": job.id, "published": False, "channel": channel}
