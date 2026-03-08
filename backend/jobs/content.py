from __future__ import annotations

import re
from html import unescape

SECTION_HEADINGS = {
    "about",
    "about the role",
    "benefits",
    "compensation",
    "how to apply",
    "key responsibilities",
    "location",
    "qualifications",
    "requirements",
    "responsibilities",
    "role overview",
    "status",
    "to apply",
}

EMOJI_BULLETS = ("📍", "🕓", "💼", "💰", "📧", "📌", "📞", "🗓", "📅", "🌐")


def _import_bs4():
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        return None
    return BeautifulSoup


def clean_inline_text(value: object | None) -> str:
    if value is None:
        return ""
    return " ".join(unescape(str(value)).split())


def _strip_html_preserving_blocks(value: str) -> str:
    if "<" not in value or ">" not in value:
        return value

    BeautifulSoup = _import_bs4()
    if BeautifulSoup is None:
        return value

    soup = BeautifulSoup(value, "html.parser")
    for tag in soup.find_all("br"):
        tag.replace_with("\n")
    for tag in soup.find_all("li"):
        tag.insert_before("\n- ")
    for tag in soup.find_all(["p", "div", "section", "article", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6"]):
        tag.insert_before("\n")
    return soup.get_text("\n", strip=False)


def _normalize_line(line: str) -> str:
    line = re.sub(r"[ \t]+", " ", line.strip())
    line = re.sub(r"^[📍🕓💼💰📧📌📞🗓📅🌐]\s*", "", line)
    line = re.sub(r"^[•●▪◦‣]\s*", "- ", line)
    return line.strip()


def is_bullet_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if stripped.startswith(("- ", "* ", "• ", "● ", "▪ ", "◦ ", "‣ ")):
        return True
    if re.match(r"^\d+[.)]\s+", stripped):
        return True
    if any(stripped.startswith(prefix) for prefix in EMOJI_BULLETS) and ":" in stripped:
        return True
    return False


def is_heading_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped or is_bullet_line(stripped):
        return False
    normalized = stripped.rstrip(":").strip().lower()
    if normalized in SECTION_HEADINGS:
        return True
    if stripped.endswith(":") and len(stripped.split()) <= 6 and len(stripped) <= 80:
        return True
    return False


def normalize_rich_text(value: object | None) -> str:
    raw = _strip_html_preserving_blocks(unescape(str(value or "")))
    raw = raw.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")

    lines: list[str] = []
    paragraph_parts: list[str] = []

    def flush_paragraph() -> None:
        if paragraph_parts:
            lines.append(" ".join(paragraph_parts).strip())
            paragraph_parts.clear()

    for raw_line in raw.split("\n"):
        line = _normalize_line(raw_line)
        if not line:
            flush_paragraph()
            if lines and lines[-1] != "":
                lines.append("")
            continue
        if is_heading_line(line) or is_bullet_line(line):
            flush_paragraph()
            lines.append(line)
            continue
        paragraph_parts.append(line)

    flush_paragraph()

    while lines and not lines[-1]:
        lines.pop()

    return "\n".join(lines)


def extract_summary(value: object | None, limit: int = 220) -> str:
    text = normalize_rich_text(value)
    if not text:
        return ""

    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped or is_heading_line(stripped) or is_bullet_line(stripped):
            continue
        return stripped[:limit].strip()

    fallback = next((line.strip() for line in text.split("\n") if line.strip()), "")
    return fallback[:limit].strip()


def build_facebook_post_message(job) -> str:
    description = normalize_rich_text(job.description_en or job.description_mm or "")
    lines = [job.title, f"{job.company} · {job.location}"]

    if job.employment_type:
        lines.append(f"Status: {job.employment_type.replace('-', ' ').title()}")
    if job.salary:
        lines.append(f"Salary: {job.salary}")

    cleaned_description_lines: list[str] = []
    seen: set[str] = set()
    for raw_line in description.split("\n"):
        line = raw_line.strip()
        if not line:
            continue
        line = re.sub(r"^[•●▪◦‣]\s*", "- ", line)
        line = re.sub(r"\s+", " ", line).strip()
        if line in {"-", "--", "- -"}:
            continue
        normalized = line.casefold()
        if normalized in seen:
            continue
        seen.add(normalized)
        cleaned_description_lines.append(line)

    if cleaned_description_lines:
        lines.append("")
        lines.extend(cleaned_description_lines[:40])

    compact: list[str] = []
    previous_blank = False
    for line in lines:
        if not line:
            if not previous_blank:
                compact.append("")
            previous_blank = True
            continue
        compact.append(line)
        previous_blank = False

    while compact and compact[-1] == "":
        compact.pop()

    return "\n".join(compact).strip()
