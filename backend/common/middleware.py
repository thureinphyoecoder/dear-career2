from django.conf import settings
from django.http import HttpResponse


class ApiCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        is_api_request = request.path.startswith("/api/")
        origin = request.headers.get("Origin")
        allowed_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", [])

        if (
            is_api_request
            and request.method == "OPTIONS"
            and origin
            and origin in allowed_origins
        ):
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)

        if is_api_request and origin and origin in allowed_origins:
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"
            response["Access-Control-Allow-Credentials"] = "true"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            requested_headers = request.headers.get(
                "Access-Control-Request-Headers",
                "Content-Type, Authorization, X-Requested-With",
            )
            response["Access-Control-Allow-Headers"] = requested_headers
            response["Access-Control-Max-Age"] = "86400"

        return response
