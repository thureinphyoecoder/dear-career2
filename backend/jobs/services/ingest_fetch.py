from __future__ import annotations

from pathlib import Path
import shutil
import subprocess

from jobs.content import clean_inline_text
from jobs.models import FetchSource
from jobs.services.ingest_common import (
    DEFAULT_TIMEOUT_SECONDS,
    FetchConfigurationError,
    build_request_headers,
    get_selector,
    import_requests,
)

BROWSER_TIMEOUT_SECONDS = 90
BROWSER_FETCH_SCRIPT = Path("/opt/dear-career-browser/fetch.mjs")


def source_uses_browser_fetch(source: FetchSource) -> bool:
    selectors = source.selectors or {}
    return clean_inline_text(selectors.get("__fetch_strategy")).lower() == "browser"


def fetch_payload(source: FetchSource) -> str:
    if source.requires_manual_url:
        raise FetchConfigurationError(
            f"{source.label} requires manual URL intake and cannot be auto-fetched."
        )

    if not source.feed_url:
        raise FetchConfigurationError(f"{source.label} has no feed URL configured.")

    if source_uses_browser_fetch(source):
        return fetch_browser_payload(source)

    requests = import_requests()
    response = requests.get(
        source.feed_url,
        headers=build_request_headers(source),
        timeout=DEFAULT_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.text


def find_browser_executable() -> str:
    for candidate in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable"):
        path = shutil.which(candidate)
        if path:
            return path
    raise FetchConfigurationError(
        "Browser fetch requires Chromium or Chrome, but no executable was found."
    )


def fetch_browser_payload(source: FetchSource) -> str:
    node_path = shutil.which("node")
    if not node_path:
        raise FetchConfigurationError("Browser fetch requires Node.js, but `node` was not found.")

    wait_selector = get_selector(source, "__wait_for", get_selector(source, "entry"))
    executable_path = find_browser_executable()
    command = [
        node_path,
        str(BROWSER_FETCH_SCRIPT),
        "--url",
        source.feed_url,
        "--wait-selector",
        wait_selector,
        "--executable-path",
        executable_path,
        "--timeout-ms",
        str(BROWSER_TIMEOUT_SECONDS * 1000),
    ]
    try:
        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=BROWSER_TIMEOUT_SECONDS + 10,
        )
    except subprocess.CalledProcessError as exc:
        detail = clean_inline_text(exc.stderr or exc.stdout or str(exc))
        raise FetchConfigurationError(
            f"{source.label} browser fetch failed. {detail or 'Unknown browser error.'}"
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise FetchConfigurationError(
            f"{source.label} browser fetch timed out after {BROWSER_TIMEOUT_SECONDS} seconds."
        ) from exc

    if not result.stdout.strip():
        raise FetchConfigurationError(f"{source.label} browser fetch returned empty content.")

    return result.stdout
