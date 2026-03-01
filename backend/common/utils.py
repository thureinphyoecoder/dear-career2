"""Common utility helpers."""

from django.utils.text import slugify


def normalize_slug(value: str) -> str:
    return slugify(value).strip("-")
