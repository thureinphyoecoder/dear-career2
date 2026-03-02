from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..admin_api import require_admin_api_auth
from ..models import ManagedAd
from ..serializers import serialize_managed_ad
from ..validation import clean_text_input, clean_url_input, format_validation_error, validate_instance
from .shared import load_json_body


@require_GET
@require_admin_api_auth
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
@require_admin_api_auth
@require_http_methods(["POST"])
def managed_ad_create(request: HttpRequest):
    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["title", "description", "cta_label", "href", "placement"]
    missing = [field for field in required if not clean_text_input(payload.get(field))]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    ad = ManagedAd(
        title=clean_text_input(payload["title"]),
        eyebrow=clean_text_input(payload.get("eyebrow", "Sponsored")) or "Sponsored",
        description=clean_text_input(payload["description"]),
        cta_label=clean_text_input(payload["cta_label"]),
        href=clean_url_input(payload["href"]),
        placement=clean_text_input(payload["placement"]),
        status=clean_text_input(payload.get("status", ManagedAd.StatusChoices.DRAFT)),
        sort_order=int(payload.get("sort_order", 100) or 100),
    )
    try:
        validate_instance(ad)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid ad payload."))
    ad.save()
    return JsonResponse(serialize_managed_ad(ad), status=201)


@csrf_exempt
@require_admin_api_auth
@require_http_methods(["GET", "PATCH", "DELETE"])
def managed_ad_detail(request: HttpRequest, ad_id: int):
    ad = get_object_or_404(ManagedAd, pk=ad_id)

    if request.method == "GET":
        return JsonResponse(serialize_managed_ad(ad))
    if request.method == "DELETE":
        ad.delete()
        return JsonResponse({"detail": "Ad deleted."})

    try:
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    for field in ["title", "eyebrow", "description", "cta_label", "href", "placement", "status"]:
        if field in payload:
            cleaner = clean_url_input if field == "href" else clean_text_input
            setattr(ad, field, cleaner(payload[field]))
    if "sort_order" in payload:
        ad.sort_order = int(payload.get("sort_order") or 100)

    required = {
        "title": clean_text_input(ad.title),
        "description": clean_text_input(ad.description),
        "cta_label": clean_text_input(ad.cta_label),
        "href": clean_url_input(ad.href),
        "placement": clean_text_input(ad.placement),
    }
    missing = [field for field, value in required.items() if not value]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    try:
        validate_instance(ad)
    except ValidationError as exc:
        return HttpResponseBadRequest(format_validation_error(exc, "Invalid ad payload."))
    ad.save()
    return JsonResponse(serialize_managed_ad(ad))
