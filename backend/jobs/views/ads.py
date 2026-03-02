from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from ..models import ManagedAd
from ..serializers import serialize_managed_ad
from .shared import load_json_body


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
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    required = ["title", "description", "cta_label", "href", "placement"]
    missing = [field for field in required if not str(payload.get(field, "")).strip()]
    if missing:
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

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
        payload = load_json_body(request)
    except ValueError as exc:
        return HttpResponseBadRequest(str(exc))

    for field in ["title", "eyebrow", "description", "cta_label", "href", "placement", "status"]:
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
        return HttpResponseBadRequest(f"Missing required fields: {', '.join(missing)}")

    ad.save()
    return JsonResponse(serialize_managed_ad(ad))
