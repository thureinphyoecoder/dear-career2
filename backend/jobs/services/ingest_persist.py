from __future__ import annotations

from typing import Any

from django.db import transaction

from jobs.content import clean_inline_text
from jobs.models import FetchSource, Job
from jobs.services.dedupe import dedupe_jobs
from jobs.services.images import mirror_remote_job_image
from jobs.services.ingest_common import (
    PersistSummary,
    build_request_headers,
    default_description,
    import_requests,
)
from jobs.services.publish import publish_job


def enrich_records_from_detail_pages(
    source: FetchSource, records: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    enrich_domains = ("unjobs.org", "thaingo.org")
    if not any(domain in source.domain for domain in enrich_domains):
        return records

    requests = import_requests()
    from jobs.views.shared import build_scraped_job_payload

    enriched_records: list[dict[str, Any]] = []
    for record in records[: source.max_jobs_per_run]:
        source_url = clean_inline_text(record.get("source_url"))
        if not source_url:
            enriched_records.append(record)
            continue

        try:
            response = requests.get(
                source_url,
                headers=build_request_headers(source),
                timeout=20,
            )
            response.raise_for_status()
            detail_payload = build_scraped_job_payload(source_url, response.text)
        except Exception:
            enriched_records.append(record)
            continue

        enriched_record = {**record}
        for field in (
            "title",
            "company",
            "location",
            "image_url",
            "description_mm",
            "description_en",
            "salary",
            "contact_email",
            "contact_phone",
        ):
            detail_value = detail_payload.get(field)
            if detail_value:
                enriched_record[field] = detail_value
        enriched_records.append(enriched_record)

    if len(records) > source.max_jobs_per_run:
        enriched_records.extend(records[source.max_jobs_per_run :])

    return enriched_records


def persist_records(source: FetchSource, records: list[dict[str, Any]]) -> PersistSummary:
    created_count = 0
    updated_count = 0
    published_count = 0

    with transaction.atomic():
        for record in dedupe_jobs(records)[: source.max_jobs_per_run]:
            source_job_id = record.get("source_job_id") or None
            source_url = record.get("source_url") or None
            existing_job = find_existing_job(source, record, source_job_id, source_url)
            defaults = build_job_defaults(source, record, source_url)

            if existing_job is None:
                job = Job.objects.create(source_job_id=source_job_id, **defaults)
                created_count += 1
            else:
                for field, value in defaults.items():
                    setattr(existing_job, field, value)
                if source_job_id:
                    existing_job.source_job_id = source_job_id
                existing_job.save()
                job = existing_job
                updated_count += 1

            if job.image_url and not job.image_file:
                try:
                    mirror_remote_job_image(
                        job,
                        job.image_url,
                        headers=build_request_headers(source),
                    )
                except Exception:
                    pass

            published_count += apply_publish_policy(job, source)

    return PersistSummary(
        fetched_count=len(records),
        created_count=created_count,
        updated_count=updated_count,
        published_count=published_count,
    )


def find_existing_job(
    source: FetchSource,
    record: dict[str, Any],
    source_job_id: str | None,
    source_url: str | None,
) -> Job | None:
    if source_job_id:
        existing_job = Job.objects.filter(source_job_id=source_job_id).first()
        if existing_job is not None:
            return existing_job
    if source_url:
        existing_job = Job.objects.filter(source_url=source_url).first()
        if existing_job is not None:
            return existing_job
    return Job.objects.filter(
        title=record["title"],
        company=record.get("company") or source.label,
    ).first()


def build_job_defaults(
    source: FetchSource,
    record: dict[str, Any],
    source_url: str | None,
) -> dict[str, Any]:
    return {
        "title": record["title"],
        "company": record.get("company") or source.label,
        "location": record.get("location") or "Thailand",
        "category": record.get("category") or source.default_category,
        "description_mm": record.get("description_mm")
        or default_description(source, record["title"], source.label),
        "description_en": record.get("description_en", ""),
        "source": Job.SourceChoices.SCRAPER,
        "source_url": source_url,
        "image_url": record.get("image_url", ""),
        "employment_type": record.get("employment_type") or Job.EmploymentType.FULL_TIME,
        "salary": record.get("salary", ""),
        "status": Job.WorkflowStatus.PUBLISHED,
        "is_active": True,
        "requires_website_approval": source.approval_required_for_website,
        "requires_facebook_approval": source.approval_required_for_facebook,
    }


def apply_publish_policy(job: Job, source: FetchSource) -> int:
    job.requires_website_approval = source.approval_required_for_website
    job.requires_facebook_approval = source.approval_required_for_facebook

    if source.auto_publish_website and not source.approval_required_for_website:
        publish_job(job, channel="website")
        return 1

    job.is_active = False
    job.status = Job.WorkflowStatus.PENDING_REVIEW
    job.save(
        update_fields=[
            "is_active",
            "status",
            "requires_website_approval",
            "requires_facebook_approval",
            "updated_at",
        ]
    )
    return 0
