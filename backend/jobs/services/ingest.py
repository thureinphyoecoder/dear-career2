"""Job ingestion service entrypoints."""

from __future__ import annotations

from django.utils import timezone

from jobs.models import FetchRun, FetchSource
from jobs.services.ingest_common import FetchConfigurationError, PersistSummary
from jobs.services.ingest_fetch import fetch_payload, source_uses_browser_fetch
from jobs.services.ingest_parse import parse_jobthai_jobs, parse_records
from jobs.services.ingest_persist import enrich_records_from_detail_pages, persist_records


def ingest_source(source: FetchSource) -> dict[str, object]:
    run = FetchRun.objects.create(source=source, status=FetchRun.RunStatus.SUCCESS)

    try:
        payload = fetch_payload(source)
        records = parse_records(source, payload)
        records = enrich_records_from_detail_pages(source, records)
        summary = persist_records(source, records)
        finalize_success(source, run, summary)
        return {
            "source": source.key,
            "status": "success",
            "fetched_count": summary.fetched_count,
            "created_count": summary.created_count,
            "updated_count": summary.updated_count,
            "published_count": summary.published_count,
        }
    except Exception as exc:
        finalize_error(source, run, exc)
        raise


def ingest_jobs(source_name: str) -> dict[str, object]:
    source = FetchSource.objects.get(key=source_name)
    return ingest_source(source)


def finalize_success(source: FetchSource, run: FetchRun, summary: PersistSummary) -> None:
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


def finalize_error(source: FetchSource, run: FetchRun, exc: Exception) -> None:
    source.last_run_at = timezone.now()
    source.status = FetchSource.HealthStatus.WARNING
    source.last_error = str(exc)
    source.save(update_fields=["last_run_at", "status", "last_error", "updated_at"])

    run.status = FetchRun.RunStatus.ERROR
    run.error_message = str(exc)
    run.finished_at = timezone.now()
    run.save(update_fields=["status", "error_message", "finished_at"])


_parse_jobthai_jobs = parse_jobthai_jobs
_source_uses_browser_fetch = source_uses_browser_fetch

__all__ = [
    "FetchConfigurationError",
    "PersistSummary",
    "_parse_jobthai_jobs",
    "_source_uses_browser_fetch",
    "ingest_jobs",
    "ingest_source",
]
