"""Publishing helpers for downstream channels."""

from django.conf import settings

from jobs.models import ChannelCredential, Job


def publish_job(job: Job, *, channel: str = "website") -> dict:
    if channel == "website":
        if not job.is_active or job.status != Job.WorkflowStatus.PUBLISHED:
            job.is_active = True
            job.status = Job.WorkflowStatus.PUBLISHED
            job.save(update_fields=["is_active", "status", "updated_at"])
        return {"job_id": job.id, "published": True, "channel": channel}

    if channel == "facebook":
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

        return {
            "job_id": job.id,
            "published": False,
            "channel": channel,
            "reason": "facebook upload integration not configured yet",
        }

    return {"job_id": job.id, "published": False, "channel": channel}
