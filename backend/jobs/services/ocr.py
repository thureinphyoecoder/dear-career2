from __future__ import annotations

from functools import lru_cache
from io import BytesIO
from typing import Literal

from PIL import Image, ImageEnhance, ImageFilter, ImageOps, UnidentifiedImageError

from .images import normalize_uploaded_image_bytes


class OCREngineUnavailableError(RuntimeError):
    pass


class OCRExtractionError(RuntimeError):
    pass


OCRMode = Literal["fast", "balanced", "accurate"]


@lru_cache(maxsize=2)
def _get_ocr_engine(rec_lang: Literal["th", "en"] = "th"):
    try:
        from rapidocr import RapidOCR
        from rapidocr.utils.typings import EngineType, LangDet, LangRec, OCRVersion
    except ImportError as exc:
        raise OCREngineUnavailableError(
            "Image-to-text OCR dependencies are not installed on the server. "
            "Install with `pip install -r backend/requirements.txt` or rebuild Docker backend."
        ) from exc

    params = {
        "Global.log_level": "error",
        "Det.engine_type": EngineType.ONNXRUNTIME,
        "Det.lang_type": LangDet.MULTI,
        "Rec.engine_type": EngineType.ONNXRUNTIME,
        "Rec.lang_type": LangRec.TH if rec_lang == "th" else LangRec.EN,
    }
    if rec_lang == "th":
        # Thai recognition is only supported with PP-OCRv5 in RapidOCR 3.6.
        params["Rec.ocr_version"] = OCRVersion.PPOCRV5

    return RapidOCR(params=params)


def _render_png_bytes(image: Image.Image) -> bytes:
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _resolve_mode(mode: str | None) -> OCRMode:
    if mode in ("fast", "balanced", "accurate"):
        return mode
    return "balanced"


def _build_ocr_candidates(image: Image.Image, mode: OCRMode) -> list[bytes]:
    candidates: list[bytes] = []

    base = image.copy()
    w, h = base.size
    longest = max(w, h)
    max_edge = 1800 if mode == "fast" else (2400 if mode == "balanced" else 2800)
    if longest > max_edge:
        scale = max_edge / float(longest)
        base = base.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)

    candidates.append(_render_png_bytes(base))

    gray = ImageOps.grayscale(base)
    candidates.append(_render_png_bytes(ImageOps.autocontrast(gray, cutoff=2)))

    if mode != "fast":
        sharpened = gray.filter(ImageFilter.UnsharpMask(radius=1.2, percent=180, threshold=2))
        candidates.append(_render_png_bytes(ImageOps.autocontrast(sharpened, cutoff=2)))

    if mode == "accurate":
        threshold = ImageOps.autocontrast(gray, cutoff=2).point(lambda px: 255 if px > 165 else 0)
        candidates.append(_render_png_bytes(threshold))

        contrast = ImageEnhance.Contrast(base).enhance(1.15)
        candidates.append(_render_png_bytes(ImageOps.autocontrast(ImageOps.grayscale(contrast), cutoff=1)))

        if max(base.size) < 2300:
            scaled = base.resize((int(base.size[0] * 1.45), int(base.size[1] * 1.45)), Image.Resampling.LANCZOS)
            candidates.append(_render_png_bytes(ImageOps.autocontrast(ImageOps.grayscale(scaled), cutoff=2)))

    if mode == "balanced" and max(base.size) < 2100:
        scaled = base.resize((int(base.size[0] * 1.3), int(base.size[1] * 1.3)), Image.Resampling.LANCZOS)
        candidates.append(_render_png_bytes(ImageOps.autocontrast(ImageOps.grayscale(scaled), cutoff=2)))

    return candidates


def _normalize_lines(lines: list[str]) -> list[str]:
    cleaned: list[str] = []
    seen: set[str] = set()
    for line in lines:
        normalized = " ".join((line or "").strip().split())
        if len(normalized) < 2:
            continue
        key = normalized.casefold()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(normalized)

    if not cleaned:
        return cleaned

    merged: list[str] = []
    for current in cleaned:
        if (
            merged
            and len(merged[-1]) <= 90
            and len(current) <= 90
            and not merged[-1].endswith((".", "!", "?", ":"))
            and not current.lower().startswith(("http", "www.", "email", "phone", "salary", "location"))
        ):
            previous = merged[-1]
            if previous.endswith("-"):
                merged[-1] = f"{previous[:-1]}{current}"
            elif previous.count(" ") <= 2 and current[:1].islower():
                merged[-1] = f"{previous} {current}"
            else:
                merged.append(current)
            continue
        merged.append(current)

    return merged


def extract_text_from_image_bytes(filename: str, raw_bytes: bytes, mode: str | None = None) -> str:
    resolved_mode = _resolve_mode(mode)
    normalize_uploaded_image_bytes(filename, raw_bytes)

    try:
        with Image.open(BytesIO(raw_bytes)) as image:
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            candidates = _build_ocr_candidates(normalized, resolved_mode)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise OCRExtractionError("Uploaded image could not be prepared for OCR.") from exc

    best_lines: list[str] = []
    last_error: Exception | None = None
    language_passes: tuple[str, ...]
    if resolved_mode == "fast":
        language_passes = ("th",)
    elif resolved_mode == "accurate":
        language_passes = ("th", "en")
    else:
        language_passes = ("th", "en")

    for rec_lang in language_passes:
        if rec_lang == "en" and resolved_mode == "balanced" and len(best_lines) >= 16:
            break

        try:
            engine = _get_ocr_engine(rec_lang)
        except OCREngineUnavailableError:
            raise
        except Exception as exc:
            last_error = exc
            continue

        for candidate in candidates:
            try:
                result = engine(candidate)
            except Exception as exc:
                last_error = exc
                continue

            extracted_lines = _normalize_lines([line.strip() for line in (result.txts or ()) if line and line.strip()])
            if len(extracted_lines) > len(best_lines):
                best_lines = extracted_lines
                if resolved_mode == "fast" and len(best_lines) >= 14:
                    return "\n".join(best_lines)
                if resolved_mode == "balanced" and rec_lang == "th" and len(best_lines) >= 24:
                    return "\n".join(best_lines)

    if not best_lines and last_error is not None:
        raise OCRExtractionError(f"Image text extraction failed: {last_error}") from last_error

    extracted_lines = best_lines
    if not extracted_lines:
        raise OCRExtractionError(
            "No readable text was detected in the uploaded image. Try a clearer crop with higher contrast."
        )

    return "\n".join(extracted_lines)
