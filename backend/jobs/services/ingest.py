"""Job ingestion service entrypoints."""

from __future__ import annotations

from dataclasses import dataclass
import json
import re
from typing import Any
from urllib.parse import urljoin
from xml.etree import ElementTree

from django.db import transaction
from django.utils import timezone

from jobs.content import clean_inline_text, normalize_rich_text
from jobs.models import FetchRun, FetchSource, Job
from jobs.services.dedupe import dedupe_jobs
from jobs.services.publish import publish_job

DEFAULT_TIMEOUT_SECONDS = 20


class FetchConfigurationError(ValueError):
    pass


@dataclass
class PersistSummary:
    fetched_count: int
    created_count: int
    updated_count: int
    published_count: int


def _import_requests():
    try:
        import requests
    except ImportError as exc:
        raise RuntimeError(
            "requests is not installed. Run `pip install -r backend/requirements.txt`."
        ) from exc

    return requests


def _import_bs4():
    try:
        from bs4 import BeautifulSoup
    except ImportError as exc:
        raise RuntimeError(
            "beautifulsoup4 is not installed. Run `pip install -r backend/requirements.txt`."
        ) from exc

    return BeautifulSoup


def _clean_text(value: Any) -> str:
    return clean_inline_text(value)


def _pick_selector_text(node, selector: str | None) -> str:
    if not selector:
        return ""

    target = node.select_one(selector)
    if target is None:
        return ""
    return _clean_text(target.get_text(" ", strip=True))


def _pick_selector_rich_text(node, selector: str | None) -> str:
    if not selector:
        return ""

    target = node.select_one(selector)
    if target is None:
        return ""
    return normalize_rich_text(str(target))


def _pick_selector_attr(node, selector: str | None, attribute: str) -> str:
    if not selector:
        return ""
    target = node.select_one(selector)
    if target is None:
        return ""
    return _clean_text(target.get(attribute, ""))


def _pick_custom_identifier(node, source: FetchSource) -> str:
    selector = _get_selector(source, "source_job_id")
    if not selector:
        return ""

    attribute = (source.selectors or {}).get("source_job_id_attr", "data-job-id")
    target = node.select_one(selector)
    if target is None:
        return ""

    value = target.get(attribute)
    if value:
        return _clean_text(value)

    return _clean_text(target.get_text(" ", strip=True))


def _normalize_employment_type(value: str) -> str:
    normalized = value.strip().lower()
    mapping = {
        "full-time": Job.EmploymentType.FULL_TIME,
        "full time": Job.EmploymentType.FULL_TIME,
        "part-time": Job.EmploymentType.PART_TIME,
        "part time": Job.EmploymentType.PART_TIME,
        "freelance": Job.EmploymentType.FREELANCE,
        "contract": Job.EmploymentType.FREELANCE,
        "internship": Job.EmploymentType.INTERNSHIP,
        "intern": Job.EmploymentType.INTERNSHIP,
    }
    return mapping.get(normalized, Job.EmploymentType.FULL_TIME)


def _default_description(source: FetchSource, title: str, company: str) -> str:
    return (
        f"{title} at {company}. Imported automatically from {source.label}. "
        "Open the source URL for full job details."
    )


def _get_selector(source: FetchSource, key: str, default: str = "") -> str:
    selectors = source.selectors or {}
    return selectors.get(key, default)


def _build_request_headers(source: FetchSource) -> dict[str, str]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0 Safari/537.36"
        )
    }
    headers.update(source.headers or {})
    return headers


def _fetch_payload(source: FetchSource) -> str:
    if source.requires_manual_url:
        raise FetchConfigurationError(
            f"{source.label} requires manual URL intake and cannot be auto-fetched."
        )

    if not source.feed_url:
        raise FetchConfigurationError(f"{source.label} has no feed URL configured.")

    requests = _import_requests()
    response = requests.get(
        source.feed_url,
        headers=_build_request_headers(source),
        timeout=DEFAULT_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.text


def _parse_rss_jobs(source: FetchSource, payload: str) -> list[dict[str, Any]]:
    root = ElementTree.fromstring(payload)
    records: list[dict[str, Any]] = []

    for item in root.findall(".//item"):
        title = _clean_text(item.findtext("title"))
        link = _clean_text(item.findtext("link"))
        description = _clean_text(item.findtext("description"))
        guid = _clean_text(item.findtext("guid")) or link

        if not title or not link:
            continue

        records.append(
            {
                "title": title,
                "company": source.label,
                "location": "Thailand",
                "category": source.default_category,
                "employment_type": Job.EmploymentType.FULL_TIME,
                "description_mm": description
                or _default_description(source, title, source.label),
                "description_en": description,
                "source_url": link,
                "source_job_id": guid,
                "salary": "",
            }
        )

    return records


def _parse_html_jobs(source: FetchSource, payload: str) -> list[dict[str, Any]]:
    if "jobthai.com" in source.domain:
        return _parse_jobthai_jobs(source, payload)

    BeautifulSoup = _import_bs4()
    soup = BeautifulSoup(payload, "html.parser")

    entry_selector = _get_selector(source, "entry", "")
    if not entry_selector:
        raise FetchConfigurationError(
            f"{source.label} needs selectors.entry for HTML fetching."
        )

    entries = soup.select(entry_selector)
    records: list[dict[str, Any]] = []

    title_selector = _get_selector(source, "title")  # may be ""
    link_selector = _get_selector(source, "link")  # may be ""

    for index, entry in enumerate(entries):
        # --- Title ---
        # Normal case: title is inside entry and selector is provided.
        # Fallback case (like UNJobs): entry itself is <a> and title selector is blank.
        title = _pick_selector_text(entry, title_selector)
        if not title:
            title = _clean_text(entry.get_text(" ", strip=True))

        # --- Company/Location/Description/Salary/Employment ---
        company = (
            _pick_selector_text(entry, _get_selector(source, "company")) or source.label
        )
        location = (
            _pick_selector_text(entry, _get_selector(source, "location")) or "Thailand"
        )
        description = _pick_selector_rich_text(entry, _get_selector(source, "description"))
        salary = _pick_selector_text(entry, _get_selector(source, "salary"))

        employment_type = _normalize_employment_type(
            _pick_selector_text(entry, _get_selector(source, "employment_type"))
        )

        # --- Link ---
        # Normal case: link is inside entry and link_selector exists.
        # Fallback: entry itself is <a>.
        link = _pick_selector_attr(entry, link_selector, "href")
        if not link:
            link = _clean_text(entry.get("href", ""))

        link = urljoin(source.feed_url, link) if link else source.feed_url

        # --- Source job id ---
        source_job_id = (
            _pick_custom_identifier(entry, source) or link or f"{source.key}-{index}"
        )

        # Skip empty titles (after fallback)
        if not title:
            continue

        records.append(
            {
                "title": title,
                "company": company,
                "location": location,
                "category": source.default_category,
                "employment_type": employment_type,
                "description_mm": description
                or _default_description(source, title, company),
                "description_en": description,
                "source_url": link,
                "source_job_id": source_job_id,
                "salary": salary,
            }
        )

    return records


def _parse_jobthai_jobs(source: FetchSource, payload: str) -> list[dict[str, Any]]:
    next_data_match = re.search(
        r'<script id="__NEXT_DATA__" type="application/json"[^>]*>(.*?)</script>',
        payload,
        flags=re.DOTALL,
    )
    if not next_data_match:
        raise FetchConfigurationError("JobThai listing data was not found in the page payload.")

    next_data = json.loads(next_data_match.group(1))
    apollo_state = (next_data.get("props") or {}).get("apolloState") or {}
    root_query = apollo_state.get("ROOT_QUERY") or {}
    search_jobs = next(
        (value for key, value in root_query.items() if "searchJobs(" in key),
        None,
    )
    job_items = ((search_jobs or {}).get("data") or {}).get("data") or []
    if not job_items:
        return []

    records: list[dict[str, Any]] = []
    for item in job_items:
        job_id = str(item.get("id") or "").strip()
        title = clean_inline_text(item.get("jobTitle"))
        company = clean_inline_text(item.get("companyName")) or source.label
        province = clean_inline_text((item.get("province") or {}).get("name"))
        district = clean_inline_text((item.get("district") or {}).get("name"))
        work_location = clean_inline_text(item.get("workLocation"))
        location = ", ".join(part for part in [district, province] if part)
        if work_location:
            location = f"{location} - {work_location}" if location else work_location

        if not job_id or not title:
            continue

        records.append(
            {
                "title": title,
                "company": company,
                "location": location or "Thailand",
                "category": source.default_category,
                "employment_type": Job.EmploymentType.FULL_TIME,
                "description_mm": normalize_rich_text(
                    item.get("salary")
                    or item.get("jobType", {}).get("name")
                    or _default_description(source, title, company)
                ),
                "description_en": normalize_rich_text(
                    item.get("salary") or item.get("jobType", {}).get("name") or ""
                ),
                "source_url": f"https://www.jobthai.com/th/company/job/{job_id}",
                "source_job_id": f"{source.key}-{job_id}",
                "salary": clean_inline_text(item.get("salary")),
            }
        )

    return records


def _parse_records(source: FetchSource, payload: str) -> list[dict[str, Any]]:
    if source.mode == FetchSource.ModeChoices.RSS:
        return _parse_rss_jobs(source, payload)

    if source.mode == FetchSource.ModeChoices.HTML:
        return _parse_html_jobs(source, payload)

    raise FetchConfigurationError(
        f"{source.label} is configured for manual intake only."
    )


def _enrich_records_from_detail_pages(
    source: FetchSource, records: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    enrich_domains = ("unjobs.org",)
    if not any(domain in source.domain for domain in enrich_domains):
        return records

    requests = _import_requests()
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
                headers=_build_request_headers(source),
                timeout=DEFAULT_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            detail_payload = build_scraped_job_payload(source_url, response.text)
        except Exception:
            enriched_records.append(record)
            continue

        enriched_record = {**record}
        for field in [
            "title",
            "company",
            "location",
            "description_mm",
            "description_en",
            "salary",
            "contact_email",
            "contact_phone",
        ]:
            detail_value = detail_payload.get(field)
            if detail_value:
                enriched_record[field] = detail_value
        enriched_records.append(enriched_record)

    if len(records) > source.max_jobs_per_run:
        enriched_records.extend(records[source.max_jobs_per_run :])

    return enriched_records


def _apply_publish_policy(job: Job, source: FetchSource) -> int:
    job.requires_website_approval = source.approval_required_for_website
    job.requires_facebook_approval = source.approval_required_for_facebook

    if source.auto_publish_website and not source.approval_required_for_website:
        publish_job(job, channel="website")
        published = 1
    else:
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
        published = 0

    return published


def _persist_records(
    source: FetchSource, records: list[dict[str, Any]]
) -> PersistSummary:
    created_count = 0
    updated_count = 0
    published_count = 0

    with transaction.atomic():
        for record in dedupe_jobs(records)[: source.max_jobs_per_run]:
            source_job_id = record.get("source_job_id") or None
            source_url = record.get("source_url") or None
            existing_job = None
            if source_job_id:
                existing_job = Job.objects.filter(source_job_id=source_job_id).first()
            if existing_job is None and source_url:
                existing_job = Job.objects.filter(source_url=source_url).first()
            if existing_job is None:
                existing_job = Job.objects.filter(
                    title=record["title"],
                    company=record.get("company") or source.label,
                ).first()

            defaults = {
                "title": record["title"],
                "company": record.get("company") or source.label,
                "location": record.get("location") or "Thailand",
                "category": record.get("category") or source.default_category,
                "description_mm": record.get("description_mm")
                or _default_description(source, record["title"], source.label),
                "description_en": record.get("description_en", ""),
                "source": Job.SourceChoices.SCRAPER,
                "source_url": source_url,
                "employment_type": record.get("employment_type")
                or Job.EmploymentType.FULL_TIME,
                "salary": record.get("salary", ""),
                "status": Job.WorkflowStatus.PUBLISHED,
                "is_active": True,
                "requires_website_approval": source.approval_required_for_website,
                "requires_facebook_approval": source.approval_required_for_facebook,
            }

            if existing_job is None:
                job = Job.objects.create(
                    source_job_id=source_job_id,
                    **defaults,
                )
                created_count += 1
            else:
                for field, value in defaults.items():
                    setattr(existing_job, field, value)
                if source_job_id:
                    existing_job.source_job_id = source_job_id
                existing_job.save()
                job = existing_job
                updated_count += 1

            published_count += _apply_publish_policy(job, source)

    return PersistSummary(
        fetched_count=len(records),
        created_count=created_count,
        updated_count=updated_count,
        published_count=published_count,
    )


def ingest_source(source: FetchSource) -> dict[str, Any]:
    run = FetchRun.objects.create(source=source, status=FetchRun.RunStatus.SUCCESS)

    try:
        payload = _fetch_payload(source)
        records = _parse_records(source, payload)
        records = _enrich_records_from_detail_pages(source, records)
        summary = _persist_records(source, records)

        source.last_run_at = timezone.now()
        source.status = FetchSource.HealthStatus.HEALTHY
        source.last_error = ""
        source.save(update_fields=["last_run_at", "status", "last_error", "updated_at"])

        run.fetched_count = summary.fetched_count
        run.created_count = summary.created_count
        run.updated_count = summary.updated_count
        run.published_count = summary.published_count
        run.finished_at = timezone.now()
        run.save(
            update_fields=[
                "fetched_count",
                "created_count",
                "updated_count",
                "published_count",
                "finished_at",
            ]
        )

        return {
            "source": source.key,
            "status": "success",
            "fetched_count": summary.fetched_count,
            "created_count": summary.created_count,
            "updated_count": summary.updated_count,
            "published_count": summary.published_count,
        }
    except Exception as exc:
        source.last_run_at = timezone.now()
        source.status = FetchSource.HealthStatus.WARNING
        source.last_error = str(exc)
        source.save(update_fields=["last_run_at", "status", "last_error", "updated_at"])

        run.status = FetchRun.RunStatus.ERROR
        run.error_message = str(exc)
        run.finished_at = timezone.now()
        run.save(update_fields=["status", "error_message", "finished_at"])
        raise


def ingest_jobs(source_name: str) -> dict[str, Any]:
    source = FetchSource.objects.get(key=source_name)
    return ingest_source(source)
