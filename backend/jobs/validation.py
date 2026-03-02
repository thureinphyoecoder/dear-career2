import re

from django.core.exceptions import ValidationError
from django.db import models
from django.utils.html import strip_tags


def clean_text_input(value: object | None) -> str:
    if value is None:
        return ""
    text = strip_tags(str(value))
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def clean_url_input(value: object | None) -> str:
    return clean_text_input(value)


def clean_json_object(value: object | None) -> dict:
    return value if isinstance(value, dict) else {}


def format_validation_error(exc: ValidationError, fallback: str = "Invalid input.") -> str:
    if hasattr(exc, "message_dict"):
        parts: list[str] = []
        for field, messages in exc.message_dict.items():
            if not messages:
                continue
            parts.append(f"{field}: {messages[0]}")
        if parts:
            return " ".join(parts)

    if getattr(exc, "messages", None):
        return str(exc.messages[0])

    return fallback


def validate_instance(instance: models.Model) -> None:
    instance.full_clean()
