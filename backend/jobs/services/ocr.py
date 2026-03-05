from __future__ import annotations

from functools import lru_cache
from io import BytesIO
from typing import Literal

from PIL import Image, ImageOps, UnidentifiedImageError

from .images import normalize_uploaded_image_bytes


class OCREngineUnavailableError(RuntimeError):
    pass


class OCRExtractionError(RuntimeError):
    pass


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


def _build_ocr_candidates(image: Image.Image) -> list[bytes]:
    candidates: list[bytes] = []

    base = image.copy()
    candidates.append(_render_png_bytes(base))

    gray = ImageOps.grayscale(base)
    candidates.append(_render_png_bytes(gray))

    contrasted = ImageOps.autocontrast(gray, cutoff=2)
    candidates.append(_render_png_bytes(contrasted))

    # Complex posters often need a larger render to recover small text.
    w, h = base.size
    if max(w, h) < 2200:
        scaled = base.resize((int(w * 1.6), int(h * 1.6)), Image.Resampling.LANCZOS)
        candidates.append(_render_png_bytes(ImageOps.autocontrast(ImageOps.grayscale(scaled), cutoff=2)))

    return candidates


def extract_text_from_image_bytes(filename: str, raw_bytes: bytes) -> str:
    normalize_uploaded_image_bytes(filename, raw_bytes)

    try:
        with Image.open(BytesIO(raw_bytes)) as image:
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            candidates = _build_ocr_candidates(normalized)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise OCRExtractionError("Uploaded image could not be prepared for OCR.") from exc

    best_lines: list[str] = []
    last_error: Exception | None = None
    for rec_lang in ("th", "en"):
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

            extracted_lines = [line.strip() for line in (result.txts or ()) if line and line.strip()]
            if len(extracted_lines) > len(best_lines):
                best_lines = extracted_lines

    if not best_lines and last_error is not None:
        raise OCRExtractionError(f"Image text extraction failed: {last_error}") from last_error

    extracted_lines = best_lines
    if not extracted_lines:
        raise OCRExtractionError(
            "No readable text was detected in the uploaded image. Try a clearer crop with higher contrast."
        )

    return "\n".join(extracted_lines)
