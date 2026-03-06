from __future__ import annotations

from io import BytesIO
from pathlib import Path
import uuid
from urllib.parse import urlparse

import requests
from django.core.files.base import ContentFile
from django.utils.text import slugify
from PIL import Image, UnidentifiedImageError

MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {
    "JPEG": "jpg",
    "PNG": "png",
    "WEBP": "webp",
    "GIF": "gif",
}


def _build_image_fetch_headers(
    image_url: str,
    extra_headers: dict[str, str] | None = None,
    source_url: str | None = None,
) -> dict[str, str]:
    parsed = urlparse(image_url)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else ""
    referer = source_url or origin
    headers: dict[str, str] = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0 Safari/537.36"
        ),
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }
    if referer:
        headers["Referer"] = referer
    if origin:
        headers["Origin"] = origin
    if extra_headers:
        headers.update(extra_headers)
    return headers


def normalize_uploaded_image_bytes(filename: str, raw_bytes: bytes) -> tuple[str, ContentFile]:
    if len(raw_bytes) > MAX_IMAGE_UPLOAD_BYTES:
        raise ValueError("Image upload exceeds 10 MB limit.")

    try:
        with Image.open(BytesIO(raw_bytes)) as image:
            image.verify()
        with Image.open(BytesIO(raw_bytes)) as image:
            image_format = (image.format or "").upper()
    except (UnidentifiedImageError, OSError, SyntaxError) as exc:
        raise ValueError("Uploaded file is not a valid image.") from exc

    extension = ALLOWED_IMAGE_FORMATS.get(image_format)
    if not extension:
        allowed_formats = ", ".join(sorted(ALLOWED_IMAGE_FORMATS.values()))
        raise ValueError(f"Unsupported image format. Allowed formats: {allowed_formats}.")

    sanitized_stem = slugify(Path(filename).stem) or "job-image"
    final_name = f"{sanitized_stem}-{uuid.uuid4().hex[:8]}.{extension}"
    return final_name, ContentFile(raw_bytes)


def normalize_uploaded_image(uploaded_file) -> tuple[str, ContentFile]:
    return normalize_uploaded_image_bytes(uploaded_file.name, uploaded_file.read())


def mirror_remote_job_image(job, image_url: str, headers: dict[str, str] | None = None) -> bool:
    image_url = (image_url or "").strip()
    if not image_url.startswith(("http://", "https://")):
        return False

    response = requests.get(
        image_url,
        headers=_build_image_fetch_headers(
            image_url,
            headers,
            getattr(job, "source_url", "") or None,
        ),
        timeout=20,
        stream=True,
    )
    response.raise_for_status()

    content_type = (response.headers.get("content-type") or "").lower()
    if content_type and (
        content_type.startswith("text/")
        or "html" in content_type
        or "json" in content_type
        or "xml" in content_type
    ):
        raise ValueError("Remote file is not served as an image.")

    chunks: list[bytes] = []
    total_size = 0
    for chunk in response.iter_content(chunk_size=8192):
        if not chunk:
            continue
        total_size += len(chunk)
        if total_size > MAX_IMAGE_UPLOAD_BYTES:
            raise ValueError("Image upload exceeds 10 MB limit.")
        chunks.append(chunk)

    filename, content = normalize_uploaded_image_bytes(
        Path(image_url.split("?", 1)[0]).name or "job-image",
        b"".join(chunks),
    )

    if job.image_file:
        job.image_file.delete(save=False)
    job.image_file.save(filename, content, save=False)
    job.save(update_fields=["image_file", "updated_at"])
    return True
