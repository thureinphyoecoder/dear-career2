from __future__ import annotations

import json
import re
from typing import Any
from urllib.parse import urljoin
from xml.etree import ElementTree

from jobs.content import clean_inline_text, normalize_rich_text
from jobs.models import FetchSource, Job
from jobs.services.ingest_common import (
    FetchConfigurationError,
    clean_text,
    default_description,
    get_selector,
    import_bs4,
    normalize_employment_type,
)


def parse_records(source: FetchSource, payload: str) -> list[dict[str, Any]]:
    if source.mode == FetchSource.ModeChoices.RSS:
        return parse_rss_jobs(source, payload)

    if source.mode == FetchSource.ModeChoices.HTML:
        return parse_html_jobs(source, payload)

    raise FetchConfigurationError(f"{source.label} is configured for manual intake only.")


def parse_rss_jobs(source: FetchSource, payload: str) -> list[dict[str, Any]]:
    root = ElementTree.fromstring(payload)
    records: list[dict[str, Any]] = []

    for item in root.findall(".//item"):
        title = clean_text(item.findtext("title"))
        link = clean_text(item.findtext("link"))
        description = clean_text(item.findtext("description"))
        guid = clean_text(item.findtext("guid")) or link

        if not title or not link:
            continue

        records.append(
            {
                "title": title,
                "company": source.label,
                "location": "Thailand",
                "category": source.default_category,
                "employment_type": Job.EmploymentType.FULL_TIME,
                "description_mm": description or default_description(source, title, source.label),
                "description_en": description,
                "source_url": link,
                "source_job_id": guid,
                "salary": "",
            }
        )

    return records


def parse_html_jobs(source: FetchSource, payload: str) -> list[dict[str, Any]]:
    if "jobthai.com" in source.domain:
        return parse_jobthai_jobs(source, payload)

    BeautifulSoup = import_bs4()
    soup = BeautifulSoup(payload, "html.parser")

    entry_selector = get_selector(source, "entry", "")
    if not entry_selector:
        raise FetchConfigurationError(f"{source.label} needs selectors.entry for HTML fetching.")

    entries = soup.select(entry_selector)
    records: list[dict[str, Any]] = []
    title_selector = get_selector(source, "title")
    link_selector = get_selector(source, "link")

    for index, entry in enumerate(entries):
        title = pick_selector_text(entry, title_selector) or clean_text(entry.get_text(" ", strip=True))
        if not title:
            continue

        company = pick_selector_text(entry, get_selector(source, "company")) or source.label
        location = pick_selector_text(entry, get_selector(source, "location")) or "Thailand"
        description = pick_selector_rich_text(entry, get_selector(source, "description"))
        salary = pick_selector_text(entry, get_selector(source, "salary"))
        image_url = pick_selector_image_url(entry, get_selector(source, "image"))
        employment_type = normalize_employment_type(
            pick_selector_text(entry, get_selector(source, "employment_type"))
        )

        link = pick_selector_attr(entry, link_selector, "href") or clean_text(entry.get("href", ""))
        link = urljoin(source.feed_url, link) if link else source.feed_url
        image_url = urljoin(source.feed_url, image_url) if image_url else ""

        records.append(
            {
                "title": title,
                "company": company,
                "location": location,
                "category": source.default_category,
                "employment_type": employment_type,
                "description_mm": description or default_description(source, title, company),
                "description_en": description,
                "source_url": link,
                "image_url": image_url,
                "source_job_id": pick_custom_identifier(entry, source) or link or f"{source.key}-{index}",
                "salary": salary,
            }
        )

    return records


def parse_jobthai_jobs(source: FetchSource, payload: str) -> list[dict[str, Any]]:
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
    search_jobs = next((value for key, value in root_query.items() if "searchJobs(" in key), None)
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

        image_path = extract_jobthai_image_url(item)
        image_url = ""
        if image_path:
            image_url = (
                image_path
                if image_path.startswith(("http://", "https://"))
                else urljoin(source.feed_url, f"/{image_path.lstrip('/')}")
            )

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
                    or default_description(source, title, company)
                ),
                "description_en": normalize_rich_text(
                    item.get("salary") or item.get("jobType", {}).get("name") or ""
                ),
                "source_url": f"https://www.jobthai.com/th/company/job/{job_id}",
                "image_url": image_url,
                "source_job_id": f"{source.key}-{job_id}",
                "salary": clean_inline_text(item.get("salary")),
            }
        )

    return records


def pick_selector_text(node, selector: str | None) -> str:
    if not selector:
        return ""
    target = node.select_one(selector)
    return clean_text(target.get_text(" ", strip=True)) if target is not None else ""


def pick_selector_rich_text(node, selector: str | None) -> str:
    if not selector:
        return ""
    target = node.select_one(selector)
    return normalize_rich_text(str(target)) if target is not None else ""


def pick_selector_attr(node, selector: str | None, attribute: str) -> str:
    if not selector:
        return ""
    target = node.select_one(selector)
    return clean_text(target.get(attribute, "")) if target is not None else ""


def pick_selector_image_url(node, selector: str | None) -> str:
    if not selector:
        return ""
    target = node.select_one(selector)
    if target is None:
        return ""
    for attribute in ("src", "data-src", "data-original", "data-lazy-src"):
        value = clean_text(target.get(attribute, ""))
        if value:
            return value
    return ""


def pick_custom_identifier(node, source: FetchSource) -> str:
    selector = get_selector(source, "source_job_id")
    if not selector:
        return ""

    attribute = (source.selectors or {}).get("source_job_id_attr", "data-job-id")
    target = node.select_one(selector)
    if target is None:
        return ""

    value = target.get(attribute)
    return clean_text(value) if value else clean_text(target.get_text(" ", strip=True))


def extract_jobthai_image_url(item: dict[str, Any]) -> str:
    company_logo = item.get("companyLogo")
    if isinstance(company_logo, dict):
        return clean_inline_text(company_logo.get("original") or company_logo.get("thumbnail"))
    return clean_inline_text(item.get("logo") or company_logo)
