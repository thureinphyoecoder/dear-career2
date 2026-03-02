"""Publishing helpers for downstream channels."""

from django.conf import settings

from jobs.models import ChannelCredential, Job


def _build_facebook_post_message(job: Job) -> str:
    lines = [f"{job.title}", f"{job.company} · {job.location}"]
    summary = (job.description_en or job.description_mm or "").strip()
    if summary:
        lines.append(summary[:280].strip())
    if job.source_url:
        lines.append(job.source_url)
    return "\n\n".join(line for line in lines if line)


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

        post_message = message.strip() or _build_facebook_post_message(job)
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
            return {
                "job_id": job.id,
                "published": False,
                "channel": channel,
                "reason": f"facebook publish failed: {exc}",
            }

        post_id = str(payload.get("id", "")).strip()
        job.is_fb_posted = True
        job.fb_post_id = post_id or None
        job.requires_facebook_approval = False
        job.save(update_fields=["is_fb_posted", "fb_post_id", "requires_facebook_approval", "updated_at"])

        return {
            "post_id": post_id,
            "job_id": job.id,
            "published": True,
            "channel": channel,
        }

    return {"job_id": job.id, "published": False, "channel": channel}
