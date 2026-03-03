import json
import re
from itertools import islice
from urllib.parse import urljoin, urlparse

from django.http import HttpRequest
from django.utils.text import slugify

from ..content import clean_inline_text, normalize_rich_text
from ..models import AdminNotification, FetchRun, FetchSource, Job


def load_json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON body.") from exc


def clean_text(value: object | None) -> str:
    return clean_inline_text(value)


def create_admin_notification(
    title: str,
    detail: str,
    *,
    tone: str = AdminNotification.ToneChoices.INFO,
    source: FetchSource | None = None,
    fetch_run: FetchRun | None = None,
    target_url: str = "",
) -> AdminNotification:
    return AdminNotification.objects.create(
        title=clean_text(title)[:160],
        detail=clean_text(detail),
        tone=tone,
        source=source,
        fetch_run=fetch_run,
        target_url=clean_text(target_url)[:255],
    )


def pick_meta_content(soup, *names: str) -> str:
    for name in names:
        tag = soup.find("meta", attrs={"property": name}) or soup.find(
            "meta", attrs={"name": name}
        )
        if tag and tag.get("content"):
            return clean_text(tag.get("content"))
    return ""


def pick_first_text(soup, selectors: list[str]) -> str:
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            return clean_text(node.get_text(" ", strip=True))
    return ""


def pick_first_rich_text(soup, selectors: list[str]) -> str:
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            return normalize_rich_text(str(node))
    return ""


def pick_first_attr(soup, selectors: list[str], *attributes: str) -> str:
    for selector in selectors:
        node = soup.select_one(selector)
        if not node:
            continue
        for attribute in attributes:
            value = clean_text(node.get(attribute))
            if value:
                return value
    return ""


def pick_image_url(soup, page_url: str, selectors: list[str] | None = None) -> str:
    direct_url = (
        pick_meta_content(soup, "og:image", "twitter:image", "twitter:image:src")
        or pick_first_attr(
            soup,
            selectors or ["img[src]", "img[data-src]", "img[data-lazy-src]"],
            "src",
            "data-src",
            "data-lazy-src",
        )
    )
    if not direct_url:
        return ""
    return urljoin(page_url, direct_url)


def derive_company(hostname: str, title: str) -> str:
    separators = (" at ", " | ", " - ", " – ", " — ")
    lowered = title.lower()
    for separator in separators:
        if separator in lowered:
            parts = re.split(re.escape(separator), title, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2 and parts[1].strip():
                return clean_text(parts[1])

    root = hostname.replace("www.", "").split(".")[0].replace("-", " ").strip()
    return clean_text(root.title())


def derive_title(raw_title: str) -> str:
    separators = (" at ", " | ", " - ", " – ", " — ")
    lowered = raw_title.lower()
    for separator in separators:
        if separator in lowered:
            parts = re.split(
                re.escape(separator), raw_title, maxsplit=1, flags=re.IGNORECASE
            )
            if parts and parts[0].strip():
                return clean_text(parts[0])
    return clean_text(raw_title)


def derive_location(text: str) -> str:
    location_patterns = [
        r"\bBangkok\b",
        r"\bThailand\b",
        r"\bChiang Mai\b",
        r"\bPhuket\b",
        r"\bRemote\b",
        r"\bHybrid\b",
    ]
    for pattern in location_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return clean_text(match.group(0))
    return ""


def extract_contact_email(text: str) -> str:
    match = re.search(r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})", text, flags=re.IGNORECASE)
    return clean_text(match.group(1)) if match else ""


def extract_contact_phone(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s().-]{7,}\d)", text)
    return clean_text(match.group(1)) if match else ""


def derive_source_label_from_url(raw_url: str, domain: str) -> str:
    parsed = urlparse(raw_url)
    path_bits = [bit for bit in parsed.path.split("/") if bit]
    if path_bits:
        candidate = path_bits[-1].replace("-", " ").replace("_", " ").strip()
        if candidate and candidate.lower() not in {"feed", "jobs", "rss", "xml"}:
            return clean_text(candidate.title())

    root = domain.replace("www.", "").split(".")[0].replace("-", " ").replace("_", " ").strip()
    return clean_text(root.title())


def derive_source_key_from_url(raw_url: str, domain: str) -> str:
    parsed = urlparse(raw_url)
    path = parsed.path.strip("/").replace("/", "-")
    candidate = slugify(f"{domain}-{path}" if path else domain)
    return candidate[:80]


def derive_category(hostname: str, text: str) -> str:
    lowered = f"{hostname} {text}".lower()
    ngo_signals = ["ngo", "un jobs", "unjobs", "reliefweb", "foundation", "humanitarian"]
    blue_collar_signals = ["driver", "warehouse", "technician", "operator", "factory", "helper"]
    if any(signal in lowered for signal in ngo_signals):
        return Job.CategoryChoices.NGO
    if any(signal in lowered for signal in blue_collar_signals):
        return Job.CategoryChoices.BLUE_COLLAR
    return Job.CategoryChoices.WHITE_COLLAR


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


def collect_json_ld_objects(soup) -> list[dict]:
    objects: list[dict] = []
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = script.string or script.get_text()
        if not raw:
            continue
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue

        if isinstance(payload, list):
            objects.extend(item for item in payload if isinstance(item, dict))
        elif isinstance(payload, dict):
            if isinstance(payload.get("@graph"), list):
                objects.extend(item for item in payload["@graph"] if isinstance(item, dict))
            objects.append(payload)
    return objects


def pick_nested_text(payload, *path: str) -> str:
    current = payload
    for key in path:
        if not isinstance(current, dict):
            return ""
        current = current.get(key)
    if isinstance(current, list):
        values = [clean_text(item) for item in current if clean_text(item)]
        return values[0] if values else ""
    return clean_text(current)


def extract_job_posting_json_ld(soup) -> dict:
    for item in collect_json_ld_objects(soup):
        item_type = item.get("@type")
        matched = "JobPosting" in item_type if isinstance(item_type, list) else item_type == "JobPosting"
        if not matched:
            continue

        location = (
            pick_nested_text(item, "jobLocation", "address", "addressLocality")
            or pick_nested_text(item, "jobLocation", "address", "addressRegion")
            or pick_nested_text(item, "jobLocation", "address", "addressCountry")
        )
        description = normalize_rich_text(item.get("description"))
        salary = (
            pick_nested_text(item, "baseSalary", "value", "value")
            or pick_nested_text(item, "baseSalary", "value", "minValue")
        )
        return {
            "title": clean_text(item.get("title")),
            "company": pick_nested_text(item, "hiringOrganization", "name"),
            "location": location,
            "description": description,
            "employment_type": clean_text(item.get("employmentType")),
            "salary": salary,
        }
    return {}


def extract_linkedin_fields(soup) -> dict:
    return {
        "title": pick_first_text(
            soup,
            [".top-card-layout__title", ".topcard__title", "h1.top-card-layout__title"],
        ),
        "company": pick_first_text(
            soup,
            [
                ".topcard__org-name-link",
                ".topcard__flavor",
                ".top-card-layout__card .topcard__org-name-link",
            ],
        ),
        "location": pick_first_text(
            soup,
            [".topcard__flavor--bullet", ".topcard__flavor.topcard__flavor--bullet"],
        ),
        "description": pick_first_rich_text(
            soup,
            [".show-more-less-html__markup", ".description__text"],
        ),
        "image_url": pick_first_attr(
            soup,
            [".artdeco-entity-image img", ".top-card-layout__entity-image img"],
            "src",
            "data-delayed-url",
        ),
    }


def extract_jobsdb_fields(soup) -> dict:
    return {
        "title": pick_first_text(soup, ['[data-automation="job-detail-title"]', "h1"]),
        "company": pick_first_text(
            soup,
            ['[data-automation="advertiser-name"]', '[data-automation="company-link"]'],
        ),
        "location": pick_first_text(soup, ['[data-automation="job-detail-location"]']),
        "description": pick_first_rich_text(
            soup,
            ['[data-automation="jobAdDetails"]', '[data-automation="jobDescription"]'],
        ),
        "image_url": pick_first_attr(
            soup,
            ['img[data-automation="advertiser-logo"]', '[data-automation="company-overview"] img', "img"],
            "src",
            "data-src",
        ),
    }


def extract_jobthai_fields(soup) -> dict:
    return {
        "title": pick_first_text(soup, ["h1", ".css-1w2awul", ".job-title"]),
        "company": pick_first_text(soup, [".job-company a", ".company-name", ".css-19n2x38"]),
        "location": pick_first_text(soup, [".job-location", ".location", ".css-129m7dg"]),
        "description": pick_first_rich_text(soup, [".job-description", ".job-highlight", ".css-1id5vzh"]),
        "image_url": pick_first_attr(
            soup,
            [".job-company img", ".company-logo img", "img"],
            "src",
            "data-src",
        ),
    }


def extract_thaingo_fields(soup) -> dict:
    return {
        "title": pick_first_text(soup, ["h1", ".page-header h1", ".job-title"]),
        "company": pick_first_text(
            soup,
            [".field-name-field-organization", ".job-company", ".company-name"],
        ),
        "location": pick_first_text(
            soup,
            [".field-name-field-location", ".job-location", ".location"],
        ),
        "description": pick_first_rich_text(
            soup,
            [".field-name-body", ".job-description", ".content"],
        ),
        "image_url": pick_first_attr(
            soup,
            [".field-name-field-logo img", ".content img", "img"],
            "src",
            "data-src",
        ),
    }


def extract_domain_specific_fields(hostname: str, soup) -> dict:
    hostname = hostname.lower()
    if "linkedin.com" in hostname:
        return extract_linkedin_fields(soup)
    if "jobsdb.com" in hostname:
        return extract_jobsdb_fields(soup)
    if "jobthai.com" in hostname:
        return extract_jobthai_fields(soup)
    if "thaingo.org" in hostname:
        return extract_thaingo_fields(soup)
    return {}


def build_scraped_job_payload(url: str, html: str) -> dict:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "html.parser")
    hostname = urlparse(url).netloc
    json_ld_fields = extract_job_posting_json_ld(soup)
    domain_fields = extract_domain_specific_fields(hostname, soup)

    raw_title = (
        domain_fields.get("title")
        or json_ld_fields.get("title")
        or pick_meta_content(soup, "og:title", "twitter:title")
        or clean_text(soup.title.string if soup.title else "")
    )
    description = (
        domain_fields.get("description")
        or json_ld_fields.get("description")
        or pick_meta_content(soup, "og:description", "twitter:description", "description")
    )
    if not description:
        paragraph = soup.find("p")
        description = normalize_rich_text(str(paragraph) if paragraph else "")

    body_text = clean_text(" ".join(islice(soup.stripped_strings, 120))) if soup else ""
    combined_text = " ".join(filter(None, [raw_title, description, body_text]))
    location = (
        domain_fields.get("location")
        or json_ld_fields.get("location")
        or derive_location(combined_text)
    )
    company = (
        domain_fields.get("company")
        or json_ld_fields.get("company")
        or pick_meta_content(soup, "og:site_name")
        or derive_company(hostname, raw_title)
    )
    title = derive_title(raw_title) or "Imported job listing"
    category = derive_category(hostname, combined_text)
    employment_type = normalize_employment_type(
        domain_fields.get("employment_type") or json_ld_fields.get("employment_type") or ""
    )
    salary = clean_text(domain_fields.get("salary") or json_ld_fields.get("salary") or "")
    contact_email = extract_contact_email(combined_text)
    contact_phone = extract_contact_phone(combined_text)
    raw_image_url = domain_fields.get("image_url") or pick_image_url(soup, url)
    image_url = urljoin(url, raw_image_url) if raw_image_url else ""

    if not description:
        description = f"{title} at {company or 'Manual source'}. Open the source URL for the full posting."

    return {
        "title": title,
        "company": company or "Manual source",
        "location": location or "Thailand",
        "employment_type": employment_type,
        "category": category,
        "source": Job.SourceChoices.MANUAL,
        "source_url": url,
        "image_url": image_url,
        "description_en": normalize_rich_text(description),
        "description_mm": normalize_rich_text(description),
        "salary": salary,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
    }
