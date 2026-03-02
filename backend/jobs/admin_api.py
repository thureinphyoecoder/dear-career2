import os
from functools import wraps

from django.http import HttpRequest, JsonResponse


def get_admin_api_key() -> str:
    configured = os.getenv("ADMIN_API_SHARED_SECRET", "").strip()
    if configured:
        return configured

    if os.getenv("DJANGO_DEBUG", "True").lower() == "true":
        return "dear-career-dev-admin-api"

    return ""


def has_valid_admin_api_key(request: HttpRequest) -> bool:
    expected = get_admin_api_key()
    if not expected:
        return False
    provided = request.headers.get("x-admin-api-key", "").strip()
    return bool(provided) and provided == expected


def require_admin_api_auth(view_func):
    @wraps(view_func)
    def wrapped(request: HttpRequest, *args, **kwargs):
        if not has_valid_admin_api_key(request):
            return JsonResponse({"detail": "Admin authentication required."}, status=403)
        return view_func(request, *args, **kwargs)

    return wrapped
