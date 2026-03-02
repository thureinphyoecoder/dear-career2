import ipaddress
import socket
from urllib.parse import urlparse


class UnsafeFetchTargetError(ValueError):
    pass


def validate_public_fetch_url(raw_url: str) -> None:
    parsed = urlparse(raw_url)
    if parsed.scheme not in {"http", "https"}:
        raise UnsafeFetchTargetError("URL must start with http:// or https://")

    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        raise UnsafeFetchTargetError("URL must include a hostname.")
    if hostname in {"localhost"}:
        raise UnsafeFetchTargetError("Localhost targets are not allowed.")

    try:
        resolved = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise UnsafeFetchTargetError("The source hostname could not be resolved.") from exc

    for result in resolved:
        address = result[4][0]
        ip = ipaddress.ip_address(address)
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
            or ip.is_unspecified
        ):
            raise UnsafeFetchTargetError("Private or unsafe network targets are not allowed.")
