import json
import re
from datetime import timedelta
from itertools import islice
from urllib.parse import urlparse

from django.db.models import Count, Max
from django.shortcuts import get_object_or_404
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from .models import (
    ChannelCredential,
    FeedbackMessage,
    FetchRun,
    FetchSource,
    Job,
    ManagedAd,
    VisitorEvent,
)
from .serializers import (
    serialize_channel_credential,
    serialize_fetch_run,
    serialize_fetch_source,
    serialize_job,
    serialize_managed_ad,
    serialize_visitor_summary,
)
from .services.ingest import ingest_source


def _load_json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid JSON body.") from exc


def _clean_text(value) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split())


def _pick_meta_content(soup, *names: str) -> str:
    for name in names:
        tag = soup.find("meta", attrs={"property": name}) or soup.find(
            "meta", attrs={"name": name}
        )
        if tag and tag.get("content"):
            return _clean_text(tag.get("content"))
    return ""


def _pick_first_text(soup, selectors: list[str]) -> str:
    for selector in selectors:
        node = soup.select_one(selector)
        if node:
            return _clean_text(node.get_text(" ", strip=True))
    return ""


def _derive_company(hostname: str, title: str) -> str:
    separators = (" at ", " | ", " - ", " – ", " — ")
    lowered = title.lower()
    for separator in separators:
        if separator in lowered:
            parts = re.split(re.escape(separator), title, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2 and parts[1].strip():
                return _clean_text(parts[1])

    root = hostname.replace("www.", "").split(".")[0].replace("-", " ").strip()
    return _clean_text(root.title())


def _derive_title(raw_title: str) -> str:
    separators = (" at ", " | ", " - ", " – ", " — ")
    lowered = raw_title.lower()
    for separator in separators:
        if separator in lowered:
            parts = re.split(
                re.escape(separator), raw_title, maxsplit=1, flags=re.IGNORECASE
            )
            if parts and parts[0].strip():
                return _clean_text(parts[0])
    return _clean_text(raw_title)


def _derive_location(text: str) -> str:
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
            return _clean_text(match.group(0))
    return ""


def _extract_contact_email(text: str) -> str:
    match = re.search(r"([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})", text, flags=re.IGNORECASE)
    return _clean_text(match.group(1)) if match else ""


def _extract_contact_phone(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s().-]{7,}\d)", text)
    return _clean_text(match.group(1)) if match else ""


def _derive_category(hostname: str, text: str) -> str:
    lowered = f"{hostname} {text}".lower()
    ngo_signals = ["ngo", "un jobs", "unjobs", "reliefweb", "foundation", "humanitarian"]
    blue_collar_signals = ["driver", "warehouse", "technician", "operator", "factory", "helper"]
    if any(signal in lowered for signal in ngo_signals):
        return Job.CategoryChoices.NGO
    if any(signal in lowered for signal in blue_collar_signals):
        return Job.CategoryChoices.BLUE_COLLAR
    return Job.CategoryChoices.WHITE_COLLAR


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


def _collect_json_ld_objects(soup) -> list[dict]:
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


def _pick_nested_text(payload, *path: str) -> str:
    current = payload
    for key in path:
        if not isinstance(current, dict):
            return ""
        current = current.get(key)
    if isinstance(current, list):
        values = [_clean_text(item) for item in current if _clean_text(item)]
        return values[0] if values else ""
    return _clean_text(current)


def _extract_job_posting_json_ld(soup) -> dict:
    for item in _collect_json_ld_objects(soup):
        item_type = item.get("@type")
        if isinstance(item_type, list):
            matched = "JobPosting" in item_type
        else:
            matched = item_type == "JobPosting"
        if not matched:
            continue

        location = (
            _pick_nested_text(item, "jobLocation", "address", "addressLocality")
            or _pick_nested_text(item, "jobLocation", "address", "addressRegion")
            or _pick_nested_text(item, "jobLocation", "address", "addressCountry")
        )
        description = _clean_text(item.get("description"))
        salary = (
            _pick_nested_text(item, "baseSalary", "value", "value")
            or _pick_nested_text(item, "baseSalary", "value", "minValue")
        )
        return {
            "title": _clean_text(item.get("title")),
            "company": _pick_nested_text(item, "hiringOrganization", "name"),
            "location": location,
            "description": description,
            "employment_type": _clean_text(item.get("employmentType")),
            "salary": salary,
        }
    return {}


def _extract_linkedin_fields(soup) -> dict:
    return {
        "title": _pick_first_text(
            soup,
            [
                ".top-card-layout__title",
                ".topcard__title",
                "h1.top-card-layout__title",
            ],
        ),
        "company": _pick_first_text(
            soup,
            [
                ".topcard__org-name-link",
                ".topcard__flavor",
                ".top-card-layout__card .topcard__org-name-link",
            ],
        ),
        "location": _pick_first_text(
            soup,
            [
                ".topcard__flavor--bullet",
                ".topcard__flavor.topcard__flavor--bullet",
            ],
        ),
        "description": _pick_first_text(
            soup,
            [
                ".show-more-less-html__markup",
                ".description__text",
            ],
        ),
    }


def _extract_jobsdb_fields(soup) -> dict:
    return {
        "title": _pick_first_text(soup, ['[data-automation="job-detail-title"]', "h1"]),
        "company": _pick_first_text(
            soup,
            ['[data-automation="advertiser-name"]', '[data-automation="company-link"]'],
        ),
        "location": _pick_first_text(soup, ['[data-automation="job-detail-location"]']),
        "description": _pick_first_text(
            soup,
            ['[data-automation="jobAdDetails"]', '[data-automation="jobDescription"]'],
        ),
    }


def _extract_jobthai_fields(soup) -> dict:
    return {
        "title": _pick_first_text(soup, ["h1", ".css-1w2awul", ".job-title"]),
        "company": _pick_first_text(
            soup,
            [".job-company a", ".company-name", ".css-19n2x38"],
        ),
        "location": _pick_first_text(
            soup,
            [".job-location", ".location", ".css-129m7dg"],
        ),
        "description": _pick_first_text(
            soup,
            [".job-description", ".job-highlight", ".css-1id5vzh"],
        ),
    }


def _extract_thaingo_fields(soup) -> dict:
    return {
        "title": _pick_first_text(soup, ["h1", ".page-header h1", ".job-title"]),
        "company": _pick_first_text(
            soup,
            [".field-name-field-organization", ".job-company", ".company-name"],
        ),
        "location": _pick_first_text(
            soup,
            [".field-name-field-location", ".job-location", ".location"],
        ),
        "description": _pick_first_text(
            soup,
            [".field-name-body", ".job-description", ".content"],
        ),
    }


def _extract_domain_specific_fields(hostname: str, soup) -> dict:
    hostname = hostname.lower()
    if "linkedin.com" in hostname:
        return _extract_linkedin_fields(soup)
    if "jobsdb.com" in hostname:
        return _extract_jobsdb_fields(soup)
    if "jobthai.com" in hostname:
        return _extract_jobthai_fields(soup)
    if "thaingo.org" in hostname:
        return _extract_thaingo_fields(soup)
    return {}


@require_GET
def job_list(request):
    include_inactive = request.GET.get("include_inactive") == "1"
    jobs = Job.objects.all() if include_inactive else Job.objects.filter(is_active=True)
    results = [serialize_job(job) for job in jobs]
    return JsonResponse({"count": len(results), "results": results})


@csrf_exempt
@require_http_methods(["POST"])
def job_create(request: HttpRequest):
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["title", "company", "location", "description_mm"]
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return HttpResponseBadRequest(
            f"Missing required fields: {', '.join(missing)}"
        )

    slug = str(payload.get("slug", "")).strip()

    job = Job.objects.create(
        title=str(payload["title"]).strip(),
        slug=slug or "",
        company=str(payload["company"]).strip(),
        location=str(payload["location"]).strip(),
        category=payload.get("category", Job.CategoryChoices.WHITE_COLLAR),
        description_mm=str(payload["description_mm"]).strip(),
        description_en=str(payload.get("description_en", "")).strip(),
        source=payload.get("source", Job.SourceChoices.MANUAL),
        source_url=str(payload.get("source_url", "")).strip() or None,
        employment_type=payload.get("employment_type", Job.EmploymentType.FULL_TIME),
        salary=str(payload.get("salary", "")).strip(),
        contact_email=str(payload.get("contact_email", "")).strip(),
        contact_phone=str(payload.get("contact_phone", "")).strip(),
        status=payload.get("status", Job.WorkflowStatus.DRAFT),
        is_active=bool(payload.get("is_active", True)),
        requires_website_approval=bool(
            payload.get("requires_website_approval", False)
        ),
        requires_facebook_approval=bool(
            payload.get("requires_facebook_approval", False)
        ),
    )
    return JsonResponse(serialize_job(job), status=201)


@csrf_exempt
@require_http_methods(["GET", "PATCH", "DELETE"])
def job_detail(request: HttpRequest, job_id: int):
    job = get_object_or_404(Job, pk=job_id)

    if request.method == "GET":
        return JsonResponse(serialize_job(job))

    if request.method == "DELETE":
        job.delete()
        return JsonResponse({"detail": "Job deleted."})

    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    for field in [
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
    ]:
        if field in payload:
            setattr(job, field, str(payload[field]).strip())

    if "source_url" in payload:
        job.source_url = str(payload.get("source_url", "")).strip() or None

    if "is_active" in payload:
        job.is_active = bool(payload["is_active"])

    if "requires_website_approval" in payload:
        job.requires_website_approval = bool(payload["requires_website_approval"])

    if "requires_facebook_approval" in payload:
        job.requires_facebook_approval = bool(payload["requires_facebook_approval"])

    required = {
        "title": str(job.title).strip(),
        "company": str(job.company).strip(),
        "location": str(job.location).strip(),
        "description_mm": str(job.description_mm).strip(),
    }
    missing = [field for field, value in required.items() if not value]
    if missing:
        return HttpResponseBadRequest(
            f"Missing required fields: {', '.join(missing)}"
        )

    job.save()
    return JsonResponse(serialize_job(job))


@csrf_exempt
@require_http_methods(["POST"])
def job_scrape_preview(request: HttpRequest):
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    url = str(payload.get("url", "")).strip()
    if not url:
        return HttpResponseBadRequest("Missing required field: url")
    if not url.startswith(("http://", "https://")):
        return HttpResponseBadRequest("URL must start with http:// or https://")

    try:
        import requests
        from bs4 import BeautifulSoup
    except ImportError as exc:
        return HttpResponseBadRequest(str(exc))

    try:
        request_headers = {
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0 Safari/537.36"
            )
        }
        try:
            response = requests.get(url, headers=request_headers, timeout=20)
        except requests.exceptions.SSLError:
            requests.packages.urllib3.disable_warnings()  # type: ignore[attr-defined]
            response = requests.get(
                url,
                headers=request_headers,
                timeout=20,
                verify=False,
            )
        response.raise_for_status()
    except requests.RequestException as exc:
        return HttpResponseBadRequest(f"Unable to fetch URL: {exc}")

    soup = BeautifulSoup(response.text, "html.parser")
    hostname = urlparse(url).netloc
    json_ld_fields = _extract_job_posting_json_ld(soup)
    domain_fields = _extract_domain_specific_fields(hostname, soup)

    raw_title = (
        domain_fields.get("title")
        or json_ld_fields.get("title")
        or _pick_meta_content(
        soup,
        "og:title",
        "twitter:title",
    )
        or _clean_text(soup.title.string if soup.title else "")
    )
    description = (
        domain_fields.get("description")
        or json_ld_fields.get("description")
        or _pick_meta_content(
        soup,
        "og:description",
        "twitter:description",
        "description",
    )
    )
    if not description:
        paragraph = soup.find("p")
        description = _clean_text(paragraph.get_text(" ", strip=True) if paragraph else "")

    body_text = _clean_text(" ".join(islice(soup.stripped_strings, 120))) if soup else ""
    combined_text = " ".join(filter(None, [raw_title, description, body_text]))
    location = (
        domain_fields.get("location")
        or json_ld_fields.get("location")
        or _derive_location(combined_text)
    )
    company = (
        domain_fields.get("company")
        or json_ld_fields.get("company")
        or _pick_meta_content(soup, "og:site_name")
        or _derive_company(
        hostname, raw_title
    )
    )
    title = _derive_title(raw_title) or "Imported job listing"
    category = _derive_category(hostname, combined_text)
    employment_type = _normalize_employment_type(
        domain_fields.get("employment_type")
        or json_ld_fields.get("employment_type")
        or ""
    )
    salary = _clean_text(domain_fields.get("salary") or json_ld_fields.get("salary") or "")
    contact_email = _extract_contact_email(combined_text)
    contact_phone = _extract_contact_phone(combined_text)
    if not description:
        description = f"{title} at {company or 'Manual source'}. Open the source URL for the full posting."

    return JsonResponse(
        {
            "title": title,
            "company": company or "Manual source",
            "location": location or "Thailand",
            "employment_type": employment_type,
            "category": category,
            "source": Job.SourceChoices.MANUAL,
            "source_url": url,
            "description_en": description,
            "description_mm": description,
            "salary": salary,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def visitor_track(request: HttpRequest):
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    session_key = str(payload.get("session_key", "")).strip()
    path = str(payload.get("path", "")).strip()
    page_title = str(payload.get("page_title", "")).strip()
    if not session_key or not path:
        return HttpResponseBadRequest("Missing required fields: session_key, path")

    today = timezone.localdate()
    event, created = VisitorEvent.objects.get_or_create(
        session_key=session_key,
        path=path,
        visit_date=today,
        defaults={"page_title": page_title[:160]},
    )

    if not created:
        updates = []
        if page_title and event.page_title != page_title[:160]:
            event.page_title = page_title[:160]
            updates.append("page_title")
        event.save(update_fields=updates + ["last_seen_at"])

    return JsonResponse({"recorded": True, "created": created})


@require_GET
def visitor_summary(request: HttpRequest):
    today = timezone.localdate()
    last_7_days = today - timedelta(days=6)
    events = VisitorEvent.objects.all()

    payload = {
        "total_visitors": events.values("session_key").distinct().count(),
        "today_visitors": events.filter(visit_date=today)
        .values("session_key")
        .distinct()
        .count(),
        "last_7_days_visitors": events.filter(visit_date__gte=last_7_days)
        .values("session_key")
        .distinct()
        .count(),
        "top_paths": list(
            events.values("path")
            .annotate(
                visitors=Count("session_key", distinct=True),
                visits=Count("id"),
                last_seen_at=Max("last_seen_at"),
            )
            .order_by("-visitors", "path")[:8]
        ),
    }
    return JsonResponse(serialize_visitor_summary(payload))


@require_GET
def managed_ad_list(request: HttpRequest):
    placement = str(request.GET.get("placement", "")).strip()
    status = str(request.GET.get("status", "")).strip()
    ads = ManagedAd.objects.all()

    if placement:
        ads = ads.filter(placement=placement)
    if status:
        ads = ads.filter(status=status)

    return JsonResponse({"results": [serialize_managed_ad(ad) for ad in ads]})


@require_GET
def public_active_ad_list(request: HttpRequest):
    placements = [
        value.strip()
        for value in str(request.GET.get("placements", "")).split(",")
        if value.strip()
    ]
    ads = ManagedAd.objects.filter(status=ManagedAd.StatusChoices.ACTIVE)
    if placements:
        ads = ads.filter(placement__in=placements)
    return JsonResponse({"results": [serialize_managed_ad(ad) for ad in ads]})


@csrf_exempt
@require_http_methods(["POST"])
def managed_ad_create(request: HttpRequest):
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["title", "description", "cta_label", "href", "placement"]
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return HttpResponseBadRequest(
            f"Missing required fields: {', '.join(missing)}"
        )

    ad = ManagedAd.objects.create(
        title=str(payload["title"]).strip(),
        eyebrow=str(payload.get("eyebrow", "Sponsored")).strip() or "Sponsored",
        description=str(payload["description"]).strip(),
        cta_label=str(payload["cta_label"]).strip(),
        href=str(payload["href"]).strip(),
        placement=str(payload["placement"]).strip(),
        status=str(payload.get("status", ManagedAd.StatusChoices.DRAFT)).strip(),
        sort_order=int(payload.get("sort_order", 100) or 100),
    )
    return JsonResponse(serialize_managed_ad(ad), status=201)


@csrf_exempt
@require_http_methods(["GET", "PATCH", "DELETE"])
def managed_ad_detail(request: HttpRequest, ad_id: int):
    ad = get_object_or_404(ManagedAd, pk=ad_id)

    if request.method == "GET":
        return JsonResponse(serialize_managed_ad(ad))

    if request.method == "DELETE":
        ad.delete()
        return JsonResponse({"detail": "Ad deleted."})

    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    for field in [
        "title",
        "eyebrow",
        "description",
        "cta_label",
        "href",
        "placement",
        "status",
    ]:
        if field in payload:
            setattr(ad, field, str(payload[field]).strip())

    if "sort_order" in payload:
        ad.sort_order = int(payload.get("sort_order") or 100)

    required = {
        "title": str(ad.title).strip(),
        "description": str(ad.description).strip(),
        "cta_label": str(ad.cta_label).strip(),
        "href": str(ad.href).strip(),
        "placement": str(ad.placement).strip(),
    }
    missing = [field for field, value in required.items() if not value]
    if missing:
        return HttpResponseBadRequest(
            f"Missing required fields: {', '.join(missing)}"
        )

    ad.save()
    return JsonResponse(serialize_managed_ad(ad))


@require_GET
def fetch_source_list(request):
    sources = FetchSource.objects.all()
    return JsonResponse(
        {
            "count": sources.count(),
            "results": [serialize_fetch_source(source) for source in sources],
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def fetch_source_create(request: HttpRequest):
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["key", "label", "domain", "mode"]
    missing = [field for field in required if not payload.get(field)]
    if missing:
        return HttpResponseBadRequest(
            f"Missing required fields: {', '.join(missing)}"
        )

    source = FetchSource.objects.create(
        key=payload["key"],
        label=payload["label"],
        domain=payload["domain"],
        feed_url=payload.get("feed_url", ""),
        mode=payload["mode"],
        enabled=payload.get("enabled", True),
        requires_manual_url=payload.get("requires_manual_url", False),
        auto_publish_website=payload.get("auto_publish_website", True),
        auto_publish_facebook=payload.get("auto_publish_facebook", False),
        approval_required_for_website=payload.get(
            "approval_required_for_website", False
        ),
        approval_required_for_facebook=payload.get(
            "approval_required_for_facebook", True
        ),
        default_category=payload.get(
            "default_category", Job.CategoryChoices.WHITE_COLLAR
        ),
        cadence_value=payload.get("cadence_value", 30),
        cadence_unit=payload.get("cadence_unit", FetchSource.CadenceUnit.MINUTES),
        max_jobs_per_run=payload.get("max_jobs_per_run", 25),
        selectors=payload.get("selectors", {}),
        headers=payload.get("headers", {}),
    )
    return JsonResponse(serialize_fetch_source(source), status=201)


@csrf_exempt
@require_http_methods(["PATCH"])
def fetch_source_update(request: HttpRequest, source_id: int):
    source = get_object_or_404(FetchSource, pk=source_id)
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    for field in [
        "label",
        "domain",
        "feed_url",
        "mode",
        "enabled",
        "requires_manual_url",
        "auto_publish_website",
        "auto_publish_facebook",
        "approval_required_for_website",
        "approval_required_for_facebook",
        "default_category",
        "cadence_value",
        "cadence_unit",
        "max_jobs_per_run",
        "selectors",
        "headers",
        "status",
    ]:
        if field in payload:
            setattr(source, field, payload[field])

    source.save()
    return JsonResponse(serialize_fetch_source(source))


@csrf_exempt
@require_POST
def fetch_source_run(request: HttpRequest, source_id: int):
    source = get_object_or_404(FetchSource, pk=source_id)
    result = ingest_source(source)
    return JsonResponse(result)


@require_GET
def fetch_run_list(request):
    runs = FetchRun.objects.select_related("source")[:20]
    return JsonResponse(
        {"count": len(runs), "results": [serialize_fetch_run(run) for run in runs]}
    )


@csrf_exempt
@require_http_methods(["GET", "PATCH"])
def facebook_channel_credential(request: HttpRequest):
    credential, _ = ChannelCredential.objects.get_or_create(
        platform=ChannelCredential.PlatformChoices.FACEBOOK
    )

    if request.method == "GET":
        return JsonResponse(serialize_channel_credential(credential))

    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    if "account_name" in payload:
        credential.account_name = str(payload.get("account_name", "")).strip()
    if "page_id" in payload:
        credential.page_id = str(payload.get("page_id", "")).strip()
    if "access_token" in payload:
        credential.access_token = str(payload.get("access_token", "")).strip()

    credential.save()
    return JsonResponse(serialize_channel_credential(credential))


@csrf_exempt
@require_POST
def feedback_create(request: HttpRequest):
    try:
        payload = _load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["name", "email", "subject", "message"]
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return HttpResponseBadRequest(
            f"Missing required fields: {', '.join(missing)}"
        )

    feedback = FeedbackMessage.objects.create(
        name=str(payload["name"]).strip(),
        email=str(payload["email"]).strip(),
        subject=str(payload["subject"]).strip(),
        message=str(payload["message"]).strip(),
    )

    return JsonResponse(
        {
            "id": feedback.id,
            "detail": "Feedback received.",
        },
        status=201,
    )
