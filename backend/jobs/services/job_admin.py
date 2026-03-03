from __future__ import annotations

import uuid

from django.core.exceptions import ValidationError
from django.utils.text import slugify

from jobs.models import Job
from jobs.services.images import mirror_remote_job_image
from jobs.validation import clean_text_input, clean_url_input, validate_instance

JOB_MUTABLE_TEXT_FIELDS = (
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
)

JOB_REQUIRED_FIELDS = ("title", "company", "location", "description_mm")


def build_generated_slug(title: str) -> str:
    base_slug = slugify(title) or "job"
    return f"{base_slug}-{uuid.uuid4().hex[:6]}"


def build_job_from_payload(payload: dict) -> Job:
    title = clean_text_input(payload["title"])
    slug = clean_text_input(payload.get("slug", "")) or build_generated_slug(title)
    return Job(
        title=title,
        slug=slug,
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


def apply_job_payload(job: Job, payload: dict) -> None:
    for field in JOB_MUTABLE_TEXT_FIELDS:
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
        clear_uploaded_job_image(job)


def validate_job(job: Job) -> None:
    missing = [
        field for field in JOB_REQUIRED_FIELDS if not clean_text_input(getattr(job, field, ""))
    ]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    if not clean_text_input(job.slug):
        job.slug = build_generated_slug(job.title)

    validate_instance(job)


def persist_job(job: Job, *, mirror_image: bool = True) -> Job:
    validate_job(job)
    job.save()
    if mirror_image:
        sync_job_image(job)
    return job


def clear_uploaded_job_image(job: Job, *, save: bool = False) -> None:
    if job.image_file:
        job.image_file.delete(save=False)
    job.image_file = ""
    if save:
        job.save(update_fields=["image_file", "updated_at"])


def sync_job_image(job: Job, headers: dict[str, str] | None = None) -> bool:
    if not job.image_url or job.image_file:
        return False

    try:
        return mirror_remote_job_image(job, job.image_url, headers=headers)
    except Exception:
        return False


def format_job_validation_error(exc: Exception) -> str:
    if isinstance(exc, ValidationError):
        from jobs.validation import format_validation_error

        return format_validation_error(exc, "Invalid job payload.")
    return str(exc)
