from __future__ import annotations

from functools import lru_cache
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

from .images import normalize_uploaded_image_bytes


class OCREngineUnavailableError(RuntimeError):
    pass


class OCRExtractionError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _get_ocr_engine():
    try:
        from rapidocr import RapidOCR
        from rapidocr.utils.typings import EngineType, LangDet, LangRec
    except ImportError as exc:
        raise OCREngineUnavailableError(
            "Image-to-text OCR dependencies are not installed on the server."
        ) from exc

    return RapidOCR(
        params={
            "Global.log_level": "error",
            "Det.engine_type": EngineType.ONNXRUNTIME,
            "Det.lang_type": LangDet.MULTI,
            "Rec.engine_type": EngineType.ONNXRUNTIME,
            "Rec.lang_type": LangRec.TH,
        }
    )


def extract_text_from_image_bytes(filename: str, raw_bytes: bytes) -> str:
    normalize_uploaded_image_bytes(filename, raw_bytes)

    try:
        with Image.open(BytesIO(raw_bytes)) as image:
            normalized = ImageOps.exif_transpose(image).convert("RGB")
            buffer = BytesIO()
            normalized.save(buffer, format="PNG")
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise OCRExtractionError("Uploaded image could not be prepared for OCR.") from exc

    try:
        result = _get_ocr_engine()(buffer.getvalue())
    except OCREngineUnavailableError:
        raise
    except Exception as exc:
        raise OCRExtractionError("Image text extraction failed.") from exc

    extracted_lines = [line.strip() for line in (result.txts or ()) if line and line.strip()]
    if not extracted_lines:
        raise OCRExtractionError(
            "No readable text was detected in the uploaded image."
        )

    return "\n".join(extracted_lines)
