from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from jobs.content import clean_inline_text
from jobs.models import FetchSource, Job

DEFAULT_TIMEOUT_SECONDS = 20


class FetchConfigurationError(ValueError):
    pass


@dataclass
class PersistSummary:
    fetched_count: int
    created_count: int
    updated_count: int
    published_count: int


def import_requests():
    try:
        import requests
    except ImportError as exc:
        raise RuntimeError(
            "requests is not installed. Run `pip install -r backend/requirements.txt`."
        ) from exc

    return requests


def import_bs4():
    try:
        from bs4 import BeautifulSoup
    except ImportError as exc:
        raise RuntimeError(
            "beautifulsoup4 is not installed. Run `pip install -r backend/requirements.txt`."
        ) from exc

    return BeautifulSoup


def clean_text(value: Any) -> str:
    return clean_inline_text(value)


def normalize_employment_type(value: str) -> str:
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


def default_description(source: FetchSource, title: str, company: str) -> str:
    return (
        f"{title} at {company}. Imported automatically from {source.label}."
    )


def get_selector(source: FetchSource, key: str, default: str = "") -> str:
    selectors = source.selectors or {}
    return selectors.get(key, default)


def build_request_headers(source: FetchSource) -> dict[str, str]:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0 Safari/537.36"
        )
    }
    headers.update(source.headers or {})
    return headers
