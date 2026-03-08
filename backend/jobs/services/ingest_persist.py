from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlparse

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

DEFAULT_QUALITY_MAX_PER_RUN = 8
MIN_QUALITY_SCORE = 5
SPAM_TERMS = (
    "crypto",
    "forex",
    "พนัน",
    "บาคาร่า",
    "พนันออนไลน์",
    "งานเสริมรายได้",
    "click here",
)
QUALITY_KEYWORDS = (
    "responsibilit",
    "requirement",
    "qualification",
    "apply",
    "salary",
    "location",
    "benefit",
    "working hours",
)


def _needs_detail_fallback(description: str) -> bool:
    cleaned = clean_inline_text(description)
    if not cleaned:
        return True
    if cleaned.endswith("..."):
        return True
    return len(cleaned) < 500


def _readable_proxy_url(source_url: str) -> str:
    parsed = urlparse(source_url)
    if not parsed.scheme or not parsed.netloc:
        return ""
    return f"https://r.jina.ai/http://{parsed.netloc}{parsed.path}"


def _extract_readable_markdown_body(payload: str) -> str:
    marker = "Markdown Content:"
    body = payload.split(marker, 1)[1] if marker in payload else payload
    body = body.replace("\r\n", "\n").strip()
    if not body:
        return ""

    lines = [line.rstrip() for line in body.split("\n")]
    cleaned_lines: list[str] = []
    previous_blank = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if cleaned_lines and not previous_blank:
                cleaned_lines.append("")
            previous_blank = True
            continue
        if stripped.startswith(("Title:", "URL Source:")):
            continue
        cleaned_lines.append(stripped)
        previous_blank = False

    return "\n".join(cleaned_lines).strip()


def _fetch_readable_description(source_url: str, source: FetchSource) -> str:
    proxy_url = _readable_proxy_url(source_url)
    if not proxy_url:
        return ""

    requests = import_requests()
    response = requests.get(
        proxy_url,
        headers=build_request_headers(source),
        timeout=30,
    )
    response.raise_for_status()
    return _extract_readable_markdown_body(response.text)


def _safe_int(value: Any, fallback: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return fallback
    return parsed if parsed > 0 else fallback


def _effective_run_limit(source: FetchSource) -> int:
    selectors = source.selectors or {}
    quality_cap = _safe_int(
        selectors.get("__quality_max_per_run"),
        DEFAULT_QUALITY_MAX_PER_RUN,
    )
    return max(1, min(source.max_jobs_per_run, quality_cap))


def _is_default_description(description: str) -> bool:
    lowered = description.lower()
    return "imported automatically from" in lowered


def _looks_spammy(record: dict[str, Any]) -> bool:
    title = clean_inline_text(record.get("title")).lower()
    description = clean_inline_text(record.get("description_mm") or record.get("description_en")).lower()
    searchable = f"{title} {description}"
    return any(term in searchable for term in SPAM_TERMS)


def _quality_score(record: dict[str, Any]) -> int:
    if _looks_spammy(record):
        return 0

    title = clean_inline_text(record.get("title"))
    company = clean_inline_text(record.get("company"))
    location = clean_inline_text(record.get("location"))
    source_url = clean_inline_text(record.get("source_url"))
    salary = clean_inline_text(record.get("salary"))
    image_url = clean_inline_text(record.get("image_url"))
    description = clean_inline_text(record.get("description_mm") or record.get("description_en"))
    lowered_description = description.lower()

    score = 0

    if 12 <= len(title) <= 120:
        score += 2
    if company and company.lower() not in {"n/a", "unknown"}:
        score += 1
    if location and location.lower() not in {"thailand", "remote"}:
        score += 1
    if source_url.startswith("http://") or source_url.startswith("https://"):
        score += 1
    if salary:
        score += 1
    if image_url:
        score += 1

    if len(description) >= 280:
        score += 3
    elif len(description) >= 120:
        score += 2
    elif len(description) >= 60:
        score += 1

    if description and not _is_default_description(description):
        score += 1

    keyword_hits = sum(1 for keyword in QUALITY_KEYWORDS if keyword in lowered_description)
    score += min(keyword_hits, 2)

    if re.search(r"[•●▪◦‣]", description):
        score += 1

    return score


def _select_quality_records(source: FetchSource, records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    limit = _effective_run_limit(source)
    scored_records: list[tuple[int, dict[str, Any]]] = []
    for record in records:
        score = _quality_score(record)
        if score < MIN_QUALITY_SCORE:
            continue
        scored_records.append((score, record))

    scored_records.sort(key=lambda item: item[0], reverse=True)
    return [record for _, record in scored_records[:limit]]


def enrich_records_from_detail_pages(
    source: FetchSource, records: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    enrich_domains = ("unjobs.org", "thaingo.org")
    if not any(domain in source.domain for domain in enrich_domains):
        return records

    requests = import_requests()
    from jobs.views.shared import build_scraped_job_payload

    enriched_records: list[dict[str, Any]] = []
    limit = _effective_run_limit(source)
    for record in records[:limit]:
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

        current_description = str(
            enriched_record.get("description_en") or enriched_record.get("description_mm") or ""
        )
        if "unjobs.org" in source.domain and _needs_detail_fallback(current_description):
            try:
                readable_description = _fetch_readable_description(source_url, source)
            except Exception:
                readable_description = ""
            if readable_description:
                enriched_record["description_en"] = readable_description
                enriched_record["description_mm"] = readable_description
        enriched_records.append(enriched_record)

    if len(records) > limit:
        enriched_records.extend(records[limit:])

    return enriched_records


def persist_records(source: FetchSource, records: list[dict[str, Any]]) -> PersistSummary:
    created_count = 0
    updated_count = 0
    published_count = 0
    deduped_records = dedupe_jobs(records)
    quality_records = _select_quality_records(source, deduped_records)

    with transaction.atomic():
        for record in quality_records:
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
        fetched_count=len(quality_records),
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
