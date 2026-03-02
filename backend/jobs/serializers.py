"""Serialization helpers for the jobs app."""


def serialize_job(job):
    return {
        "id": job.id,
        "title": job.title,
        "slug": job.slug,
        "company": job.company,
        "location": job.location,
        "category": job.category,
        "employment_type": job.employment_type,
        "salary": job.salary,
        "contact_email": job.contact_email,
        "contact_phone": job.contact_phone,
        "source": job.source,
        "source_url": job.source_url,
        "status": job.status,
        "is_active": job.is_active,
        "is_fb_posted": job.is_fb_posted,
        "requires_website_approval": job.requires_website_approval,
        "requires_facebook_approval": job.requires_facebook_approval,
        "description_mm": job.description_mm,
        "description_en": job.description_en,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }


def serialize_fetch_source(source):
    return {
        "id": source.id,
        "key": source.key,
        "label": source.label,
        "domain": source.domain,
        "feed_url": source.feed_url,
        "mode": source.mode,
        "enabled": source.enabled,
        "requires_manual_url": source.requires_manual_url,
        "auto_publish_website": source.auto_publish_website,
        "auto_publish_facebook": source.auto_publish_facebook,
        "approval_required_for_website": source.approval_required_for_website,
        "approval_required_for_facebook": source.approval_required_for_facebook,
        "default_category": source.default_category,
        "cadence_value": source.cadence_value,
        "cadence_unit": source.cadence_unit,
        "max_jobs_per_run": source.max_jobs_per_run,
        "status": source.status,
        "selectors": source.selectors,
        "headers": source.headers,
        "last_run_at": source.last_run_at.isoformat() if source.last_run_at else None,
        "last_error": source.last_error,
        "updated_at": source.updated_at.isoformat() if source.updated_at else None,
    }


def serialize_fetch_run(run):
    return {
        "id": run.id,
        "source_id": run.source_id,
        "source_label": run.source.label,
        "status": run.status,
        "fetched_count": run.fetched_count,
        "created_count": run.created_count,
        "updated_count": run.updated_count,
        "published_count": run.published_count,
        "error_message": run.error_message,
        "started_at": run.started_at.isoformat() if run.started_at else None,
        "finished_at": run.finished_at.isoformat() if run.finished_at else None,
    }


def serialize_admin_notification(notification):
    return {
        "id": str(notification.id),
        "title": notification.title,
        "detail": notification.detail,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
        "tone": notification.tone,
    }


def serialize_approval_item(job):
    requested_actions = []
    if job.requires_website_approval or job.status == "pending-review":
        requested_actions.append("publish")
    if job.requires_facebook_approval:
        requested_actions.append("facebook-upload")

    requested_action = requested_actions[0] if requested_actions else "manual-review"

    return {
        "id": f"approval-{job.id}",
        "title": job.title,
        "company": job.company,
        "source_label": job.source or "Manual source",
        "requested_action": requested_action,
        "requested_at": job.updated_at.isoformat() if job.updated_at else None,
    }


def serialize_channel_credential(credential):
    return {
        "platform": credential.platform,
        "account_name": credential.account_name,
        "page_id": credential.page_id,
        "access_token": credential.access_token,
        "profile_name": credential.profile_name,
        "profile_image_url": credential.profile_image_url,
        "updated_at": credential.updated_at.isoformat() if credential.updated_at else None,
    }


def serialize_visitor_summary(payload):
    return {
        "total_visitors": payload["total_visitors"],
        "today_visitors": payload["today_visitors"],
        "last_7_days_visitors": payload["last_7_days_visitors"],
        "top_paths": payload["top_paths"],
    }


def serialize_managed_ad(ad):
    return {
        "id": ad.id,
        "title": ad.title,
        "eyebrow": ad.eyebrow,
        "description": ad.description,
        "cta_label": ad.cta_label,
        "href": ad.href,
        "placement": ad.placement,
        "status": ad.status,
        "sort_order": ad.sort_order,
        "created_at": ad.created_at.isoformat() if ad.created_at else None,
        "updated_at": ad.updated_at.isoformat() if ad.updated_at else None,
    }
